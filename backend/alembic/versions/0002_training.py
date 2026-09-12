"""Phase 2: exercises, routines, workout logging

Creates the training tables from SQLModel metadata and seeds the global exercise
library. RLS policies (owner-scoped, with global exercises readable by all) are
raw SQL.

Revision ID: 0002_training
Revises: 0001_profiles
Create Date: 2026-09-12

"""

import uuid
from typing import Sequence, Union

from alembic import op

from app.models import Exercise, Routine, RoutineExercise, Workout, WorkoutSet

# revision identifiers, used by Alembic.
revision: str = "0002_training"
down_revision: Union[str, None] = "0001_profiles"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# (name, primary_muscle, secondary_muscles, equipment)
SEED_EXERCISES: list[tuple[str, str, list[str], str]] = [
    # chest
    ("Barbell Bench Press", "chest", ["triceps", "shoulders"], "barbell"),
    ("Incline Barbell Bench Press", "chest", ["shoulders", "triceps"], "barbell"),
    ("Dumbbell Bench Press", "chest", ["triceps", "shoulders"], "dumbbell"),
    ("Incline Dumbbell Press", "chest", ["shoulders", "triceps"], "dumbbell"),
    ("Dumbbell Fly", "chest", ["shoulders"], "dumbbell"),
    ("Cable Crossover", "chest", ["shoulders"], "cable"),
    ("Machine Chest Press", "chest", ["triceps", "shoulders"], "machine"),
    ("Push-Up", "chest", ["triceps", "shoulders"], "bodyweight"),
    ("Chest Dip", "chest", ["triceps", "shoulders"], "bodyweight"),
    ("Pec Deck", "chest", ["shoulders"], "machine"),
    # back
    ("Deadlift", "back", ["hamstrings", "glutes", "core"], "barbell"),
    ("Barbell Row", "back", ["biceps", "core"], "barbell"),
    ("Pendlay Row", "back", ["biceps"], "barbell"),
    ("Dumbbell Row", "back", ["biceps"], "dumbbell"),
    ("Pull-Up", "back", ["biceps"], "bodyweight"),
    ("Chin-Up", "back", ["biceps"], "bodyweight"),
    ("Lat Pulldown", "back", ["biceps"], "cable"),
    ("Seated Cable Row", "back", ["biceps"], "cable"),
    ("T-Bar Row", "back", ["biceps"], "barbell"),
    ("Face Pull", "back", ["shoulders"], "cable"),
    ("Straight-Arm Pulldown", "back", ["core"], "cable"),
    ("Machine Row", "back", ["biceps"], "machine"),
    # shoulders
    ("Overhead Press", "shoulders", ["triceps", "core"], "barbell"),
    ("Dumbbell Shoulder Press", "shoulders", ["triceps"], "dumbbell"),
    ("Arnold Press", "shoulders", ["triceps"], "dumbbell"),
    ("Lateral Raise", "shoulders", [], "dumbbell"),
    ("Cable Lateral Raise", "shoulders", [], "cable"),
    ("Rear Delt Fly", "shoulders", ["back"], "dumbbell"),
    ("Front Raise", "shoulders", [], "dumbbell"),
    ("Upright Row", "shoulders", ["back", "biceps"], "barbell"),
    ("Machine Shoulder Press", "shoulders", ["triceps"], "machine"),
    # quads
    ("Back Squat", "quads", ["glutes", "hamstrings", "core"], "barbell"),
    ("Front Squat", "quads", ["glutes", "core"], "barbell"),
    ("Hack Squat", "quads", ["glutes"], "machine"),
    ("Leg Press", "quads", ["glutes", "hamstrings"], "machine"),
    ("Bulgarian Split Squat", "quads", ["glutes", "hamstrings"], "dumbbell"),
    ("Walking Lunge", "quads", ["glutes", "hamstrings"], "dumbbell"),
    ("Leg Extension", "quads", [], "machine"),
    ("Goblet Squat", "quads", ["glutes", "core"], "dumbbell"),
    # hamstrings
    ("Romanian Deadlift", "hamstrings", ["glutes", "back"], "barbell"),
    ("Lying Leg Curl", "hamstrings", [], "machine"),
    ("Seated Leg Curl", "hamstrings", [], "machine"),
    ("Nordic Curl", "hamstrings", [], "bodyweight"),
    ("Good Morning", "hamstrings", ["glutes", "back"], "barbell"),
    ("Glute-Ham Raise", "hamstrings", ["glutes"], "bodyweight"),
    # glutes
    ("Hip Thrust", "glutes", ["hamstrings"], "barbell"),
    ("Glute Bridge", "glutes", ["hamstrings"], "bodyweight"),
    ("Cable Kickback", "glutes", ["hamstrings"], "cable"),
    ("Sumo Deadlift", "glutes", ["hamstrings", "back"], "barbell"),
    # biceps
    ("Barbell Curl", "biceps", [], "barbell"),
    ("Dumbbell Curl", "biceps", [], "dumbbell"),
    ("Hammer Curl", "biceps", [], "dumbbell"),
    ("Preacher Curl", "biceps", [], "barbell"),
    ("Cable Curl", "biceps", [], "cable"),
    ("Incline Dumbbell Curl", "biceps", [], "dumbbell"),
    # triceps
    ("Close-Grip Bench Press", "triceps", ["chest", "shoulders"], "barbell"),
    ("Triceps Pushdown", "triceps", [], "cable"),
    ("Overhead Triceps Extension", "triceps", [], "dumbbell"),
    ("Skull Crusher", "triceps", [], "barbell"),
    ("Triceps Dip", "triceps", ["chest", "shoulders"], "bodyweight"),
    ("Cable Overhead Extension", "triceps", [], "cable"),
    # calves
    ("Standing Calf Raise", "calves", [], "machine"),
    ("Seated Calf Raise", "calves", [], "machine"),
    ("Donkey Calf Raise", "calves", [], "machine"),
    # core
    ("Plank", "core", [], "bodyweight"),
    ("Hanging Leg Raise", "core", [], "bodyweight"),
    ("Cable Crunch", "core", [], "cable"),
    ("Russian Twist", "core", [], "bodyweight"),
    ("Ab Wheel Rollout", "core", [], "other"),
    ("Hanging Knee Raise", "core", [], "bodyweight"),
    ("Dead Bug", "core", [], "bodyweight"),
]

