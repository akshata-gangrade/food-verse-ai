from typing import List, Optional, Any, Dict
from pydantic import BaseModel


class HistoryItemResponse(BaseModel):
    id: str
    feature: str  # food | freshness | hygiene | chat | mealplan
    title: str
    created_at: str
    source: str
    input_type: Optional[str] = "image"
    summary: Optional[str] = ""
    thumbnail: Optional[str] = None
    data: Optional[Dict[str, Any]] = None


class HistoryListResponse(BaseModel):
    items: List[HistoryItemResponse]
    total: int
