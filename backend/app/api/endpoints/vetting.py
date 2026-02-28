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

@router.get("/batches")
async def get_batches(status: Optional[str] = None, db: Session = Depends(get_db)):
    """List batches with optional status filtering"""
    from ...models import database
    import json
    from datetime import datetime
    
    rubrics = db.query(database.Rubric).order_by(
        database.Rubric.created_at.desc()
    ).all()
    
    batches = []
    for r in rubrics:
        total = db.query(database.Question).filter(
            database.Question.rubric_id == r.id
        ).count()
        if total == 0:
            continue
            
        pending = db.query(database.Question).filter(
            database.Question.rubric_id == r.id, 
            database.Question.status == "pending"
        ).count()
        approved = db.query(database.Question).filter(
            database.Question.rubric_id == r.id, 
            database.Question.status == "approved"
        ).count()
        rejected = db.query(database.Question).filter(
            database.Question.rubric_id == r.id, 
            database.Question.status == "rejected"
        ).count()
        quarantined = db.query(database.Question).filter(
            database.Question.rubric_id == r.id, 
            database.Question.status == "quarantined"
        ).count()
        
        reviewed = approved + rejected + quarantined
        
        batch_status = "pending"
        if pending == 0 and total > 0:
            batch_status = "completed"
        elif reviewed > 0:
            batch_status = "in_progress"
            
        if status and batch_status != status:
            continue
            
        batches.append({
            "id": str(r.id),
            "rubric_id": str(r.id),
            "rubricId": str(r.id),
            "subject_id": str(r.subject_id),
            "subjectId": str(r.subject_id),
            "title": r.title,
            "generated_by": "Faculty",
            "facultyName": "Faculty",
            "total_questions": total,
            "totalQuestions": total,
            "pending_count": pending,
            "approved_count": approved,
            "approvedCount": approved,
            "rejected_count": rejected,
            "rejectedCount": rejected,
            "quarantined_count": quarantined,
            "quarantinedCount": quarantined,
            "reviewedQuestions": reviewed,
            "generated_at": r.created_at.isoformat() if r.created_at else None,
            "generatedAt": r.created_at.isoformat() if r.created_at else None,
            "status": batch_status,
            "questions": []
        })
        
    return batches

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
    notes: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """Approve question, optionally with CO/LO intensity adjustments"""
    try:
        co_adj = json.loads(co_adjustment) if co_adjustment else None
        lo_adj = json.loads(lo_adjustment) if lo_adjustment else None
        return await vetting_service.approve_question(db, question_id, vetter_id, co_adj, lo_adj, notes)
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

@router.post("/{question_id}/quarantine")
async def quarantine_question(
    question_id: str,
    body: Dict = {},
    db: Session = Depends(get_db)
):
    """Quarantine question with optional notes"""
    try:
        vetter_id = body.get("vetter_id", "vetter")
        category = body.get("category", "quarantined")
        reason = body.get("reason") or body.get("notes", "")
        notes = body.get("notes", "")
        return await vetting_service.quarantine_question(
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
