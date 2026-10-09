from app.services import program_context as pc

PROFILE = {
    "goal": "cut",
    "experience": "intermediate",
    "days_per_week": 4,
    "session_len_min": 60,
    "equipment": ["barbell", "dumbbell"],
    "injuries": ["lower_back"],
    "injuries_note": "avoid heavy deadlifts",
    "sex": "male",
    "birth_date": "1997-06-15",
    "weight_kg": 78.44,
}


def _set(exercise, muscle, weight, reps, date, set_type="normal", is_pr=False):
    return {
        "exercise_name": exercise,
        "primary_muscle": muscle,
        "weight_kg": weight,
        "reps": reps,
        "set_type": set_type,
        "is_pr": is_pr,
        "started_at": f"{date}T10:00:00Z",
    }


def test_estimated_1rm_matches_epley():
    assert pc.estimated_1rm(100, 1) == 100
    assert pc.estimated_1rm(100, 5) == 100 * (1 + 5 / 30)


def test_detect_stall_boundaries():
    assert pc.detect_stall([100, 100, 100]) is False
    assert pc.detect_stall([100, 100, 100, 100]) is True
    assert pc.detect_stall([90, 95, 100, 105]) is False
    assert pc.detect_stall([]) is False


def test_summarize_empty_history():
    ctx = pc.summarize_context(PROFILE, [])
    assert ctx["training"]["sessions_logged"] == 0
    assert ctx["training"]["top_exercises"] == []
    assert ctx["training"]["volume_trend"] == "flat"


def test_summarize_context_builds_exercises_and_stalls():
    rows = [
        _set("Squat", "quads", 40, 5, "2026-01-05", set_type="warmup"),
        _set("Squat", "quads", 100, 5, "2026-01-05", is_pr=True),
        _set("Squat", "quads", 100, 5, "2026-01-12"),
        _set("Squat", "quads", 100, 5, "2026-01-19"),
        _set("Squat", "quads", 100, 5, "2026-01-26"),
        _set("Bench Press", "chest", 60, 10, "2026-01-05"),
        _set("Bench Press", "chest", 65, 8, "2026-01-12"),
        _set("Bench Press", "chest", 70, 6, "2026-01-19"),
        _set("Bench Press", "chest", 72, 5, "2026-01-26"),
        _set("Pull-up", "back", 0, 10, "2026-01-05"),
    ]
    ctx = pc.summarize_context(PROFILE, rows)
    training = ctx["training"]

    by_name = {e["name"]: e for e in training["top_exercises"]}
    assert training["top_exercises"][0]["name"] == "Squat"  # highest volume first
    assert by_name["Squat"]["best_e1rm"] == round(100 * (1 + 5 / 30), 1)
    assert by_name["Squat"]["working_volume"] == 2000  # warmup excluded
    assert by_name["Squat"]["stalled"] is True
    assert by_name["Bench Press"]["stalled"] is False
    assert by_name["Pull-up"]["best_e1rm"] == 0
    assert by_name["Pull-up"]["stalled"] is False

    assert training["sessions_logged"] == 4
    assert training["avg_sessions_per_week"] == 1.3
    assert "Squat" in training["stalled_lifts"]
    assert "Bench Press" not in training["stalled_lifts"]
    assert training["recent_prs"][0]["exercise"] == "Squat"


def test_profile_digest_computes_age_and_rounds_weight():
    ctx = pc.summarize_context(PROFILE, [])
    profile = ctx["profile"]
    assert profile["goal"] == "cut"
    assert profile["equipment"] == ["barbell", "dumbbell"]
    assert profile["injuries"] == ["lower_back"]
    assert profile["weight_kg"] == 78.4
    assert isinstance(profile["age"], int)


def test_build_program_context_wires_fetchers(monkeypatch):
    monkeypatch.setattr(pc, "_fetch_profile", lambda uid: PROFILE)
    monkeypatch.setattr(pc, "_fetch_set_history", lambda uid: [_set("Squat", "quads", 100, 5, "2026-01-05")])

    ctx = pc.build_program_context("user-1")
    assert ctx["profile"]["goal"] == "cut"
    assert ctx["training"]["top_exercises"][0]["name"] == "Squat"
