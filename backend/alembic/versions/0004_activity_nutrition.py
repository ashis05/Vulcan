"""Phase 3: daily activity (steps) + meals

Revision ID: 0004_activity_nutrition
Revises: 0003_exercise_media
Create Date: 2026-09-15

"""

from typing import Sequence, Union

from alembic import op

from app.models import DailyActivity, Meal

# revision identifiers, used by Alembic.
revision: str = "0004_activity_nutrition"
down_revision: Union[str, None] = "0003_exercise_media"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

RLS_STATEMENTS: list[str] = [
    "alter table public.daily_activity enable row level security",
    'create policy "daily_activity: owner select" on public.daily_activity '
    "for select using (auth.uid() = user_id)",
    'create policy "daily_activity: owner insert" on public.daily_activity '
    "for insert with check (auth.uid() = user_id)",
    'create policy "daily_activity: owner update" on public.daily_activity '
    "for update using (auth.uid() = user_id) with check (auth.uid() = user_id)",
    'create policy "daily_activity: owner delete" on public.daily_activity '
    "for delete using (auth.uid() = user_id)",
    "alter table public.meals enable row level security",
    'create policy "meals: owner select" on public.meals '
    "for select using (auth.uid() = user_id)",
    'create policy "meals: owner insert" on public.meals '
    "for insert with check (auth.uid() = user_id)",
    'create policy "meals: owner update" on public.meals '
    "for update using (auth.uid() = user_id) with check (auth.uid() = user_id)",
    'create policy "meals: owner delete" on public.meals '
    "for delete using (auth.uid() = user_id)",
]


def upgrade() -> None:
    bind = op.get_bind()
    DailyActivity.__table__.create(bind)
    Meal.__table__.create(bind)
    for statement in RLS_STATEMENTS:
        op.execute(statement)


def downgrade() -> None:
    bind = op.get_bind()
    Meal.__table__.drop(bind)
    DailyActivity.__table__.drop(bind)
