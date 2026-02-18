from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, Body
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from ...models import database, schemas

import re
import os
from pathlib import Path
from datetime import datetime
import json
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/subjects", tags=["subjects"])

# Initialize services
from ...services.rag_service import RAGService
from ...services.textbook_processor import TextbookProcessor

rag_service = RAGService()
textbook_processor = TextbookProcessor()

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("")
async def list_subjects(db: Session = Depends(get_db)):
    subjects = db.query(database.Subject).all()
    result = []
    for s in subjects:
        total_q = db.query(database.Question).filter(database.Question.subject_id == s.id).count()
        # Load topics from DB
        # topics are loaded via relationship automatically if not lazy=dynamic, otherwise use s.topics
        # But we accessed s.topics below, so it should be fine.
        result.append({
            "id": s.id,
            "name": s.name,
            "code": s.code,
            "department": s.department,
            "credits": s.credits,
            "terminology_detected": s.terminology_detected,
            "courseOutcomes": [{"id": co.id, "code": co.code, "description": co.description} for co in s.course_outcomes],
            "terminology_detected": s.terminology_detected,
            "courseOutcomes": [{"id": co.id, "code": co.code, "description": co.description} for co in s.course_outcomes],
            "topics": [{"id": t.id, "name": t.name, "order": t.order} for t in s.topics],
            "totalQuestions": total_q,
            "createdAt": None,
        })
    return result

@router.post("", response_model=schemas.SubjectSchema)
async def create_subject(
    name: str = Form(...),
    code: str = Form(...),
    department: str = Form(...),
    credits: int = Form(4),
    paper_type: str = Form("core"),
    db: Session = Depends(get_db)
):
    """
    Step 1: Create Subject Metadata
    """
    try:
        # Check if code exists
        existing = db.query(database.Subject).filter(database.Subject.code == code).first()
        if existing:
            raise HTTPException(status_code=400, detail="Subject code already exists")

        subject = database.Subject(
            name=name,
            code=code,
            department=department,
            credits=credits,
            paper_type=paper_type
        )
        db.add(subject)
        db.commit()
        db.refresh(subject)
        
        # Create folder structure (lightweight version of what service did)
        base_dir = Path(os.getcwd()) / "data/subjects" / code
        (base_dir / "syllabus").mkdir(parents=True, exist_ok=True)
        (base_dir / "notes").mkdir(parents=True, exist_ok=True)
        (base_dir / "generated").mkdir(parents=True, exist_ok=True)
        
        return subject
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{subject_id}/course-outcomes")
async def add_course_outcomes(
    subject_id: int,
    outcomes: List[schemas.CourseOutcomeCreate],
    db: Session = Depends(get_db)
):
    """
    Step 2: Add Course Outcomes
    """
    try:
        subject = db.query(database.Subject).filter(database.Subject.id == subject_id).first()
        if not subject:
            raise HTTPException(status_code=404, detail="Subject not found")

        # Clear existing COs if any? Or append? Assuming append/update.
        # But usually this is a setup step.
        
        created_cos = []
        for i, co_data in enumerate(outcomes):
            co = database.CourseOutcome(
                subject_id=subject.id,
                code=co_data.code,
                description=co_data.description,
                order=i+1
            )
            db.add(co)
            created_cos.append(co)
            
        db.commit()
        return {"message": f"Added {len(created_cos)} Course Outcomes"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{subject_id}/learning-outcomes")
async def add_learning_outcomes(
    subject_id: int,
    outcomes: List[schemas.LearningOutcomeCreate],
    db: Session = Depends(get_db)
):
    """
    Step 3: Add Learning Outcomes
    """
    try:
        subject = db.query(database.Subject).filter(database.Subject.id == subject_id).first()
        if not subject:
            raise HTTPException(status_code=404, detail="Subject not found")

        created_los = []
        for i, lo_data in enumerate(outcomes):
            lo = database.LearningOutcome(
                subject_id=subject.id,
                code=lo_data.code,
                description=lo_data.description,
                order=i+1
            )
            db.add(lo)
            created_los.append(lo)
            
        db.commit()
        return {"message": f"Added {len(created_los)} Learning Outcomes"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))



