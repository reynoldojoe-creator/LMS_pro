from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session, joinedload
from datetime import datetime
from ..models import vetting_models
from ..models.database import Subject, GeneratedBatch, Question
from sqlalchemy import func

class VettingService:
    
    REJECTION_CATEGORIES = [
        {"id": "out_of_syllabus", "label": "Out of Syllabus", "prompt_fix": "Ensure question is answerable from provided context"},

        {"id": "ambiguous", "label": "Ambiguous Question", "prompt_fix": "Make questions clear and unambiguous"},
        {"id": "multiple_correct", "label": "Multiple Correct Answers", "prompt_fix": "Ensure exactly one correct answer for MCQ"},
        {"id": "too_similar", "label": "Too Similar to Existing", "prompt_fix": "Generate more diverse questions"},
        {"id": "factually_incorrect", "label": "Factually Incorrect", "prompt_fix": "Verify facts against syllabus"},
        {"id": "other", "label": "Other", "prompt_fix": None}
    ]
    
    async def get_pending_batches(self, db: Session) -> List[GeneratedBatch]:
        """Get all batches with pending questions"""
        return db.query(GeneratedBatch).filter(
            GeneratedBatch.status != "complete"
        ).order_by(GeneratedBatch.generated_at.desc()).all()
    
    async def get_batch_detail(self, db: Session, batch_id: str) -> Dict[str, Any]:
        """
        Get batch with questions grouped by type:
        """
        from ..models import database  # Import here to ensure it's available for fallback logic

        batch = db.query(GeneratedBatch).filter(
            GeneratedBatch.id == batch_id
        ).first()
        
        if not batch:
            # Fallback: Check if it's a Rubric ID and get latest batch
            rubric = db.query(database.Rubric).filter(database.Rubric.id == batch_id).first()
            if rubric:
                batch = db.query(GeneratedBatch).filter(
                    GeneratedBatch.rubric_id == rubric.id
                ).order_by(GeneratedBatch.generated_at.desc()).first()
                if batch:
                    # found the batch via rubric, update local batch_id to correct one
                    batch_id = batch.id
        
        if not batch:
            return None
            
        # Use unified Question model
        from ..models import database
        questions = db.query(database.Question).filter(
            database.Question.batch_id == batch_id
        ).all()
        
        sections = {
            "mcq": [],
            "short_answer": [],
            "essay": []
        }
        
        for q in questions:
            q_type = q.question_type.lower()
            if "mcq" in q_type:
                sections["mcq"].append(q)
            elif "short" in q_type:
                sections["short_answer"].append(q)
            elif "essay" in q_type:
                sections["essay"].append(q)
            elif "long" in q_type:
                sections["essay"].append(q) # Map long answer to essay
            else:
                # Fallback
                sections.setdefault(q_type, []).append(q)
                
        return {
            "batch": batch,
            "sections": sections,
            "questions": questions,  # Add flat list for frontend
            "progress": {
                "total": batch.total_questions,
                "approved": batch.approved_count,
                "rejected": batch.rejected_count,
                "pending": batch.pending_count
            }
        }
    
    async def approve_question(
        self,
        db: Session,
        question_id: str, # Question ID is int in DB but str in signature? Let's check.
        vetter_id: str,
        co_adjustment: Optional[List[Dict]] = None,
        lo_adjustment: Optional[List[Dict]] = None
    ) -> Any:
        from ..models import database
        
        # question_id might be passed as string from URL, but DB is Int.
        try:
             q_id_int = int(question_id)
        except ValueError:
             raise ValueError("Invalid question ID")

        question = db.query(database.Question).filter(
            database.Question.id == q_id_int
        ).first()
        
        if not question:
            raise ValueError("Question not found")
            
        old_status = question.status
        question.status = "approved"
        # question.vetted_by = vetter_id # Question model doesn't have vetted_by yet? checks schema...
        # The user didn't ask to add vetted_by to Question. 
        # But GeneratedQuestion had it.
        # If we unify, we lose vetted_by unless we add it to Question.
        # For now, let's skip vetted_by or adding it if strictly required. 
        # User only asked for is_reference and rubric_id.
        # But vetting process might need it.
        # I'll update status and batch counts.
        
        # If co_adjustment is provided, we might need a place to store it.
        # Question has co_id (string). GeneratedQuestion had JSON mappings.
        # This is the friction of unification.
        # I will assume for Prototype we just Approve/Reject status.
        
        # Update batch counts
        if question.batch_id:
             self._update_batch_counts(db, question.batch_id, old_status, "approved")
        
        db.commit()
        db.refresh(question)
        return question

    async def reject_question(
        self,
        db: Session,
        question_id: str,
        vetter_id: str,
        rejection_category: str,
        rejection_reason: Optional[str] = None,
        notes: Optional[str] = None
    ) -> Any:
        from ..models import database

        try:
             q_id_int = int(question_id)
        except ValueError:
             raise ValueError("Invalid question ID")

        question = db.query(database.Question).filter(
            database.Question.id == q_id_int
        ).first()
        
        if not question:
            raise ValueError("Question not found")
            
        old_status = question.status
        question.status = "rejected"
        question.rejection_reason = rejection_reason
        
        # Update batch counts
        if question.batch_id:
             self._update_batch_counts(db, question.batch_id, old_status, "rejected")
        
        # Log feedback
        feedback = vetting_models.VettingFeedback(
            id=f"fb_{datetime.utcnow().timestamp()}",
            subject_id=question.subject_id,
            topic_id=question.topic_id,
            question_type=question.question_type,
            rejection_category=rejection_category,
            timestamp=datetime.utcnow()
        )
        db.add(feedback)
        
        db.commit()
        db.refresh(question)
        return question

    def _update_batch_counts(self, db: Session, batch_id: str, old_status: str, new_status: str):
        batch = db.query(GeneratedBatch).filter(
            GeneratedBatch.id == batch_id
        ).first()
        
        if not batch:
            return

        if old_status == "pending":
            batch.pending_count -= 1
        elif old_status == "approved":
            batch.approved_count -= 1
        elif old_status == "rejected":
            batch.rejected_count -= 1
            
        if new_status == "approved":
            batch.approved_count += 1
        elif new_status == "rejected":
            batch.rejected_count += 1
        elif new_status == "pending":
            batch.pending_count += 1
            
        # Update batch status
        if batch.pending_count == 0:
            batch.status = "complete"
        else:
            batch.status = "in_progress"

    async def get_rejection_analytics(
        self, 
        db: Session,
        subject_id: Optional[str] = None
    ) -> Dict:
        """
        Get rejection statistics
        """
        query = db.query(
            vetting_models.VettingFeedback.rejection_category,
            func.count(vetting_models.VettingFeedback.id)
        )
        
        if subject_id:
            query = query.filter(vetting_models.VettingFeedback.subject_id == subject_id)
            
        stats = query.group_by(vetting_models.VettingFeedback.rejection_category).all()
        
        return {
            category: count for category, count in stats
        }

vetting_service = VettingService()
