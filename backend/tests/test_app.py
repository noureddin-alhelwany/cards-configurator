from cards_configurator_backend.app import create_app
from fastapi.testclient import TestClient


def test_health_endpoint_returns_ok() -> None:
    client = TestClient(create_app())

    response = client.get("/api/healthz")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "cards-configurator-backend",
    }
