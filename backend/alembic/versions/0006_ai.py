"""Phase 4: AI usage/calls, the quota function, and the private food-photos bucket

Revision ID: 0006_ai
Revises: 0005_meal_slot
Create Date: 2026-09-17

"""

from typing import Sequence, Union

from alembic import op

from app.models import AiCall, AiUsage

# revision identifiers, used by Alembic.
revision: str = "0006_ai"
down_revision: Union[str, None] = "0005_meal_slot"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Atomic upsert + increment. Returns whether the call is allowed (count < limit).
# SECURITY DEFINER so it can write ai_usage from the service role.
INCREMENT_FUNCTION = """
create or replace function public.increment_ai_usage(
    p_user uuid,
    p_feature text,
    p_limit int
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
    current_count int;
begin
    insert into public.ai_usage (user_id, usage_date, feature, count)
    values (p_user, current_date, p_feature, 0)
    on conflict (user_id, usage_date, feature) do nothing;

    select count into current_count
    from public.ai_usage
    where user_id = p_user and usage_date = current_date and feature = p_feature
    for update;

    if current_count >= p_limit then
        return false;
    end if;

    update public.ai_usage
    set count = count + 1, updated_at = now()
    where user_id = p_user and usage_date = current_date and feature = p_feature;

    return true;
end;
$$;
"""

# ai_usage: users may read only their own rows (quota meters); writes are
# service-role only. ai_calls: RLS enabled, no policies → service-role only.
RLS_STATEMENTS: list[str] = [
    "alter table public.ai_usage enable row level security",
    'create policy "ai_usage: owner select" on public.ai_usage '
    "for select using (auth.uid() = user_id)",
    "alter table public.ai_calls enable row level security",
]

STORAGE_STATEMENTS: list[str] = [
    "insert into storage.buckets (id, name, public) values ('food-photos', 'food-photos', false) "
    "on conflict (id) do nothing",
    """
    do $$ begin
      if not exists (
        select 1 from pg_policies
        where schemaname = 'storage' and tablename = 'objects'
          and policyname = 'food-photos: owner select'
      ) then
        create policy "food-photos: owner select" on storage.objects
        for select using (
          bucket_id = 'food-photos' and auth.uid()::text = (storage.foldername(name))[1]
        );
      end if;
    end $$;
    """,
    """
    do $$ begin
      if not exists (
        select 1 from pg_policies
        where schemaname = 'storage' and tablename = 'objects'
          and policyname = 'food-photos: owner insert'
      ) then
        create policy "food-photos: owner insert" on storage.objects
        for insert with check (
          bucket_id = 'food-photos' and auth.uid()::text = (storage.foldername(name))[1]
        );
      end if;
    end $$;
    """,
    """
    do $$ begin
      if not exists (
        select 1 from pg_policies
        where schemaname = 'storage' and tablename = 'objects'
          and policyname = 'food-photos: owner update'
      ) then
        create policy "food-photos: owner update" on storage.objects
        for update using (
          bucket_id = 'food-photos' and auth.uid()::text = (storage.foldername(name))[1]
        );
      end if;
    end $$;
    """,
    """
    do $$ begin
      if not exists (
        select 1 from pg_policies
        where schemaname = 'storage' and tablename = 'objects'
          and policyname = 'food-photos: owner delete'
      ) then
        create policy "food-photos: owner delete" on storage.objects
        for delete using (
          bucket_id = 'food-photos' and auth.uid()::text = (storage.foldername(name))[1]
        );
      end if;
    end $$;
    """,
]


def upgrade() -> None:
    bind = op.get_bind()
    AiUsage.__table__.create(bind)
    AiCall.__table__.create(bind)
    for statement in RLS_STATEMENTS:
        op.execute(statement)
    op.execute(INCREMENT_FUNCTION)
    for statement in STORAGE_STATEMENTS:
        op.execute(statement)


def downgrade() -> None:
    for policy in (
        "food-photos: owner select",
        "food-photos: owner insert",
        "food-photos: owner update",
        "food-photos: owner delete",
    ):
        op.execute(f'drop policy if exists "{policy}" on storage.objects')
    op.execute("drop function if exists public.increment_ai_usage(uuid, text, int)")
    bind = op.get_bind()
    AiCall.__table__.drop(bind)
    AiUsage.__table__.drop(bind)
