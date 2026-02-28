
from sqlalchemy.orm import Session
from sqlalchemy import func, case, desc
from typing import Dict, List, Any, Optional
import json
from ..models import vetting_models, database

class ReportsService:
    """
    Service for generating analytics and reports based on the Enhanced Vetting System.
    """

    def get_overview_stats(self, db: Session, subject_id: Optional[int] = None) -> Dict[str, Any]:
        """
        Get high-level statistics: generated, approved, rejected, pending.
        """
        # Query both tables: GeneratedQuestion (Vetting) and Question (Quick Gen)
        
        # 1. GeneratedQuestion (Vetting flow)
        q_gen = db.query(vetting_models.GeneratedQuestion)
        if subject_id:
            q_gen = q_gen.join(database.GeneratedBatch).filter(database.GeneratedBatch.subject_id == subject_id)
            
        gen_total = q_gen.count()
        gen_approved = q_gen.filter(vetting_models.GeneratedQuestion.status == "approved").count()
        gen_rejected = q_gen.filter(vetting_models.GeneratedQuestion.status == "rejected").count()
        gen_pending = q_gen.filter(vetting_models.GeneratedQuestion.status == "pending").count()

        # 2. Question (Quick Gen flow)
        q_quick = db.query(database.Question)
        if subject_id:
            q_quick = q_quick.filter(database.Question.subject_id == subject_id)
            
        quick_total = q_quick.count()
        quick_approved = q_quick.filter(database.Question.status == "approved").count()
        quick_rejected = q_quick.filter(database.Question.status == "rejected").count()
        quick_pending = q_quick.filter(database.Question.status == "pending").count()

        # Aggregate
        total_questions = gen_total + quick_total
        approved = gen_approved + quick_approved
        rejected = gen_rejected + quick_rejected
        pending = gen_pending + quick_pending
        
        # Calculate approval rate based on reviewed questions
        reviewed = approved + rejected
        approval_rate = 0.0
        if reviewed > 0:
            approval_rate = round((approved / reviewed) * 100, 1)

        return {
            "total_questions": total_questions,
            "approved": approved,
            "rejected": rejected,
            "pending": pending,
            "approval_rate": approval_rate
        }

    def get_co_coverage(self, db: Session, subject_id: int) -> List[Dict[str, Any]]:
        """
        Analyze Course Outcome coverage for APPROVED questions.
        Returns percentage progress for each CO based on question distribution.
        """
        # 1. Get all COs for the subject to initialize the map
        cos = db.query(database.CourseOutcome).filter(database.CourseOutcome.subject_id == subject_id).all()
        co_map = {co.code: 0 for co in cos}
        
        if not co_map:
            return []

        # 2. Fetch approved questions for the subject
        questions = db.query(vetting_models.GeneratedQuestion)\
            .join(database.GeneratedBatch)\
            .filter(
                database.GeneratedBatch.subject_id == subject_id,
                vetting_models.GeneratedQuestion.status == "approved"
            ).all()

        # 3. Aggregate CO counts from JSON mappings
        # Mappings structure: [{"co_code": "CO1", "intensity": 3}, ...]
        total_mapped_questions = 0
        for q in questions:
            if not q.co_mappings:
                continue
                
            mappings = q.co_mappings
            if isinstance(mappings, str):
                try:
                    mappings = json.loads(mappings)
                except:
                    continue
            
            if isinstance(mappings, list):
                has_mapping = False
                for m in mappings:
                    code = m.get("co_code")
                    if code and code in co_map:
                        co_map[code] += 1
                        has_mapping = True
                
                if has_mapping:
                    total_mapped_questions += 1

        # 4. Calculate relative distribution (for progress bars)
        # We can also assume a "target" if defined, but for now we show distribution/count.
        result = []
        for code in sorted(co_map.keys()):
            count = co_map[code]
            # Simple percentage of total approved questions that cover this CO
            # Note: Sum of % can be > 100% since one question maps to multiple COs
            percentage = 0.0
            if total_mapped_questions > 0:
                percentage = round((count / total_mapped_questions) * 100, 1)
                
            result.append({
                "co_code": code,
                "question_count": count,
                "percentage": percentage
            })
            
        return result

    def get_blooms_distribution(self, db: Session, subject_id: int) -> Dict[str, int]:
        """
        Get count of approved questions per Bloom's Taxonomy level.
        """
        results = db.query(
            vetting_models.GeneratedQuestion.bloom_level,
            func.count(vetting_models.GeneratedQuestion.id)
        ).join(database.GeneratedBatch).filter(
            database.GeneratedBatch.subject_id == subject_id,
            vetting_models.GeneratedQuestion.status == "approved"
        ).group_by(vetting_models.GeneratedQuestion.bloom_level).all()
        
        # Normalize keys to lowercase for frontend consistency if needed, 
        # or keep as stored (Title Case)
        return {level: count for level, count in results if level}

    def get_topic_coverage(self, db: Session, subject_id: int) -> List[Dict[str, Any]]:
        """
        Get approved question counts per topic.
        """
        # 1. Get all topics for subject (to show 0s)
        topics = db.query(database.Topic.id, database.Topic.name)\
            .filter(database.Topic.subject_id == subject_id).all()
            
        topic_map = {t.id: {"name": t.name, "count": 0} for t in topics}
        
        if not topic_map:
            return []

        # 2. Count approved questions per topic
        counts = db.query(
            vetting_models.GeneratedQuestion.topic_id,
            func.count(vetting_models.GeneratedQuestion.id)
        ).join(database.GeneratedBatch).filter(
            database.GeneratedBatch.subject_id == subject_id,
            vetting_models.GeneratedQuestion.status == "approved",
            vetting_models.GeneratedQuestion.topic_id.isnot(None)
        ).group_by(vetting_models.GeneratedQuestion.topic_id).all()
        
        for topic_id, count in counts:
            if topic_id in topic_map:
                topic_map[topic_id]["count"] = count
                
        # Format list
        result = [
            {"topic_id": tid, "topic_name": data["name"], "count": data["count"]}
            for tid, data in topic_map.items()
        ]
        
        # Sort by count desc or name?
        return sorted(result, key=lambda x: x["count"], reverse=True)

    def get_vetter_stats(self, db: Session) -> List[Dict[str, Any]]:
        """
        Get performance stats for vetters: total reviewed, approved, rejected.
        """
        results = db.query(
            vetting_models.GeneratedQuestion.vetted_by,
            func.count(vetting_models.GeneratedQuestion.id).label("total"),
            func.sum(case((vetting_models.GeneratedQuestion.status == "approved", 1), else_=0)).label("approved"),
            func.sum(case((vetting_models.GeneratedQuestion.status == "rejected", 1), else_=0)).label("rejected")
        ).filter(
            vetting_models.GeneratedQuestion.vetted_by.isnot(None)
        ).group_by(vetting_models.GeneratedQuestion.vetted_by).all()
        
        stats = []
        for row in results:
            stats.append({
                "vetter_id": row.vetted_by,
                "total_reviewed": row.total,
                "approved_count": int(row.approved or 0),
                "rejected_count": int(row.rejected or 0)
            })
            
        return stats

    def get_questions_by_subject(self, db: Session) -> List[Dict[str, Any]]:
        """
        Get total question counts (all statuses) partitioned by subject.
        """
        results = db.query(
            database.Subject.name,
            func.count(vetting_models.GeneratedQuestion.id)
        ).join(database.GeneratedBatch, database.GeneratedBatch.subject_id == database.Subject.id)\
         .join(vetting_models.GeneratedQuestion, vetting_models.GeneratedQuestion.batch_id == database.GeneratedBatch.id)\
         .group_by(database.Subject.name).all()
         
        return [{"subject": name, "question_count": count} for name, count in results]

reports_service = ReportsService()
