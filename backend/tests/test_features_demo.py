import io
import pytest
from PIL import Image


def create_dummy_png():
    img = Image.new("RGB", (120, 120), color=(34, 139, 34))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


@pytest.mark.asyncio
async def test_food_analysis_demo(client, auth_headers):
    png = create_dummy_png()
    files = {"files": ("salad.png", png, "image/png")}
    data = {"note": "Healthy lunch bowl", "save_to_history": "true"}
    res = await client.post("/api/v1/food/analyze", files=files, data=data, headers=auth_headers)
    assert res.status_code == 200
    body = res.json()
    assert body["source"] == "demo_sample"
    assert "identified_items" in body
    assert body["total_nutrition"]["calories"] > 0
    assert "AI estimates" in body["disclaimer"]


@pytest.mark.asyncio
async def test_freshness_analysis_demo(client, auth_headers):
    png = create_dummy_png()
    files = {"file": ("apple.png", png, "image/png")}
    res = await client.post("/api/v1/freshness/analyze", files=files, headers=auth_headers)
    assert res.status_code == 200
    body = res.json()
    assert body["source"] == "demo_sample"
    assert body["visual_indicator"] in ["Looks fresh", "Some signs of aging", "Multiple warning signs", "Unclear from image"]
    assert len(body["observations"]) > 0
    assert "Visual assessment only" in body["disclaimer"]


@pytest.mark.asyncio
async def test_hygiene_analysis_demo(client, auth_headers):
    png = create_dummy_png()
    files = {"file": ("kitchen.png", png, "image/png")}
    res = await client.post("/api/v1/hygiene/analyze", files=files, headers=auth_headers)
    assert res.status_code == 200
    body = res.json()
    assert body["source"] == "demo_sample"
    assert 0 <= body["visual_risk_score"] <= 100
    assert len(body["findings"]) > 0
    assert "Not an official inspection" in body["disclaimer"]


@pytest.mark.asyncio
async def test_cooking_assistant_chat_and_recipes(client, auth_headers):
    # 1. Create chat session
    ses_res = await client.post("/api/v1/chat/sessions", json={"title": "Curry Night"}, headers=auth_headers)
    assert ses_res.status_code == 200
    ses_id = ses_res.json()["id"]

    # 2. Send message asking for recipe
    msg_res = await client.post(
        f"/api/v1/chat/sessions/{ses_id}/messages",
        data={"message": "Please give me a chickpea curry recipe"},
        headers=auth_headers
    )
    assert msg_res.status_code == 200
    msg_data = msg_res.json()
    assert "reply" in msg_data
    assert msg_data["recipe"] is not None
    assert msg_data["recipe"]["title"] == "Fragrant Coconut Lime Chickpea Curry"

    # 3. Save recipe
    rec_res = await client.post("/api/v1/recipes", json=msg_data["recipe"], headers=auth_headers)
    assert rec_res.status_code == 201
    rec_id = rec_res.json()["id"]

    # 4. List recipes
    list_rec = await client.get("/api/v1/recipes", headers=auth_headers)
    assert list_rec.status_code == 200
    assert any(r["id"] == rec_id for r in list_rec.json())


@pytest.mark.asyncio
async def test_meal_planner_and_replace_meal(client, auth_headers):
    plan_req = {
        "diet_type": "Mediterranean",
        "allergies": ["Shellfish"],
        "cuisine_preferences": ["Mediterranean"],
        "budget": "Moderate",
        "target_calories": 2100,
        "days": 7,
        "meals_per_day": 3
    }
    gen_res = await client.post("/api/v1/mealplans/generate", json=plan_req, headers=auth_headers)
    assert gen_res.status_code == 200
    plan = gen_res.json()
    assert plan["source"] == "demo_sample"
    assert len(plan["daily_plans"]) == 7
    assert len(plan["grocery_list"]) > 0
    plan_id = plan["id"]

    # Test replace meal
    replace_req = {
        "day": 1,
        "meal_type": "Lunch",
        "diet_type": "Mediterranean",
        "allergies": ["Shellfish"],
        "target_calories": 600
    }
    rep_res = await client.post(f"/api/v1/mealplans/{plan_id}/replace-meal", json=replace_req, headers=auth_headers)
    assert rep_res.status_code == 200
    updated_plan = rep_res.json()
    assert len(updated_plan["daily_plans"]) == 7
