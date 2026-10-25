from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, model_validator


class RecipeStep(BaseModel):
    step_number: int
    text: str = ""
    timer_seconds: Optional[int] = 0

    @model_validator(mode="before")
    @classmethod
    def check_text_or_instruction(cls, data: Any):
        if isinstance(data, dict):
            if not data.get("text") and data.get("instruction"):
                data["text"] = str(data["instruction"])
        return data


class RecipeMacros(BaseModel):
    protein: float = 20.0
    carbs: float = 45.0
    fats: float = 15.0


class RecipeSchema(BaseModel):
    id: Optional[str] = None
    title: str
    cuisine: Optional[str] = "General"
    prep_time_minutes: int = 15
    cook_time_minutes: int = 20
    servings: int = 2
    calories_per_serving: Optional[int] = 400
    macros: Optional[RecipeMacros] = Field(default_factory=RecipeMacros)
    ingredients: List[str]
    instructions: List[RecipeStep]
    substitutions: Optional[List[str]] = Field(default_factory=list)
    source: str = "demo_sample"
    created_at: Optional[str] = None


class ChatOutput(BaseModel):
    reply: str
    recipe: Optional[RecipeSchema] = None


class ChatMessage(BaseModel):
    role: str = Field(..., description="'user' | 'assistant' | 'system'")
    content: str
    recipe: Optional[RecipeSchema] = None
    image_url: Optional[str] = None
    timestamp: Optional[str] = None


class ChatSessionCreate(BaseModel):
    title: Optional[str] = "Culinary Assistant Chat"


class ChatSessionResponse(BaseModel):
    id: str
    user_id: str
    title: str
    created_at: str
    updated_at: str
    messages: List[ChatMessage] = []


class SendMessageRequest(BaseModel):
    content: str
    image_data: Optional[str] = None  # Base64 data if any
