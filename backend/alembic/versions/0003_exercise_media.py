"""Phase 2: exercise media catalog

Adds `exercises.media_url` and expands the global library to the full gym
catalog (1,084 lifts) from the MIT-licensed exercise-library dataset. Old
unreferenced seed rows are replaced; rows referenced by logged routines/sets
are preserved and updated in place.

Revision ID: 0003_exercise_media
Revises: 0002_training
Create Date: 2026-09-12

"""

import json
from pathlib import Path
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0003_exercise_media"
down_revision: Union[str, None] = "0002_training"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

SEED_PATH = Path(__file__).resolve().parents[2] / "app" / "data" / "exercises_seed.json"

_UPDATE = sa.text(
    """
    update public.exercises
       set media_url = :media,
           primary_muscle = :primary,
           secondary_muscles = :secondary,
           equipment = :equipment
     where user_id is null and lower(name) = lower(:name)
    """
)

_INSERT = sa.text(
    """
    insert into public.exercises
        (name, primary_muscle, secondary_muscles, equipment, is_custom, media_url)
    values
        (:name, :primary, :secondary, :equipment, false, :media)
    """
)


def upgrade() -> None:
    op.add_column("exercises", sa.Column("media_url", sa.Text(), nullable=True), schema="public")

    bind = op.get_bind()

    # Drop the original small seed (only rows nothing depends on), then build the
    # full catalog. Referenced rows are kept and updated below.
    bind.execute(
        sa.text(
            """
            delete from public.exercises e
             where e.user_id is null
               and not exists (select 1 from public.routine_exercises re where re.exercise_id = e.id)
               and not exists (select 1 from public.workout_sets ws where ws.exercise_id = e.id)
            """
        )
    )

    rows = json.loads(SEED_PATH.read_text(encoding="utf-8"))
    for row in rows:
        params = {
            "name": row["name"],
            "primary": row["primary_muscle"],
            "secondary": row["secondary_muscles"],
            "equipment": row["equipment"],
            "media": row["media_url"],
        }
        result = bind.execute(_UPDATE, params)
        if result.rowcount == 0:
            bind.execute(_INSERT, params)


def downgrade() -> None:
    # Data-expanding migration: dropping the column keeps the expanded catalog.
    op.drop_column("exercises", "media_url", schema="public")
