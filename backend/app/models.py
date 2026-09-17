"""SQLModel table definitions — the schema source of truth for Alembic.

Mirrors PLAN.md §6. RLS policies and the `handle_new_user` trigger are not
expressible in SQLModel metadata, so they live in `alembic/versions/0001_profiles.py`.
"""

from datetime import date, datetime
from typing import List, Optional
from uuid import UUID, uuid4

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    Text,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID as PG_UUID
from sqlmodel import Field, SQLModel


class Profile(SQLModel, table=True):
    __tablename__ = "profiles"
    __table_args__ = (
        CheckConstraint("sex in ('male', 'female')", name="profiles_sex_check"),
        CheckConstraint("height_unit in ('cm', 'ft')", name="profiles_height_unit_check"),
        CheckConstraint("weight_unit in ('kg', 'lb')", name="profiles_weight_unit_check"),
        CheckConstraint("goal in ('cut', 'recomp', 'maintain', 'bulk')", name="profiles_goal_check"),
        CheckConstraint("pace_kg_wk >= -1 and pace_kg_wk <= 0.5", name="profiles_pace_check"),
        CheckConstraint(
            "activity_level in ('sedentary', 'light', 'moderate', 'very_active')",
            name="profiles_activity_level_check",
        ),
        CheckConstraint(
            "experience in ('beginner', 'intermediate', 'advanced')",
            name="profiles_experience_check",
        ),
        CheckConstraint("days_per_week between 1 and 7", name="profiles_days_per_week_check"),
        CheckConstraint("session_len_min > 0", name="profiles_session_len_check"),
        {"schema": "public"},
    )

    id: UUID = Field(sa_column=Column(PG_UUID(as_uuid=True), primary_key=True))
    # NOTE: the FK to auth.users (ON DELETE CASCADE) is added in the migration —
    # auth.users lives outside our metadata and cannot be resolved by SQLAlchemy.
    display_name: Optional[str] = Field(default=None, sa_column=Column(Text))
    sex: Optional[str] = Field(default=None, sa_column=Column(Text))
    birth_date: Optional[date] = Field(default=None, sa_column=Column(Date))
    height_cm: Optional[float] = Field(default=None, sa_column=Column(Numeric(5, 1)))
    height_unit: str = Field(
        default="cm",
        sa_column=Column(Text, nullable=False, server_default=text("'cm'")),
    )
    weight_unit: str = Field(
        default="kg",
        sa_column=Column(Text, nullable=False, server_default=text("'kg'")),
    )
    goal: Optional[str] = Field(default=None, sa_column=Column(Text))
    pace_kg_wk: float = Field(
        default=-0.5,
        sa_column=Column(Numeric(4, 2), nullable=False, server_default=text("-0.5")),
    )
    activity_level: Optional[str] = Field(default=None, sa_column=Column(Text))
    experience: Optional[str] = Field(default=None, sa_column=Column(Text))
    days_per_week: Optional[int] = Field(default=None, sa_column=Column(Integer))
    session_len_min: Optional[int] = Field(default=None, sa_column=Column(Integer))
    equipment: List[str] = Field(
        default_factory=list,
        sa_column=Column(ARRAY(Text), nullable=False, server_default=text("'{}'")),
    )
    injuries: List[str] = Field(
        default_factory=list,
        sa_column=Column(ARRAY(Text), nullable=False, server_default=text("'{}'")),
    )
    injuries_note: Optional[str] = Field(default=None, sa_column=Column(Text))
    onboarding_completed: bool = Field(
        default=False,
        sa_column=Column(Boolean, nullable=False, server_default=text("false")),
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(
            DateTime(timezone=True), nullable=False, server_default=func.now()
        ),
    )


class BodyMetric(SQLModel, table=True):
    __tablename__ = "body_metrics"
    __table_args__ = (
        CheckConstraint("weight_kg > 0", name="body_metrics_weight_kg_check"),
        CheckConstraint(
            "bodyfat_pct > 0 and bodyfat_pct < 100",
            name="body_metrics_bodyfat_pct_check",
        ),
        UniqueConstraint(
            "user_id", "measured_on", name="body_metrics_user_id_measured_on_key"
        ),
        Index("body_metrics_user_date_idx", "user_id", text("measured_on DESC")),
        {"schema": "public"},
    )

    id: UUID = Field(
        default_factory=uuid4,
        sa_column=Column(
            PG_UUID(as_uuid=True),
            primary_key=True,
            server_default=func.gen_random_uuid(),
        ),
    )
    user_id: UUID = Field(
        sa_column=Column(
            PG_UUID(as_uuid=True),
            ForeignKey("public.profiles.id", ondelete="CASCADE"),
            nullable=False,
        )
    )
    measured_on: date = Field(sa_column=Column(Date, nullable=False))
    weight_kg: float = Field(sa_column=Column(Numeric(5, 2), nullable=False))
    bodyfat_pct: Optional[float] = Field(default=None, sa_column=Column(Numeric(4, 1)))
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(
            DateTime(timezone=True), nullable=False, server_default=func.now()
        ),
    )


