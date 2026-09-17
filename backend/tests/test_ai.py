import pytest
from fastapi.testclient import TestClient

from app.core import quotas
from app.core.auth import get_current_user
from app.main import app
from app.schemas import FoodEstimate
from app.services import ai_log, gemini, supabase_admin

USER_ID = "11111111-1111-1111-1111-111111111111"
OTHER_ID = "22222222-2222-2222-2222-222222222222"

client = TestClient(app)

ESTIMATE = FoodEstimate(
    name="Dal tadka",
    serving_description="1 bowl, ~200 g",
    calories=180,
    protein_g=9,
    carbs_g=28,
    fat_g=3,
    confidence="medium",
    notes="Assumes 1 tsp ghee.",
)


@pytest.fixture(autouse=True)
def _clear_overrides():
    yield
    app.dependency_overrides.clear()


def _auth():
    app.dependency_overrides[get_current_user] = lambda: USER_ID


def _capture_log(monkeypatch) -> list:
    entries: list = []

    def fake_log(user_id, feature, status, **kwargs):
        entries.append({"user_id": user_id, "feature": feature, "status": status, **kwargs})

    monkeypatch.setattr(ai_log, "log_call", fake_log)
    return entries


def _stub_storage(monkeypatch):
    async def fake_download(path: str):
        return b"image-bytes", "image/jpeg"

    monkeypatch.setattr(supabase_admin, "download_food_photo", fake_download)


def _stub_gemini(monkeypatch, result=None, error: Exception | None = None):
    async def fake_analyze(image_bytes, mime_type, hint=None):
        if error is not None:
            raise error
        return result

    monkeypatch.setattr(gemini, "analyze_food_image", fake_analyze)


def test_analyze_food_requires_auth():
    response = client.post("/ai/analyze-food", json={"photo_path": f"{USER_ID}/a.jpg"})
    assert response.status_code == 401


def test_analyze_food_success(monkeypatch):
    _auth()
    _stub_storage(monkeypatch)
    monkeypatch.setattr(quotas, "increment_usage", lambda *a, **k: True)
    _stub_gemini(monkeypatch, result=gemini.FoodAnalysis(ESTIMATE, 120, 40))
    entries = _capture_log(monkeypatch)

    response = client.post(
        "/ai/analyze-food",
        json={"photo_path": f"{USER_ID}/meal.jpg"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["name"] == "Dal tadka"
    assert body["calories"] == 180
    assert entries[0]["status"] == "ok"
    assert entries[0]["prompt_tokens"] == 120


def test_quota_exceeded_returns_429(monkeypatch):
    _auth()
    _stub_storage(monkeypatch)
    monkeypatch.setattr(quotas, "increment_usage", lambda *a, **k: False)
    _stub_gemini(monkeypatch, result=gemini.FoodAnalysis(ESTIMATE, 1, 1))

    response = client.post("/ai/analyze-food", json={"photo_path": f"{USER_ID}/meal.jpg"})

    assert response.status_code == 429
    detail = response.json()["detail"]
    assert detail["error"] == "quota_exceeded"
    assert "resets_at" in detail


def test_refusal_maps_to_422(monkeypatch):
    _auth()
    _stub_storage(monkeypatch)
    monkeypatch.setattr(quotas, "increment_usage", lambda *a, **k: True)
    _stub_gemini(monkeypatch, error=gemini.GeminiRefusal("no content"))
    entries = _capture_log(monkeypatch)

    response = client.post("/ai/analyze-food", json={"photo_path": f"{USER_ID}/meal.jpg"})

    assert response.status_code == 422
    assert entries[0]["status"] == "refused"


def test_malformed_response_maps_to_502(monkeypatch):
    _auth()
    _stub_storage(monkeypatch)
    monkeypatch.setattr(quotas, "increment_usage", lambda *a, **k: True)
    _stub_gemini(monkeypatch, error=gemini.GeminiParseError("bad json"))
    entries = _capture_log(monkeypatch)

    response = client.post("/ai/analyze-food", json={"photo_path": f"{USER_ID}/meal.jpg"})

    assert response.status_code == 502
    assert entries[0]["status"] == "error"


def test_photo_path_must_belong_to_caller(monkeypatch):
    _auth()
    monkeypatch.setattr(quotas, "increment_usage", lambda *a, **k: True)

    response = client.post("/ai/analyze-food", json={"photo_path": f"{OTHER_ID}/meal.jpg"})

    assert response.status_code == 403
