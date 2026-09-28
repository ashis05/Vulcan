"""Phase 6: physique check-in photos + the private progress-photos bucket

Creates `progress_photos` (owner-only RLS; `analysis` written by the service
role) and the private `progress-photos` storage bucket with owner-scoped
policies mirroring `food-photos` (revision `0006_ai`).

Revision ID: 0010_physique
Revises: 0009_programs
Create Date: 2026-09-29

"""

from typing import Sequence, Union

from alembic import op

from app.models import ProgressPhoto

# revision identifiers, used by Alembic.
revision: str = "0010_physique"
down_revision: Union[str, None] = "0009_programs"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

RLS_STATEMENTS: list[str] = [
    "alter table public.progress_photos enable row level security",
    'create policy "progress_photos: owner select" on public.progress_photos '
    "for select using (auth.uid() = user_id)",
    'create policy "progress_photos: owner insert" on public.progress_photos '
    "for insert with check (auth.uid() = user_id)",
    'create policy "progress_photos: owner update" on public.progress_photos '
    "for update using (auth.uid() = user_id) with check (auth.uid() = user_id)",
    'create policy "progress_photos: owner delete" on public.progress_photos '
    "for delete using (auth.uid() = user_id)",
]

BUCKET = "progress-photos"

STORAGE_STATEMENTS: list[str] = [
    f"insert into storage.buckets (id, name, public) values ('{BUCKET}', '{BUCKET}', false) "
    "on conflict (id) do nothing",
]

for action, clause in (
    ("select", "using"),
    ("insert", "with check"),
    ("update", "using"),
    ("delete", "using"),
):
    STORAGE_STATEMENTS.append(
        f"""
    do $$ begin
      if not exists (
        select 1 from pg_policies
        where schemaname = 'storage' and tablename = 'objects'
          and policyname = '{BUCKET}: owner {action}'
      ) then
        create policy "{BUCKET}: owner {action}" on storage.objects
        for {action} {clause} (
          bucket_id = '{BUCKET}' and auth.uid()::text = (storage.foldername(name))[1]
        );
      end if;
    end $$;
    """
    )


def upgrade() -> None:
    bind = op.get_bind()
    ProgressPhoto.__table__.create(bind)
    for statement in RLS_STATEMENTS:
        op.execute(statement)
    for statement in STORAGE_STATEMENTS:
        op.execute(statement)


def downgrade() -> None:
    for action in ("select", "insert", "update", "delete"):
        op.execute(f'drop policy if exists "{BUCKET}: owner {action}" on storage.objects')
    bind = op.get_bind()
    ProgressPhoto.__table__.drop(bind)
