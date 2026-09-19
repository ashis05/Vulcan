from datetime import datetime, timezone

from app.core.quotas import quota_resets_at


def test_resets_at_next_pacific_midnight_summer():
    # 2026-09-19 10:00 UTC = 03:00 PDT → next midnight PDT = 2026-09-20 07:00 UTC
    now = datetime(2026, 9, 19, 10, 0, tzinfo=timezone.utc)
    assert quota_resets_at(now) == "2026-09-20T07:00:00+00:00"


def test_resets_at_next_pacific_midnight_winter():
    # 2026-12-15 05:00 UTC = 2026-12-14 21:00 PST → next midnight = 2026-12-15 08:00 UTC
    now = datetime(2026, 12, 15, 5, 0, tzinfo=timezone.utc)
    assert quota_resets_at(now) == "2026-12-15T08:00:00+00:00"
