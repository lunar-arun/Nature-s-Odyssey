import os
import json
import tempfile
import pytest
import re

# Set up test database env variables before importing app
temp_db_fd, temp_db_path = tempfile.mkstemp()
os.environ["MONGO_URI"] = "mongodb://invalid_uri_to_force_fallback:27017/"
os.environ["MOCK_DB_PATH"] = temp_db_path
os.environ["FLASK_SECRET_KEY"] = "test-secret-key-999"
os.environ["FLASK_ENV"] = "testing"

from app import app, db, LOGIN_LIMITS

@pytest.fixture
def client():
    app.config["TESTING"] = True
    app.config["WTF_CSRF_ENABLED"] = False
    
    # Clear rate limit logs
    LOGIN_LIMITS.clear()
    
    with app.test_client() as client:
        with app.app_context():
            # Reset database file
            if os.path.exists(temp_db_path):
                with open(temp_db_path, "w") as f:
                    json.dump({}, f)
            yield client

    # Cleanup database file
    try:
        os.close(temp_db_fd)
        if os.path.exists(temp_db_path):
            os.unlink(temp_db_path)
    except Exception:
        pass

def test_security_headers(client):
    res = client.get("/")
    assert res.status_code == 200
    assert "Content-Security-Policy" in res.headers
    assert res.headers["X-Frame-Options"] == "DENY"
    assert res.headers["X-Content-Type-Options"] == "nosniff"
    assert res.headers["Referrer-Policy"] == "strict-origin-when-cross-origin"

def test_auth_register_and_login(client):
    # 1. Test missing fields
    res = client.post("/api/auth/register", json={
        "username": "",
        "email": "test@test.com",
        "password": "password123"
    })
    assert res.status_code == 400
    
    # 2. Test invalid email
    res = client.post("/api/auth/register", json={
        "username": "eco_test",
        "email": "invalidemail",
        "password": "password123"
    })
    assert res.status_code == 400
    assert "Invalid email" in res.get_json()["error"]
    
    # 3. Test short password
    res = client.post("/api/auth/register", json={
        "username": "eco_test",
        "email": "test@test.com",
        "password": "short"
    })
    assert res.status_code == 400
    assert "Password must be" in res.get_json()["error"]
    
    # 4. Successful registration
    res = client.post("/api/auth/register", json={
        "username": "eco_test",
        "email": "test@test.com",
        "password": "password123"
    })
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] == "Registration successful"
    assert data["user"]["username"] == "eco_test"
    assert data["user"]["level"] == 1
    assert data["user"]["eco_coins"] == 100
    
    # 5. Duplicate username
    res = client.post("/api/auth/register", json={
        "username": "eco_test",
        "email": "test2@test.com",
        "password": "password123"
    })
    assert res.status_code == 400
    assert "already exists" in res.get_json()["error"]

    # 6. Logout
    res = client.post("/api/auth/logout")
    assert res.status_code == 200
    
    # 7. Login successful
    res = client.post("/api/auth/login", json={
        "username": "eco_test",
        "password": "password123"
    })
    assert res.status_code == 200
    assert res.get_json()["success"] == "Login successful"
    
    # 8. Login incorrect password
    res = client.post("/api/auth/login", json={
        "username": "eco_test",
        "password": "wrong_password"
    })
    assert res.status_code == 401

def test_nosql_injection_prevention(client):
    # Try sending Mongo operator inside username parameter
    res = client.post("/api/auth/login", json={
        "username": {"$gt": ""},
        "password": "password123"
    })
    assert res.status_code == 400
    assert "Invalid request parameters" in res.get_json()["error"]

def test_rate_limiting(client):
    # Make 11 requests to login endpoint to trigger rate limits (limit is 10)
    for i in range(11):
        res = client.post("/api/auth/login", json={
            "username": f"user_{i}",
            "password": "password123"
        })
        if i >= 10:
            assert res.status_code == 429
            assert "Too many requests" in res.get_json()["error"]

