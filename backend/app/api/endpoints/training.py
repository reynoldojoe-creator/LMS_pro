from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Dict, Any
import uuid
import asyncio
import random
from datetime import datetime
from ...models import database
from ...models import database

router = APIRouter(
    prefix="/training",
    tags=["training"]
)

# In-memory job store (replace with Redis/Celery for production)
training_jobs = {}

from ...services.upskill_integration import LMSUpskillService
from ...models import database
from ...api.deps import get_db

# ...

async def run_training_job(job_id: str, topic_id: int, db_session_factory):
    """
    Runs the actual Upskill training process in background.
    """
    training_jobs[job_id]["status"] = "running"
    training_jobs[job_id]["progress"] = 10
    
    db = db_session_factory()
    try:
        # A. Fetch Data
        topic = db.query(database.Topic).filter(database.Topic.id == topic_id).first()
        if not topic:
            raise Exception("Topic not found during training")
            
        sample_questions = db.query(database.SampleQuestion).filter(database.SampleQuestion.topic_id == topic_id).all()
        notes = db.query(database.TopicNotes).filter(database.TopicNotes.topic_id == topic_id).all()
        
        # Get COs and LOs
        # (Assuming topic.mapped_cos and topic.mapped_los are populated via relationships)
        # Note: relationships might need separate query if lazy loaded in new session
        # We'll fetch them explicitly to be safe
        
        # Re-query with eager loading or just query relationships
        # For Simplicity:
        cos = [f"{co.code}: {co.description}" for co in topic.mapped_cos]
        los = [f"{lo.code}: {lo.description}" for lo in topic.mapped_los]
        
        training_jobs[job_id]["progress"] = 20
        training_jobs[job_id]["current_step"] = "Formatting data..."
        
        # B. Prepare Service
        service = LMSUpskillService()
        
        # Convert notes to text
        # Assuming notes have 'file_path', we might need to read the file.
        # For now, let's assume 'content' isn't directly on TopicNotes model (it has file_path).
        # We'll skip reading real files for this demo step and use a placeholder or read if generic.
        # Impl: just use "Notes available in " + file_path
        notes_content = "\n".join([f"Note: {n.title} ({n.file_path})" for n in notes])
        
        # Convert samples
        samples_formatted = []
        for q in sample_questions:
            opts = []
            try:
                if q.options:
                    opts = json.loads(q.options)
            except: 
                pass
                
            samples_formatted.append({
                "type": q.question_type,
                "content": q.question_text,
                "options": opts,
                "topic_hint": topic.name
            })
            
        training_jobs[job_id]["progress"] = 30
        training_jobs[job_id]["current_step"] = "Training skill model..."
        
        # C. Run Training
        result = await service.train_topic_skill(
            subject_id=topic.subject_id,
            topic_id=topic.id,
            topic_name=topic.name,
            sample_questions=samples_formatted,
            notes_content=notes_content,
            co_descriptions=cos,
            lo_descriptions=los
        )
        
        training_jobs[job_id]["progress"] = 90
        training_jobs[job_id]["current_step"] = "Saving results..."
        
        # D. Save Results
        topic.has_custom_skill = 1
        
        # Check/Create TopicSkill
        skill = db.query(database.TopicSkill).filter(database.TopicSkill.topic_id == topic_id).first()
        if not skill:
            skill = database.TopicSkill(
                topic_id=topic_id,
                skill_path=result['skill_path'],
                baseline_pass_rate=result['baseline_pass_rate'],
                skill_pass_rate=result['skill_pass_rate'],
                training_data_count=len(samples_formatted)
            )
            db.add(skill)
        else:
            skill.skill_path = result['skill_path']
            skill.baseline_pass_rate = result['baseline_pass_rate']
            skill.skill_pass_rate = result['skill_pass_rate']
            skill.last_trained_at = datetime.utcnow()
            skill.training_data_count = len(samples_formatted)
            
        db.commit()
        
        training_jobs[job_id]["status"] = "completed"
        training_jobs[job_id]["progress"] = 100
        training_jobs[job_id]["result"] = result
        
    except Exception as e:
        training_jobs[job_id]["status"] = "failed"
        training_jobs[job_id]["error"] = str(e)
        print(f"Training job failed: {e}")
    finally:
        db.close()

@router.post("/topics/{topic_id}/train-model")
async def train_model(
    topic_id: int, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    topic = db.query(database.Topic).filter(database.Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
        
    job_id = str(uuid.uuid4())
    training_jobs[job_id] = {
        "id": job_id,
        "topic_id": topic_id,
        "status": "pending",
        "progress": 0,
        "created_at": datetime.utcnow()
    }
    
    background_tasks.add_task(run_training_job, job_id, topic_id, database.SessionLocal)
    
    return {"job_id": job_id, "status": "pending"}

@router.get("/status/{job_id}")
async def get_training_status(job_id: str):
    job = training_jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job
