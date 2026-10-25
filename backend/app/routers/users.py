from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.deps import get_current_user
from app.db.mongo import get_db
from app.schemas.auth import UserPreferencesRequest, UserPreferencesResponse

router = APIRouter(prefix="/users", tags=["User Preferences"])


@router.get("/preferences", response_model=UserPreferencesResponse)
async def get_preferences(current_user=Depends(get_current_user), db=Depends(get_db)):
    user_id = str(current_user["_id"])
    pref = await db.preferences.find_one({"user_id": user_id})
    if not pref:
        # Create default
        now = datetime.now(timezone.utc).isoformat()
        pref = {
            "user_id": user_id,
            "diet_type": "Balanced",
            "allergies": [],
            "cuisine_preferences": ["Mediterranean"],
            "daily_calorie_target": 2000,
            "macro_targets": {"protein": 120, "carbs": 220, "fats": 65},
            "health_goals": ["Healthy living"],
            "updated_at": now
        }
        await db.preferences.insert_one(pref)

    return UserPreferencesResponse(**pref)


@router.put("/preferences", response_model=UserPreferencesResponse)
async def update_preferences(
    payload: UserPreferencesRequest,
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    user_id = str(current_user["_id"])
    now = datetime.now(timezone.utc).isoformat()

    update_doc = payload.model_dump()
    update_doc["user_id"] = user_id
    update_doc["updated_at"] = now

    await db.preferences.update_one(
        {"user_id": user_id},
        {"$set": update_doc},
        upsert=True
    )

    return UserPreferencesResponse(**update_doc)
