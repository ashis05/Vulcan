from datetime import date

import pytest
from fastapi.testclient import TestClient

from app.core import quotas
from app.core.auth import get_current_user
from app.main import app
from app.routers import ai as ai_router
from app.schemas import (
    ProgramExercise,
    ProgramPayload,
    ProgramSession,
    ProgramWeek,
)
from app.services import ai_log, gemini, program_context, program_materialize

USER_ID = "11111111-1111-1111-1111-111111111111"

client = TestClient(app)

PAYLOAD = ProgramPayload(
    name="4-Day Upper/Lower Cut",
    weeks=[
        ProgramWeek(
            sessions=[
                ProgramSession(
                    day_label="Day 1 – Upper",
                    exercises=[
                        ProgramExercise(
                            name="Bench Press",
                            sets=4,
                            reps="8-12",
                            primary_muscle="chest",
                            equipment="barbell",
                        )
                    ],
                )
            ]
        )
    ],
    progression_notes="Add 2.5 kg to the bar each week while reps stay in range.",
    rationale="Fits 4 days/week with the user's barbell + dumbbell setup.",
)

CONTEXT = {"profile": {"goal": "cut"}, "training": {"sessions_logged": 12}}


@pytest.fixture(autouse=True)
def _clear_overrides():
    yield
    app.dependency_overrides.clear()


def _auth():
    app.dependency_overrides[get_current_user] = lambda: USER_ID


def _stub_gemini(monkeypatch, *, result=None, error: Exception | None = None):
    async def fake(context, *, focus_areas=None, notes=None):
        if error is not None:
            raise error
        return result

    monkeypatch.setattr(gemini, "generate_program", fake)


def _stub_pipeline(monkeypatch, *, allowed=True, last_used=None):
    monkeypatch.setattr(program_context, "build_program_context", lambda uid: CONTEXT)
    monkeypatch.setattr(program_context, "latest_focus_areas", lambda uid: [])
    monkeypatch.setattr(quotas, "check_once_per_days", lambda uid, f, d: (allowed, last_used))
    recorded: list = []
    monkeypatch.setattr(quotas, "record_use", lambda uid, f: recorded.append((uid, f)))
    saved: list = []

    def fake_save(uid, payload, *, goal_snapshot, rationale, prompt_version):
        saved.append({"payload": payload, "goal_snapshot": goal_snapshot, "rationale": rationale})
        return {"program_id": "p1", "routines": 1, "customs_created": 0}

    monkeypatch.setattr(program_materialize, "save_program", fake_save)
    return recorded, saved


def test_generate_requires_auth():
    assert client.post("/ai/generate-program", json={}).status_code == 401


def test_generate_program_success(monkeypatch):
    _auth()
    _stub_gemini(monkeypatch, result=gemini.ProgramGeneration(PAYLOAD, 1200, 800))
    recorded, saved = _stub_pipeline(monkeypatch)
    entries: list = []
    monkeypatch.setattr(
        ai_log, "log_call", lambda uid, f, s, **kw: entries.append({"status": s, **kw})
    )

    response = client.post("/ai/generate-program", json={"notes": "keep it short"})

    assert response.status_code == 200
    assert response.json()["name"] == "4-Day Upper/Lower Cut"
    assert saved[0]["payload"]["name"] == "4-Day Upper/Lower Cut"
    assert saved[0]["goal_snapshot"] == {"goal": "cut"}
    assert recorded == [(USER_ID, "program")]
    assert entries[0]["status"] == "ok"
    assert entries[0]["prompt_tokens"] == 1200


def test_generate_program_passes_request_focus_areas(monkeypatch):
    _auth()
    seen: dict = {}

    async def fake(context, *, focus_areas=None, notes=None):
        seen["focus_areas"] = focus_areas
        seen["notes"] = notes
        return gemini.ProgramGeneration(PAYLOAD, 1, 1)

    monkeypatch.setattr(gemini, "generate_program", fake)
    _stub_pipeline(monkeypatch)

    client.post("/ai/generate-program", json={"focus_areas": ["shoulders"], "notes": "go heavy"})

    assert seen == {"focus_areas": ["shoulders"], "notes": "go heavy"}


def test_generate_program_quota_blocks_second_within_window(monkeypatch):
    _auth()
    _stub_gemini(monkeypatch, result=gemini.ProgramGeneration(PAYLOAD, 1, 1))
    recorded, _ = _stub_pipeline(monkeypatch, allowed=False, last_used=date(2026, 9, 25))

    response = client.post("/ai/generate-program", json={})

    assert response.status_code == 429
    detail = response.json()["detail"]
    assert detail["error"] == "quota_exceeded"
    assert detail["feature"] == "program"
    assert "resets_at" in detail
    assert recorded == []


def test_generate_program_parse_error_does_not_consume_quota(monkeypatch):
    _auth()
    _stub_gemini(monkeypatch, error=gemini.GeminiParseError("bad json"))
    recorded, saved = _stub_pipeline(monkeypatch)
    entries: list = []
    monkeypatch.setattr(
        ai_log, "log_call", lambda uid, f, s, **kw: entries.append({"status": s, **kw})
    )

    response = client.post("/ai/generate-program", json={})

    assert response.status_code == 502
    assert recorded == []
    assert saved == []
    assert entries[0]["status"] == "error"


def test_active_program_requires_auth():
    assert client.get("/ai/program/active").status_code == 401


def test_active_program_returns_payload(monkeypatch):
    _auth()
    monkeypatch.setattr(
        program_materialize,
        "get_active_program",
        lambda uid: {
            "id": "p1",
            "status": "active",
            "payload": PAYLOAD.model_dump(),
            "rationale": "because",
            "prompt_version": "program-v1",
            "created_at": "2026-09-28T10:00:00+00:00",
        },
    )

    response = client.get("/ai/program/active")

    assert response.status_code == 200
    body = response.json()
    assert body["program"]["name"] == "4-Day Upper/Lower Cut"
    assert body["rationale"] == "because"


def test_active_program_404_when_none(monkeypatch):
    _auth()
    monkeypatch.setattr(program_materialize, "get_active_program", lambda uid: None)

    assert client.get("/ai/program/active").status_code == 404
