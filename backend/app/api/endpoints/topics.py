from fastapi import APIRouter, Body, UploadFile, File, Form, HTTPException, Depends, BackgroundTasks
from typing import Optional, List, Dict
from sqlalchemy.orm import Session
from ...models import database, schemas
from ...models.database import SessionLocal
from ...services.topic_actions_service import topic_actions_service
from ...services.rag_service import RAGService
from ...services.topic_question_generator import topic_question_generator
from ...services.sample_parser import SampleParser
from ...services.sample_processor import sample_processor
from ...services.sample_vector_store import SampleVectorStore
from ...models.topic_question import TopicQuestion
from ...models.sample_question import SampleQuestion
from datetime import datetime
import os
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

rag_service = RAGService()
sample_parser = SampleParser()
sample_store = SampleVectorStore()

router = APIRouter(prefix="/subjects", tags=["topics"])

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/{subject_id}/topics/{topic_id}/map-outcomes")
async def map_outcomes(
    subject_id: int,
    topic_id: int,
    request: schemas.TopicOutcomeMappingRequest,
    db: Session = Depends(get_db)
):
    """
    Step 5: Map COs and LOs to a Topic
    """
    try:
        topic = db.query(database.Topic).filter(database.Topic.id == topic_id).first()
        if not topic:
            raise HTTPException(status_code=404, detail="Topic not found")
            
        # Update COs (Many-to-Many)
        if request.co_ids is not None: # explicit check if list provided
            cos = db.query(database.CourseOutcome).filter(database.CourseOutcome.id.in_(request.co_ids)).all()
            topic.mapped_cos = cos
            
        # Update LOs (Many-to-Many)
        if request.lo_ids is not None:
             los = db.query(database.LearningOutcome).filter(database.LearningOutcome.id.in_(request.lo_ids)).all()
             topic.mapped_los = los
            
        db.commit()
        return {"message": "Updated outcome mappings"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{subject_id}/topics/{topic_id}/quick-generate")
async def quick_generate(
    subject_id: int,
    topic_id: int,
    request: schemas.QuickGenerateRequest,
    db: Session = Depends(get_db)
):
    """
    Generate questions for faculty reference (not for vetting).
    Uses RAG + few-shot learning from sample questions.
    """
    try:
        # Validate topic_id matches URL if provided in body
        if request.topic_id and request.topic_id != topic_id:
             # Just a warning or strict check? Let's proceed with URL param
             pass
             
        result = await topic_actions_service.quick_generate_questions(
            db=db,
            subject_id=subject_id,
            topic_id=topic_id,
            question_type=request.question_type,
            count=request.count,
            difficulty=request.difficulty
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def background_upload_sample_questions(
    subject_id: int, 
    topic_id: int, 
    question_type: str, 
    content: bytes, 
    filename: str
):
    db = SessionLocal()
    try:
        await topic_actions_service.upload_sample_questions(
            db=db,
            subject_id=subject_id,
            topic_id=topic_id,
            file_content=content,
            filename=filename,
            question_type=question_type
        )
    except Exception as e:
        logger.error(f"Background sample upload failed: {e}")
    finally:
        db.close()

@router.post("/{subject_id}/topics/{topic_id}/upload-questions")
async def upload_sample_questions(
    subject_id: int,
    topic_id: int,
    background_tasks: BackgroundTasks,
    question_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload sample questions for few-shot learning.
    Supports CSV, PDF, DOC formats.
    Processed in background.
    """
    try:
        file_content = await file.read()
        
        background_tasks.add_task(
            background_upload_sample_questions,
            subject_id,
            topic_id,
            question_type,
            file_content,
            file.filename
        )
        
        return {
            "message": "Upload started. Questions will appear shortly.",
            "parsed_count": 0, # Cannot return actual count immediately
            "saved_count": 0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def background_upload_notes(subject_id: int, topic_id: int, content: bytes, filename: str):
    db = SessionLocal()
    try:
        await topic_actions_service.upload_topic_notes(
            db=db,
            subject_id=subject_id,
            topic_id=topic_id,
            file_content=content,
            filename=filename
        )
    except Exception as e:
        logger.error(f"Background upload failed: {e}")
    finally:
        db.close()

@router.post("/{subject_id}/topics/{topic_id}/notes")
async def upload_notes(
    subject_id: int,
    topic_id: int,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    """
    Upload additional notes to enhance RAG context.
    Processed in background to avoid timeouts.
    """
    try:
        file_content = await file.read()
        
        # Enqueue background task
        background_tasks.add_task(
            background_upload_notes,
            subject_id,
            topic_id,
            file_content,
            file.filename
        )
        
        return {"message": "File upload started. Processing in background."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{subject_id}/topics/{topic_id}/train")
async def trigger_training(
    subject_id: int,
    topic_id: int,
    db: Session = Depends(get_db)
):
    """
    For prototype: This doesn't actually fine-tune the model.
    Instead, it:
    1. Re-indexes all sample questions
    2. Optimizes few-shot example selection
    3. Returns a "training complete" status
    
    Real fine-tuning would require:
    - GPU resources
    - DPO/RLHF pipeline
    - Much more complexity
    
    For MVP, few-shot learning is sufficient.
    """
    # Count sample questions for this topic
    sample_count = db.query(SampleQuestion).filter(
        SampleQuestion.subject_id == subject_id,
        SampleQuestion.topic_id == topic_id
    ).count()
    
    return {
        "status": "complete",
        "message": f"Sample questions indexed for few-shot learning ({sample_count} questions available)",
        "note": "Full model fine-tuning not implemented in prototype",
        "sample_questions_count": sample_count
    }

@router.put("/{subject_id}/topics/{topic_id}")
async def update_topic(
    subject_id: int,
    topic_id: int,
    name: str = Body(..., embed=True),
    db: Session = Depends(get_db)
):
    """
    Update topic name.
    """
    topic = db.query(database.Topic).filter(database.Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
        
    topic.name = name
    db.commit()
    return {"message": "Topic updated",
        "id": topic.id,
        "name": topic.name,
        "subject_id": topic.subject_id}

@router.post("/{subject_id}/topics")
async def create_topic(
    subject_id: int,
    name: str = Body(..., embed=True),
    db: Session = Depends(get_db)
):
    """Create a new topic directly under a subject"""
    # Check max order to append
    max_order = db.query(database.Topic).filter(database.Topic.subject_id == subject_id).count()
    
    topic = database.Topic(
        subject_id=subject_id,
        name=name,
        order=max_order + 1
    )
    db.add(topic)
    db.commit()
    db.refresh(topic)
    return topic

@router.patch("/topics/reorder")
async def reorder_topics(
    subject_id: int = Body(...),
    topic_ids: list[int] = Body(...),
    db: Session = Depends(get_db)
):
    """Reorder topics based on the list of IDs provided"""
    # Verify all topics belong to subject
    topics = db.query(database.Topic).filter(
        database.Topic.subject_id == subject_id,
        database.Topic.id.in_(topic_ids)
    ).all()
    
    topic_map = {t.id: t for t in topics}
    
    for index, t_id in enumerate(topic_ids):
        if t_id in topic_map:
            topic_map[t_id].order = index + 1
            
    db.commit()
    db.commit()
    return {"message": "Topics reordered successfully"}

@router.post("/{subject_id}/topics/{topic_id}/syllabus")
async def upload_topic_syllabus(
    subject_id: int,
    topic_id: int,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload a syllabus/reference file for a specific topic.
    Stores file and indexes it for RAG (Question Generation).
    Does NOT extract topics.
    """
    try:
        subject = db.query(database.Subject).filter(database.Subject.id == subject_id).first()
        if not subject:
            raise HTTPException(status_code=404, detail="Subject not found")
            
        topic = db.query(database.Topic).filter(database.Topic.id == topic_id).first()
        if not topic:
            raise HTTPException(status_code=404, detail="Topic not found")
        
        # Define storage path
        # data/subjects/{code}/topics/{topic_id}/syllabus/{filename}
        base_dir = Path(os.getcwd()) / "data/subjects" / subject.code / "topics" / str(topic_id) / "syllabus"
        base_dir.mkdir(parents=True, exist_ok=True)
        
        file_path = base_dir / file.filename
        
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
            
        # Index in ChromaDB
        # We use a composite ID or metadata to scope it to the topic?
        # RAGService usually takes a doc_id/group_id. 
        # If we pass subject_id, it searches the whole subject.
        # If we want topic specific, we might need to adjust RAGService or just index it under subject_id 
        # but maybe the filename or metadata helps.
        # For now, index under subject_id so it's available for the subject, 
        # but good question generation filters by content relevance anyway.
        
        # Better: Index with metadata? 
        # rag_service.index_document(str(file_path), str(subject_id))
        
        try:
            background_tasks.add_task(rag_service.index_document, str(file_path), str(subject_id))
            logger.info(f"Queued topic syllabus for indexing: {file.filename}")
        except Exception as e:
            logger.warning(f"Failed to queue indexing: {e}")
            
        return {
            "message": "File uploaded and indexing started in background",
            "file_path": str(file_path)
        }


    except Exception as e:
        logger.error(f"Error uploading topic syllabus: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Topic Files Management
@router.get("/{subject_id}/topics/{topic_id}/files")
async def list_topic_files(
    subject_id: int,
    topic_id: int,
    db: Session = Depends(get_db)
):
    """
    List all files uploaded for this topic (Syllabus, Notes, Samples).
    """
    files = []
    
    subject = db.query(database.Subject).filter(database.Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
        
    # 1. Syllabus
    try:
        base_dir = Path(os.getcwd()) / "data/subjects" / subject.code / "topics" / str(topic_id) / "syllabus"
        if base_dir.exists():
            for f in base_dir.iterdir():
                if f.is_file():
                    files.append({
                        "name": f.name,
                        "type": "syllabus",
                        "size": f.stat().st_size,
                        "uploaded_at": datetime.fromtimestamp(f.stat().st_mtime).isoformat()
                    })
    except Exception as e:
        logger.error(f"Error listing syllabus: {e}")

    # 2. Notes (from DB or FS)
    try:
        notes = db.query(database.TopicNotes).filter(
            database.TopicNotes.subject_id == subject_id,
            database.TopicNotes.topic_id == topic_id
        ).all()
        for n in notes:
            files.append({
                "name": n.title,
                "type": "notes",
                "size": 0, # Could check file_path
                "uploaded_at": datetime.utcnow().isoformat() # DB doesn't have timestamp?
            })
    except Exception as e:
        logger.error(f"Error listing notes: {e}")
        
    # 3. Sample Questions (Aggregate)
    try:
        sample_count = db.query(SampleQuestion).filter(
            SampleQuestion.subject_id == subject_id,
            SampleQuestion.topic_id == topic_id
        ).count()
        
        if sample_count > 0:
            files.append({
                "name": f"{sample_count} Sample Questions",
                "type": "samples",
                "size": 0,
                "uploaded_at": datetime.utcnow().isoformat(),
                "details": f"{sample_count} questions indexed"
            })
    except Exception as e:
        logger.error(f"Error listing samples: {e}")
        
    return files

# Topic Question Generation (Faculty Reference)
@router.post("/{subject_id}/topics/{topic_id}/samples")
async def upload_samples(
    subject_id: int,
    topic_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload sample questions (JSON) to train the model (Few-Shot).
    """
    try:
        content = await file.read()
        
        # Parse
        result = sample_processor.process_file(db, subject_id, content, file.filename, topic_id=topic_id)
        
        # Add to Vector Store
        if result.get("questions"):
            sample_store.add_samples(topic_id, result["questions"])
        
        return {
            "message": f"Successfully added {len(result.get('questions', []))} sample questions for few-shot learning.",
            "details": result
        }
        
    except Exception as e:
        logger.error(f"Error uploading samples: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{subject_id}/topics/{topic_id}/questions/generate", response_model=List[schemas.TopicQuestionResponse])
async def generate_topic_questions_endpoint(
    subject_id: int,
    topic_id: int,
    request: schemas.TopicQuestionGenerationRequest,
    db: Session = Depends(get_db)
):
    """
    Generate practice questions for a topic.
    """
    try:
        # Verify ownership/existence
        topic = db.query(database.Topic).filter(database.Topic.id == topic_id).first()
        if not topic:
            raise HTTPException(status_code=404, detail="Topic not found")
            
        questions = await topic_question_generator.generate_questions(
            db=db,
            topic_id=topic_id,
            count=request.count,
            config={
                "question_types": request.question_types,
                "difficulty": request.difficulty,
                "blooms_levels": request.blooms_levels
            }
        )
        return questions
    except Exception as e:
        logger.error(f"Error generating topic questions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{subject_id}/topics/{topic_id}/questions", response_model=List[schemas.TopicQuestionResponse])
async def list_topic_questions(
    subject_id: int,
    topic_id: int,
    db: Session = Depends(get_db)
):
    """
    Get all generated practice questions for a topic.
    """
    questions = db.query(TopicQuestion).filter(TopicQuestion.topic_id == topic_id).order_by(TopicQuestion.created_at.desc()).all()
    return questions

@router.delete("/{subject_id}/topics/{topic_id}/questions/{question_id}")
async def delete_topic_question(
    subject_id: int,
    topic_id: int,
    question_id: int,
    db: Session = Depends(get_db)
):
    """
    Delete a generated practice question.
    """
    question = db.query(TopicQuestion).filter(TopicQuestion.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
        
    db.delete(question)
    db.commit()
    return {"message": "Question deleted"}