MUSCLE_GROUPS = (
    "chest",
    "back",
    "shoulders",
    "quads",
    "hamstrings",
    "glutes",
    "biceps",
    "triceps",
    "calves",
    "core",
)
EQUIPMENT_TYPES = ("barbell", "dumbbell", "machine", "cable", "bodyweight", "other")
_SET_TYPES = ("warmup", "normal", "drop", "failure")
MEAL_SLOTS = ("breakfast", "lunch", "dinner", "snacks")

# Reusable SQL fragments for the CHECK constraints below.
_MUSCLE_IN = ", ".join(f"'{m}'" for m in MUSCLE_GROUPS)
_EQUIPMENT_IN = ", ".join(f"'{e}'" for e in EQUIPMENT_TYPES)
_SET_TYPES_IN = ", ".join(f"'{s}'" for s in _SET_TYPES)
_MEAL_SLOTS_IN = ", ".join(f"'{s}'" for s in MEAL_SLOTS)

# Cross-schema / forward references which cannot be resolved from metadata are
# added as raw SQL in the revision: `auth.users` (0001) and `programs` (Phase 5).


class Exercise(SQLModel, table=True):
    """Global rows (`user_id IS NULL`) are readable by any authenticated user;
    custom rows are owner-only. Seeded in revision 0002_training."""

    __tablename__ = "exercises"
    __table_args__ = (
        CheckConstraint(f"primary_muscle in ({_MUSCLE_IN})", name="exercises_primary_muscle_check"),
        CheckConstraint(f"equipment in ({_EQUIPMENT_IN})", name="exercises_equipment_check"),
        Index("exercises_user_id_idx", "user_id"),
        {"schema": "public"},
    )

    id: UUID = Field(
        default_factory=uuid4,
        sa_column=Column(
            PG_UUID(as_uuid=True),
            primary_key=True,
            server_default=func.gen_random_uuid(),
        ),
    )
    user_id: Optional[UUID] = Field(
        default=None,
        sa_column=Column(
            PG_UUID(as_uuid=True),
            ForeignKey("public.profiles.id", ondelete="CASCADE"),
            nullable=True,
        ),
    )
    name: str = Field(sa_column=Column(Text, nullable=False))
    primary_muscle: str = Field(sa_column=Column(Text, nullable=False))
    secondary_muscles: List[str] = Field(
        default_factory=list,
        sa_column=Column(ARRAY(Text), nullable=False, server_default=text("'{}'")),
    )
    equipment: str = Field(
        default="other",
        sa_column=Column(Text, nullable=False, server_default=text("'other'")),
    )
    is_custom: bool = Field(
        default=False,
        sa_column=Column(Boolean, nullable=False, server_default=text("false")),
    )
    # Tutorial GIF URL (global catalog). Null for exercises without media.
    media_url: Optional[str] = Field(default=None, sa_column=Column(Text))
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(
            DateTime(timezone=True), nullable=False, server_default=func.now()
        ),
    )


class Routine(SQLModel, table=True):
    __tablename__ = "routines"
    __table_args__ = (
        CheckConstraint("source in ('manual', 'ai')", name="routines_source_check"),
        Index("routines_user_id_idx", "user_id"),
        {"schema": "public"},
    )

    id: UUID = Field(
        default_factory=uuid4,
        sa_column=Column(
            PG_UUID(as_uuid=True),
            primary_key=True,
            server_default=func.gen_random_uuid(),
        ),
    )
    user_id: UUID = Field(
        sa_column=Column(
            PG_UUID(as_uuid=True),
            ForeignKey("public.profiles.id", ondelete="CASCADE"),
            nullable=False,
        )
    )
    name: str = Field(sa_column=Column(Text, nullable=False))
    source: str = Field(
        default="manual",
        sa_column=Column(Text, nullable=False, server_default=text("'manual'")),
    )
    # FK to programs added in Phase 5 (table does not exist yet).
    program_id: Optional[UUID] = Field(
        default=None, sa_column=Column(PG_UUID(as_uuid=True), nullable=True)
    )
    day_label: Optional[str] = Field(default=None, sa_column=Column(Text))
    sort_order: int = Field(
        default=0,
        sa_column=Column(Integer, nullable=False, server_default=text("0")),
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(
            DateTime(timezone=True), nullable=False, server_default=func.now()
        ),
    )


