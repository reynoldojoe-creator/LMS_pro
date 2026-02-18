from fastapi import APIRouter, Form, HTTPException, Depends
from typing import Optional, List, Dict, Any
import json
import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from ...models import database
from ...services.rubric_service import rubric_service

router = APIRouter(prefix="/rubrics", tags=["rubrics"])

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("")
async def create_rubric(
    request: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """
    Create rubric — accepts plain JSON dict.
    Handles both camelCase (from some frontends) and snake_case keys.
    """
    try:
        # Helper to get value from either camelCase or snake_case key
        def get(camel: str, snake: str, default=None):
            return request.get(camel, request.get(snake, default))

        rubric_id = str(uuid.uuid4())
        title = get("title", "name", "Untitled")
        subject_id = int(get("subjectId", "subject_id", 0))
        exam_type = get("examType", "exam_type", "final")
        total_marks = int(get("totalMarks", "total_marks", 100))
        duration = int(get("duration", "duration_minutes", 180))

        # Serialize dict/list fields to JSON strings for Text columns
        def to_json(val, default="{}"):
            if val is None:
                return default
            if isinstance(val, (dict, list)):
                return json.dumps(val)
            if isinstance(val, str):
                return val
            return json.dumps(val)

        sections = to_json(
            get("sections", "question_distribution", {}),
            "{}"
        )
        co_dist = to_json(get("coDistribution", "co_distribution", None), None)
        co_req = to_json(get("coRequirements", "co_requirements", None), None)
        lo_dist = to_json(get("loDistribution", "lo_distribution", None), None)
        diff_dist = to_json(get("difficultyDistribution", "difficulty_distribution", {}))
        units = to_json(get("unitsCovered", "units_covered", []), "[]")
        assign_cfg = to_json(get("assignmentConfig", "assignment_config", None), None)

        rubric = database.Rubric(
            id=rubric_id,
            title=title,
            name=title,  # Legacy column, NOT NULL in physical DB
            subject_id=subject_id,
            exam_type=exam_type,
            total_marks=total_marks,
            duration=duration,
            sections=sections,
            difficulty_distribution=diff_dist,
            co_requirements=co_req,
            co_distribution=co_dist,
            lo_distribution=lo_dist,
            units_covered=units,
            assignment_config=assign_cfg,
            status="created",
            created_at=datetime.utcnow(),
        )
        db.add(rubric)
        db.commit()
        db.refresh(rubric)

        # Create Rubric Items from sections
        if sections and sections != "{}":
            sections_data = json.loads(sections)
            for q_type, config in sections_data.items():
                if isinstance(config, dict):
                    item = database.RubricItem(
                        rubric_id=rubric.id,
                        question_type=q_type,
                        marks=config.get("marks_each", 1),
                        count=config.get("count", 0),
                        difficulty=config.get("difficulty", "medium")
                    )
                    db.add(item)
            db.commit()

        return {
            "id": str(rubric.id),
            "title": rubric.title,
            "name": rubric.name,
            "subjectId": str(rubric.subject_id),
            "examType": rubric.exam_type,
            "duration": rubric.duration,
            "totalMarks": rubric.total_marks,
            "sections": json.loads(rubric.sections) if rubric.sections else {},
            "difficultyDistribution": json.loads(rubric.difficulty_distribution) if rubric.difficulty_distribution else {},
            "coRequirements": json.loads(rubric.co_requirements) if rubric.co_requirements else [],
            "coDistribution": json.loads(rubric.co_distribution) if rubric.co_distribution else {},
            "loDistribution": json.loads(rubric.lo_distribution) if rubric.lo_distribution else {},
            "unitsCovered": json.loads(rubric.units_covered) if rubric.units_covered else [],
            "status": rubric.status,
            "createdAt": rubric.created_at.isoformat() if rubric.created_at else None,
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/presets/{exam_type}")
async def get_exam_preset(exam_type: str):
    """Get default preset for exam type for frontend to display"""
    return rubric_service.get_preset(exam_type)

@router.post("/{rubric_id}/generate-exam")
async def generate_exam(
    rubric_id: str,
    db: Session = Depends(get_db)
):
    """
    Trigger generation of full exam based on rubric configuration.
    Runs asynchronously.
    """
    from ...services.generation_manager import generation_manager
    
    try:
        batch_id = await generation_manager.start_rubric_generation(rubric_id, db)
        return {"batch_id": batch_id, "status": "queued", "message": "Exam generation started"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/generation-status/{batch_id}")
async def get_generation_status(batch_id: str):
    """Check status of generation batch"""
    from ...services.generation_manager import generation_manager
    return generation_manager.get_status(batch_id)

@router.get("/{rubric_id}/latest-batch")
async def get_latest_batch(rubric_id: str, db: Session = Depends(get_db)):
    """Get the latest generated batch for a rubric"""
    batch = db.query(database.GeneratedBatch).filter(
        database.GeneratedBatch.rubric_id == rubric_id
    ).order_by(database.GeneratedBatch.generated_at.desc()).first()
    
    if not batch:
        raise HTTPException(status_code=404, detail="No generation found for this rubric")
        
    return {"batch_id": batch.id}
