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


@dataclass
class FoodAnalysis:
    estimate: FoodEstimate
    prompt_tokens: int | None
    output_tokens: int | None


def _build_client():
    if not settings.gemini_api_key:
        raise GeminiError("GEMINI_API_KEY is not configured on the server.")
    from google import genai  # local import — keeps the SDK optional for tests

    return genai.Client(api_key=settings.gemini_api_key)


async def _generate(client, image_bytes: bytes, mime_type: str, prompt: str):
    from google.genai import types

    return await client.aio.models.generate_content(
        model=settings.gemini_model,
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
    prompt = "Estimate the nutrition for this meal."
    if hint:
        prompt += f" User note: {hint}"

    response = None
    last_error: Exception | None = None
    for attempt in range(2):
        try:
            response = await _generate(client, image_bytes, mime_type, prompt)
            break
        except Exception as exc:  # noqa: BLE001 — retry once, then surface
            last_error = exc
            if attempt == 0:
                await asyncio.sleep(0.6)
    if response is None:
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
    )
