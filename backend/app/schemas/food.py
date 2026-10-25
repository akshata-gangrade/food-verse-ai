from typing import List, Optional, Dict
from pydantic import BaseModel, Field


class NutritionItem(BaseModel):
    name: str = Field(..., description="Identified food item name")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Detection confidence score")
    serving_size: str = Field(..., description="Estimated serving size (e.g., '1 cup (150g)')")
    calories: float = Field(..., description="Estimated calories")
    protein: float = Field(..., description="Protein in grams")
    carbs: float = Field(..., description="Total carbohydrates in grams")
    fats: float = Field(..., description="Total fats in grams")
    fiber: float = Field(default=0.0, description="Dietary fiber in grams")
    sugar: Optional[float] = Field(default=0.0, description="Sugar in grams")
    sodium: Optional[float] = Field(default=0.0, description="Sodium in milligrams")


class TotalNutrition(BaseModel):
    calories: float
    protein: float
    carbs: float
    fats: float
    fiber: float = 0.0
    sugar: Optional[float] = 0.0
    sodium: Optional[float] = 0.0


class MacroPercentages(BaseModel):
    protein: float = 25.0
    carbs: float = 50.0
    fats: float = 25.0


class FoodAnalysisResponse(BaseModel):
    id: Optional[str] = None
    title: str = "Nutritional Analysis"
    identified_items: List[NutritionItem]
    total_nutrition: TotalNutrition
    macro_percentages: Optional[MacroPercentages] = Field(default_factory=MacroPercentages)
    insights: List[str] = Field(default_factory=list)
    source: str = "demo_sample"  # "live_ai" | "demo_sample"
    disclaimer: str = "Values are AI estimates and may differ from actual content."
    thumbnail: Optional[str] = None
    created_at: Optional[str] = None
