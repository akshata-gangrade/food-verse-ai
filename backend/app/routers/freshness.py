import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from app.core.deps import get_current_user
from app.db.mongo import get_db
from app.utils.image import validate_and_process_image
from app.services.ai.provider_factory import get_ai_provider
from app.schemas.freshness import FreshnessAnalysisResponse

router = APIRouter(prefix="/freshness", tags=["Food Freshness Detection"])


@router.post("/analyze", response_model=FreshnessAnalysisResponse)
async def analyze_freshness(
    file: UploadFile = File(..., description="Image or video of produce / food"),
    note: Optional[str] = Form(None),
    save_to_history: bool = Form(True),
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    content = await file.read()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "empty_file", "message": "Uploaded file is empty.", "details": None}
        )

    content_type = file.content_type or ""
    is_video = "video" in content_type or file.filename.lower().endswith((".mp4", ".webm", ".mov"))
    thumbnail = None
    media_bytes = content
    mime = content_type or "image/jpeg"

    if is_video:
        # Enforce video constraint: max 20MB
        if len(content) > 20 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": "video_too_large", "message": "Video clips must be under 20 MB and 30 seconds.", "details": None}
            )
        mime = content_type or "video/mp4"
    else:
        try:
            media_bytes, mime, thumbnail = validate_and_process_image(content)
        except ValueError as ve:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": "invalid_image", "message": str(ve), "details": file.filename}
            )

    provider = get_ai_provider()
    try:
        result: FreshnessAnalysisResponse = await provider.analyze_freshness(media_bytes, mime_type=mime, note=note)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "freshness_analysis_failed", "message": f"Freshness assessment failed: {str(e)}", "details": None}
        )

    analysis_id = f"ana_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    result.id = analysis_id
    result.thumbnail = thumbnail
    result.created_at = now

    if save_to_history:
        record = {
            "_id": analysis_id,
            "user_id": str(current_user["_id"]),
            "feature": "freshness",
            "title": result.title,
            "created_at": now,
            "source": result.source,
            "input_type": "video" if is_video else "image",
            "summary": f"{result.visual_indicator} (Confidence: {int(result.confidence * 100)}%)",
            "thumbnail": thumbnail,
            "data": result.model_dump()
        }
        await db.analyses.insert_one(record)

    return result
