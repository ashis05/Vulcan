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
from sqlalchemy.dialects.postgresql import ARRAY, UUID as PG_UUID
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
