def test_create_site_valid_geojson(client, admin_token_headers):
    # Create parent project
    p_res = client.post(
        "/api/projects",
        headers=admin_token_headers,
        json={
            "name": "Site Test Project",
            "project_type": "Carbon",
            "status": "Active",
        },
    )
    project_id = p_res.json()["data"]["id"]

    # Valid Polygon in Western Ghats
    valid_polygon = {
        "type": "Polygon",
        "coordinates": [
            [
                [76.012, 11.642],
                [76.068, 11.642],
                [76.068, 11.595],
                [76.012, 11.595],
                [76.012, 11.642],
            ]
        ],
    }

    site_res = client.post(
        f"/api/projects/{project_id}/sites",
        headers=admin_token_headers,
        json={
            "name": "Wayanad High Canopy Sector",
            "description": "Evergreen forest patch",
            "location": valid_polygon,
            "status": "Active",
            "carbon_value": 450.0,
            "biodiversity_value": 91.0,
        },
    )
    assert site_res.status_code == 201
    data = site_res.json()
    assert data["success"] is True
    assert data["data"]["name"] == "Wayanad High Canopy Sector"
    assert data["data"]["area_hectares"] > 0
    assert data["data"]["location"]["type"] == "Polygon"


def test_create_site_invalid_geojson_rejected(client, admin_token_headers):
    # Create parent project
    p_res = client.post(
        "/api/projects",
        headers=admin_token_headers,
        json={"name": "Invalid Site Test Project", "project_type": "Carbon"},
    )
    project_id = p_res.json()["data"]["id"]

    # Invalid polygon: not closed and only 2 coordinates
    invalid_polygon = {
        "type": "Polygon",
        "coordinates": [
            [
                [76.012, 11.642],
                [76.068, 11.642],
            ]
        ],
    }

    site_res = client.post(
        f"/api/projects/{project_id}/sites",
        headers=admin_token_headers,
        json={
            "name": "Faulty Geometry Site",
            "location": invalid_polygon,
        },
    )
    assert site_res.status_code == 422
    data = site_res.json()
    assert data["success"] is False
    assert "Invalid GeoJSON geometry" in data["error"]["message"]


def test_get_sites_geojson_feature_collection(client, admin_token_headers, user_token_headers):
    # Create project and site
    p_res = client.post(
        "/api/projects",
        headers=admin_token_headers,
        json={"name": "GeoJSON Test Project", "project_type": "Mixed"},
    )
    project_id = p_res.json()["data"]["id"]

    polygon = {
        "type": "Polygon",
        "coordinates": [
            [
                [88.752, 22.052],
                [88.825, 22.052],
                [88.825, 21.984],
                [88.752, 21.984],
                [88.752, 22.052],
            ]
        ],
    }
    client.post(
        f"/api/projects/{project_id}/sites",
        headers=admin_token_headers,
        json={
            "name": "Mangrove Delta Site",
            "location": polygon,
            "carbon_value": 780.0,
            "biodiversity_value": 88.0,
        },
    )

    # Fetch FeatureCollection
    geo_res = client.get("/api/sites/geojson", headers=user_token_headers)
    assert geo_res.status_code == 200
    data = geo_res.json()
    assert data["success"] is True
    fc = data["data"]
    assert fc["type"] == "FeatureCollection"
    assert len(fc["features"]) >= 1
    sample = fc["features"][0]
    assert sample["type"] == "Feature"
    assert "geometry" in sample
    assert "properties" in sample
    assert "name" in sample["properties"]
