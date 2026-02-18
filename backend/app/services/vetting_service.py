from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session, joinedload
from datetime import datetime
from ..models import vetting_models
from ..models.database import Subject, GeneratedBatch, Question, Rubric
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
    
    async def get_pending_batches(self, db: Session) -> list:
        """Get all batches that have questions (both from GeneratedBatch and Rubric tables)"""
        # from ..models import database # Already imported above
        
        batches = []
        seen_rubric_ids = set()
        
        # Source 1: GeneratedBatch table (rubric-based generation)
        gen_batches = db.query(GeneratedBatch).order_by(
            GeneratedBatch.generated_at.desc()
        ).all()
        
        for gb in gen_batches:
            # Count questions linked to this batch via batch_id
            total = db.query(Question).filter(
                Question.batch_id == gb.id
            ).count()
            
            if total == 0:
                continue
            
            pending = db.query(Question).filter(
                Question.batch_id == gb.id, 
                Question.status == "pending"
            ).count()
            approved = db.query(Question).filter(
                Question.batch_id == gb.id, 
                Question.status == "approved"
            ).count()
            rejected = db.query(Question).filter(
                Question.batch_id == gb.id, 
                Question.status == "rejected"
            ).count()
            quarantined = db.query(Question).filter(
                Question.batch_id == gb.id, 
                Question.status == "quarantined"
            ).count()
            reviewed = approved + rejected + quarantined
            
            status = "pending"
            if pending == 0 and total > 0:
                status = "completed"
            elif reviewed > 0:
                status = "in_progress"
            
            batches.append({
                "id": str(gb.id),
                "rubric_id": str(gb.rubric_id) if gb.rubric_id else None,
                "rubricId": str(gb.rubric_id) if gb.rubric_id else None,
                "subject_id": gb.subject_id,
                "subjectId": str(gb.subject_id) if gb.subject_id else None,
                "title": gb.title or "Generated Batch",
                "generated_by": gb.generated_by or "Faculty",
                "facultyName": gb.generated_by or "Faculty",
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
                "generated_at": gb.generated_at.isoformat() if gb.generated_at else None,
                "generatedAt": gb.generated_at.isoformat() if gb.generated_at else None,
                "status": status,
                "questions": []
            })
            
            if gb.rubric_id:
                seen_rubric_ids.add(str(gb.rubric_id))
        
        # Source 2: Questions linked directly to rubrics via rubric_id 
        # (from the old sync generation path, or questions without batch_id)
        rubrics = db.query(Rubric).order_by(
            Rubric.created_at.desc()
        ).all()
        
        for r in rubrics:
            if str(r.id) in seen_rubric_ids:
                continue  # Already covered by GeneratedBatch
            
            total = db.query(Question).filter(
                Question.rubric_id == str(r.id)
            ).count()
            
            if total == 0:
                continue
            
            pending = db.query(Question).filter(
                Question.rubric_id == str(r.id), 
                Question.status == "pending"
            ).count()
            approved = db.query(Question).filter(
                Question.rubric_id == str(r.id), 
                Question.status == "approved"
            ).count()
            rejected = db.query(Question).filter(
                Question.rubric_id == str(r.id), 
                Question.status == "rejected"
            ).count()
            quarantined = db.query(Question).filter(
                Question.rubric_id == str(r.id), 
                Question.status == "quarantined"
            ).count()
            reviewed = approved + rejected + quarantined
            
            status = "pending"
            if pending == 0 and total > 0:
                status = "completed"
            elif reviewed > 0:
                status = "in_progress"
            
            batches.append({
                "id": str(r.id),
                "rubric_id": str(r.id),
                "rubricId": str(r.id),
                "subject_id": r.subject_id,
                "subjectId": str(r.subject_id),
                "title": r.title or "Untitled Rubric",
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
                "generated_at": r.generated_at.isoformat() if r.generated_at else (r.created_at.isoformat() if r.created_at else None),
                "generatedAt": r.generated_at.isoformat() if r.generated_at else (r.created_at.isoformat() if r.created_at else None),
                "status": status,
                "questions": []
            })
        
        return batches
    
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
            
        # Use unified Question model — search by batch_id OR rubric_id
        from ..models import database
        from sqlalchemy import or_
        
        questions = db.query(database.Question).filter(
            or_(
                database.Question.batch_id == batch_id,
                database.Question.rubric_id == batch_id,
                database.Question.rubric_id == (batch.rubric_id if batch and batch.rubric_id else batch_id)
            )
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
                "total": batch.total_questions if batch else len(questions),
                "approved": batch.approved_count if batch else sum(1 for q in questions if q.status == 'approved'),
                "rejected": batch.rejected_count if batch else sum(1 for q in questions if q.status == 'rejected'),
                "pending": batch.pending_count if batch else sum(1 for q in questions if q.status == 'pending')
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
