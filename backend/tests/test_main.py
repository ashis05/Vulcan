from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_public():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_health_protected_requires_token():
    response = client.get("/health/protected")
    assert response.status_code == 401