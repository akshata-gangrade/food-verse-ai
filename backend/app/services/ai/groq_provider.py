import json
import base64
import logging
import asyncio
from typing import List, Optional, Dict, Any, Tuple
from groq import AsyncGroq
from app.core.config import get_settings
from app.services.ai.base import BaseAIProvider
from app.schemas.food import FoodAnalysisResponse
from app.schemas.freshness import FreshnessAnalysisResponse
from app.schemas.hygiene import HygieneAnalysisResponse
from app.schemas.mealplan import MealPlanGenerateRequest, MealPlanResponse, ReplaceMealRequest, MealItem
from app.schemas.chat import ChatMessage, RecipeSchema, ChatOutput

logger = logging.getLogger("aahaar.ai.groq")


class GroqProvider(BaseAIProvider):
    def __init__(self):
        settings = get_settings()
        self.api_key = settings.GROQ_API_KEY.strip()
        if not self.api_key:
            raise ValueError("GROQ_API_KEY is not configured in backend/.env")

        self.text_model = settings.GROQ_MODEL or "llama-3.3-70b-versatile"
        self.vision_model = settings.GROQ_VISION_MODEL or "llama-3.2-11b-vision-preview"
        self.client = AsyncGroq(api_key=self.api_key)

    async def _generate_structured(
        self,
        messages: List[Dict[str, Any]],
        pydantic_schema: type,
        candidate_models: List[str],
        retries: int = 1
    ):
        """Invoke Groq with JSON mode, schema injection, model fallback, and retries."""
        last_error = None
        unique_models = list(dict.fromkeys([m for m in candidate_models if m]))

        for model in unique_models:
            for attempt in range(retries + 1):
                try:
                    logger.info(f"[Groq] Requesting structured output using model: {model} (attempt {attempt + 1})")
                    completion = await self.client.chat.completions.create(
                        model=model,
                        messages=messages,
                        response_format={"type": "json_object"},
                        temperature=0.2,
                        max_tokens=4096,
                    )
                    content = completion.choices[0].message.content or "{}"
                    clean = content.strip()

                    # Strip markdown block if model included it
                    if clean.startswith("```"):
                        lines = clean.splitlines()
                        if lines[0].startswith("```"):
                            lines = lines[1:]
                        if lines and lines[-1].startswith("```"):
                            lines = lines[:-1]
                        clean = "\n".join(lines).strip()

                    data = json.loads(clean)
                    validated = pydantic_schema.model_validate(data)
                    return validated
                except Exception as e:
                    last_error = e
                    logger.warning(f"[Groq] Model {model} attempt {attempt + 1} failed: {e}")
                    err_str = str(e).lower()
                    # If model not found or rate limited, break early to next model
                    if "404" in err_str or "model_not_found" in err_str or "does not exist" in err_str:
                        break
                    await asyncio.sleep(0.5)

        raise RuntimeError(f"Groq generation failed across candidate models: {last_error}")

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

        schema_json = json.dumps(FoodAnalysisResponse.model_json_schema())
        system_instruction = (
            f"{system_prompt}\n\n"
            f"CRITICAL: Output ONLY a JSON object strictly adhering to this schema:\n{schema_json}"
        )

        prompt_text = "Please analyze the nutritional breakdown of this meal."
        if note:
            prompt_text += f" Additional user note: {note}"

        user_content = [{"type": "text", "text": prompt_text}]
        for img_bytes, mime_type in images:
            b64 = base64.b64encode(img_bytes).decode("utf-8")
            user_content.append({
                "type": "image_url",
                "image_url": {"url": f"data:{mime_type};base64,{b64}"}
            })

        messages = [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": user_content}
        ]

        candidate_models = [self.vision_model, "llama-3.2-11b-vision-preview", "llama-3.2-90b-vision-preview"]
        result: FoodAnalysisResponse = await self._generate_structured(
            messages=messages,
            pydantic_schema=FoodAnalysisResponse,
            candidate_models=candidate_models
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

        schema_json = json.dumps(FreshnessAnalysisResponse.model_json_schema())
        system_instruction = (
            f"{system_prompt}\n\n"
            f"CRITICAL: Output ONLY a JSON object strictly adhering to this schema:\n{schema_json}"
        )

        b64 = base64.b64encode(media_bytes).decode("utf-8")
        user_content = [
            {"type": "text", "text": f"Please assess visual freshness indicators. Note: {note or 'None'}"},
            {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{b64}"}}
        ]

        messages = [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": user_content}
        ]

        candidate_models = [self.vision_model, "llama-3.2-11b-vision-preview", "llama-3.2-90b-vision-preview"]
        result: FreshnessAnalysisResponse = await self._generate_structured(
            messages=messages,
            pydantic_schema=FreshnessAnalysisResponse,
            candidate_models=candidate_models
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

        schema_json = json.dumps(HygieneAnalysisResponse.model_json_schema())
        system_instruction = (
            f"{system_prompt}\n\n"
            f"CRITICAL: Output ONLY a JSON object strictly adhering to this schema:\n{schema_json}"
        )

        b64 = base64.b64encode(media_bytes).decode("utf-8")
        user_content = [
            {"type": "text", "text": f"Please audit the hygiene and sanitary conditions in this food preparation image. Context: {note or 'Standard inspection'}"},
            {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{b64}"}}
        ]

        messages = [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": user_content}
        ]

        candidate_models = [self.vision_model, "llama-3.2-11b-vision-preview", "llama-3.2-90b-vision-preview"]
        result: HygieneAnalysisResponse = await self._generate_structured(
            messages=messages,
            pydantic_schema=HygieneAnalysisResponse,
            candidate_models=candidate_models
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

        schema_json = json.dumps(ChatOutput.model_json_schema())
        system_instruction = (
            f"{system_prompt}\n\n"
            f"CRITICAL: Output ONLY a JSON object strictly adhering to this schema:\n{schema_json}"
        )

        messages: List[Dict[str, Any]] = [
            {"role": "system", "content": system_instruction}
        ]

        # Prior history
        for msg in history[-6:]:
            messages.append({"role": msg.role, "content": msg.content})

        has_image = bool(image_bytes and image_mime)
        if has_image:
            b64 = base64.b64encode(image_bytes).decode("utf-8")
            messages.append({
                "role": "user",
                "content": [
                    {"type": "text", "text": latest_message},
                    {"type": "image_url", "image_url": {"url": f"data:{image_mime};base64,{b64}"}}
                ]
            })
            candidate_models = [self.vision_model, "llama-3.2-11b-vision-preview", "llama-3.2-90b-vision-preview"]
        else:
            messages.append({"role": "user", "content": latest_message})
            candidate_models = [self.text_model, "llama-3.3-70b-versatile", "llama-3.1-8b-instant", "llama-3.2-11b-vision-preview"]

        output: ChatOutput = await self._generate_structured(
            messages=messages,
            pydantic_schema=ChatOutput,
            candidate_models=candidate_models
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

        schema_json = json.dumps(MealPlanResponse.model_json_schema())
        system_instruction = (
            f"{system_prompt}\n\n"
            f"CRITICAL: Output ONLY a JSON object strictly adhering to this schema:\n{schema_json}"
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

        messages = [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": prompt_text}
        ]

        candidate_models = [self.text_model, "llama-3.3-70b-versatile", "llama-3.1-8b-instant", "llama-3.2-11b-vision-preview"]
        result: MealPlanResponse = await self._generate_structured(
            messages=messages,
            pydantic_schema=MealPlanResponse,
            candidate_models=candidate_models
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

        schema_json = json.dumps(MealItem.model_json_schema())
        system_instruction = (
            f"{system_prompt}\n\n"
            f"CRITICAL: Output ONLY a JSON object strictly adhering to this schema:\n{schema_json}"
        )

        messages = [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": f"Provide an alternative {request.meal_type} recipe."}
        ]

        candidate_models = [self.text_model, "llama-3.3-70b-versatile", "llama-3.1-8b-instant", "llama-3.2-11b-vision-preview"]
        result: MealItem = await self._generate_structured(
            messages=messages,
            pydantic_schema=MealItem,
            candidate_models=candidate_models
        )
        return result
