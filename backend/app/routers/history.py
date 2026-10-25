from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.core.deps import get_current_user
from app.db.mongo import get_db
from app.schemas.history import HistoryItemResponse, HistoryListResponse

router = APIRouter(prefix="/history", tags=["Analysis History"])


@router.get("", response_model=HistoryListResponse)
async def list_history(
    feature: Optional[str] = Query(None, description="Filter by feature: food, freshness, hygiene"),
    limit: int = Query(50, ge=1, le=100),
    skip: int = Query(0, ge=0),
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    user_id = str(current_user["_id"])
    query = {"user_id": user_id}
    if feature and feature.lower() != "all":
        query["feature"] = feature.lower()

    cursor = db.analyses.find(query).sort("created_at", -1).skip(skip).limit(limit)
    total = await db.analyses.count_documents(query)

    items = []
    async for doc in cursor:
        items.append(HistoryItemResponse(
            id=str(doc["_id"]),
            feature=doc.get("feature", "food"),
            title=doc.get("title", "Analysis"),
            created_at=doc.get("created_at", ""),
            source=doc.get("source", "demo_sample"),
            input_type=doc.get("input_type", "image"),
            summary=doc.get("summary", ""),
            thumbnail=doc.get("thumbnail"),
            data=doc.get("data")
        ))

    return HistoryListResponse(items=items, total=total)


@router.get("/{analysis_id}", response_model=HistoryItemResponse)
async def get_history_item(analysis_id: str, current_user=Depends(get_current_user), db=Depends(get_db)):
    user_id = str(current_user["_id"])
    doc = await db.analyses.find_one({"_id": analysis_id, "user_id": user_id})
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "not_found", "message": "History record not found.", "details": None}
        )
    return HistoryItemResponse(
        id=str(doc["_id"]),
        feature=doc.get("feature", "food"),
        title=doc.get("title", "Analysis"),
        created_at=doc.get("created_at", ""),
        source=doc.get("source", "demo_sample"),
        input_type=doc.get("input_type", "image"),
        summary=doc.get("summary", ""),
        thumbnail=doc.get("thumbnail"),
        data=doc.get("data")
    )


@router.delete("/{analysis_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_history_item(analysis_id: str, current_user=Depends(get_current_user), db=Depends(get_db)):
    user_id = str(current_user["_id"])
    result = await db.analyses.delete_one({"_id": analysis_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "not_found", "message": "History record not found.", "details": None}
        )
