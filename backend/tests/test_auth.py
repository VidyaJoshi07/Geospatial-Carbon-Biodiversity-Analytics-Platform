def test_register_success(client):
    response = client.post(
        "/api/auth/register",
        json={
            "name": "Jane Doe",
            "email": "jane@darukaa.earth",
            "password": "SecurePassword123!",
            "role": "USER",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert data["data"]["email"] == "jane@darukaa.earth"
    assert data["data"]["name"] == "Jane Doe"


def test_register_duplicate_email(client):
    client.post(
        "/api/auth/register",
        json={
            "name": "Duplicate User",
            "email": "duplicate@darukaa.earth",
            "password": "Password123!",
        },
    )
    response = client.post(
        "/api/auth/register",
        json={
            "name": "Duplicate User 2",
            "email": "duplicate@darukaa.earth",
            "password": "Password123!",
        },
    )
    assert response.status_code == 400
    data = response.json()
    assert data["success"] is False
    assert "already exists" in data["error"]["message"].lower()


def test_login_success(client, test_admin_user):
    response = client.post(
        "/api/auth/login",
        json={
            "email": test_admin_user.email,
            "password": "AdminPass123!",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "access_token" in data["data"]
    assert "refresh_token" in data["data"]
    assert data["data"]["user"]["role"] == "ADMIN"


def test_login_invalid_credentials(client, test_admin_user):
    response = client.post(
        "/api/auth/login",
        json={
            "email": test_admin_user.email,
            "password": "WrongPassword!",
        },
    )
    assert response.status_code == 401
    data = response.json()
    assert data["success"] is False


def test_protected_routes_unauthenticated(client):
    response = client.get("/api/projects")
    assert response.status_code == 401
    data = response.json()
    assert data["success"] is False


def test_get_current_user_profile(client, user_token_headers, test_regular_user):
    response = client.get("/api/auth/me", headers=user_token_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["email"] == test_regular_user.email
