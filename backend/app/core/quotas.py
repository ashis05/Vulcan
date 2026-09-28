"""AI quota enforcement — daily counters (via the atomic `increment_ai_usage`
SQL function) plus windowed "once per N days" checks for program/physique.

The quota day (and reset) follows Gemini's free-tier boundary: midnight Pacific.
"""

from datetime import date, datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo

from sqlalchemy import text

from app.db import create_db_engine

PACIFIC = ZoneInfo("America/Los_Angeles")


def increment_usage(user_id: str, feature: str, limit: int) -> bool:
    """Increment the user's daily counter for `feature`. False → quota exhausted."""
    engine = create_db_engine()
    with engine.begin() as conn:
        allowed = conn.execute(
            text("select public.increment_ai_usage(cast(:user_id as uuid), :feature, :limit)"),
            {"user_id": user_id, "feature": feature, "limit": limit},
        ).scalar()
    return bool(allowed)


def quota_resets_at(now: datetime | None = None) -> str:
    """ISO (UTC) timestamp of the next midnight Pacific — when quotas reset."""
    current = (now or datetime.now(timezone.utc)).astimezone(PACIFIC)
    midnight = (current + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    return midnight.astimezone(timezone.utc).isoformat()


def pacific_today() -> date:
    return datetime.now(PACIFIC).date()


def check_once_per_days(user_id: str, feature: str, days: int) -> tuple[bool, date | None]:
    """Windowed check: at most one successful use per `days`.

    Read-only — recording happens via `record_use` so a failed generation doesn't
    consume the window. Returns (allowed, last_used_date).
    """
    engine = create_db_engine()
    today = pacific_today()
    with engine.connect() as conn:
        last = conn.execute(
            text(
                """
                select max(usage_date) from public.ai_usage
                where user_id = cast(:u as uuid) and feature = :f and count > 0
                """
            ),
            {"u": user_id, "f": feature},
        ).scalar()
    if last is not None and (today - last).days < days:
        return False, last
    return True, last


def record_use(user_id: str, feature: str) -> None:
    """Record a successful use of a windowed feature (increments today's counter)."""
    engine = create_db_engine()
    with engine.begin() as conn:
        conn.execute(
            text("select public.increment_ai_usage(cast(:u as uuid), :f, 2147483647)"),
            {"u": user_id, "f": feature},
        )


def window_resets_at(last_used: date, days: int) -> str:
    """ISO (UTC) timestamp when a `days`-window that started on `last_used` resets."""
    reset = datetime.combine(last_used + timedelta(days=days), time(0, 0), tzinfo=PACIFIC)
    return reset.astimezone(timezone.utc).isoformat()
