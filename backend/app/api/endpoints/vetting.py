from fastapi import APIRouter, Depends, HTTPException, Form
from typing import List, Optional, Dict
from sqlalchemy.orm import Session
from ...models.database import SessionLocal
from ...services.vetting_service import vetting_service
import json

router = APIRouter(prefix="/vetting", tags=["vetting"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/pending")
async def get_pending_batches(db: Session = Depends(get_db)):
    """Get all batches with pending questions"""
    return await vetting_service.get_pending_batches(db)

@router.get("/batches/{batch_id}")
async def get_batch_detail(batch_id: str, db: Session = Depends(get_db)):
    """
    Get batch with questions grouped by type
    """
    result = await vetting_service.get_batch_detail(db, batch_id)
    if not result:
        raise HTTPException(status_code=404, detail="Batch not found")
    return result

@router.post("/{question_id}/approve")
async def approve_question(
    question_id: str,
    vetter_id: str = Form(...),
    co_adjustment: Optional[str] = Form(None),  # JSON of adjusted CO mappings
    lo_adjustment: Optional[str] = Form(None),  # JSON of adjusted LO mappings
    db: Session = Depends(get_db)
):
    """Approve question, optionally with CO/LO intensity adjustments"""
    try:
        co_adj = json.loads(co_adjustment) if co_adjustment else None
        lo_adj = json.loads(lo_adjustment) if lo_adjustment else None
        return await vetting_service.approve_question(db, question_id, vetter_id, co_adj, lo_adj)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{question_id}/reject")
async def reject_question(
    question_id: str,
    vetter_id: str = Form(...),
    category: str = Form(...),  # Rejection category ID
    reason: Optional[str] = Form(None),  # Custom reason text
    notes: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """Reject question with categorized reason"""
    try:
        return await vetting_service.reject_question(
            db, question_id, vetter_id, category, reason, notes
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/rejection-categories")
async def get_rejection_categories():
    """Get list of rejection categories for UI dropdown"""
    return vetting_service.REJECTION_CATEGORIES

@router.get("/analytics")
async def get_vetting_analytics(
    subject_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get rejection analytics for reports"""
    return await vetting_service.get_rejection_analytics(db, subject_id)
