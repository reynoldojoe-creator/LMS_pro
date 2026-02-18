
import json
import logging
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from ..models.database import Topic, CourseOutcome, LearningOutcome, TopicCOMapping, topic_lo_association
from ..services.llm_service import LLMService
from .. import config

logger = logging.getLogger(__name__)

class OutcomeMappingService:
    def __init__(self):
        self.llm_service = LLMService()

    async def auto_suggest_mappings(self, db: Session, subject_id: int, co_id: int) -> Dict[str, Any]:
        """
        Use LLM to suggest relevant topics for a CO.
        """
        # Fetch Context
        co = db.query(CourseOutcome).filter(CourseOutcome.id == co_id).first()
        if not co:
            raise ValueError("Course Outcome not found")
            
        topics = db.query(Topic).filter(Topic.subject_id == subject_id).all()
        if not topics:
            return {"topic_ids": [], "reasoning": "No topics found for subject"}

        # Format prompt
        topic_list_str = "\n".join([f"{t.id}. {t.name}" for t in topics])
        
        prompt = f"""Given this Course Outcome:
"{co.code}: {co.description}"

Which of these topics are MOST relevant to this outcome? Select 3-5 topic IDs.

TOPICS:
{topic_list_str}

Respond in JSON format:
{{
    "topic_ids": [1, 2, ...],
    "reasoning": "Brief explanation..."
}}
"""
        try:
            response = await self.llm_service.generate(
                prompt=prompt,
                model=config.GENERATION_MODEL, # Use generation model effectively
                temperature=0.3, # Low temp for precision
                expect_json=True
            )
            
            # Parsing handled by LLMService, hopefully returns dict
            if isinstance(response, dict):
                 return response
            # Fallback if response is wrapper
            return {"topic_ids": [], "reasoning": "Failed to parse response"}
            
        except Exception as e:
            logger.error(f"Auto-suggest failed: {e}")
            return {"topic_ids": [], "reasoning": f"Error: {str(e)}"}

    def bulk_map(self, db: Session, co_id: int, topic_ids: List[int], weight: str = 'moderate'):
        """
        Map multiple topics to a CO.
        """
        # Clear existing mappings? Or append?
        # User implies "Map topics", usually implies setting the state.
        # But existing might exist.
        # Strategy: Merge. Update weight if exists, insert if new.
        
        for t_id in topic_ids:
            # Check existence
            existing = db.query(TopicCOMapping).filter_by(topic_id=t_id, course_outcome_id=co_id).first()
            if existing:
                existing.weight = weight
            else:
                mapping = TopicCOMapping(
                    topic_id=t_id,
                    course_outcome_id=co_id,
                    weight=weight
                )
                db.add(mapping)
        
        db.commit()
    
    def remove_mapping(self, db: Session, co_id: int, topic_id: int):
        db.query(TopicCOMapping).filter_by(topic_id=topic_id, course_outcome_id=co_id).delete()
        db.commit()

    # ── LO Mapping Methods ──

    async def auto_suggest_lo_mappings(self, db: Session, subject_id: int, lo_id: int) -> Dict[str, Any]:
        """
        Use LLM to suggest relevant topics for an LO.
        """
        lo = db.query(LearningOutcome).filter(LearningOutcome.id == lo_id).first()
        if not lo:
            raise ValueError("Learning Outcome not found")

        topics = db.query(Topic).filter(Topic.subject_id == subject_id).all()
        if not topics:
            return {"topic_ids": [], "reasoning": "No topics found for subject"}

        topic_list_str = "\n".join([f"{t.id}. {t.name}" for t in topics])

        prompt = f"""Given this Learning Outcome:
"{lo.code}: {lo.description}"

Which of these topics are MOST relevant to this learning outcome? Select 3-5 topic IDs.

TOPICS:
{topic_list_str}

Respond in JSON format:
{{
    "topic_ids": [1, 2, ...],
    "reasoning": "Brief explanation..."
}}
"""
        try:
            response = await self.llm_service.generate(
                prompt=prompt,
                model=config.GENERATION_MODEL,
                temperature=0.3,
                expect_json=True
            )

            if isinstance(response, dict):
                return response
            return {"topic_ids": [], "reasoning": "Failed to parse response"}

        except Exception as e:
            logger.error(f"LO auto-suggest failed: {e}")
            return {"topic_ids": [], "reasoning": f"Error: {str(e)}"}

    def bulk_map_lo(self, db: Session, lo_id: int, topic_ids: List[int]):
        """
        Map multiple topics to an LO via topic_lo_mapping.
        """
        from sqlalchemy import insert, delete

        # Clear existing mappings for this LO, then re-insert
        db.execute(
            delete(topic_lo_association).where(
                topic_lo_association.c.learning_outcome_id == lo_id
            )
        )

        for t_id in topic_ids:
            db.execute(
                insert(topic_lo_association).values(
                    topic_id=t_id,
                    learning_outcome_id=lo_id
                )
            )

        db.commit()

    def remove_lo_mapping(self, db: Session, lo_id: int, topic_id: int):
        from sqlalchemy import delete
        db.execute(
            delete(topic_lo_association).where(
                topic_lo_association.c.topic_id == topic_id,
                topic_lo_association.c.learning_outcome_id == lo_id
            )
        )
        db.commit()

outcome_mapping_service = OutcomeMappingService()
