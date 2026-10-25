from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any, Tuple
from app.schemas.food import FoodAnalysisResponse
from app.schemas.freshness import FreshnessAnalysisResponse
from app.schemas.hygiene import HygieneAnalysisResponse
from app.schemas.mealplan import MealPlanGenerateRequest, MealPlanResponse, ReplaceMealRequest, MealItem
from app.schemas.chat import ChatMessage, RecipeSchema


class BaseAIProvider(ABC):
    @abstractmethod
    async def analyze_food(
        self,
        images: List[Tuple[bytes, str]],
        note: Optional[str] = None
    ) -> FoodAnalysisResponse:
        pass

    @abstractmethod
    async def analyze_freshness(
        self,
        media_bytes: bytes,
        mime_type: str,
        note: Optional[str] = None
    ) -> FreshnessAnalysisResponse:
        pass

    @abstractmethod
    async def analyze_hygiene(
        self,
        media_bytes: bytes,
        mime_type: str,
        note: Optional[str] = None
    ) -> HygieneAnalysisResponse:
        pass

    @abstractmethod
    async def generate_chat_reply(
        self,
        history: List[ChatMessage],
        latest_message: str,
        image_bytes: Optional[bytes] = None,
        image_mime: Optional[str] = None,
        audio_bytes: Optional[bytes] = None,
        audio_mime: Optional[str] = None
    ) -> Dict[str, Any]:
        """Returns dict with 'reply': str, and optional 'recipe': RecipeSchema"""
        pass

    @abstractmethod
    async def generate_meal_plan(
        self,
        request: MealPlanGenerateRequest
    ) -> MealPlanResponse:
        pass

    @abstractmethod
    async def replace_meal(
        self,
        request: ReplaceMealRequest
    ) -> MealItem:
        pass
