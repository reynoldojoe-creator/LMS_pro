
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, List, Any, Optional
from ...models import database
from ...services.reports_service import reports_service

router = APIRouter(prefix="/reports", tags=["reports"])

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/overview")
async def get_overview_stats(subject_id: Optional[int] = None, db: Session = Depends(get_db)):
    """
    Get high-level stats: total questions, approved, rejected, pending.
    Optional subject_id filter.
    """
    try:
        return reports_service.get_overview_stats(db, subject_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/co-coverage/{subject_id}")
async def get_co_coverage(subject_id: int, db: Session = Depends(get_db)):
    """
    Get Course Outcome coverage analysis for a subject.
    """
    try:
        subject = db.query(database.Subject).filter(database.Subject.id == subject_id).first()
        if not subject:
            raise HTTPException(status_code=404, detail="Subject not found")
            
        return reports_service.get_co_coverage(db, subject_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/blooms-distribution/{subject_id}")
async def get_blooms_distribution(subject_id: int, db: Session = Depends(get_db)):
    """
    Get Bloom's Taxonomy distribution for a subject.
    """
    try:
        subject = db.query(database.Subject).filter(database.Subject.id == subject_id).first()
        if not subject:
            raise HTTPException(status_code=404, detail="Subject not found")
            
        return reports_service.get_blooms_distribution(db, subject_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/topic-coverage/{subject_id}")
async def get_topic_coverage(subject_id: int, db: Session = Depends(get_db)):
    """
    Get question counts per topic for a subject.
    """
    try:
        subject = db.query(database.Subject).filter(database.Subject.id == subject_id).first()
        if not subject:
            raise HTTPException(status_code=404, detail="Subject not found")
            
        return reports_service.get_topic_coverage(db, subject_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/vetter-stats")
async def get_vetter_stats(db: Session = Depends(get_db)):
    """
    Get performance stats for vetters.
    """
    try:
        return reports_service.get_vetter_stats(db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/questions-by-subject")
async def get_questions_by_subject(db: Session = Depends(get_db)):
    """
    Get question counts by subject.
    """
    try:
        return reports_service.get_questions_by_subject(db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ─── Compatibility endpoints (match frontend's existing API calls) ───

@router.get("/faculty")
async def get_faculty_report(db: Session = Depends(get_db)):
    """
    Compatibility endpoint for the frontend Dashboard.
    Returns stats in the shape the facultyStore expects:
    { activeSubjects, totalSubjects, totalQuestions, pendingReview }
    """
    try:
        overview = reports_service.get_overview_stats(db)
        subject_count = db.query(database.Subject).count()
        return {
            "activeSubjects": subject_count,
            "totalSubjects": subject_count,
            "totalQuestions": overview["total_questions"],
            "pendingReview": overview["pending"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/vetter")
async def get_vetter_report(db: Session = Depends(get_db)):
    """
    Compatibility endpoint for the Vetter Stats screen.
    Returns stats in the shape the vetterStore expects:
    { totalReviewedThisWeek, totalReviewedThisMonth, approvalRate,
      averageTimePerQuestion, rejectionReasons }
    """
    try:
        overview = reports_service.get_overview_stats(db)
        reviewed = overview["approved"] + overview["rejected"]
        approval_rate = overview["approval_rate"] / 100.0 if overview["approval_rate"] else 0

        return {
            "totalReviewedThisWeek": reviewed,   # Simplified: using total (no date filtering yet)
            "totalReviewedThisMonth": reviewed,
            "approvalRate": approval_rate,
            "averageTimePerQuestion": 0,          # Not tracked yet
            "rejectionReasons": {},               # Not tracked yet
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
