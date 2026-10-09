"""Align the AI quota day with Google's Pacific-time reset

Gemini's free-tier RPD resets at midnight **Pacific**, so `increment_ai_usage`
now buckets by the Pacific calendar date instead of the server's UTC date.
`quotas.quota_resets_at()` returns the same boundary.

Revision ID: 0008b_ai_quota_timezone
Revises: 0008_food_per_gram
Create Date: 2026-09-19

"""

from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0008b_ai_quota_timezone"
down_revision: Union[str, None] = "0008_food_per_gram"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

PACIFIC_FUNCTION = """
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
    usage_day date := (now() at time zone 'America/Los_Angeles')::date;
begin
    insert into public.ai_usage (user_id, usage_date, feature, count)
    values (p_user, usage_day, p_feature, 0)
    on conflict (user_id, usage_date, feature) do nothing;

    select count into current_count
    from public.ai_usage
    where user_id = p_user and usage_date = usage_day and feature = p_feature
    for update;

    if current_count >= p_limit then
        return false;
    end if;

    update public.ai_usage
    set count = count + 1, updated_at = now()
    where user_id = p_user and usage_date = usage_day and feature = p_feature;

    return true;
end;
$$;
"""

UTC_FUNCTION = PACIFIC_FUNCTION.replace(
    "usage_day date := (now() at time zone 'America/Los_Angeles')::date;",
    "usage_day date := current_date;",
)


def upgrade() -> None:
    op.execute(PACIFIC_FUNCTION)


def downgrade() -> None:
    op.execute(UTC_FUNCTION)
