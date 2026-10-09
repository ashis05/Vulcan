"""Gemini access — structured output only, one retry, typed result.

The `google-genai` SDK is imported lazily so the API and its unit tests do not
require it on import. Callers mock `analyze_food_image` / `generate_program`.
"""

import asyncio
import json
from dataclasses import dataclass
from typing import TypeVar

from pydantic import BaseModel

from app.core.config import settings
from app.schemas import FoodEstimate, PhysiqueAnalysis, ProgramPayload
from app.services.prompts import (
    FOOD_SYSTEM_INSTRUCTION,
    PHYSIQUE_SYSTEM_INSTRUCTION,
    PROGRAM_SYSTEM_INSTRUCTION,
)


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

ModelT = TypeVar("ModelT", bound=BaseModel)


def _status_code(exc: Exception) -> int | None:
    code = getattr(exc, "code", None) or getattr(exc, "status_code", None)
    try:
        return int(code) if code is not None else None
    except (TypeError, ValueError):
        return None


def _is_model_not_found(exc: Exception) -> bool:
    message = str(exc).lower()
    return "not_found" in message or "not found" in message or "no longer available" in message


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


async def _generate_program_text(client, model: str, prompt: str):
    from google.genai import types

    return await client.aio.models.generate_content(
        model=model,
        contents=[prompt],
        config=types.GenerateContentConfig(
            system_instruction=PROGRAM_SYSTEM_INSTRUCTION,
            response_mime_type="application/json",
            response_schema=ProgramPayload,
            temperature=0.4,
        ),
    )


async def _generate_physique_images(client, model: str, images: list[tuple[bytes, str]], prompt: str):
    from google.genai import types

    parts = [types.Part.from_bytes(data=image, mime_type=mime) for image, mime in images]
    parts.append(prompt)
    return await client.aio.models.generate_content(
        model=model,
        contents=parts,
        config=types.GenerateContentConfig(
            system_instruction=PHYSIQUE_SYSTEM_INSTRUCTION,
            response_mime_type="application/json",
            response_schema=PhysiqueAnalysis,
            temperature=0.2,
        ),
    )


async def _invoke_models(make_call):
    """Run `make_call(model)` against the configured model then the fallback.

    Retries transient failures (up to 3 attempts per model), skips a bad model
    name, and surfaces rate-limit / unavailable conditions as typed errors.
    """
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
                response = await make_call(model)
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
    return response, used_model


def _parse_model(response, model_cls: type[ModelT]) -> ModelT:
    parsed = getattr(response, "parsed", None)
    if parsed is None:
        text = getattr(response, "text", None)
        if not text:
            raise GeminiRefusal("The model did not return a result.")
        try:
            parsed = model_cls.model_validate_json(text)
        except Exception as exc:  # noqa: BLE001
            raise GeminiParseError(f"Unparseable response: {exc}") from exc
    if not isinstance(parsed, model_cls):
        # `parsed` may be a dict depending on the SDK version.
        try:
            parsed = model_cls.model_validate(parsed)
        except Exception as exc:  # noqa: BLE001
            raise GeminiParseError(str(exc)) from exc
    return parsed


def _tokens(response) -> tuple[int | None, int | None]:
    usage = getattr(response, "usage_metadata", None)
    return (
        getattr(usage, "prompt_token_count", None),
        getattr(usage, "candidates_token_count", None),
    )


@dataclass
class FoodAnalysis:
    estimate: FoodEstimate
    prompt_tokens: int | None
    output_tokens: int | None
    model: str = settings.gemini_model


@dataclass
class ProgramGeneration:
    program: ProgramPayload
    prompt_tokens: int | None
    output_tokens: int | None
    model: str = settings.gemini_model


@dataclass
class PhysiqueResult:
    analysis: PhysiqueAnalysis
    prompt_tokens: int | None
    output_tokens: int | None
    model: str = settings.gemini_model


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

    async def _call(model: str):
        return await _generate(client, model, image_bytes, mime_type, prompt)

    response, used_model = await _invoke_models(_call)
    estimate = _parse_model(response, FoodEstimate)
    prompt_tokens, output_tokens = _tokens(response)
    return FoodAnalysis(
        estimate=estimate,
        prompt_tokens=prompt_tokens,
        output_tokens=output_tokens,
        model=used_model,
    )


async def generate_program(
    context: dict,
    *,
    focus_areas: list[str] | None = None,
    notes: str | None = None,
) -> ProgramGeneration:
    """Structured training program from the context digest. Retries on transient failure."""
    client = _build_client()
    parts = ["Design a training program from this JSON context."]
    parts.append("Context: " + json.dumps(context, separators=(",", ":")))
    if focus_areas:
        parts.append("Emphasize these focus areas: " + ", ".join(focus_areas))
    if notes:
        parts.append("User request (honor unless it conflicts with the hard constraints): " + notes)
    prompt = "\n".join(parts)

    async def _call(model: str):
        return await _generate_program_text(client, model, prompt)

    response, used_model = await _invoke_models(_call)
    program = _parse_model(response, ProgramPayload)
    prompt_tokens, output_tokens = _tokens(response)
    return ProgramGeneration(
        program=program,
        prompt_tokens=prompt_tokens,
        output_tokens=output_tokens,
        model=used_model,
    )


async def analyze_physique_images(
    images: list[tuple[bytes, str]],
    *,
    poses: list[str] | None = None,
    compare_note: str | None = None,
) -> PhysiqueResult:
    """Structured physique analysis from one or more photos. Retries on transient failure."""
    client = _build_client()
    label = ", ".join(poses) if poses else "front/side"
    prompt = (
        f"Assess the physique in these {len(images)} progress photo(s) ({label} views). "
        "Identify well-developed and under-developed areas and any posture notes."
    )
    if compare_note:
        prompt += f" {compare_note}"

    async def _call(model: str):
        return await _generate_physique_images(client, model, images, prompt)

    response, used_model = await _invoke_models(_call)
    analysis = _parse_model(response, PhysiqueAnalysis)
    prompt_tokens, output_tokens = _tokens(response)
    return PhysiqueResult(
        analysis=analysis,
        prompt_tokens=prompt_tokens,
        output_tokens=output_tokens,
        model=used_model,
    )
