import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from app.core.deps import get_current_user
from app.db.mongo import get_db
from app.utils.image import validate_and_process_image
from app.services.ai.provider_factory import get_ai_provider
from app.schemas.food import FoodAnalysisResponse

router = APIRouter(prefix="/food", tags=["Food Recognition & Nutrition"])


@router.post("/analyze", response_model=FoodAnalysisResponse)
async def analyze_food(
    files: List[UploadFile] = File(..., description="One or more food images"),
    note: Optional[str] = Form(None),
    save_to_history: bool = Form(True),
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "no_files", "message": "At least one food image is required for analysis.", "details": None}
        )

    processed_images = []
    first_thumbnail = None

    for file in files:
        content = await file.read()
        try:
            clean_bytes, mime, thumb = validate_and_process_image(content)
            processed_images.append((clean_bytes, mime))
            if first_thumbnail is None:
                first_thumbnail = thumb
        except ValueError as ve:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": "invalid_image", "message": str(ve), "details": file.filename}
            )

    provider = get_ai_provider()
    try:
        result: FoodAnalysisResponse = await provider.analyze_food(processed_images, note=note)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "analysis_failed", "message": f"Food analysis could not be completed: {str(e)}", "details": None}
        )

    analysis_id = f"ana_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    result.id = analysis_id
    result.thumbnail = first_thumbnail
    result.created_at = now

    if save_to_history:
        record = {
            "_id": analysis_id,
            "user_id": str(current_user["_id"]),
            "feature": "food",
            "title": result.title,
            "created_at": now,
            "source": result.source,
            "input_type": "image",
            "summary": f"{len(result.identified_items)} items identified, ~{int(result.total_nutrition.calories)} kcal",
            "thumbnail": first_thumbnail,
            "data": result.model_dump()
        }
        await db.analyses.insert_one(record)

    return result
