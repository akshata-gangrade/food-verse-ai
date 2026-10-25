import pytest


@pytest.mark.asyncio
async def test_dashboard_summary_aggregation(client, auth_headers):
    res = await client.get("/api/v1/dashboard/summary", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "total_analyses" in data
    assert data["total_analyses"] >= 3  # seeded demo analyses
    assert "analyses_by_feature" in data
    assert "food" in data["analyses_by_feature"]
    assert "seven_day_nutrition" in data
    assert len(data["seven_day_nutrition"]) == 7
    assert "weekly_activity" in data
    assert len(data["weekly_activity"]) == 7
    assert "saved_recipes_count" in data
    assert data["db_mode"]
    assert data["ai_mode"] in ["demo_sample", "live_ai"]
