import pytest
import requests

BASE_URL = "http://127.0.0.1:8000/api"

@pytest.fixture(scope="session")
def api_base_url():
    """Returns the base API URL."""
    return BASE_URL

@pytest.fixture(scope="session")
def auth_token(api_base_url):
    """Logs in and returns the authentication token."""
    payload = {
        "username": "admin",
        "password": "admin123"
    }
    response = requests.post(f"{api_base_url}/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["code"] == 200
    return data["data"]["token"]

@pytest.fixture
def auth_header(auth_token):
    """Returns the headers with the Authorization token."""
    return {"Authorization": f"Bearer {auth_token}"}
