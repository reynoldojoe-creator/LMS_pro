from pydantic import BaseModel
from typing import List, Optional, Literal

class ExpertCheck(BaseModel):
    score: float
    feedback: str
    verdict: Literal["APPROVE", "REVISE", "REJECT"]

class CouncilResult(BaseModel):
    content_expert: ExpertCheck
    pedagogy_expert: ExpertCheck
    quality_expert: ExpertCheck
    
    overall_verdict: Literal["APPROVE", "REVISE", "REJECT"]
    aggregate_score: float
    
    critical_issues: List[str] = []
    suggested_improvements: List[str] = []
