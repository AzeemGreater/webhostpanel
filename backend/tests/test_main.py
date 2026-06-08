from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_read_main():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to WebHostPanel API"}

def test_server_stats_protected():
    response = client.get("/api/servers/stats")
    assert response.status_code == 401

def test_list_websites_protected():
    response = client.get("/api/websites/")
    assert response.status_code == 401
