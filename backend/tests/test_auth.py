import sys
import os
import pytest
from fastapi.testclient import TestClient

# Add backend to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
from config import config

client = TestClient(app)

def test_login_success():
    response = client.post(
        "/login",
        json={"username": "admin", "password": "password"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_failure():
    response = client.post(
        "/login",
        json={"username": "admin", "password": "wrongpassword"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect username or password"

def test_websocket_auth_failure_no_token():
    with pytest.raises(Exception): # TestClient raises for WebSocket disconnect with code
        with client.websocket_connect("/ws/video") as websocket:
            pass

def test_websocket_auth_success():
    # 1. Login to get token
    response = client.post(
        "/login",
        json={"username": "admin", "password": "password"},
    )
    token = response.json()["access_token"]
    
    # 2. Connect with token
    with client.websocket_connect(f"/ws/video?token={token}") as websocket:
        # Should connect successfully
        # Send a ping to verify
        websocket.send_json({"type": "ping"})
        data = websocket.receive_json()
        assert data["type"] == "pong"

def test_websocket_auth_invalid_token():
    with pytest.raises(Exception):
        with client.websocket_connect("/ws/video?token=invalid-token") as websocket:
            pass
