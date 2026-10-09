import pytest
from fastapi.testclient import TestClient

from app.core.auth import get_current_user
from app.main import app
from app.routers import foods
from app.services import openfoodfacts

USER_ID = "11111111-1111-1111-1111-111111111111"

client = TestClient(app)

LOCAL = {
    "id": "1",
    "name": "Aloo paratha",
    "serving_description": "1 parantha",
    "kcal": 300,
    "protein_g": 7.0,
    "carbs_g": 40.0,
    "fat_g": 12.0,
    "source": "indb",
}
OFF = {
    "id": "off-123",
    "name": "Lays (Classic)",
    "serving_description": "30 g",
    "kcal": 160,
    "protein_g": 2.0,
    "carbs_g": 15.0,
    "fat_g": 10.0,
    "source": "off",
}


@pytest.fixture(autouse=True)
def _clear_overrides():
    yield
    app.dependency_overrides.clear()


def _auth():
    app.dependency_overrides[get_current_user] = lambda: USER_ID


def test_search_requires_auth():
    assert client.get("/foods/search", params={"q": "lays"}).status_code == 401


def test_search_rejects_short_query():
    _auth()
    assert client.get("/foods/search", params={"q": "a"}).status_code == 422


def test_search_merges_local_and_packaged(monkeypatch):
    _auth()
    monkeypatch.setattr(foods, "_search_local", lambda uid, q, limit: [LOCAL])

    async def fake_off(query: str, limit: int):
        return [OFF]

    monkeypatch.setattr(openfoodfacts, "search_products", fake_off)

    response = client.get("/foods/search", params={"q": "lays"})
    assert response.status_code == 200
    names = [item["name"] for item in response.json()]
    assert names == ["Aloo paratha", "Lays (Classic)"]


def test_openfoodfacts_outage_degrades_gracefully(monkeypatch):
    _auth()
    monkeypatch.setattr(foods, "_search_local", lambda uid, q, limit: [])

    async def boom(query: str, limit: int):
        raise RuntimeError("offline")

    monkeypatch.setattr(openfoodfacts, "search_products", boom)

    response = client.get("/foods/search", params={"q": "lays"})
    assert response.status_code == 200
    assert response.json() == []


def test_search_skips_off_when_local_is_full(monkeypatch):
    _auth()
    monkeypatch.setattr(
        foods, "_search_local", lambda uid, q, limit: [LOCAL, {**LOCAL, "id": "2", "name": "Gobi paratha"}]
    )

    async def should_not_run(query: str, limit: int):
        raise AssertionError("Open Food Facts should not be called")

    monkeypatch.setattr(openfoodfacts, "search_products", should_not_run)

    response = client.get("/foods/search", params={"q": "paratha", "limit": 2})
    assert response.status_code == 200
    assert len(response.json()) == 2