class RoutineExercise(SQLModel, table=True):
    __tablename__ = "routine_exercises"
    __table_args__ = (
        CheckConstraint("target_sets is null or target_sets > 0", name="routine_exercises_sets_check"),
        CheckConstraint("target_rpe is null or (target_rpe >= 0 and target_rpe <= 10)", name="routine_exercises_rpe_check"),
        Index("routine_exercises_routine_id_idx", "routine_id"),
        Index("routine_exercises_exercise_id_idx", "exercise_id"),
        {"schema": "public"},
    )

    id: UUID = Field(
        default_factory=uuid4,
        sa_column=Column(
            PG_UUID(as_uuid=True),
            primary_key=True,
            server_default=func.gen_random_uuid(),
        ),
    )
    routine_id: UUID = Field(
        sa_column=Column(
            PG_UUID(as_uuid=True),
            ForeignKey("public.routines.id", ondelete="CASCADE"),
            nullable=False,
        )
    )
    exercise_id: UUID = Field(
        sa_column=Column(
            PG_UUID(as_uuid=True),
            ForeignKey("public.exercises.id", ondelete="CASCADE"),
            nullable=False,
        )
    )
    sort_order: int = Field(
        default=0,
        sa_column=Column(Integer, nullable=False, server_default=text("0")),
    )
    target_sets: Optional[int] = Field(default=None, sa_column=Column(Integer))
    target_reps: Optional[str] = Field(default=None, sa_column=Column(Text))
    target_rpe: Optional[float] = Field(default=None, sa_column=Column(Numeric(3, 1)))
    superset_group: Optional[str] = Field(default=None, sa_column=Column(Text))
    rest_seconds: Optional[int] = Field(default=None, sa_column=Column(Integer))


class Workout(SQLModel, table=True):
    __tablename__ = "workouts"
    __table_args__ = (
        Index("workouts_user_started_idx", "user_id", text("started_at DESC")),
        {"schema": "public"},
    )

    id: UUID = Field(
        default_factory=uuid4,
        sa_column=Column(
            PG_UUID(as_uuid=True),
            primary_key=True,
            server_default=func.gen_random_uuid(),
        ),
    )
    user_id: UUID = Field(
        sa_column=Column(
            PG_UUID(as_uuid=True),
            ForeignKey("public.profiles.id", ondelete="CASCADE"),
            nullable=False,
        )
    )
    routine_id: Optional[UUID] = Field(
        default=None,
        sa_column=Column(
            PG_UUID(as_uuid=True),
            ForeignKey("public.routines.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    started_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(
            DateTime(timezone=True), nullable=False, server_default=func.now()
        ),
    )
    ended_at: Optional[datetime] = Field(
        default=None, sa_column=Column(DateTime(timezone=True))
    )
    notes: Optional[str] = Field(default=None, sa_column=Column(Text))
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(
            DateTime(timezone=True), nullable=False, server_default=func.now()
        ),
    )


class WorkoutSet(SQLModel, table=True):
    __tablename__ = "workout_sets"
    __table_args__ = (
        CheckConstraint(f"set_type in ({_SET_TYPES_IN})", name="workout_sets_set_type_check"),
        CheckConstraint("set_number >= 1", name="workout_sets_set_number_check"),
        CheckConstraint("reps is null or reps >= 0", name="workout_sets_reps_check"),
        CheckConstraint("weight_kg is null or weight_kg >= 0", name="workout_sets_weight_check"),
        CheckConstraint("rpe is null or (rpe >= 0 and rpe <= 10)", name="workout_sets_rpe_check"),
        Index("workout_sets_workout_id_idx", "workout_id"),
        Index("workout_sets_exercise_id_idx", "exercise_id"),
        {"schema": "public"},
    )

    id: UUID = Field(
        default_factory=uuid4,
        sa_column=Column(
            PG_UUID(as_uuid=True),
            primary_key=True,
            server_default=func.gen_random_uuid(),
        ),
    )
    workout_id: UUID = Field(
        sa_column=Column(
            PG_UUID(as_uuid=True),
            ForeignKey("public.workouts.id", ondelete="CASCADE"),
            nullable=False,
        )
    )
    exercise_id: UUID = Field(
        sa_column=Column(
            PG_UUID(as_uuid=True),
            ForeignKey("public.exercises.id", ondelete="RESTRICT"),
            nullable=False,
        )
    )
    set_number: int = Field(sa_column=Column(Integer, nullable=False))
    set_type: str = Field(
        default="normal",
        sa_column=Column(Text, nullable=False, server_default=text("'normal'")),
    )
    superset_group: Optional[str] = Field(default=None, sa_column=Column(Text))
    reps: Optional[int] = Field(default=None, sa_column=Column(Integer))
    weight_kg: Optional[float] = Field(default=None, sa_column=Column(Numeric(6, 2)))
    rpe: Optional[float] = Field(default=None, sa_column=Column(Numeric(3, 1)))
    completed: bool = Field(
        default=False,
        sa_column=Column(Boolean, nullable=False, server_default=text("false")),
    )
    is_pr: bool = Field(
        default=False,
        sa_column=Column(Boolean, nullable=False, server_default=text("false")),
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(
            DateTime(timezone=True), nullable=False, server_default=func.now()
        ),
    )