@router.post("/{subject_id}/textbook")
async def upload_textbook(
    subject_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Phase A: Upload & Index Textbook (Hybrid Structure Detection)
    """
    try:
        subject = db.query(database.Subject).filter(database.Subject.id == subject_id).first()
        if not subject:
            raise HTTPException(status_code=404, detail="Subject not found")

        # Save file (separate 'textbooks' folder to keep it clean)
        base_dir = Path(os.getcwd()) / "data/subjects" / subject.code / "textbooks"
        base_dir.mkdir(parents=True, exist_ok=True)
        file_path = base_dir / file.filename
        
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
            
        # Process using TextbookProcessor
        structure = await textbook_processor.process_textbook(str(file_path), str(subject_id))
        
        return {
            "message": "Textbook processed and indexed successfully",
            "structure": structure,
            "file_path": str(file_path)
        }
    except Exception as e:
        logger.error(f"Textbook upload failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))




@router.get("/{subject_id}")
async def get_subject(subject_id: int, db: Session = Depends(get_db)):
    """Get subject with all details"""
    subject = db.query(database.Subject).filter(database.Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    # Load units with topics
    # topics loaded via subject.topics relationship
    total_q = db.query(database.Question).filter(database.Question.subject_id == subject_id).count()
    
    # Load learning outcomes
    los = db.query(database.LearningOutcome).filter(database.LearningOutcome.subject_id == subject_id).all()
    
    return {
        "id": subject.id,
        "name": subject.name,
        "code": subject.code,
        "department": subject.department,
        "credits": subject.credits,
        "paper_type": subject.paper_type,
        "terminology_detected": subject.terminology_detected,
        "courseOutcomes": [{"id": co.id, "code": co.code, "description": co.description, "topics": [{"id": t.id, "name": t.name} for t in co.topics]} for co in subject.course_outcomes],
        "learningOutcomes": [{"id": lo.id, "code": lo.code, "description": lo.description, "topics": [{"id": t.id, "name": t.name} for t in lo.topics]} for lo in los],
        "topics": [{
            "id": t.id, 
            "name": t.name,
            "order": t.order,
            "learningOutcomes": [{"id": lo.id, "code": lo.code, "description": lo.description} for lo in t.mapped_los]
        } for t in subject.topics],
        "totalQuestions": total_q,
    }


@router.get("/{subject_id}/topics/{topic_id}")
async def get_topic_detail(subject_id: int, topic_id: int, db: Session = Depends(get_db)):
    """Get topic details"""
    topic = db.query(database.Topic).filter(database.Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
        
    question_counts = {
        "mcq": db.query(database.Question).filter(database.Question.topic_id == topic_id, database.Question.question_type == "mcq").count(),
        "short_answer": db.query(database.Question).filter(database.Question.topic_id == topic_id, database.Question.question_type == "short_answer").count(),
        "essay": db.query(database.Question).filter(database.Question.topic_id == topic_id, database.Question.question_type == "essay").count()
    }
    
    notes = db.query(database.TopicNotes).filter(database.TopicNotes.topic_id == topic_id).all()
    
    # Manually map mappings since schema might be tricky with secondary
    mapped_cos = [{"id": co.id, "code": co.code, "description": co.description} for co in topic.mapped_cos]
    mapped_los = [{"id": lo.id, "code": lo.code, "description": lo.description} for lo in topic.mapped_los]

    return {
        "id": topic.id,
        "name": topic.name,
        "subject_id": topic.subject_id,
        "stats": question_counts,
        "samples": [],
        "notes": [{"id": n.id, "title": n.title, "path": n.file_path} for n in notes],
        "mapped_cos": mapped_cos,
        "mapped_los": mapped_los
    }



@router.post("/{subject_id}/topics/{topic_id}/map")
async def update_topic_mappings(
    subject_id: int,
    topic_id: int,
    mapping: schemas.TopicOutcomeMappingRequest,
    db: Session = Depends(get_db)
):
    """
    Update CO and LO mappings for a topic.
    """
    topic = db.query(database.Topic).filter(database.Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
        
    # Verify Subject ID match (optional but good for safety)
    # Topic -> Unit -> Subject is the chain.
    
    # 1. Update CO mappings
    if mapping.co_ids is not None:
        # Fetch COs
        cos = db.query(database.CourseOutcome).filter(
            database.CourseOutcome.id.in_(mapping.co_ids),
            database.CourseOutcome.subject_id == subject_id
        ).all()
        
        # Replace existing
        topic.mapped_cos = cos
        
    # 2. Update LO mappings
    if mapping.lo_ids is not None:
        # Fetch LOs
        los = db.query(database.LearningOutcome).filter(
            database.LearningOutcome.id.in_(mapping.lo_ids),
            database.LearningOutcome.subject_id == subject_id
        ).all()
        
        # Replace existing
        topic.mapped_los = los
        
    db.commit()
    
    return {
        "message": "Mappings updated",
        "co_count": len(topic.mapped_cos),
        "lo_count": len(topic.mapped_los)
    }