RLS_STATEMENTS: list[str] = [
    "alter table public.exercises enable row level security",
    'create policy "exercises: read global or own" on public.exercises '
    "for select using (auth.uid() is not null and (user_id is null or auth.uid() = user_id))",
    'create policy "exercises: owner insert" on public.exercises '
    "for insert with check (auth.uid() = user_id)",
    'create policy "exercises: owner update" on public.exercises '
    "for update using (auth.uid() = user_id) with check (auth.uid() = user_id)",
    'create policy "exercises: owner delete" on public.exercises '
    "for delete using (auth.uid() = user_id)",
    "alter table public.routines enable row level security",
    'create policy "routines: owner select" on public.routines '
    "for select using (auth.uid() = user_id)",
    'create policy "routines: owner insert" on public.routines '
    "for insert with check (auth.uid() = user_id)",
    'create policy "routines: owner update" on public.routines '
    "for update using (auth.uid() = user_id) with check (auth.uid() = user_id)",
    'create policy "routines: owner delete" on public.routines '
    "for delete using (auth.uid() = user_id)",
    "alter table public.routine_exercises enable row level security",
    'create policy "routine_exercises: owner select" on public.routine_exercises '
    "for select using (exists (select 1 from public.routines r "
    "where r.id = routine_id and r.user_id = auth.uid()))",
    'create policy "routine_exercises: owner insert" on public.routine_exercises '
    "for insert with check (exists (select 1 from public.routines r "
    "where r.id = routine_id and r.user_id = auth.uid()))",
    'create policy "routine_exercises: owner update" on public.routine_exercises '
    "for update using (exists (select 1 from public.routines r "
    "where r.id = routine_id and r.user_id = auth.uid())) "
    "with check (exists (select 1 from public.routines r "
    "where r.id = routine_id and r.user_id = auth.uid()))",
    'create policy "routine_exercises: owner delete" on public.routine_exercises '
    "for delete using (exists (select 1 from public.routines r "
    "where r.id = routine_id and r.user_id = auth.uid()))",
    "alter table public.workouts enable row level security",
    'create policy "workouts: owner select" on public.workouts '
    "for select using (auth.uid() = user_id)",
    'create policy "workouts: owner insert" on public.workouts '
    "for insert with check (auth.uid() = user_id)",
    'create policy "workouts: owner update" on public.workouts '
    "for update using (auth.uid() = user_id) with check (auth.uid() = user_id)",
    'create policy "workouts: owner delete" on public.workouts '
    "for delete using (auth.uid() = user_id)",
    "alter table public.workout_sets enable row level security",
    'create policy "workout_sets: owner select" on public.workout_sets '
    "for select using (exists (select 1 from public.workouts w "
    "where w.id = workout_id and w.user_id = auth.uid()))",
    'create policy "workout_sets: owner insert" on public.workout_sets '
    "for insert with check (exists (select 1 from public.workouts w "
    "where w.id = workout_id and w.user_id = auth.uid()))",
    'create policy "workout_sets: owner update" on public.workout_sets '
    "for update using (exists (select 1 from public.workouts w "
    "where w.id = workout_id and w.user_id = auth.uid())) "
    "with check (exists (select 1 from public.workouts w "
    "where w.id = workout_id and w.user_id = auth.uid()))",
    'create policy "workout_sets: owner delete" on public.workout_sets '
    "for delete using (exists (select 1 from public.workouts w "
    "where w.id = workout_id and w.user_id = auth.uid()))",
]

INDEX_STATEMENTS: list[str] = [
    "create unique index if not exists exercises_global_name_key "
    "on public.exercises (lower(name)) where user_id is null",
    "create unique index if not exists exercises_user_name_key "
    "on public.exercises (lower(name), user_id) where user_id is not null",
]


def upgrade() -> None:
    bind = op.get_bind()
    Exercise.__table__.create(bind)
    Routine.__table__.create(bind)
    RoutineExercise.__table__.create(bind)
    Workout.__table__.create(bind)
    WorkoutSet.__table__.create(bind)

    for statement in RLS_STATEMENTS + INDEX_STATEMENTS:
        op.execute(statement)

    op.bulk_insert(
        Exercise.__table__,
        [
            {
                "id": uuid.uuid4(),
                "name": name,
                "primary_muscle": primary,
                "secondary_muscles": secondary,
                "equipment": equipment,
                "is_custom": False,
            }
            for name, primary, secondary, equipment in SEED_EXERCISES
        ],
    )


def downgrade() -> None:
    bind = op.get_bind()
    WorkoutSet.__table__.drop(bind)
    Workout.__table__.drop(bind)
    RoutineExercise.__table__.drop(bind)
    Routine.__table__.drop(bind)
    Exercise.__table__.drop(bind)