class DailyActivity(SQLModel, table=True):
    """One row per user per day: Health Connect steps + the calorie budget they imply."""

    __tablename__ = "daily_activity"
    __table_args__ = (
        CheckConstraint("steps >= 0", name="daily_activity_steps_check"),
        UniqueConstraint("user_id", "activity_date", name="daily_activity_user_id_activity_date_key"),
        Index("daily_activity_user_date_idx", "user_id", text("activity_date DESC")),
        {"schema": "public"},
    )

    id: UUID = Field(
        default_factory=uuid4,
        sa_column=Column(
            PG_UUID(as_uuid=True),
            primary_key=True,
            server_default=func.gen_random_uuid(),
        ),
    )
    user_id: UUID = Field(
        sa_column=Column(
            PG_UUID(as_uuid=True),
            ForeignKey("public.profiles.id", ondelete="CASCADE"),
            nullable=False,
        )
    )
    activity_date: date = Field(sa_column=Column(Date, nullable=False))
    steps: int = Field(default=0, sa_column=Column(Integer, nullable=False, server_default=text("0")))
    target_kcal: Optional[int] = Field(default=None, sa_column=Column(Integer))
    step_bonus_kcal: Optional[int] = Field(default=None, sa_column=Column(Integer))
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(
            DateTime(timezone=True), nullable=False, server_default=func.now()
        ),
    )


class Meal(SQLModel, table=True):
    __tablename__ = "meals"
    __table_args__ = (
        CheckConstraint("source in ('manual', 'photo')", name="meals_source_check"),
        CheckConstraint(f"meal_slot in ({_MEAL_SLOTS_IN})", name="meals_meal_slot_check"),
        CheckConstraint("calories >= 0", name="meals_calories_check"),
        Index("meals_user_logged_idx", "user_id", text("logged_at DESC")),
        {"schema": "public"},
    )

    id: UUID = Field(
        default_factory=uuid4,
        sa_column=Column(
            PG_UUID(as_uuid=True),
            primary_key=True,
            server_default=func.gen_random_uuid(),
        ),
    )
    user_id: UUID = Field(
        sa_column=Column(
            PG_UUID(as_uuid=True),
            ForeignKey("public.profiles.id", ondelete="CASCADE"),
            nullable=False,
        )
    )
    logged_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False, server_default=func.now()),
    )
    name: str = Field(sa_column=Column(Text, nullable=False))
    # Breakfast/lunch/dinner/snacks — drives the S16 diary sections.
    meal_slot: str = Field(
        default="snacks",
        sa_column=Column(Text, nullable=False, server_default=text("'snacks'")),
    )
    photo_path: Optional[str] = Field(default=None, sa_column=Column(Text))
    calories: int = Field(default=0, sa_column=Column(Integer, nullable=False, server_default=text("0")))
    protein_g: float = Field(default=0, sa_column=Column(Numeric(6, 1), nullable=False, server_default=text("0")))
    carbs_g: float = Field(default=0, sa_column=Column(Numeric(6, 1), nullable=False, server_default=text("0")))
    fat_g: float = Field(default=0, sa_column=Column(Numeric(6, 1), nullable=False, server_default=text("0")))
    source: str = Field(
        default="manual",
        sa_column=Column(Text, nullable=False, server_default=text("'manual'")),
    )
    ai_raw: Optional[dict] = Field(default=None, sa_column=Column(JSONB))
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(
            DateTime(timezone=True), nullable=False, server_default=func.now()
        ),
    )
