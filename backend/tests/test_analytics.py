def test_get_site_analytics_and_ranges(client, admin_token_headers, user_token_headers):
    # Create project and site
    p_res = client.post(
        "/api/projects",
        headers=admin_token_headers,
        json={"name": "Analytics Project", "project_type": "Carbon"},
    )
    proj_id = p_res.json()["data"]["id"]

    site_res = client.post(
        f"/api/projects/{proj_id}/sites",
        headers=admin_token_headers,
        json={
            "name": "Analytics Site Alpha",
            "location": {
                "type": "Polygon",
                "coordinates": [
                    [
                        [-60.12, -2.98],
                        [-60.08, -2.98],
                        [-60.08, -3.02],
                        [-60.12, -3.02],
                        [-60.12, -2.98],
                    ]
                ],
            },
            "carbon_value": 1200.0,
            "biodiversity_value": 85.0,
        },
    )
    site_id = site_res.json()["data"]["id"]

    # Query 1Y analytics
    res = client.get(f"/api/sites/{site_id}/analytics?time_range=1Y", headers=user_token_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    payload = data["data"]
    assert payload["site_id"] == site_id
    assert "time_series" in payload
    assert len(payload["time_series"]) > 0
    record = payload["time_series"][0]
    assert "carbon_value" in record
    assert "biodiversity_value" in record
    assert "vegetation_index" in record
    assert "performance_score" in record

    # Check summary metrics
    summary = payload["summary"]
    assert "latest_carbon" in summary
    assert "latest_biodiversity" in summary
    assert "latest_ndvi" in summary
    assert "latest_performance" in summary

    # Query 30D analytics
    res_30d = client.get(f"/api/sites/{site_id}/analytics?time_range=30D", headers=user_token_headers)
    assert res_30d.status_code == 200


def test_global_analytics_dashboard(client, user_token_headers):
    res = client.get("/api/analytics/dashboard", headers=user_token_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "system_avg_performance" in data["data"]
    assert "total_monitored_sites" in data["data"]
