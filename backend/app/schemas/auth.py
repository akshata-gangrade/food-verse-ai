from typing import Optional, List, Dict
from pydantic import BaseModel, EmailStr, Field


class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")
    full_name: str = Field(..., min_length=2)


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, str]


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    created_at: str
    is_demo_account: Optional[bool] = False


class UserPreferencesRequest(BaseModel):
    diet_type: Optional[str] = "Balanced"
    allergies: Optional[List[str]] = []
    cuisine_preferences: Optional[List[str]] = []
    daily_calorie_target: Optional[int] = 2000
    macro_targets: Optional[Dict[str, int]] = {"protein": 120, "carbs": 220, "fats": 65}
    health_goals: Optional[List[str]] = []


class UserPreferencesResponse(UserPreferencesRequest):
    user_id: str
    updated_at: str
