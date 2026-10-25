from typing import List, Optional
from pydantic import BaseModel, Field


class FreshnessAnalysisResponse(BaseModel):
    id: Optional[str] = None
    title: str = "Freshness Assessment"
    visual_indicator: str = Field(
        ...,
        description="'Looks fresh' | 'Some signs of aging' | 'Multiple warning signs' | 'Unclear from image'"
    )
    confidence: float = Field(..., ge=0.0, le=1.0)
    observations: List[str] = Field(
        ...,
        description="Visible signs only: bruising, discoloration, mold-like patterns, wilting, texture changes"
    )
    estimated_shelf_life: Optional[str] = Field(
        default="Consume promptly",
        description="Estimated shelf life under ideal storage"
    )
    storage_recommendations: List[str] = Field(
        ...,
        description="Storage guidance and 'when in doubt, throw it out' reminders"
    )
    source: str = "demo_sample"
    disclaimer: str = "Visual assessment only. It cannot detect bacteria, toxins, or contamination and cannot guarantee food safety."
    thumbnail: Optional[str] = None
    created_at: Optional[str] = None
