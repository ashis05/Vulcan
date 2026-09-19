"""AI routes — auth → quota → storage fetch → Gemini structured output → log → respond."""

import time

from fastapi import APIRouter, Depends, HTTPException, status

from app.core import quotas
from app.core.auth import get_current_user
from app.core.config import settings
from app.schemas import AnalyzeFoodRequest, FoodEstimate
from app.services import ai_log, gemini, supabase_admin

router = APIRouter(prefix="/ai", tags=["ai"])

FOOD_FEATURE = "food"
REFUSAL_MESSAGE = (
    "Couldn't read that photo. Try better lighting, less clutter, and a top-down shot."
)


@router.post("/analyze-food", response_model=FoodEstimate)
async def analyze_food(
    payload: AnalyzeFoodRequest,
    user_id: str = Depends(get_current_user),
) -> FoodEstimate:
    # The object path must live under the caller's own folder.
    if not payload.photo_path.startswith(f"{user_id}/"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Photo path does not belong to this user.",
        )

    if not quotas.increment_usage(user_id, FOOD_FEATURE, settings.quota_food_per_day):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "error": "quota_exceeded",
                "feature": FOOD_FEATURE,
                "resets_at": quotas.quota_resets_at(),
            },
            headers={"Retry-After": "3600"},
        )

    started = time.monotonic()
    try:
        image, mime = await supabase_admin.download_food_photo(payload.photo_path)
        analysis = await gemini.analyze_food_image(image, mime, payload.hint)
    except gemini.GeminiRefusal as exc:
        latency = int((time.monotonic() - started) * 1000)
        ai_log.log_call(user_id, FOOD_FEATURE, "refused", latency_ms=latency, error=str(exc))
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, REFUSAL_MESSAGE) from exc
    except gemini.GeminiRateLimited as exc:
        latency = int((time.monotonic() - started) * 1000)
        ai_log.log_call(user_id, FOOD_FEATURE, "error", latency_ms=latency, error=str(exc))
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={"error": "rate_limited", "resets_at": quotas.quota_resets_at()},
            headers={"Retry-After": "60"},
        ) from exc
    except gemini.GeminiUnavailable as exc:
        latency = int((time.monotonic() - started) * 1000)
        ai_log.log_call(user_id, FOOD_FEATURE, "error", latency_ms=latency, error=str(exc))
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"error": "ai_busy", "resets_at": quotas.quota_resets_at()},
            headers={"Retry-After": "15"},
        ) from exc
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001 — Gemini/parse/network all degrade the same way
        latency = int((time.monotonic() - started) * 1000)
        ai_log.log_call(user_id, FOOD_FEATURE, "error", latency_ms=latency, error=str(exc))
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY, "The estimate failed. Please retry."
        ) from exc

    latency = int((time.monotonic() - started) * 1000)
    ai_log.log_call(
        user_id,
        FOOD_FEATURE,
        "ok",
        model=analysis.model,
        prompt_tokens=analysis.prompt_tokens,
        output_tokens=analysis.output_tokens,
        latency_ms=latency,
    )
    return analysis.estimate
