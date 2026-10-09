"""Phase 4: switch the food catalog to per-100 g values

INDB ships both per-100 g and per-serving figures. "1 bowl"/"1 plate" is
ambiguous, so the catalog now stores per-100 g macros (`serving_description =
"100 g"`) and the app lets users log an exact gram amount. Refreshes the global
INDB rows only; custom foods are untouched.

Revision ID: 0008_food_per_gram
Revises: 0007_food_catalog
Create Date: 2026-09-18

"""

import json
from pathlib import Path
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0008_food_per_gram"
down_revision: Union[str, None] = "0007_food_catalog"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

SEED_PATH = Path(__file__).resolve().parents[2] / "app" / "data" / "foods_seed.json"

_INSERT = sa.text(
    """
    insert into public.foods
        (name, serving_description, kcal, protein_g, carbs_g, fat_g, source, is_custom)
    values
        (:name, :serving_description, :kcal, :protein_g, :carbs_g, :fat_g, :source, false)
    on conflict do nothing
    """
)


def upgrade() -> None:
    bind = op.get_bind()
    bind.execute(sa.text("delete from public.foods where user_id is null and source = 'indb'"))
    foods = json.loads(SEED_PATH.read_text(encoding="utf-8"))
    if foods:
        bind.execute(_INSERT, foods)


def downgrade() -> None:
    # Data-only refresh — the previous per-serving values are not retained.
    pass
