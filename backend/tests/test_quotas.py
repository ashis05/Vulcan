from datetime import date, datetime, timezone

from app.core import quotas
from app.core.quotas import UNLIMITED, quota_resets_at, window_resets_at


def test_resets_at_next_pacific_midnight_summer():
    # 2026-09-19 10:00 UTC = 03:00 PDT → next midnight PDT = 2026-09-20 07:00 UTC
    now = datetime(2026, 9, 19, 10, 0, tzinfo=timezone.utc)
    assert quota_resets_at(now) == "2026-09-20T07:00:00+00:00"


def test_resets_at_next_pacific_midnight_winter():
    # 2026-12-15 05:00 UTC = 2026-12-14 21:00 PST → next midnight = 2026-12-15 08:00 UTC
    now = datetime(2026, 12, 15, 5, 0, tzinfo=timezone.utc)
    assert quota_resets_at(now) == "2026-12-15T08:00:00+00:00"


def test_window_resets_seven_days_after_last_use():
    # 2026-09-25 + 7 days = 2026-10-02 00:00 PDT = 07:00 UTC
    assert window_resets_at(date(2026, 9, 25), 7) == "2026-10-02T07:00:00+00:00"


def test_disabled_quota_allows_any_usage(monkeypatch):
    monkeypatch.setattr(quotas.settings, "quota_enabled", False)
    assert quotas.check_once_per_days("00000000-0000-0000-0000-000000000000", "program", 7) == (
        True,
        None,
    )


def test_disabled_quota_uses_unlimited_limit(monkeypatch):
    monkeypatch.setattr(quotas.settings, "quota_enabled", False)
    captured: dict[str, int] = {}

    class FakeResult:
        def scalar(self):
            return True

    class FakeConn:
        def execute(self, _statement, params):
            captured["limit"] = params["limit"]
            return FakeResult()

        def __enter__(self):
            return self

        def __exit__(self, *_):
            return False

    class FakeEngine:
        def begin(self):
            return FakeConn()

    monkeypatch.setattr(quotas, "create_db_engine", lambda: FakeEngine())
    assert quotas.increment_usage("00000000-0000-0000-0000-000000000000", "food", 5) is True
    assert captured["limit"] == UNLIMITED


