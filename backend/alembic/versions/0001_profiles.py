"""Phase 1: profiles + body_metrics

Creates the tables from the SQLModel definitions, then applies the raw SQL that
SQLModel cannot express: RLS policies and the `handle_new_user` signup trigger.

Revision ID: 0001_profiles
Revises:
Create Date: 2026-09-12

"""

from typing import Sequence, Union

from alembic import op

from app.models import BodyMetric, Profile

# revision identifiers, used by Alembic.
revision: str = "0001_profiles"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# RLS + trigger statements. Kept as discrete statements (the function body's
# internal semicolons make naive splitting unsafe).
RLS_STATEMENTS: list[str] = [
    "alter table public.profiles enable row level security",
    'create policy "profiles: owner select" on public.profiles '
    "for select using (auth.uid() = id)",
    'create policy "profiles: owner insert" on public.profiles '
    "for insert with check (auth.uid() = id)",
    'create policy "profiles: owner update" on public.profiles '
    "for update using (auth.uid() = id) with check (auth.uid() = id)",
    "alter table public.body_metrics enable row level security",
    'create policy "body_metrics: owner select" on public.body_metrics '
    "for select using (auth.uid() = user_id)",
    'create policy "body_metrics: owner insert" on public.body_metrics '
    "for insert with check (auth.uid() = user_id)",
    'create policy "body_metrics: owner update" on public.body_metrics '
    "for update using (auth.uid() = user_id) with check (auth.uid() = user_id)",
    "create or replace function public.handle_new_user() "
    "returns trigger language plpgsql security definer set search_path = public as $$ "
    "begin "
    "insert into public.profiles (id) values (new.id) on conflict (id) do nothing; "
    "return new; "
    "end; "
    "$$",
    "drop trigger if exists on_auth_user_created on auth.users",
    "create trigger on_auth_user_created after insert on auth.users "
    "for each row execute procedure public.handle_new_user()",
]


def upgrade() -> None:
    bind = op.get_bind()
    Profile.__table__.create(bind)
    BodyMetric.__table__.create(bind)
    # Cross-schema FK to Supabase Auth (kept out of SQLModel metadata).
    op.execute(
        "alter table public.profiles add constraint profiles_id_fkey "
        "foreign key (id) references auth.users (id) on delete cascade"
    )
    for statement in RLS_STATEMENTS:
        op.execute(statement)


def downgrade() -> None:
    op.execute("drop trigger if exists on_auth_user_created on auth.users")
    op.execute("drop function if exists public.handle_new_user()")
    bind = op.get_bind()
    BodyMetric.__table__.drop(bind)
    Profile.__table__.drop(bind)
