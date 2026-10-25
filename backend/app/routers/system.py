from fastapi import APIRouter
from app.core.config import get_settings
from app.db.mongo import is_in_memory_db
from app.schemas.system import SystemStatusResponse

router = APIRouter(prefix="/system", tags=["System Status"])
settings = get_settings()


@router.get("/status", response_model=SystemStatusResponse)
async def get_system_status():
    in_mem = is_in_memory_db()
    current_settings = get_settings()
    active_prov = current_settings.active_provider
    if active_prov == "groq":
        active_model = f"Groq: {current_settings.GROQ_MODEL}"
        key_configured = bool(current_settings.GROQ_API_KEY.strip())
    else:
        active_model = current_settings.GEMINI_MODEL
        key_configured = bool(current_settings.GEMINI_API_KEY.strip())

    return SystemStatusResponse(
        mode="demo_sample" if current_settings.is_demo else "live_ai",
        is_demo=current_settings.is_demo,
        is_in_memory_db=in_mem,
        db_type="In-Memory mongomock (Temporary)" if in_mem else "MongoDB (Live Connection)",
        gemini_model=active_model,
        gemini_key_configured=key_configured,
        project_name=current_settings.PROJECT_NAME
    )
