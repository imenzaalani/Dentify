from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_collection_routes_accept_requests_without_trailing_slash() -> None:
    response = client.get("/api/v1/documents", follow_redirects=False)
    assert response.status_code != 307

    response = client.get("/api/v1/patients", follow_redirects=False)
    assert response.status_code != 307

    response = client.get("/api/v1/treatments", follow_redirects=False)
    assert response.status_code != 307
