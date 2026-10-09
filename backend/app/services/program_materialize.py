"""Materialize an AI program payload into trainable routines (Phase 5).

Week 1 of the payload becomes the user's starting routines (later weeks are the
progression the model described). Exercise names are matched case-insensitively
against the catalog; unmatched names become owner-scoped custom exercises.
"""

from __future__ import annotations

import json
from typing import Any

from sqlalchemy import text
from sqlalchemy.engine import Connection

from app.db import create_db_engine
from app.models import EQUIPMENT_TYPES, MUSCLE_GROUPS

DEFAULT_MUSCLE = "core"
DEFAULT_EQUIPMENT = "other"


def normalize_name(name: str) -> str:
    """Collapse whitespace + lowercase so names match across the catalog."""
    return " ".join((name or "").strip().lower().split())


def match_names(names: list[str], catalog: dict[str, str]) -> dict[str, str | None]:
    """Map each name to a catalog exercise id (or None if unmatched)."""
    return {name: catalog.get(normalize_name(name)) for name in names}


def first_week_sessions(payload: dict[str, Any]) -> list[dict[str, Any]]:
    weeks = payload.get("weeks") or []
    if not weeks:
        return []
    return weeks[0].get("sessions") or []


def _fetch_catalog(conn: Connection, user_id: str) -> dict[str, str]:
    rows = conn.execute(
        text(
            """
            select id::text as id, name from public.exercises
            where user_id is null or user_id = cast(:u as uuid)
            """
        ),
        {"u": user_id},
    ).all()
    return {normalize_name(row.name): row.id for row in rows}


def _resolve_exercise(
    conn: Connection,
    user_id: str,
    exercise: dict[str, Any],
    catalog: dict[str, str],
) -> tuple[str, bool]:
    """Return (exercise_id, created). Creates a custom when the name is unmatched."""
    key = normalize_name(exercise.get("name"))
    if key in catalog:
        return catalog[key], False

    muscle = exercise.get("primary_muscle")
    if muscle not in MUSCLE_GROUPS:
        muscle = DEFAULT_MUSCLE
    equipment = exercise.get("equipment")
    if equipment not in EQUIPMENT_TYPES:
        equipment = DEFAULT_EQUIPMENT

    new_id = conn.execute(
        text(
            """
            insert into public.exercises
                (user_id, name, primary_muscle, secondary_muscles, equipment, is_custom)
            values (cast(:u as uuid), :name, :muscle, '{}', :equipment, true)
            on conflict do nothing
            returning id::text
            """
        ),
        {
            "u": user_id,
            "name": exercise.get("name"),
            "muscle": muscle,
            "equipment": equipment,
        },
    ).scalar()

    created = new_id is not None
    if new_id is None:
        # A conflicting custom already exists (e.g. same name, different spacing).
        new_id = conn.execute(
            text(
                """
                select id::text from public.exercises
                where user_id = cast(:u as uuid) and lower(name) = :name
                limit 1
                """
            ),
            {"u": user_id, "name": key},
        ).scalar()

    catalog[key] = new_id
    return new_id, created


def save_program(
    user_id: str,
    payload: dict[str, Any],
    *,
    goal_snapshot: dict[str, Any] | None,
    rationale: str | None,
    prompt_version: str | None,
) -> dict[str, Any]:
    """Archive the current active program, store the new one, materialize routines."""
    engine = create_db_engine()
    with engine.begin() as conn:
        conn.execute(
            text(
                "update public.programs set status = 'archived', archived_at = now() "
                "where user_id = cast(:u as uuid) and status = 'active'"
            ),
            {"u": user_id},
        )
        program_id = conn.execute(
            text(
                """
                insert into public.programs
                    (user_id, status, goal_snapshot, payload, rationale, prompt_version)
                values
                    (cast(:u as uuid), 'active', cast(:goal as jsonb), cast(:payload as jsonb),
                     :rationale, :prompt_version)
                returning id::text
                """
            ),
            {
                "u": user_id,
                "goal": json.dumps(goal_snapshot or {}),
                "payload": json.dumps(payload),
                "rationale": rationale,
                "prompt_version": prompt_version,
            },
        ).scalar()

        catalog = _fetch_catalog(conn, user_id)
        customs_created = 0
        routine_count = 0
        for i, session in enumerate(first_week_sessions(payload)):
            day_label = session.get("day_label") or f"Day {i + 1}"
            routine_id = conn.execute(
                text(
                    """
                    insert into public.routines
                        (user_id, name, source, program_id, day_label, sort_order)
                    values
                        (cast(:u as uuid), :name, 'ai', cast(:pid as uuid), :day, :sort)
                    returning id::text
                    """
                ),
                {"u": user_id, "name": day_label, "pid": program_id, "day": day_label, "sort": i},
            ).scalar()
            routine_count += 1

            for j, exercise in enumerate(session.get("exercises") or []):
                exercise_id, created = _resolve_exercise(conn, user_id, exercise, catalog)
                customs_created += int(created)
                conn.execute(
                    text(
                        """
                        insert into public.routine_exercises
                            (routine_id, exercise_id, sort_order, target_sets, target_reps,
                             target_rpe, rest_seconds)
                        values
                            (cast(:rid as uuid), cast(:eid as uuid), :sort, :sets, :reps, :rpe, :rest)
                        """
                    ),
                    {
                        "rid": routine_id,
                        "eid": exercise_id,
                        "sort": j,
                        "sets": exercise.get("sets"),
                        "reps": exercise.get("reps"),
                        "rpe": exercise.get("rpe"),
                        "rest": exercise.get("rest_seconds"),
                    },
                )

    return {
        "program_id": program_id,
        "routines": routine_count,
        "customs_created": customs_created,
    }


def get_active_program(user_id: str) -> dict[str, Any] | None:
    engine = create_db_engine()
    with engine.connect() as conn:
        row = conn.execute(
            text(
                """
                select id::text as id, status, payload, rationale, prompt_version,
                       goal_snapshot, created_at
                from public.programs
                where user_id = cast(:u as uuid) and status = 'active'
                limit 1
                """
            ),
            {"u": user_id},
        ).first()
    if row is None:
        return None
    record = dict(row._mapping)
    record["created_at"] = record["created_at"].isoformat()
    return record
