"""Training-context builder for AI program generation (Phase 5).

Turns a user's profile + the last 12 weeks of logged sets into a compact JSON
digest the program prompt reasons over. The summarization is a pure function
(`summarize_context`, unit-tested); `build_program_context` is the thin
DB-fetching wrapper. Strength math mirrors `frontend/src/engine/strength.ts`.
"""

from __future__ import annotations

from datetime import date, datetime
from typing import Any

from sqlalchemy import text

from app.db import create_db_engine

WINDOW_WEEKS = 12
TOP_EXERCISES = 20
STALL_WINDOW = 3


def estimated_1rm(weight_kg: float, reps: int) -> float:
    """Epley estimate (mirrors engine/strength.ts). Single rep returns the weight."""
    if reps <= 1:
        return weight_kg
    return weight_kg * (1 + reps / 30)


def detect_stall(e1rm_history: list[float], window: int = STALL_WINDOW) -> bool:
    """No e1RM improvement across `window` consecutive exposures (chronological)."""
    if len(e1rm_history) <= window:
        return False
    recent_best = max(e1rm_history[-window:])
    prior_best = max(e1rm_history[:-window])
    return recent_best <= prior_best


def _round(value: float, digits: int = 1) -> float:
    return round(float(value), digits)


def _week_key(iso: str) -> str:
    dt = datetime.fromisoformat(iso.replace("Z", "+00:00"))
    year, week, _ = dt.isocalendar()
    return f"{year}-W{week:02d}"


def _profile_digest(profile: dict[str, Any]) -> dict[str, Any]:
    birth = profile.get("birth_date")
    age: int | None = None
    if birth:
        try:
            born = date.fromisoformat(str(birth)[:10])
            today = date.today()
            age = today.year - born.year - ((today.month, today.day) < (born.month, born.day))
        except ValueError:
            age = None
    weight = profile.get("weight_kg")
    return {
        "goal": profile.get("goal"),
        "experience": profile.get("experience"),
        "days_per_week": profile.get("days_per_week"),
        "session_len_min": profile.get("session_len_min"),
        "equipment": list(profile.get("equipment") or []),
        "injuries": list(profile.get("injuries") or []),
        "injuries_note": profile.get("injuries_note"),
        "sex": profile.get("sex"),
        "age": age,
        "weight_kg": _round(weight) if weight is not None else None,
    }


def _average(values: list[float]) -> float:
    return sum(values) / len(values) if values else 0.0


def summarize_context(
    profile: dict[str, Any] | None,
    set_rows: list[dict[str, Any]],
) -> dict[str, Any]:
    """Build the compact context dict from a profile row + logged set rows.

    `set_rows` are chronological dicts with: exercise_name, primary_muscle,
    weight_kg, reps, set_type, is_pr, started_at (ISO string).
    """
    by_exercise: dict[str, dict[str, Any]] = {}
    weekly_volume: dict[str, float] = {}
    session_days: set[str] = set()
    pr_rows: list[dict[str, Any]] = []

    for row in set_rows:
        name = row.get("exercise_name") or "Unknown"
        reps = int(row.get("reps") or 0)
        weight = float(row.get("weight_kg") or 0)
        started = str(row.get("started_at") or "")
        day = started[:10]
        if day:
            session_days.add(day)
        if reps <= 0 or not started:
            continue

        week = _week_key(started)
        entry = by_exercise.setdefault(
            name,
            {
                "muscle": row.get("primary_muscle"),
                "volume": 0.0,
                "best_e1rm": 0.0,
                "weekly_best": {},
                "days": set(),
            },
        )
        if day:
            entry["days"].add(day)
        if (row.get("set_type") or "normal") != "warmup":
            entry["volume"] += weight * reps
            weekly_volume[week] = weekly_volume.get(week, 0.0) + weight * reps
        if weight > 0:
            e1rm = estimated_1rm(weight, reps)
            entry["best_e1rm"] = max(entry["best_e1rm"], e1rm)
            entry["weekly_best"][week] = max(entry["weekly_best"].get(week, 0.0), e1rm)
        if row.get("is_pr"):
            pr_rows.append(
                {
                    "exercise": name,
                    "e1rm": _round(estimated_1rm(weight, reps)) if weight > 0 else None,
                    "date": day,
                }
            )

    exercises_out: list[dict[str, Any]] = []
    stalled_lifts: list[str] = []
    for name, entry in by_exercise.items():
        weekly_sorted = [entry["weekly_best"][k] for k in sorted(entry["weekly_best"])]
        stalled = entry["best_e1rm"] > 0 and detect_stall(weekly_sorted)
        if stalled:
            stalled_lifts.append(name)
        exercises_out.append(
            {
                "name": name,
                "muscle": entry["muscle"],
                "best_e1rm": _round(entry["best_e1rm"]),
                "working_volume": _round(entry["volume"], 0),
                "sessions": len(entry["days"]),
                "stalled": stalled,
            }
        )
    exercises_out.sort(key=lambda e: e["working_volume"], reverse=True)

    weekly_sorted = [weekly_volume[k] for k in sorted(weekly_volume)]
    recent_avg = _average(weekly_sorted[-3:])
    prior_avg = _average(weekly_sorted[-6:-3])
    if recent_avg > prior_avg * 1.05:
        trend = "up"
    elif recent_avg < prior_avg * 0.95:
        trend = "down"
    else:
        trend = "flat"

    span_weeks = WINDOW_WEEKS
    if session_days:
        first, last = min(session_days), max(session_days)
        try:
            days = (date.fromisoformat(last) - date.fromisoformat(first)).days
            span_weeks = max(1.0, days / 7)
        except ValueError:
            span_weeks = WINDOW_WEEKS

    pr_rows.sort(key=lambda p: p["date"], reverse=True)

    return {
        "profile": _profile_digest(profile or {}),
        "training": {
            "window_weeks": WINDOW_WEEKS,
            "sessions_logged": len(session_days),
            "avg_sessions_per_week": _round(len(session_days) / span_weeks, 1),
            "volume_trend": trend,
            "top_exercises": exercises_out[:TOP_EXERCISES],
            "stalled_lifts": stalled_lifts,
            "recent_prs": pr_rows[:5],
        },
    }


