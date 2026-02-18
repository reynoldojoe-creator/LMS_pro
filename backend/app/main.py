from fastapi import FastAPI, UploadFile, File, HTTPException, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from .services.rag_service import RAGService
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from .models import database, schemas
from .services.question_generator import QuestionGenerator
from .services.question_validator import QuestionValidator
from .api.endpoints import subjects, topics, rubrics, vetting, reports, training, upload, outcomes
import shutil
import os
import uuid
import json
import logging
import asyncio
from datetime import datetime
from .models import rubric_models # Ensure tables are created

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="LMS-SIMATS RAG API", version="0.1.0")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(subjects.router)
app.include_router(topics.router)
app.include_router(rubrics.router)
app.include_router(vetting.router)
app.include_router(reports.router)
app.include_router(training.router)
app.include_router(upload.router)
app.include_router(outcomes.router)

# Initialize Services
rag_service = RAGService()
question_generator = QuestionGenerator()
question_validator = QuestionValidator()

# Ensure temp directory exists
UPLOAD_DIR = "backend/data/temp_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

from .api.deps import get_db

# --- Auth ---

@app.post("/auth/login", response_model=Dict[str, Any])
async def login_endpoint(
    username: str = Form(...), 
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    try:
        user = db.query(database.User).filter(database.User.reg_no == username).first()
        
        if not user or user.password_hash != password:
            # Fallback for dev/test if DB not properly seeded or reset
            if username == "123456" and password == "demo123":
                 return {
                    "access_token": "fake-jwt-token-test",
                    "token_type": "bearer",
                    "user": {
                        "id": "0",
                        "regNo": "123456",
                        "name": "Demo Faculty",
                        "roles": ["faculty", "vetter"]
                    }
                }
            raise HTTPException(status_code=401, detail="Invalid credentials. Try 123456 / demo123")
        
        roles = json.loads(user.roles)
        
        return {
            "access_token": f"fake-jwt-token-{user.id}",
            "token_type": "bearer",
            "user": {
                "id": str(user.id),
                "regNo": user.reg_no,
                "name": user.name,
                "roles": roles
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/auth/logout")
async def logout():
    return {"message": "Logged out"}

@app.on_event("startup")
def startup():
    database.init_db()
    
    # Seed default user
    db = database.SessionLocal()
    try:
        user = db.query(database.User).filter(database.User.reg_no == "123456").first()
        if not user:
            default_user = database.User(
                reg_no="123456",
                name="Demo Faculty",
                password_hash="demo123", 
                roles=json.dumps(["faculty", "vetter"])
            )
            db.add(default_user)
            db.commit()
            logger.info("Seeded default user: 123456")
    except Exception as e:
        logger.error(f"Seeding error: {e}")
    finally:
        db.close()

@app.get("/")
async def root():
    return {"status": "healthy", "service": "LMS-SIMATS API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    # Helper to check Ollama
    async def check_ollama_connection():
        try:
            # Simple ping to Ollama (implementation depends on client, assuming rag_service has check)
            # For now, just checking if we can init the service
            return True 
        except:
            return False

    # Helper to check ChromaDB
    def check_chroma_connection():
        try:
            # rag_service.chroma_client.heartbeat() # Example
            return True
        except:
            return False

    ollama_status = await check_ollama_connection()
    chroma_status = check_chroma_connection()
    
    return {
        "status": "healthy" if all([ollama_status, chroma_status]) else "degraded",
        "components": {
            "api": True,
            "ollama": ollama_status,
            "chromadb": chroma_status,
            "database": True,
        }
    }

 

# --- Rubrics ---

@app.get("/rubrics")
async def list_rubrics(db: Session = Depends(get_db)):
    rubrics = db.query(database.Rubric).order_by(database.Rubric.created_at.desc()).all()
    result = []
    for r in rubrics:
        subject = db.query(database.Subject).filter(database.Subject.id == r.subject_id).first()
        result.append({
            "id": str(r.id),
            "subjectId": str(r.subject_id),
            "subjectName": subject.name if subject else "Unknown Subject",
            "examType": r.exam_type,
            "title": r.title,
            "duration": r.duration,
            "totalMarks": r.total_marks,
            "sections": json.loads(r.sections) if r.sections else [],
            "bloomDistribution": json.loads(r.bloom_distribution) if r.bloom_distribution else {},
            "difficultyDistribution": json.loads(r.difficulty_distribution) if r.difficulty_distribution else {},
            "coRequirements": json.loads(r.co_requirements) if r.co_requirements else [],
            "unitsCovered": json.loads(r.units_covered) if r.units_covered else [],
            "status": r.status,
            "createdAt": r.created_at.isoformat() if r.created_at else None,
            "generatedAt": r.generated_at.isoformat() if r.generated_at else None,
        })
    return result


# POST /rubrics is handled by app/api/endpoints/rubrics.py (included via rubrics.router)


@app.get("/rubrics/{rubric_id}")
async def get_rubric(rubric_id: int, db: Session = Depends(get_db)):
    rubric = db.query(database.Rubric).filter(database.Rubric.id == rubric_id).first()
    if not rubric:
        raise HTTPException(status_code=404, detail="Rubric not found")
    
    return {
        "id": str(rubric.id),
        "subjectId": str(rubric.subject_id),
        "examType": rubric.exam_type,
        "title": rubric.title,
        "duration": rubric.duration,
        "totalMarks": rubric.total_marks,
        "sections": json.loads(rubric.sections) if rubric.sections else [],
        "bloomDistribution": json.loads(rubric.bloom_distribution) if rubric.bloom_distribution else {},
        "difficultyDistribution": json.loads(rubric.difficulty_distribution) if rubric.difficulty_distribution else {},
        "coRequirements": json.loads(rubric.co_requirements) if rubric.co_requirements else [],
        "unitsCovered": json.loads(rubric.units_covered) if rubric.units_covered else [],
        "status": rubric.status,
        "createdAt": rubric.created_at.isoformat() if rubric.created_at else None,
        "generatedAt": rubric.generated_at.isoformat() if rubric.generated_at else None,
    }

@app.delete("/rubrics/{rubric_id}")
async def delete_rubric(rubric_id: int, db: Session = Depends(get_db)):
    rubric = db.query(database.Rubric).filter(database.Rubric.id == rubric_id).first()
    if not rubric:
        raise HTTPException(status_code=404, detail="Rubric not found")
    db.delete(rubric)
    db.commit()
    return {"message": "Rubric deleted"}

# --- Question Generation ---

from .services.generation_manager import generation_manager

@app.post("/generate/async", response_model=schemas.GenerationStatusResponse) # New async endpoint
async def generate_questions_async(request: schemas.GenerateQuestionRequest, db: Session = Depends(get_db)):
    batch_id = await generation_manager.start_generation(request, db)
    return {
        "batch_id": batch_id,
        "status": "queued",
        "progress": 0,
        "questions_generated": 0,
        "questions_validated": 0
    }

@app.get("/generate/{batch_id}/status", response_model=schemas.GenerationStatusResponse)
async def get_generation_status(batch_id: str):
    status = generation_manager.get_status(batch_id)
    if "error" in status and status["error"] == "Batch not found":
        raise HTTPException(status_code=404, detail="Batch not found")
    
    return {
        "batch_id": batch_id,
        **status
    }

@app.post("/generate/questions", response_model=Dict[str, Any])
async def generate_questions(request: schemas.GenerateQuestionRequest, db: Session = Depends(get_db)):
    # Keep existing sync endpoint for backward compatibility or direct usage
    try:
        subject = db.query(database.Subject).filter(database.Subject.id == request.subject_id).first()
        if not subject:
            raise HTTPException(status_code=404, detail="Subject not found")

        # 1. Generate
        topic_name = ""
        if request.topic_id:
             topic = db.query(database.Topic).filter(database.Topic.id == request.topic_id).first()
             if topic: topic_name = topic.name
        else:
            # Pick a random topic from the subject's units for better RAG retrieval
            topics = db.query(database.Topic).filter(
                database.Topic.subject_id == request.subject_id
            ).all()
            if topics:
                import random
                selected = random.choice(topics)
                topic_name = selected.name
                logger.info(f"Auto-selected topic: {topic_name}")
            else:
                # Fallback to subject name as query
                topic_name = subject.name
                logger.info(f"No topics found, using subject name: {topic_name}")
        
        gen_result = await question_generator.generate_questions(
            subject_name=subject.name,
            subject_id=str(subject.id),
            topic=topic_name,
            question_type=request.question_type,
            bloom_level=request.bloom_level,
            difficulty=request.difficulty,
            db=db, # Pass DB session for skill retrieval
            count=request.count,
            co=request.co_id or "N/A",
            lo=request.lo_id or "N/A",
            marks=1
        )
        
        generated_questions = gen_result.get("questions", [])
        saved_questions = []

        # 2. Validate & Save
        for q_data in generated_questions:
            context = [] 
            existing_texts = [] 

            val_result = question_validator.validate_question(q_data, context, existing_texts)
            
            new_q = database.Question(
                subject_id=subject.id,
                topic_id=request.topic_id,
                question_text=q_data.get("question_text"),
                question_type=request.question_type,
                options=json.dumps(q_data.get("options")) if q_data.get("options") else None,
                correct_answer=q_data.get("correct_answer"),
                bloom_level=q_data.get("bloom_level"),
                difficulty=q_data.get("difficulty"),
                marks=q_data.get("marks", 1),
                co_id=q_data.get("mapped_co"),
                lo_id=q_data.get("mapped_lo"),
                rubric_id=request.rubric_id,
                status="pending" if val_result["status"] == "success" else "rejected",
                rejection_reason=val_result.get("reason"),
                validation_score=int(val_result.get("llm_evaluation", {}).get("overall_score", 0))
            )

            db.add(new_q)
            db.commit()
            db.refresh(new_q)
            
            q_data["id"] = new_q.id
            q_data["validation"] = val_result
            saved_questions.append(q_data)

        # Update Rubric status if rubric_id provided (once, after all questions saved)
        if request.rubric_id:
            rubric = db.query(database.Rubric).filter(database.Rubric.id == request.rubric_id).first()
            if rubric:
                rubric.status = "generated"
                rubric.generated_at = datetime.utcnow()
                db.commit()

        return {"generated": saved_questions, "count": len(saved_questions)}

    except Exception as e:
        logger.error(f"Error generating questions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- Question Management ---

@app.get("/questions", response_model=List[schemas.QuestionSchema])
async def list_questions(
    subject_id: Optional[int] = None, 
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(database.Question)
    if subject_id:
        query = query.filter(database.Question.subject_id == subject_id)
    if status:
        query = query.filter(database.Question.status == status)
    
    questions = query.all()
    
    results = []
    for q in questions:
        q_dict = q.__dict__.copy()
        if q.options:
            try:
                q_dict["options"] = json.loads(q.options)
            except:
                q_dict["options"] = {}
        results.append(schemas.QuestionSchema(**q_dict))
        
    return results

@app.post("/vetting/{question_id}/{action}")
async def vet_question(
    question_id: int, 
    action: str, 
    request: schemas.VettingActionRequest,
    db: Session = Depends(get_db)
):
    q = db.query(database.Question).filter(database.Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
        
    if action == "approve":
        q.status = "approved"
    elif action == "reject":
        q.status = "rejected"
        q.rejection_reason = request.reason
    elif action == "quarantine":
        q.status = "quarantined"
        q.rejection_reason = request.notes
    else:
        raise HTTPException(status_code=400, detail="Invalid action")
        
    db.commit()
    return {"message": f"Question {question_id} {action}d successfully"}



# --- Vetting ---
# Endpoints handled by app.include_router(vetting.router)
# See backend/app/api/endpoints/vetting.py


# --- Reports ---

@app.get("/reports/vetter")
async def get_vetter_reports(db: Session = Depends(get_db)):
    # Calculate stats matching frontend VetterStats interface
    
    total_approved = db.query(database.Question).filter(database.Question.status == "approved").count()
    total_rejected = db.query(database.Question).filter(database.Question.status == "rejected").count()
    total_quarantined = db.query(database.Question).filter(database.Question.status == "quarantined").count()
    
    total_reviewed = total_approved + total_rejected + total_quarantined
    
    approval_rate = 0
    if total_reviewed > 0:
        approval_rate = (total_approved / total_reviewed) * 100
        
    # Group rejection reasons
    rejection_reasons = {}
    reasons_query = db.query(
        database.Question.rejection_reason,
        func.count(database.Question.id)
    ).filter(
        database.Question.status == "rejected",
        database.Question.rejection_reason.isnot(None)
    ).group_by(database.Question.rejection_reason).all()
    
    for reason, count in reasons_query:
        if reason:
            rejection_reasons[reason] = count
            
    return {
        "totalReviewedThisWeek": total_reviewed, # Mocking as total since no timestamps
        "totalReviewedThisMonth": total_reviewed,
        "approvalRate": approval_rate,
        "averageTimePerQuestion": 120, # Mock 2 mins
        "rejectionReasons": rejection_reasons
    }

@app.get("/reports/faculty")
async def get_faculty_reports(db: Session = Depends(get_db)):
    # Mock data for dashboard stats
    # In real app, calculate from DB
    
    total_subjects = db.query(database.Subject).count()
    total_questions = db.query(database.Question).count()
    pending_review = db.query(database.Question).filter(database.Question.status == "pending").count()
    
    return {
        "activeSubjects": total_subjects,
        "totalSubjects": total_subjects,
        "totalQuestions": total_questions,
        "pendingReview": pending_review
    }

@app.get("/reports/activity")
async def get_activity_reports():
    # Mock activity log
    return [
        {
            "id": "1",
            "type": "subject",
            "description": "Created new subject: Software Engineering",
            "timestamp": datetime.now().isoformat()
        },
        {
            "id": "2",
            "type": "generate",
            "description": "Generated 5 questions for Unit 1",
            "timestamp": datetime.now().isoformat()
        }
    ]
