from sqlalchemy import Column, Integer, String, Text, JSON, DateTime, ForeignKey
from datetime import datetime
from .database import Base

class SampleQuestion(Base):
    __tablename__ = 'sample_questions'
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey('subjects.id'))
    topic_id = Column(Integer, ForeignKey('topics.id'), nullable=True) # Link to specific topic for training
    
    question_text = Column(Text, nullable=False)
    question_type = Column(String)  # 'mcq', 'short', 'essay'
    
    # New fields for structured data
    options = Column(JSON, nullable=True)
    correct_answer = Column(Text, nullable=True)
    
    marks = Column(Integer)
    difficulty = Column(String)  # 'easy', 'medium', 'hard'
    
    # Store mappings as JSON
    # Format: {"CO1": "high", "CO2": "moderate"}
    # Legacy: co_mapping, lo_mapping
    co_mapping = Column(JSON, nullable=True)
    lo_mapping = Column(JSON, nullable=True)
    
    # New mapping fields (simple strings/lists)
    co_ids = Column(String, nullable=True)
    lo_ids = Column(String, nullable=True)
    
    topic = Column(String, nullable=True)
    unit = Column(Integer, nullable=True)
    
    file_path = Column(String, nullable=True)
    
    uploaded_at = Column(DateTime, default=datetime.utcnow)
