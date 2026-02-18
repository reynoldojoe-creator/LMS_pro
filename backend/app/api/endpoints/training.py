from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Body
from sqlalchemy.orm import Session
from typing import Dict, Any, List
import uuid
import asyncio
import random
import json
import os
from datetime import datetime
from pydantic import BaseModel
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

async def run_training_job(job_id: str, topic_id: int, db_session_factory, job_meta: dict = None):
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
            
        if job_meta and job_meta.get("sample_file_ids"):
            # Filter by specific sample files if provided
            # Ensure IDs are integers
            try:
                # Convert to int, ignoring non-digits
                sample_file_ids = [int(sid) for sid in job_meta["sample_file_ids"] if str(sid).isdigit()]
            except:
                sample_file_ids = []

            sample_questions = db.query(database.SampleQuestion).filter(
                database.SampleQuestion.topic_id == topic_id,
                database.SampleQuestion.id.in_(sample_file_ids)
            ).all()
        else:
            # Default: use all
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



class TrainRequest(BaseModel):
    sample_file_ids: List[int] = []

@router.post("/topics/{topic_id}/train-model")
async def train_model(
    topic_id: int,
    request: TrainRequest,
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
    
    # Pass metadata to job
    job_meta = {"sample_file_ids": request.sample_file_ids}
    
    # Run in background via sync wrapper to ensure event loop handling
    background_tasks.add_task(_run_training_sync, job_id, topic_id, database.SessionLocal, job_meta)
    
    return {"job_id": job_id, "status": "pending"}

def _run_training_sync(job_id, topic_id, session_factory, job_meta):
    """
    Wrapper to run async training job in background task
    """
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(run_training_job(job_id, topic_id, session_factory, job_meta))
    finally:
        loop.close()

@router.get("/topics/{topic_id}/sample-files")
async def get_sample_files(topic_id: int, db: Session = Depends(get_db)):
    """Get list of sample files uploaded for this topic"""
    # Group by file_path or just list distinct uploads
    # Since SampleQuestion has 'file_path' and 'uploaded_at', we can group by them.
    # But for simplicity, we can return individual 'batches' if we had a batch ID.
    # We don't have a batch ID on SampleQuestion table shown in previous steps.
    # We have 'file_path'. Let's group by that.
    
    questions = db.query(database.SampleQuestion.file_path, database.SampleQuestion.uploaded_at, database.SampleQuestion.id).filter(
        database.SampleQuestion.topic_id == topic_id
    ).all()
    
    # Group in python
    files_map = {}
    for q in questions:
        path = q.file_path or "Manual Entry"
        if path not in files_map:
            files_map[path] = {
                "id": path, # Use path as ID for grouping? No, we need question IDs.
                "name": os.path.basename(path),
                "uploaded_at": q.uploaded_at,
                "count": 0,
                "question_ids": []
            }
        files_map[path]["count"] += 1
        files_map[path]["question_ids"].append(q.id)
        
    return list(files_map.values())

@router.get("/status/{job_id}")
async def get_training_status(job_id: str):
    job = training_jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job
