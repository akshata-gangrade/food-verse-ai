import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.core.config import get_settings
from app.services.ai.groq_provider import GroqProvider
from app.schemas.mealplan import MealPlanGenerateRequest
from app.schemas.chat import ChatMessage


@pytest.mark.asyncio
async def test_groq_provider_missing_key_raises_error(monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "")
    get_settings.cache_clear()
    with pytest.raises(ValueError, match="GROQ_API_KEY is not configured"):
        GroqProvider()


@pytest.mark.asyncio
async def test_groq_provider_initialization_with_key(monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "gsk_dummy_test_key_12345")
    get_settings.cache_clear()
    provider = GroqProvider()
    assert provider.api_key == "gsk_dummy_test_key_12345"
    assert provider.text_model == "llama-3.3-70b-versatile"
    assert provider.vision_model == "llama-3.2-11b-vision-preview"


@pytest.mark.asyncio
async def test_groq_generate_meal_plan_structured(monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "gsk_dummy_test_key_12345")
    get_settings.cache_clear()
    provider = GroqProvider()

    mock_json = """{
        "id": "mlp_test_1",
        "title": "Groq Keto Plan",
        "days_count": 1,
        "daily_plans": [
            {
                "day": 1,
                "day_name": "Day 1",
                "daily_calories": 1800,
                "daily_protein": 110,
                "daily_carbs": 40,
                "daily_fats": 130,
                "meals": [
                    {
                        "meal_type": "Lunch",
                        "name": "Keto Avocado Salmon Salad",
                        "description": "Fresh wild salmon over mixed greens and diced avocado.",
                        "ingredients": ["Salmon", "Avocado", "Olive Oil", "Mixed Greens"],
                        "calories": 600,
                        "protein": 45,
                        "carbs": 10,
                        "fats": 42
                    }
                ]
            }
        ],
        "grocery_list": [
            {"name": "Salmon fillet", "quantity": "250g", "category": "Proteins"},
            {"name": "Avocado", "quantity": "2", "category": "Produce"}
        ],
        "detected_allergy_warnings": [],
        "source": "live_ai"
    }"""

    mock_resp = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = mock_json
    mock_resp.choices = [mock_choice]

    with patch.object(provider.client.chat.completions, "create", new_callable=AsyncMock) as mock_create:
        mock_create.return_value = mock_resp
        req = MealPlanGenerateRequest(days=1, diet_type="Keto", target_calories=1800)
        res = await provider.generate_meal_plan(req)

        assert res.title == "Groq Keto Plan"
        assert res.days_count == 1
        assert len(res.daily_plans) == 1
        assert res.daily_plans[0].meals[0].name == "Keto Avocado Salmon Salad"
        assert len(res.grocery_list) == 2
        assert res.source == "live_ai"


@pytest.mark.asyncio
async def test_groq_generate_chat_reply_with_recipe(monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "gsk_dummy_test_key_12345")
    get_settings.cache_clear()
    provider = GroqProvider()

    mock_json = """{
        "reply": "Here is a high-protein quinoa bowl recipe for you!",
        "recipe": {
            "title": "Quinoa Veggie Power Bowl",
            "cuisine": "Mediterranean",
            "prep_time_minutes": 10,
            "cook_time_minutes": 15,
            "servings": 2,
            "calories_per_serving": 420,
            "macros": {"calories": 420, "protein": 18, "carbs": 55, "fats": 12},
            "ingredients": ["1 cup cooked quinoa", "1 cup cherry tomatoes", "1/2 cup cucumber", "2 tbsp tahini dressing"],
            "instructions": [
                {"step_number": 1, "instruction": "Cook quinoa according to package.", "timer_seconds": 900},
                {"step_number": 2, "instruction": "Toss chopped veggies and dressing.", "timer_seconds": 0}
            ],
            "substitutions": ["Brown rice for quinoa"]
        }
    }"""

    mock_resp = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = mock_json
    mock_resp.choices = [mock_choice]

    with patch.object(provider.client.chat.completions, "create", new_callable=AsyncMock) as mock_create:
        mock_create.return_value = mock_resp
        chat_res = await provider.generate_chat_reply(
            history=[ChatMessage(role="user", content="Give me a quick healthy lunch")],
            latest_message="Give me a quick healthy lunch"
        )

        assert "quinoa" in chat_res["reply"].lower()
        assert chat_res["recipe"] is not None
        assert chat_res["recipe"].title == "Quinoa Veggie Power Bowl"
        assert chat_res["recipe"].source == "live_ai"