_PROFILE_SQL = text(
    """
    select p.goal, p.experience, p.days_per_week, p.session_len_min, p.equipment,
           p.injuries, p.injuries_note, p.sex, p.birth_date,
           (select bm.weight_kg from public.body_metrics bm
             where bm.user_id = p.id
             order by bm.measured_on desc limit 1) as weight_kg
    from public.profiles p
    where p.id = cast(:user_id as uuid)
    """
)

_HISTORY_SQL = text(
    """
    select e.name as exercise_name, e.primary_muscle,
           ws.weight_kg, ws.reps, ws.set_type, ws.is_pr, w.started_at
    from public.workout_sets ws
    join public.workouts w on w.id = ws.workout_id
    join public.exercises e on e.id = ws.exercise_id
    where w.user_id = cast(:user_id as uuid)
      and ws.completed = true
      and ws.reps is not null
      and w.started_at >= now() - make_interval(weeks => :weeks)
    order by w.started_at asc
    """
)


def _fetch_profile(user_id: str) -> dict[str, Any] | None:
    engine = create_db_engine()
    with engine.connect() as conn:
        row = conn.execute(_PROFILE_SQL, {"user_id": user_id}).first()
    return dict(row._mapping) if row else None


def _fetch_set_history(user_id: str, weeks: int = WINDOW_WEEKS) -> list[dict[str, Any]]:
    engine = create_db_engine()
    with engine.connect() as conn:
        rows = conn.execute(_HISTORY_SQL, {"user_id": user_id, "weeks": weeks}).all()
    return [dict(row._mapping) for row in rows]


def latest_focus_areas(user_id: str) -> list[str]:
    """Focus areas from the latest physique analysis (Phase 6), or [] if none.

    `progress_photos` doesn't exist until Phase 6 — degrade gracefully.
    """
    return latest_physique_summary(user_id).get("focus_areas") or []


def latest_physique_summary(user_id: str) -> dict[str, Any]:
    """The latest physique analysis digest, or {} if none (Phase 6 absent)."""
    try:
        engine = create_db_engine()
        with engine.connect() as conn:
            row = conn.execute(
                text(
                    """
                    select analysis, taken_on from public.progress_photos
                    where user_id = cast(:u as uuid) and analysis is not null
                    order by taken_on desc
                    limit 1
                    """
                ),
                {"u": user_id},
            ).first()
    except Exception:  # noqa: BLE001 — table absent until Phase 6
        return {}
    if not row or not row[0]:
        return {}
    analysis = row[0]
    return {
        "taken_on": str(row[1]),
        "summary": analysis.get("summary"),
        "strong_areas": analysis.get("strong_areas") or [],
        "focus_areas": analysis.get("focus_areas") or [],
        "recommendations": analysis.get("recommendations") or [],
    }


def build_program_context(user_id: str) -> dict[str, Any]:
    """Fetch the user's profile + recent training + latest physique assessment."""
    context = summarize_context(_fetch_profile(user_id), _fetch_set_history(user_id))
    physique = latest_physique_summary(user_id)
    if physique:
        context["physique"] = physique
    return context
