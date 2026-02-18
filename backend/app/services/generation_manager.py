import asyncio
from uuid import uuid4
from typing import Dict, Any, Optional, List
import json
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from ..models import schemas, database

# Configure logging
logger = logging.getLogger(__name__)

# In-memory status tracking (use Redis in production)
generation_status = {}

class GenerationManager:
    def __init__(self):
        # Restriction for 8GB RAM: Only one generation process at a time
        self._concurrency_lock = asyncio.Semaphore(1)

    async def start_quick_generation(self, params: schemas.QuickGenerateRequest, db: Session) -> str:
        """
        Starts a quick generation task. 
        Questions are marked as is_reference=True and NOT sent to vetting.
        """
        batch_id = str(uuid4())
        self._init_status(batch_id)
        
        gen_params = schemas.GenerateQuestionRequest(
            subject_id=params.subject_id,
            topic_id=params.topic_id,
            question_type=params.question_type,
            count=params.count,
            difficulty="medium"
        )
        
        # Use sequential wrapper
        asyncio.create_task(self._generate_batches_sequentially(batch_id, gen_params, db, is_reference=True))
        return batch_id

    async def start_rubric_generation(self, rubric_id: str, db: Session) -> str:
        """
        Starts a rubric-based generation task.
        Reads rubric config, generates questions for all sections using real LLM + RAG.
        Questions are saved to vetting queue.
        """
        batch_id = str(uuid4())
        self._init_status(batch_id)
        
        rubric = db.query(database.Rubric).filter(database.Rubric.id == rubric_id).first()
        if not rubric:
            generation_status[batch_id]["status"] = "failed"
            generation_status[batch_id]["error"] = "Rubric not found"
            return batch_id

        asyncio.create_task(self._generate_rubric_sequentially(batch_id, rubric, db))
        return batch_id

    def _init_status(self, batch_id: str):
        generation_status[batch_id] = {
            "status": "queued",
            "progress": 0,
            "questions_generated": 0,
            "result": None,
            "error": None,
        }

    async def _generate_batches_sequentially(self, batch_id: str, params: schemas.GenerateQuestionRequest, db: Session, is_reference: bool):
        async with self._concurrency_lock:
             await self._generate_batch(batch_id, params, db, is_reference)

    async def _generate_batch(self, batch_id: str, params: schemas.GenerateQuestionRequest, db: Session, is_reference: bool):
        """Generate a batch using TopicActionsService for real LLM generation."""
        session = database.SessionLocal()
        try:
            from ..services.topic_actions_service import topic_actions_service
            
            generation_status[batch_id]["status"] = "processing"
            
            result = await topic_actions_service.quick_generate_questions(
                db=session,
                subject_id=params.subject_id,
                topic_id=params.topic_id,
                question_type=params.question_type,
                count=params.count,
                difficulty=params.difficulty or "medium"
            )
            
            generated_ids = [q.id for q in result.get("questions", [])]
            
            generation_status[batch_id]["status"] = "completed"
            generation_status[batch_id]["questions_generated"] = len(generated_ids)
            generation_status[batch_id]["progress"] = 100
            generation_status[batch_id]["result"] = {
                "count": len(generated_ids),
                "question_ids": generated_ids
            }
            
        except Exception as e:
            generation_status[batch_id]["status"] = "failed"
            generation_status[batch_id]["error"] = str(e)
            logger.error(f"Generation Error: {e}", exc_info=True)
        finally:
            session.close()

    async def _generate_rubric_sequentially(self, batch_id: str, rubric: database.Rubric, db: Session):
        async with self._concurrency_lock:
            await self._generate_rubric_batch(batch_id, rubric, db)

    async def _generate_rubric_batch(self, batch_id: str, rubric: database.Rubric, db: Session):
        """
        Generate questions from rubric using real RAG + Ollama.
        1) Parse rubric sections for question types/counts
        2) Get all topics for the subject
        3) Generate real questions per section using TopicActionsService
        """
        session = database.SessionLocal()
        try:
            from ..services.topic_actions_service import topic_actions_service
            from ..models import vetting_models
            from ..models.database import GeneratedBatch
            
            # Re-fetch rubric in this session to ensure it's attached
            rubric_in_session = session.query(database.Rubric).filter(database.Rubric.id == rubric.id).first()
            if not rubric_in_session:
                raise ValueError("Rubric not found in session")

            
            generation_status[batch_id]["status"] = "processing"
            logger.info(f"Starting rubric generation for rubric {rubric.id}, subject {rubric.subject_id}")
            
            # 1) Parse sections (question distribution)
            sections_raw = rubric.sections
            if not sections_raw:
                raise ValueError("Rubric has no sections/question_distribution configured")
            
            sections = json.loads(sections_raw) if isinstance(sections_raw, str) else sections_raw
            logger.info(f"Parsed sections: {sections}")
            
            # Build generation tasks from sections
            # sections can be dict like {"mcq": {"count": 20, "marks_each": 2}, ...}
            # or array like [{"type": "mcq", "count": 20, ...}]
            gen_tasks = []
            if isinstance(sections, dict):
                for q_type, config in sections.items():
                    if isinstance(config, dict) and config.get("count", 0) > 0:
                        gen_tasks.append({
                            "question_type": self._normalize_question_type(q_type),
                            "count": config["count"],
                            "marks_each": config.get("marks_each", 1),
                        })
            elif isinstance(sections, list):
                for s in sections:
                    if s.get("count", 0) > 0:
                        gen_tasks.append({
                            "question_type": self._normalize_question_type(s.get("type", "mcq")),
                            "count": s["count"],
                            "marks_each": s.get("marks_each", s.get("marksEach", 1)),
                        })
            
            if not gen_tasks:
                raise ValueError("No valid question types found in rubric sections")
            
            total_questions = sum(t["count"] for t in gen_tasks)
            logger.info(f"Will generate {total_questions} questions across {len(gen_tasks)} types")
            
            # 2) Get all topics for this subject
            topics = (
                session.query(database.Topic)
                .filter(database.Topic.subject_id == rubric.subject_id)
                .all()
            )
            
            if not topics:
                logger.warning(f"No topics found for subject {rubric.subject_id}. Generating without topic context.")
            
            topic_ids = [t.id for t in topics] if topics else [None]
            logger.info(f"Found {len(topic_ids)} topics for subject {rubric.subject_id}")
            
            # 3) Create GeneratedBatch record
            batch = GeneratedBatch(
                id=batch_id,
                rubric_id=str(rubric.id),
                subject_id=rubric.subject_id,
                title=rubric.title,  # Populate title from Rubric
                generated_by="Faculty",
                total_questions=total_questions,
                pending_count=total_questions,
                status="in_progress"
            )
            session.add(batch)
            session.commit()
            
            # 4) Pre-retrieve RAG context from ALL topics combined
            from ..services.rag_service import RAGService
            rag_service = RAGService()
            
            # Build a combined query from all topic names for better retrieval
            all_topic_names = [t.name for t in topics]
            combined_query = "; ".join(all_topic_names)
            
            # Retrieve WITHOUT topic_id filter to get chunks from ALL topics
            all_topics_context = rag_service.retrieve_context(
                query_text=combined_query,
                subject_id=str(rubric.subject_id),
                n_results=15,  # More results since covering all topics
                topic_id=None   # NO filter — get chunks from ALL topics
            )
            
            # 5) Generate questions for each section type
            generated_ids = []
            current_count = 0
            topic_index = 0
            
            for task in gen_tasks:
                q_type = task["question_type"]
                count = task["count"]
                logger.info(f"Generating {count} {q_type} questions...")
                
                # Distribute across topics round-robin
                target_topic_id = topic_ids[topic_index % len(topic_ids)] if topic_ids else None
                topic_index += 1
                
                try:
                    result = await topic_actions_service.quick_generate_questions(
                        db=session,
                        subject_id=rubric.subject_id,
                        topic_id=target_topic_id,
                        question_type=q_type,
                        count=count,
                        difficulty=task.get("difficulty", "medium"),
                        pre_retrieved_context=all_topics_context  # Pass pre-retrieved context
                    )
                    
                    questions = result.get("questions", [])
                    
                    if not questions:
                        logger.warning(f"Generated 0 {q_type} questions. Skipping type.")
                        continue

                    # Process and save all generated questions
                    for q in questions:
                        # Update question with rubric/batch info
                        q.rubric_id = str(rubric.id)
                        q.batch_id = batch_id
                        q.is_reference = 0  # These go to vetting
                        q.status = "pending"
                        q.marks = task["marks_each"]
                        
                        generated_ids.append(q.id)
                        
                    # Commit the batch
                    session.commit()
                    
                    current_count += len(questions)
                    generation_status[batch_id]["questions_generated"] = current_count
                    generation_status[batch_id]["progress"] = int((current_count / total_questions) * 100)
                    
                    logger.info(f"Batch generated {len(questions)} {q_type} questions")
                    
                    # Yield control briefly
                    await asyncio.sleep(0.1)
                        
                except Exception as e:
                    logger.error(f"Error producing batch for {q_type}: {e}", exc_info=True)
                    # Don't crash the whole rubric, just log and continue? 
                    # Or maybe re-raise? Failing a whole section is bad but better than hanging.
                    continue

            # 5) Update batch status AND Rubric status
            batch.status = "complete"
            batch.pending_count = len(generated_ids)
            
            # Update Rubric status to "generated" so frontend knows to show "View Questions"
            rubric_in_session.status = "generated"
            rubric_in_session.generated_at = datetime.utcnow()
            
            session.commit()

            generation_status[batch_id]["status"] = "completed"
            generation_status[batch_id]["progress"] = 100
            generation_status[batch_id]["result"] = {
                "count": len(generated_ids),
                "question_ids": generated_ids
            }
            
            logger.info(f"Rubric generation complete: {len(generated_ids)} questions generated")
        
        except Exception as e:
            generation_status[batch_id]["status"] = "failed"
            generation_status[batch_id]["error"] = str(e)
            logger.error(f"Rubric Gen Error: {e}", exc_info=True)
        finally:
            session.close()

    @staticmethod
    def _normalize_question_type(q_type: str) -> str:
        """Normalize question type names to what TopicActionsService expects."""
        mapping = {
            "mcq": "mcq",
            "multiple_choice": "mcq",
            "short_answer": "short_answer",
            "short": "short_answer",
            "essay": "essay",
            "long_answer": "essay",
        }
        return mapping.get(q_type.lower(), q_type.lower())

    def get_status(self, batch_id: str) -> dict:
        return generation_status.get(batch_id, {"error": "Batch not found"})

generation_manager = GenerationManager()

