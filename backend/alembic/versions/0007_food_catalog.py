"""Phase 4: global food/recipe catalog (Anuvaad INDB)

Creates `foods` and seeds the global library from the open-access Anuvaad
Indian Nutrient Databank (1,014 recipes; per-serving values). Attribution:
Vijayakumar A, Dubasi HB, Awasthi A, Jaacks LM. Development of an Indian Food
Composition Database. Current Developments in Nutrition. 2024; data:
https://www.anuvaad.org.in/indian-nutrient-databank. Build the seed with
`python scripts/build_foods_seed.py --input <INDB.xlsx>`.

Revision ID: 0007_food_catalog
Revises: 0006_ai
Create Date: 2026-09-17

"""

import json
from pathlib import Path
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

from app.models import Food

# revision identifiers, used by Alembic.
revision: str = "0007_food_catalog"
down_revision: Union[str, None] = "0006_ai"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

SEED_PATH = Path(__file__).resolve().parents[2] / "app" / "data" / "foods_seed.json"

INDEX_STATEMENTS: list[str] = [
    "create index foods_name_idx on public.foods (lower(name))",
    "create unique index foods_global_name_key on public.foods (lower(name)) where user_id is null",
    "create unique index foods_user_name_key on public.foods (user_id, lower(name)) where user_id is not null",
]

# Global rows (user_id NULL) are readable by any authenticated user; customs are
# owner-only. Writes are service-role only (the seed) or owner-only for customs.
RLS_STATEMENTS: list[str] = [
    "alter table public.foods enable row level security",
    'create policy "foods: read" on public.foods '
    "for select using ((user_id is null and auth.uid() is not null) or auth.uid() = user_id)",
    'create policy "foods: owner insert" on public.foods '
    "for insert with check (auth.uid() = user_id and is_custom)",
    'create policy "foods: owner update" on public.foods '
    "for update using (auth.uid() = user_id) with check (auth.uid() = user_id)",
    'create policy "foods: owner delete" on public.foods '
    "for delete using (auth.uid() = user_id)",
]

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
    Food.__table__.create(bind)
    for statement in INDEX_STATEMENTS:
        op.execute(statement)
    for statement in RLS_STATEMENTS:
        op.execute(statement)

    foods = json.loads(SEED_PATH.read_text(encoding="utf-8"))
    if foods:
        bind.execute(_INSERT, foods)


def downgrade() -> None:
    bind = op.get_bind()
    Food.__table__.drop(bind)
