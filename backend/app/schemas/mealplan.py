from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class GroceryItem(BaseModel):
    name: str
    quantity: str
    category: str = Field(..., description="e.g. Produce, Proteins, Dairy & Refrigerated, Pantry, Spices")
    checked: bool = False


class MealItem(BaseModel):
    meal_type: str = Field(..., description="Breakfast | Lunch | Dinner | Snack")
    name: str
    description: str
    ingredients: List[str]
    calories: int
    protein: float
    carbs: float
    fats: float
    prep_time: Optional[str] = "15 mins"
    allergy_flags: List[str] = Field(default_factory=list, description="Any detected potential allergens")


class DailyPlan(BaseModel):
    day: int = Field(..., description="Day number (1 through 7)")
    day_name: Optional[str] = "Day 1"
    meals: List[MealItem]
    daily_calories: int
    daily_protein: float
    daily_carbs: float
    daily_fats: float


class MealPlanGenerateRequest(BaseModel):
    diet_type: str = "Balanced"
    allergies: List[str] = []
    cuisine_preferences: List[str] = []
    budget: str = "Moderate"  # Budget / Moderate / Premium
    ingredients_on_hand: Optional[str] = ""
    target_calories: int = 2000
    macro_targets: Optional[Dict[str, int]] = {"protein": 120, "carbs": 220, "fats": 65}
    days: int = Field(default=7, ge=1, le=7)
    meals_per_day: int = Field(default=3, ge=2, le=5)


class ReplaceMealRequest(BaseModel):
    day: int
    meal_type: str
    diet_type: Optional[str] = "Balanced"
    allergies: Optional[List[str]] = []
    cuisine_preferences: Optional[List[str]] = []
    target_calories: Optional[int] = 600
    target_protein: Optional[float] = 35


class MealPlanResponse(BaseModel):
    id: Optional[str] = None
    title: str = "Personalized Nutrition & Meal Schedule"
    days_count: int
    daily_plans: List[DailyPlan]
    grocery_list: List[GroceryItem]
    detected_allergy_warnings: List[str] = Field(
        default_factory=list,
        description="List of detected allergy conflicts flagged by server-side verification"
    )
    source: str = "demo_sample"
    disclaimer: str = "General guidance, not medical advice. Consult a professional for medical conditions or severe allergies."
    created_at: Optional[str] = None
