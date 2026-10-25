from typing import Optional
from pydantic import BaseModel


class SystemStatusResponse(BaseModel):
    mode: str  # "live_ai" | "demo_sample"
    is_demo: bool
    is_in_memory_db: bool
    db_type: str  # "MongoDB (Live Connection)" | "In-Memory mongomock (Temporary)"
    gemini_model: str
    gemini_key_configured: bool
    project_name: str
