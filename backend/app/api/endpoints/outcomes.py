
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from pydantic import BaseModel

from ...models import database
from ...services.outcome_mapper import outcome_mapping_service
from ...api.deps import get_db

router = APIRouter()

class BulkMapRequest(BaseModel):
    topic_ids: List[int]
    weight: str = "moderate"

@router.get("/subjects/{subject_id}/cos/{co_id}/suggest-topics")
async def suggest_topics(
    subject_id: int,
    co_id: int,
    db: Session = Depends(get_db)
):
    """Suggest topics for a CO using AI."""
    result = await outcome_mapping_service.auto_suggest_mappings(db, subject_id, co_id)
    return result

@router.post("/subjects/{subject_id}/cos/{co_id}/map-topics")
def bulk_map_topics(
    subject_id: int,
    co_id: int,
    data: BulkMapRequest,
    db: Session = Depends(get_db)
):
    """Map multiple topics to a CO."""
    outcome_mapping_service.bulk_map(db, co_id, data.topic_ids, data.weight)
    return {"status": "success", "mapped_count": len(data.topic_ids)}

@router.delete("/subjects/{subject_id}/cos/{co_id}/topics/{topic_id}")
def remove_mapping(
    subject_id: int,
    co_id: int,
    topic_id: int,
    db: Session = Depends(get_db)
):
    """Remove a topic mapping."""
    outcome_mapping_service.remove_mapping(db, co_id, topic_id)
    return {"status": "success"}

# ── LO Mapping Endpoints ──

@router.get("/subjects/{subject_id}/los/{lo_id}/suggest-topics")
async def suggest_lo_topics(
    subject_id: int,
    lo_id: int,
    db: Session = Depends(get_db)
):
    """Suggest topics for an LO using AI."""
    result = await outcome_mapping_service.auto_suggest_lo_mappings(db, subject_id, lo_id)
    return result

@router.post("/subjects/{subject_id}/los/{lo_id}/map-topics")
def bulk_map_lo_topics(
    subject_id: int,
    lo_id: int,
    data: BulkMapRequest,
    db: Session = Depends(get_db)
):
    """Map multiple topics to an LO."""
    outcome_mapping_service.bulk_map_lo(db, lo_id, data.topic_ids)
    return {"status": "success", "mapped_count": len(data.topic_ids)}

