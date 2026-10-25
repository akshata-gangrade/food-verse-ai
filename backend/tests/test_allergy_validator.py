import pytest
from app.services.allergy_validator import check_ingredient_allergy_conflicts, validate_meal_plan_allergies
from app.schemas.mealplan import MealPlanResponse, DailyPlan, MealItem, GroceryItem


def test_allergy_validator_direct_and_synonym_matches():
    ingredients = [
        "2 tbsp creamy peanut butter",
        "100g parmesan cheese",
        "200g wild Atlantic salmon",
        "1 cup organic quinoa",
        "1 tbsp sesame oil"
    ]

    # Test Peanuts match
    conflicts = check_ingredient_allergy_conflicts(ingredients, ["Peanuts"])
    assert len(conflicts) >= 1
    assert any("peanut" in c.lower() for c in conflicts)

    # Test Dairy synonym match (cheese)
    conflicts_dairy = check_ingredient_allergy_conflicts(ingredients, ["Dairy"])
    assert len(conflicts_dairy) >= 1
    assert any("cheese" in c.lower() or "dairy" in c.lower() for c in conflicts_dairy)

    # Test Sesame match
    conflicts_sesame = check_ingredient_allergy_conflicts(ingredients, ["Sesame"])
    assert len(conflicts_sesame) >= 1
    assert any("sesame" in c.lower() for c in conflicts_sesame)

    # Test no declared allergies
    assert check_ingredient_allergy_conflicts(ingredients, []) == []


def test_validate_meal_plan_allergies_flags():
    sample_plan = MealPlanResponse(
        title="Test Plan",
        days_count=1,
        daily_plans=[
            DailyPlan(
                day=1,
                day_name="Monday",
                meals=[
                    MealItem(
                        meal_type="Breakfast",
                        name="PB Oats",
                        description="Oats with peanut butter",
                        ingredients=["Rolled oats", "Peanut butter", "Almond milk"],
                        calories=400,
                        protein=15,
                        carbs=50,
                        fats=15
                    )
                ],
                daily_calories=400,
                daily_protein=15,
                daily_carbs=50,
                daily_fats=15
            )
        ],
        grocery_list=[GroceryItem(name="Peanut butter", quantity="1 jar", category="Pantry")],
        source="demo_sample"
    )

    validated = validate_meal_plan_allergies(sample_plan, ["Peanuts"])
    assert len(validated.detected_allergy_warnings) > 0
    assert "Day 1 - Breakfast" in validated.detected_allergy_warnings[0]
    assert len(validated.daily_plans[0].meals[0].allergy_flags) > 0
