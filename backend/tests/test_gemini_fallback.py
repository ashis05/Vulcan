import pytest

from app.core.config import settings
from app.schemas import FoodEstimate
from app.services import gemini

ESTIMATE = FoodEstimate(
    name="Apple",
    serving_description="1 medium apple",
    calories=95,
    protein_g=0.5,
    carbs_g=25,
    fat_g=0.3,
    confidence="high",
    notes="",
)


class FakeResponse:
    parsed = ESTIMATE
    text = None
    usage_metadata = None


class FakeApiError(Exception):
    def __init__(self, code: int):
        super().__init__(f"HTTP {code}")
        self.code = code


async def test_invalid_model_falls_back(monkeypatch):
    monkeypatch.setattr(settings, "gemini_model", "gemini-3.8-flash-lite")
    monkeypatch.setattr(gemini, "_build_client", lambda: object())

    calls: list[str] = []

    async def fake_generate(client, model, image_bytes, mime_type, prompt):
        calls.append(model)
        if model != gemini.FALLBACK_MODEL:
            raise Exception("404 NOT_FOUND. models/... is not found for API version v1beta")
        return FakeResponse()

    monkeypatch.setattr(gemini, "_generate", fake_generate)

    result = await gemini.analyze_food_image(b"bytes", "image/jpeg")

    assert result.estimate.name == "Apple"
    assert result.model == gemini.FALLBACK_MODEL
    assert calls == ["gemini-3.8-flash-lite", gemini.FALLBACK_MODEL]


async def test_valid_model_is_used(monkeypatch):
    monkeypatch.setattr(settings, "gemini_model", "gemini-3.1-flash-lite")
    monkeypatch.setattr(gemini, "_build_client", lambda: object())

    calls: list[str] = []

    async def fake_generate(client, model, image_bytes, mime_type, prompt):
        calls.append(model)
        return FakeResponse()

    monkeypatch.setattr(gemini, "_generate", fake_generate)

    result = await gemini.analyze_food_image(b"bytes", "image/jpeg")

    assert result.model == "gemini-3.1-flash-lite"
    assert calls == ["gemini-3.1-flash-lite"]


async def test_rate_limit_surfaces(monkeypatch):
    monkeypatch.setattr(settings, "gemini_model", "gemini-3.1-flash-lite")
    monkeypatch.setattr(gemini, "_build_client", lambda: object())

    async def fake_generate(*args, **kwargs):
        raise FakeApiError(429)

    monkeypatch.setattr(gemini, "_generate", fake_generate)

    with pytest.raises(gemini.GeminiRateLimited):
        await gemini.analyze_food_image(b"bytes", "image/jpeg")


async def test_unavailable_surfaces_after_retries(monkeypatch):
    monkeypatch.setattr(settings, "gemini_model", "gemini-3.1-flash-lite")
    monkeypatch.setattr(gemini, "_build_client", lambda: object())

    async def no_sleep(*_args):
        return None

    monkeypatch.setattr(gemini.asyncio, "sleep", no_sleep)

    async def fake_generate(*args, **kwargs):
        raise FakeApiError(503)

    monkeypatch.setattr(gemini, "_generate", fake_generate)

    with pytest.raises(gemini.GeminiUnavailable):
        await gemini.analyze_food_image(b"bytes", "image/jpeg")
