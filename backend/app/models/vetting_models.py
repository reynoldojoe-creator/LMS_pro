from sqlalchemy import Column, String, Integer, Float, JSON, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

# GeneratedBatch moved to database.py to avoid duplicates


class GeneratedQuestion(Base):
    """Individual generated question with vetting status"""
    __tablename__ = "generated_questions"
    __table_args__ = {'extend_existing': True}
    
    id = Column(String, primary_key=True)
    batch_id = Column(String, ForeignKey("generated_batches.id"))
    
    # Question content
    question_text = Column(Text)
    question_type = Column(String)  # MCQ, short_answer, essay
    options = Column(JSON)  # For MCQ: {"A": "...", "B": "...", ...}
    correct_answer = Column(String)
    explanation = Column(Text)
    
    # OBE Mapping
    co_mappings = Column(JSON)  
    # Example: [{"co_code": "CO1", "intensity": 3}, {"co_code": "CO2", "intensity": 1}]
    
    lo_mappings = Column(JSON, nullable=True)
    # Example: [{"lo_code": "LO1", "intensity": 2}]


    difficulty = Column(String)
    bloom_level = Column(String) # knowledge, comprehension, application, analysis, synthesis, evaluation
    marks = Column(Integer)
    
    # Topic source
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=True)
    
    # Validation scores (from auto-validator)
    validation_score = Column(Float)
    validation_issues = Column(JSON)
    
    # Vetting status
    status = Column(String, default="pending")  # pending, approved, rejected
    vetted_by = Column(String, nullable=True)
    vetted_at = Column(DateTime, nullable=True)
    
    # Vetter feedback (for learning)
    rejection_reason = Column(String, nullable=True)
    rejection_category = Column(String, nullable=True)
    # Categories: "out_of_syllabus", "ambiguous", 
    #            "multiple_correct", "too_similar", "factually_incorrect", "other"
    
    vetter_co_adjustment = Column(JSON, nullable=True)
    # If vetter changes CO mapping: [{"co_code": "CO1", "intensity": 2}]
    
    vetter_lo_adjustment = Column(JSON, nullable=True)
    # If vetter changes LO mapping
    
    vetter_notes = Column(Text, nullable=True)
    
    batch = relationship("GeneratedBatch", back_populates="questions")

class VettingFeedback(Base):
    """Aggregated feedback for analytics and future improvement"""
    __tablename__ = "vetting_feedback"
    __table_args__ = {'extend_existing': True}
    
    id = Column(String, primary_key=True)
    subject_id = Column(Integer)
    topic_id = Column(Integer)
    question_type = Column(String)
    
    # Rejection stats
    rejection_category = Column(String)
    count = Column(Integer, default=1)
    
    timestamp = Column(DateTime, default=datetime.utcnow)
