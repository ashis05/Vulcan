from datetime import date

import pytest
from fastapi.testclient import TestClient

from app.core import quotas
from app.core.auth import get_current_user
from app.main import app
from app.schemas import PhysiqueAnalysis
from app.services import ai_log, gemini, supabase_admin

USER_ID = "11111111-1111-1111-1111-111111111111"
OTHER_ID = "22222222-2222-2222-2222-222222222222"

client = TestClient(app)

ANALYSIS = PhysiqueAnalysis(
    summary="Solid upper-body development with room to grow the chest.",
    strong_areas=["back", "shoulders"],
    focus_areas=["chest", "calves"],
    posture_notes="Slight forward shoulder roll.",
    recommendations=["Add a horizontal press and calf work."],
    confidence="medium",
    disclaimer="AI-generated training guidance, not medical advice.",
)


@pytest.fixture(autouse=True)
def _clear_overrides():
    yield
    app.dependency_overrides.clear()


def _auth():
    app.dependency_overrides[get_current_user] = lambda: USER_ID


def _stub_gemini(monkeypatch, *, result=None, error: Exception | None = None):
    async def fake(images, *, poses=None, compare_note=None):
        if error is not None:
            raise error
        return result

    monkeypatch.setattr(gemini, "analyze_physique_images", fake)


def _stub_storage(monkeypatch):
    async def fake(path):
        return b"image-bytes", "image/jpeg"

    monkeypatch.setattr(supabase_admin, "download_progress_photo", fake)


def test_analyze_requires_auth():
    response = client.post(
        "/ai/analyze-physique", json={"photo_paths": [f"{USER_ID}/a.jpg"]}
    )
    assert response.status_code == 401


def test_analyze_rejects_foreign_photo(monkeypatch):
    _auth()
    monkeypatch.setattr(quotas, "check_once_per_days", lambda uid, f, d: (True, None))

    response = client.post(
        "/ai/analyze-physique", json={"photo_paths": [f"{OTHER_ID}/a.jpg"]}
    )
    assert response.status_code == 403


def test_analyze_success(monkeypatch):
    _auth()
    _stub_storage(monkeypatch)
    _stub_gemini(monkeypatch, result=gemini.PhysiqueResult(ANALYSIS, 900, 300))
    monkeypatch.setattr(quotas, "check_once_per_days", lambda uid, f, d: (True, None))
    recorded: list = []
    monkeypatch.setattr(quotas, "record_use", lambda uid, f: recorded.append(f))
    entries: list = []
    monkeypatch.setattr(ai_log, "log_call", lambda uid, f, s, **kw: entries.append({"status": s, **kw}))

    response = client.post(
        "/ai/analyze-physique", json={"photo_paths": [f"{USER_ID}/front.jpg"]}
    )

    assert response.status_code == 200
    body = response.json()
    assert body["focus_areas"] == ["chest", "calves"]
    assert body["disclaimer"] == "AI-generated training guidance, not medical advice."
    assert recorded == ["physique"]
    assert entries[0]["status"] == "ok"


def test_quota_exceeded_returns_429(monkeypatch):
    _auth()
    _stub_storage(monkeypatch)
    _stub_gemini(monkeypatch, result=gemini.PhysiqueResult(ANALYSIS, 1, 1))
    monkeypatch.setattr(quotas, "check_once_per_days", lambda uid, f, d: (False, date(2026, 9, 25)))

    response = client.post(
        "/ai/analyze-physique", json={"photo_paths": [f"{USER_ID}/front.jpg"]}
    )

    assert response.status_code == 429
    detail = response.json()["detail"]
    assert detail["error"] == "quota_exceeded"
    assert detail["feature"] == "physique"
    assert "resets_at" in detail


def test_refusal_maps_to_422_without_consuming_quota(monkeypatch):
    _auth()
    _stub_storage(monkeypatch)
    _stub_gemini(monkeypatch, error=gemini.GeminiRefusal("blocked"))
    monkeypatch.setattr(quotas, "check_once_per_days", lambda uid, f, d: (True, None))
    recorded: list = []
    monkeypatch.setattr(quotas, "record_use", lambda uid, f: recorded.append(f))
    entries: list = []
    monkeypatch.setattr(ai_log, "log_call", lambda uid, f, s, **kw: entries.append({"status": s}))

    response = client.post(
        "/ai/analyze-physique", json={"photo_paths": [f"{USER_ID}/front.jpg"]}
    )

    assert response.status_code == 422
    assert recorded == []
    assert entries[0]["status"] == "refused"
