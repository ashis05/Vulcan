"""Phase 5: AI-generated training programs

Creates `programs` (one `active` per user via a partial unique index) and adds
the `routines.program_id` foreign key that Phase 2 reserved. RLS is owner-only.

Revision ID: 0009_programs
Revises: 0008b_ai_quota_timezone
Create Date: 2026-09-28

"""

from typing import Sequence, Union

from alembic import op

from app.models import Program

# revision identifiers, used by Alembic.
revision: str = "0009_programs"
down_revision: Union[str, None] = "0008b_ai_quota_timezone"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

INDEX_STATEMENTS: list[str] = [
    "create unique index programs_one_active_key on public.programs (user_id) where status = 'active'",
    "create index routines_program_id_idx on public.routines (program_id)",
]

# Programs are private to their owner. The API writes them with the service role
# (which bypasses RLS); these policies let the app read its own rows directly.
RLS_STATEMENTS: list[str] = [
    "alter table public.programs enable row level security",
    'create policy "programs: owner select" on public.programs '
    "for select using (auth.uid() = user_id)",
    'create policy "programs: owner insert" on public.programs '
    "for insert with check (auth.uid() = user_id)",
    'create policy "programs: owner update" on public.programs '
    "for update using (auth.uid() = user_id) with check (auth.uid() = user_id)",
    'create policy "programs: owner delete" on public.programs '
    "for delete using (auth.uid() = user_id)",
]

# routines.program_id existed since Phase 2 but had no FK (the table didn't exist).
FK_STATEMENTS: list[str] = [
    "alter table public.routines "
    "add constraint routines_program_id_fkey foreign key (program_id) "
    "references public.programs(id) on delete set null",
]


def upgrade() -> None:
    bind = op.get_bind()
    Program.__table__.create(bind)
    for statement in INDEX_STATEMENTS:
        op.execute(statement)
    for statement in RLS_STATEMENTS:
        op.execute(statement)
    for statement in FK_STATEMENTS:
        op.execute(statement)


def downgrade() -> None:
    op.execute("alter table public.routines drop constraint if exists routines_program_id_fkey")
    op.execute("drop index if exists public.routines_program_id_idx")
    bind = op.get_bind()
    Program.__table__.drop(bind)
