"""Gemini access — structured output only, one retry, typed result.

The `google-genai` SDK is imported lazily so the API and its unit tests do not
require it on import. Callers mock `analyze_food_image` in tests.
"""

import asyncio
from dataclasses import dataclass

from app.core.config import settings
from app.schemas import FoodEstimate
from app.services.prompts import FOOD_SYSTEM_INSTRUCTION


class GeminiError(Exception):
    """Any failure calling or parsing Gemini."""


class GeminiRefusal(GeminiError):
    """The model returned no content (safety refusal or empty response)."""


class GeminiParseError(GeminiError):
    """The model returned content that did not match the expected structure."""


class GeminiRateLimited(GeminiError):
    """Gemini rejected the call for exceeding a rate/quota limit (HTTP 429)."""


class GeminiUnavailable(GeminiError):
    """Gemini is temporarily overloaded (HTTP 503)."""


# Known-good free-tier vision model — used if GEMINI_MODEL is wrong/retired.
FALLBACK_MODEL = "gemini-3.1-flash-lite"


def _status_code(exc: Exception) -> int | None:
    code = getattr(exc, "code", None) or getattr(exc, "status_code", None)
    try:
        return int(code) if code is not None else None
    except (TypeError, ValueError):
        return None


def _is_model_not_found(exc: Exception) -> bool:
    message = str(exc).lower()
    return "not_found" in message or "not found" in message or "no longer available" in message


@dataclass
class FoodAnalysis:
    estimate: FoodEstimate
    prompt_tokens: int | None
    output_tokens: int | None
    model: str = settings.gemini_model


def _build_client():
    if not settings.gemini_api_key:
        raise GeminiError("GEMINI_API_KEY is not configured on the server.")
    from google import genai  # local import — keeps the SDK optional for tests

    return genai.Client(api_key=settings.gemini_api_key)


async def _generate(client, model: str, image_bytes: bytes, mime_type: str, prompt: str):
    from google.genai import types

    return await client.aio.models.generate_content(
        model=model,
        contents=[types.Part.from_bytes(data=image_bytes, mime_type=mime_type), prompt],
        config=types.GenerateContentConfig(
            system_instruction=FOOD_SYSTEM_INSTRUCTION,
            response_mime_type="application/json",
            response_schema=FoodEstimate,
            temperature=0.2,
        ),
    )


async def analyze_food_image(
    image_bytes: bytes,
    mime_type: str,
    hint: str | None = None,
) -> FoodAnalysis:
    """Structured food estimate from a photo. Retries once on transient failure."""
    client = _build_client()
    prompt = "Identify the food in this photo and estimate its nutrition for the portion shown."
    if hint:
        prompt += f" User note: {hint}"

    # Try the configured model, then the known-good fallback if it's invalid.
    models = [settings.gemini_model]
    if settings.gemini_model != FALLBACK_MODEL:
        models.append(FALLBACK_MODEL)

    response = None
    used_model = settings.gemini_model
    last_error: Exception | None = None
    for model in models:
        # The free tier can return transient 503 "high demand" — retry with backoff.
        for attempt in range(3):
            try:
                response = await _generate(client, model, image_bytes, mime_type, prompt)
                break
            except Exception as exc:  # noqa: BLE001 — retry, then surface
                last_error = exc
                if _is_model_not_found(exc):
                    break  # bad model name — don't retry it, try the next
                if _status_code(exc) == 429:
                    # Rate/quota exhausted — retrying only burns more. Surface now.
                    raise GeminiRateLimited(str(exc)) from exc
                if attempt < 2:
                    await asyncio.sleep(1.0 * (attempt + 1))
        if response is not None:
            used_model = model
            break
    if response is None:
        if last_error is not None and _status_code(last_error) == 503:
            raise GeminiUnavailable(str(last_error))
        raise GeminiError(str(last_error) if last_error else "Gemini call failed.")

    estimate = getattr(response, "parsed", None)
    if estimate is None:
        text = getattr(response, "text", None)
        if not text:
            raise GeminiRefusal("The model did not return an estimate.")
        try:
            estimate = FoodEstimate.model_validate_json(text)
        except Exception as exc:  # noqa: BLE001
            raise GeminiParseError(f"Unparseable response: {exc}") from exc

    if not isinstance(estimate, FoodEstimate):
        # `parsed` may be a dict depending on the SDK version.
        try:
            estimate = FoodEstimate.model_validate(estimate)
        except Exception as exc:  # noqa: BLE001
            raise GeminiParseError(str(exc)) from exc

    usage = getattr(response, "usage_metadata", None)
    return FoodAnalysis(
        estimate=estimate,
        prompt_tokens=getattr(usage, "prompt_token_count", None),
        output_tokens=getattr(usage, "candidates_token_count", None),
        model=used_model,
    )
