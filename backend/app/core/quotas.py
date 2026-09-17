"""AI quota enforcement — a single call into the atomic `increment_ai_usage` SQL function."""

from datetime import datetime, timedelta, timezone

from sqlalchemy import text

from app.db import create_db_engine


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
    """ISO timestamp of the next UTC midnight (when daily quotas reset)."""
    current = now or datetime.now(timezone.utc)
    midnight = (current + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    return midnight.isoformat()
