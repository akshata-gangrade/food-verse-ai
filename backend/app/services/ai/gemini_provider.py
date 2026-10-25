import json
import logging
import asyncio
from typing import List, Optional, Dict, Any, Tuple
from pydantic import BaseModel
from google import genai
from google.genai import types
from app.core.config import get_settings
from app.services.ai.base import BaseAIProvider
from app.schemas.food import FoodAnalysisResponse
from app.schemas.freshness import FreshnessAnalysisResponse
from app.schemas.hygiene import HygieneAnalysisResponse
from app.schemas.mealplan import MealPlanGenerateRequest, MealPlanResponse, ReplaceMealRequest, MealItem
from app.schemas.chat import ChatMessage, RecipeSchema, ChatOutput

logger = logging.getLogger("aahaar.ai.gemini")
settings = get_settings()


class GeminiProvider(BaseAIProvider):
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model_name = settings.GEMINI_MODEL or "gemini-flash-latest"
        self.client = genai.Client(api_key=self.api_key)

    async def _generate_structured(self, contents: list, pydantic_schema: type, system_prompt: str, retries: int = 1):
        """Helper to invoke Gemini with structured JSON output, resilient model fallback, and retries."""
        candidate_models = []
        # If user configured a valid non-deprecated model, try it first
        if self.model_name and self.model_name not in ("gemini-2.5-flash", "gemini-2.5-flash-lite", "models/gemini-2.5-flash"):
            candidate_models.append(self.model_name)
        # Fast, responsive models on the Gemini Developer API
        for fast_model in ["gemini-3-flash-preview", "gemini-3.5-flash"]:
            if fast_model not in candidate_models:
                candidate_models.append(fast_model)

        last_error = None
        for model in candidate_models:
            for attempt in range(retries + 1):
                try:
                    response = self.client.models.generate_content(
                        model=model,
                        contents=contents,
                        config=types.GenerateContentConfig(
                            system_instruction=system_prompt,
                            response_mime_type="application/json",
                            response_schema=pydantic_schema,
                            temperature=0.2,
                        )
                    )
                    text = response.text
                    data = json.loads(text)
                    validated = pydantic_schema.model_validate(data)
                    return validated
                except Exception as e:
                    last_error = e
                    logger.warning(f"Gemini generation with {model} (attempt {attempt + 1}) failed: {e}")
                    err_msg = str(e).lower()
                    if "404" in err_msg or "not_found" in err_msg or "no longer available" in err_msg:
                        break  # Move to next model immediately on 404
                    await asyncio.sleep(0.5)

        raise RuntimeError(f"Live AI generation failed across candidate models: {last_error}")

    async def analyze_food(
        self,
        images: List[Tuple[bytes, str]],
        note: Optional[str] = None
    ) -> FoodAnalysisResponse:
        system_prompt = (
            "You are an expert nutritional intelligence agent. Identify all food items visible in the image(s). "
            "For each item, estimate serving size, calories, protein (g), carbs (g), fats (g), fiber (g), sugar (g), sodium (mg), and confidence. "
            "Sum total calories and macros, calculate macro percentages (protein, carbs, fats), and provide 2-4 nutritional insights. "
            "Always include the disclaimer: 'Values are AI estimates and may differ from actual content.' "
            "Label source as 'live_ai'."
        )

        contents = []
        for img_bytes, mime_type in images:
            contents.append(types.Part.from_bytes(data=img_bytes, mime_type=mime_type))

        prompt_text = "Please analyze the nutritional breakdown of this meal."
        if note:
            prompt_text += f" Additional user note: {note}"
        contents.append(prompt_text)

        result: FoodAnalysisResponse = await self._generate_structured(
            contents=contents,
            pydantic_schema=FoodAnalysisResponse,
            system_prompt=system_prompt
        )
        result.source = "live_ai"
        result.disclaimer = "Values are AI estimates and may differ from actual content."
        return result

    async def analyze_freshness(
        self,
        media_bytes: bytes,
        mime_type: str,
        note: Optional[str] = None
    ) -> FreshnessAnalysisResponse:
        system_prompt = (
            "You are an expert food safety inspector evaluating produce freshness based on VISIBLE SIGNS ONLY. "
            "Assess bruising, discoloration, wilting, mold-like patterns, and surface texture. "
            "Determine visual indicator: EXACTLY one of 'Looks fresh', 'Some signs of aging', 'Multiple warning signs', or 'Unclear from image'. "
            "Provide cautious recommendations including storage tips and 'when in doubt, throw it out'. "
            "CRITICAL SAFETY RULE: NEVER state or imply that food is safe, sterilize, or free of microbiological contamination. "
            "Always include the disclaimer: 'Visual assessment only. It cannot detect bacteria, toxins, or contamination and cannot guarantee food safety.' "
            "Label source as 'live_ai'."
        )

        contents = [
            types.Part.from_bytes(data=media_bytes, mime_type=mime_type),
            f"Please assess visual freshness indicators. Note: {note or 'None'}"
        ]

        result: FreshnessAnalysisResponse = await self._generate_structured(
            contents=contents,
            pydantic_schema=FreshnessAnalysisResponse,
            system_prompt=system_prompt
        )
        result.source = "live_ai"
        result.disclaimer = "Visual assessment only. It cannot detect bacteria, toxins, or contamination and cannot guarantee food safety."
        return result

    async def analyze_hygiene(
        self,
        media_bytes: bytes,
        mime_type: str,
        note: Optional[str] = None
    ) -> HygieneAnalysisResponse:
        system_prompt = (
            "You are a commercial kitchen hygiene auditor evaluating kitchen and food-prep cleanliness. "
            "Inspect visible conditions across categories: 'surfaces', 'food storage', 'cross-contamination risk', 'PPE and attire', 'waste handling', 'pests', 'equipment'. "
            "For each finding assign severity: 'low', 'medium', or 'high', evidence description, and actionable corrective action. "
            "Assign a visual_risk_score from 0 (pristine) to 100 (severe hazard), and risk_level ('Low Risk', 'Moderate Risk', 'High Risk'). "
            "Write a clear summary report. "
            "CRITICAL: Always state that this is not an official inspection or certification: 'Based on visible conditions in the image. Not an official inspection or certification.' "
            "Label source as 'live_ai'."
        )

        contents = [
            types.Part.from_bytes(data=media_bytes, mime_type=mime_type),
            f"Please audit the hygiene and sanitary conditions in this food preparation image/video. Context: {note or 'Standard inspection'}"
        ]

        result: HygieneAnalysisResponse = await self._generate_structured(
            contents=contents,
            pydantic_schema=HygieneAnalysisResponse,
            system_prompt=system_prompt
        )
        result.source = "live_ai"
        result.disclaimer = "Based on visible conditions in the image. Not an official inspection or certification."
        return result

    async def generate_chat_reply(
        self,
        history: List[ChatMessage],
        latest_message: str,
        image_bytes: Optional[bytes] = None,
        image_mime: Optional[str] = None,
        audio_bytes: Optional[bytes] = None,
        audio_mime: Optional[str] = None
    ) -> Dict[str, Any]:
        system_prompt = (
            "You are Food Verse AI Cooking Assistant, an encouraging and culinary expert assistant. "
            "You answer cooking questions, offer smart ingredient substitutions, and guide cooking steps. "
            "If the user asks for a recipe or meal idea, output a structured response with your conversational text AND a structured recipe object "
            "containing: title, cuisine, prep_time_minutes, cook_time_minutes, servings, calories_per_serving, macros, ingredients list, "
            "step-by-step instructions with timer_seconds for timed tasks, and substitutions. "
            "Always maintain food safety awareness."
        )

        contents = []
        for msg in history[-8:]:  # Context window of recent messages
            contents.append(f"{msg.role.capitalize()}: {msg.content}")

        if image_bytes and image_mime:
            contents.append(types.Part.from_bytes(data=image_bytes, mime_type=image_mime))
        if audio_bytes and audio_mime:
            contents.append(types.Part.from_bytes(data=audio_bytes, mime_type=audio_mime))

        contents.append(f"User: {latest_message}")

        output: ChatOutput = await self._generate_structured(
            contents=contents,
            pydantic_schema=ChatOutput,
            system_prompt=system_prompt
        )
        if output.recipe:
            output.recipe.source = "live_ai"
        return {"reply": output.reply, "recipe": output.recipe}

    async def generate_meal_plan(
        self,
        request: MealPlanGenerateRequest
    ) -> MealPlanResponse:
        system_prompt = (
            "You are a personalized dietary intelligence planner. Generate a comprehensive day-by-day meal schedule. "
            "Strictly follow the user's diet type, calorie target, macro targets, and respect declared allergies. "
            "Provide daily plans with breakdown of meals (breakfast, lunch, dinner, snacks), calories, protein, carbs, fats, prep time. "
            "Consolidate a complete grocery list grouped into categories: Produce, Proteins, Dairy & Refrigerated, Pantry, Spices & Seasonings. "
            "Include disclaimer: 'General guidance, not medical advice. Consult a professional for medical conditions or severe allergies.' "
            "Label source as 'live_ai'."
        )

        prompt_text = (
            f"Generate a {request.days}-day meal plan ({request.meals_per_day} meals/day) for {request.diet_type} diet. "
            f"Target daily calories: {request.target_calories} kcal. "
            f"Macros: {request.macro_targets}. "
            f"Declared allergies: {request.allergies}. "
            f"Cuisine preferences: {request.cuisine_preferences}. "
            f"Budget: {request.budget}. "
            f"Ingredients on hand: {request.ingredients_on_hand or 'None'}."
        )

        result: MealPlanResponse = await self._generate_structured(
            contents=[prompt_text],
            pydantic_schema=MealPlanResponse,
            system_prompt=system_prompt
        )
        result.source = "live_ai"
        result.disclaimer = "General guidance, not medical advice. Consult a professional for medical conditions or severe allergies."
        return result

    async def replace_meal(
        self,
        request: ReplaceMealRequest
    ) -> MealItem:
        system_prompt = (
            "You are a culinary dietitian. Suggest a single replacement meal under the provided constraints: "
            f"Meal Type: {request.meal_type}, Diet: {request.diet_type}, Target Calories: ~{request.target_calories} kcal, "
            f"Allergies to strictly avoid: {request.allergies}."
        )

        contents = [f"Provide an alternative {request.meal_type} recipe."]
        result: MealItem = await self._generate_structured(
            contents=contents,
            pydantic_schema=MealItem,
            system_prompt=system_prompt
        )
        return result
