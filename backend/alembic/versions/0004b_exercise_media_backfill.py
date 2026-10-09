"""Backfill media for the Phase-2 seed rows kept by referencing routines

`0003_exercise_media` replaced the original 71-lift seed with the 1,084-exercise
catalog, but rows referenced by existing routines/sets were preserved and, where
their name differed from the catalog, left without media. This maps those rows
to the closest catalog GIF.

Revision ID: 0004b_exercise_media_backfill
Revises: 0004_activity_nutrition
Create Date: 2026-09-15

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0004b_exercise_media_backfill"
down_revision: Union[str, None] = "0004_activity_nutrition"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

GIF_BASE = "https://raw.githubusercontent.com/mohamedatef90/exercise-library/main/gifs/"

# old seed name (lowercase) -> catalog gif id
BACKFILL: dict[str, str] = {
    "cable crossover": "UKWTJWR",  # Cable Standing Up Straight Crossovers
    "incline dumbbell press": "ns0SIbU",  # Dumbbell Incline Bench Press
    "overhead triceps extension": "2IxROQ1",  # Cable Overhead Triceps Extension
    "pec deck": "7saC5zz",  # Cable Decline Fly
    "triceps pushdown": "gAwDzB3",  # Cable Triceps Pushdown (v-bar)
}


def upgrade() -> None:
    bind = op.get_bind()
    for name, gif in BACKFILL.items():
        bind.execute(
            sa.text(
                "update public.exercises set media_url = :url "
                "where user_id is null and media_url is null and lower(name) = :name"
            ),
            {"url": GIF_BASE + gif + ".gif", "name": name},
        )


def downgrade() -> None:
    bind = op.get_bind()
    for name in BACKFILL:
        bind.execute(
            sa.text(
                "update public.exercises set media_url = null "
                "where user_id is null and lower(name) = :name"
            ),
            {"name": name},
        )
