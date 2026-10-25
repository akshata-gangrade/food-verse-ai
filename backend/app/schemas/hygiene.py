from typing import List, Optional
from pydantic import BaseModel, Field


class HygieneFinding(BaseModel):
    category: str = Field(
        ...,
        description="'surfaces' | 'food storage' | 'cross-contamination risk' | 'PPE and attire' | 'waste handling' | 'pests' | 'equipment'"
    )
    severity: str = Field(..., description="'low' | 'medium' | 'high'")
    evidence: str = Field(..., description="Observable evidence seen in the inspection image")
    corrective_action: str = Field(..., description="Actionable standard corrective step")


class HygieneAnalysisResponse(BaseModel):
    id: Optional[str] = None
    title: str = "Kitchen Hygiene & Food Safety Assessment"
    visual_risk_score: int = Field(..., ge=0, le=100, description="Risk index (0-30 Low, 31-70 Moderate, 71-100 High Risk)")
    risk_level: str = Field(..., description="'Low Risk' | 'Moderate Risk' | 'High Risk'")
    findings: List[HygieneFinding]
    summary_report: str = Field(..., description="Comprehensive findings overview and critical safety action points")
    source: str = "demo_sample"
    disclaimer: str = "Based on visible conditions in the image. Not an official inspection or certification."
    thumbnail: Optional[str] = None
    created_at: Optional[str] = None