def test_log_action_and_level_up(client):
    # Register & login
    client.post("/api/auth/register", json={
        "username": "action_test",
        "email": "action@test.com",
        "password": "password123"
    })
    
    # 1. Log a valid predefined action
    res = client.post("/api/user/log_action", json={
        "action_name": "Walking instead of driving"
    })
    assert res.status_code == 200
    data = res.get_json()
    assert data["xp_earned"] == 50
    assert data["co2_saved"] == 1.2
    assert data["coins_earned"] == 10
    assert data["user"]["xp"] == 50
    assert data["user"]["eco_coins"] == 110
    
    # 2. Log custom action (gets default rewards: co2=0.5, xp=20, coins=5)
    res = client.post("/api/user/log_action", json={
        "action_name": "Composted kitchen scraps"
    })
    assert res.status_code == 200
    assert res.get_json()["xp_earned"] == 20
    
    # 3. Trigger multiple actions to level up (needs 100 XP to level up from Level 1)
    # Current user XP = 70. Log planting trees (+100 XP)
    res = client.post("/api/user/log_action", json={
        "action_name": "Planting trees"
    })
    assert res.status_code == 200
    data = res.get_json()
    assert data["leveled_up"] is True
    assert data["user"]["level"] == 2
    assert data["user"]["xp"] == 70  # (70 + 100) - 100 = 70
    assert "First Step" in data["user"]["achievements"]

def test_quests(client):
    # Register & login
    client.post("/api/auth/register", json={
        "username": "quest_test",
        "email": "quest@test.com",
        "password": "password123"
    })
    
    # Get active quests
    res = client.get("/api/user/quests")
    assert res.status_code == 200
    quests = res.get_json()
    assert len(quests) == 3
    
    quest_to_complete = quests[0]
    assert quest_to_complete["completed"] is False
    
    # Complete the quest
    res = client.post("/api/user/quests/complete", json={
        "quest_id": quest_to_complete["_id"]
    })
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] == "Quest completed!"
    
    # Verify completed quest is marked completed
    res = client.get("/api/user/quests")
    quests_after = res.get_json()
    completed_quests = [q for q in quests_after if q["_id"] == quest_to_complete["_id"]]
    assert completed_quests[0]["completed"] is True

def test_shop_and_leaderboard(client):
    # Register & login
    client.post("/api/auth/register", json={
        "username": "shop_test",
        "email": "shop@test.com",
        "password": "password123"
    })
    
    # 1. Try to buy something with insufficient funds (cost: 250, start balance: 100)
    res = client.post("/api/user/shop/buy", json={
        "item_type": "pets",
        "item_id": "bubbles"
    })
    assert res.status_code == 400
    assert "Not enough" in res.get_json()["error"]
    
    # 2. Buy a skin within funds (cost: 50)
    res = client.post("/api/user/shop/buy", json={
        "item_type": "skins",
        "item_id": "solar"
    })
    assert res.status_code == 200
    assert res.get_json()["user"]["eco_coins"] == 50
    assert "solar" in res.get_json()["user"]["unlocked_skins"]
    
    # 3. Equip skin
    res = client.post("/api/user/shop/equip", json={
        "item_type": "skin",
        "item_id": "solar"
    })
    assert res.status_code == 200
    assert res.get_json()["user"]["active_skin"] == "solar"
    
    # 4. Try to equip unbought item
    res = client.post("/api/user/shop/equip", json={
        "item_type": "skin",
        "item_id": "cyber"
    })
    assert res.status_code == 400
    assert "not unlocked yet" in res.get_json()["error"]

    # 5. Verify leaderboard
    res = client.get("/api/leaderboard")
    assert res.status_code == 200
    leaderboard = res.get_json()
    assert len(leaderboard) >= 1
    assert leaderboard[0]["username"] == "shop_test"
