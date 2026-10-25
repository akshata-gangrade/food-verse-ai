import pytest


@pytest.mark.asyncio
async def test_register_and_login_flow(client):
    unique_email = "newchef@example.com"
    # 1. Register new user
    reg_res = await client.post("/api/v1/auth/register", json={
        "email": unique_email,
        "password": "Password123!",
        "full_name": "Test Chef"
    })
    assert reg_res.status_code == 201, reg_res.text
    reg_data = reg_res.json()
    assert "access_token" in reg_data
    assert reg_data["user"]["email"] == unique_email

    # 2. Reject duplicate email
    dup_res = await client.post("/api/v1/auth/register", json={
        "email": unique_email,
        "password": "Password123!",
        "full_name": "Test Chef"
    })
    assert dup_res.status_code == 400
    assert "already exists" in dup_res.json()["message"]

    # 3. Successful login
    login_res = await client.post("/api/v1/auth/login", json={
        "email": unique_email,
        "password": "Password123!"
    })
    assert login_res.status_code == 200
    login_data = login_res.json()
    token = login_data["access_token"]
    assert token

    # 4. Bad password
    bad_login = await client.post("/api/v1/auth/login", json={
        "email": unique_email,
        "password": "WrongPassword!"
    })
    assert bad_login.status_code == 401

    # 5. Access /auth/me with token
    me_res = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == unique_email


@pytest.mark.asyncio
async def test_demo_user_seeded_login(client):
    # Verify seeded demo user can login
    res = await client.post("/api/v1/auth/login", json={
        "email": "demo@aahaar.ai",
        "password": "Demo@12345"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["user"]["email"] == "demo@aahaar.ai"
