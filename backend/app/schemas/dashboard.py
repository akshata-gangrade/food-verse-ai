from typing import List, Dict, Optional, Any
from pydantic import BaseModel


class ActivityItem(BaseModel):
    id: str
    feature: str
    title: str
    created_at: str
    source: str
    summary: Optional[str] = ""
    thumbnail: Optional[str] = None


class DailyNutritionSummary(BaseModel):
    date: str
    calories: float
    protein: float
    carbs: float
    fats: float


class WeeklyActivityDay(BaseModel):
    day: str
    count: int


class DashboardSummaryResponse(BaseModel):
    total_analyses: int
    analyses_by_feature: Dict[str, int]
    recent_activity: List[ActivityItem]
    today_nutrition: Dict[str, float]
    seven_day_nutrition: List[DailyNutritionSummary]
    weekly_activity: List[WeeklyActivityDay]
    saved_recipes_count: int
    saved_recipes_preview: List[Dict[str, Any]]
    active_meal_plan_days: int
    db_mode: str
    ai_mode: str
