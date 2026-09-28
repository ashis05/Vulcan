from app.services import program_materialize as pm

PAYLOAD = {
    "weeks": [
        {
            "sessions": [
                {
                    "day_label": "Day 1 – Push",
                    "exercises": [{"name": "Bench Press", "sets": 4, "reps": "8-12"}],
                },
                {
                    "day_label": "Day 2 – Pull",
                    "exercises": [{"name": "Lat Pulldown", "sets": 3, "reps": "10-12"}],
                },
            ]
        },
        {"sessions": [{"day_label": "Week 2", "exercises": [{"name": "Bench Press"}]}]},
    ]
}


def test_normalize_name_collapses_and_lowercases():
    assert pm.normalize_name("  Bench   Press ") == "bench press"
    assert pm.normalize_name("") == ""


def test_match_names_is_case_insensitive():
    catalog = {"bench press": "ex-1", "lat pulldown": "ex-2"}
    matched = pm.match_names(["BENCH press", "Squat"], catalog)
    assert matched == {"BENCH press": "ex-1", "Squat": None}


def test_first_week_sessions_uses_week_one():
    sessions = pm.first_week_sessions(PAYLOAD)
    assert [s["day_label"] for s in sessions] == ["Day 1 – Push", "Day 2 – Pull"]


def test_first_week_sessions_empty_payload():
    assert pm.first_week_sessions({}) == []
    assert pm.first_week_sessions({"weeks": []}) == []
