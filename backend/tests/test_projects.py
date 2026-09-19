def test_create_project_admin_success(client, admin_token_headers):
    response = client.post(
        "/api/projects",
        headers=admin_token_headers,
        json={
            "name": "Amazon Reforestation Test",
            "description": "Restoring riparian forest zones",
            "project_type": "Carbon",
            "status": "Active",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert data["data"]["name"] == "Amazon Reforestation Test"
    assert data["data"]["project_type"] == "Carbon"


def test_create_project_user_forbidden(client, user_token_headers):
    response = client.post(
        "/api/projects",
        headers=user_token_headers,
        json={
            "name": "Unauthorized Project",
            "project_type": "Mixed",
            "status": "Draft",
        },
    )
    assert response.status_code == 403
    data = response.json()
    assert data["success"] is False


def test_get_projects_list_and_filters(client, user_token_headers, admin_token_headers):
    # Seed a project
    client.post(
        "/api/projects",
        headers=admin_token_headers,
        json={
            "name": "Mangrove Restoration Project",
            "description": "Blue carbon conservation",
            "project_type": "Biodiversity",
            "status": "Active",
        },
    )

    # List all
    res = client.get("/api/projects", headers=user_token_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert len(data["data"]["items"]) >= 1

    # Filter by search
    res_search = client.get("/api/projects?search=Mangrove", headers=user_token_headers)
    assert res_search.status_code == 200
    assert any("Mangrove" in p["name"] for p in res_search.json()["data"]["items"])

    # Filter by type
    res_type = client.get("/api/projects?project_type=Biodiversity", headers=user_token_headers)
    assert res_type.status_code == 200
    for p in res_type.json()["data"]["items"]:
        assert p["project_type"] == "Biodiversity"


def test_update_and_delete_project(client, admin_token_headers):
    # Create
    create_res = client.post(
        "/api/projects",
        headers=admin_token_headers,
        json={
            "name": "Project To Delete",
            "project_type": "Mixed",
            "status": "Draft",
        },
    )
    proj_id = create_res.json()["data"]["id"]

    # Update
    update_res = client.put(
        f"/api/projects/{proj_id}",
        headers=admin_token_headers,
        json={
            "name": "Updated Project Name",
            "status": "Active",
        },
    )
    assert update_res.status_code == 200
    assert update_res.json()["data"]["name"] == "Updated Project Name"
    assert update_res.json()["data"]["status"] == "Active"

    # Delete
    del_res = client.delete(f"/api/projects/{proj_id}", headers=admin_token_headers)
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True

    # Confirm 404
    get_res = client.get(f"/api/projects/{proj_id}", headers=admin_token_headers)
    assert get_res.status_code == 404
