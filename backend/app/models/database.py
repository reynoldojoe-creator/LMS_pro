from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, Table, Text, DateTime, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import os
from datetime import datetime

# Use absolute path based on this file's location to avoid CWD issues
_BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_DB_PATH = os.path.join(_BASE_DIR, "data", "lms_simats.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{_DB_PATH}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class TopicCOMapping(Base):
    __tablename__ = 'topic_co_mapping'
    
    topic_id = Column(Integer, ForeignKey('topics.id'), primary_key=True)
    course_outcome_id = Column(Integer, ForeignKey('course_outcomes.id'), primary_key=True)
    weight = Column(String, default="moderate") # low, moderate, high
    
    # Relationships for association object pattern (optional but good)
    # topic = relationship("Topic", back_populates="co_mappings")
    # course_outcome = relationship("CourseOutcome", back_populates="topic_mappings")

topic_lo_association = Table(
    'topic_lo_mapping', Base.metadata,
    Column('topic_id', Integer, ForeignKey('topics.id')),
    Column('learning_outcome_id', Integer, ForeignKey('learning_outcomes.id'))
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    reg_no = Column(String, unique=True, index=True)
    name = Column(String)
    password_hash = Column(String)
    roles = Column(String) # JSON string: ["faculty", "vetter"]

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    code = Column(String, unique=True, index=True)
    department = Column(String, nullable=True)
    credits = Column(Integer, default=4)
    paper_type = Column(String, default="core") # 'core' or 'elective'
    terminology_detected = Column(String) # "Course Objectives" or "Course Outcomes"

    course_outcomes = relationship("CourseOutcome", back_populates="subject", order_by="CourseOutcome.order")
    learning_outcomes = relationship("LearningOutcome", back_populates="subject", order_by="LearningOutcome.order")
    topics = relationship("Topic", back_populates="subject", order_by="Topic.order")
    rubrics = relationship("Rubric", back_populates="subject")
    rubrics = relationship("Rubric", back_populates="subject")

class Rubric(Base):
    __tablename__ = "rubrics"
    __table_args__ = {'extend_existing': True}
    
    id = Column(String, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    exam_type = Column(String) # final, midterm, quiz
    
    title = Column(String)
    name = Column(String, default="")  # Legacy column, kept for DB compatibility
    duration = Column(Integer, default=180) # Minutes
    total_marks = Column(Integer, default=100)
    
    sections = Column(Text) # JSON string of sections config
    difficulty_distribution = Column(Text) # JSON string
    co_requirements = Column(Text) # JSON string (Legacy name for co_distribution)
    co_distribution = Column(Text) # JSON string
    bloom_distribution = Column(Text) # JSON string
    lo_distribution = Column(Text) # JSON string
    units_covered = Column(Text) # JSON string
    assignment_config = Column(Text) # JSON string for assignment specific details
    
    status = Column(String, default="draft")
    created_at = Column(DateTime, default=datetime.utcnow)
    generated_at = Column(DateTime, nullable=True)
    
    subject = relationship("Subject", back_populates="rubrics")
    items = relationship("RubricItem", back_populates="rubric", cascade="all, delete-orphan")

class RubricItem(Base):
    __tablename__ = "rubric_items"
    
    id = Column(Integer, primary_key=True, index=True)
    rubric_id = Column(String, ForeignKey("rubrics.id"))
    question_type = Column(String) # mcq, short_answer, essay
    marks = Column(Integer)
    difficulty = Column(String, default="medium") # easy, medium, hard
    count = Column(Integer)
    
    # Optional mapping overrides specific to this item/section
    # topic_id = Column(Integer, ForeignKey('topics.id'), nullable=True) 
    
    rubric = relationship("Rubric", back_populates="items")

class CourseOutcome(Base):
    __tablename__ = "course_outcomes"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    code = Column(String) # CO1, CO2
    description = Column(Text)
    source = Column(String, default="explicit") # explicit or inferred
    order = Column(Integer, default=0)

    subject = relationship("Subject", back_populates="course_outcomes")
    topics = relationship("Topic", secondary="topic_co_mapping", back_populates="mapped_cos")



class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    name = Column(String)
    order = Column(Integer, default=0)

    subject = relationship("Subject", back_populates="topics")
    mapped_cos = relationship("CourseOutcome", secondary="topic_co_mapping", back_populates="topics")
    mapped_los = relationship("LearningOutcome", secondary=topic_lo_association, overlaps="topics")
    
    # Training Support
    has_custom_skill = Column(Integer, default=0) # Boolean flag
    skill_metadata = relationship("TopicSkill", uselist=False, back_populates="topic")
    generated_questions = relationship("TopicQuestion", back_populates="topic")



class TopicSkill(Base):
    __tablename__ = "topic_skills"
    
    id = Column(Integer, primary_key=True, index=True)
    topic_id = Column(Integer, ForeignKey("topics.id"), unique=True)
    skill_path = Column(String)
    baseline_pass_rate = Column(Integer, default=60)
    skill_pass_rate = Column(Integer, default=85)
    last_trained_at = Column(DateTime, default=datetime.utcnow)
    training_data_count = Column(Integer, default=0)
    
    topic = relationship("Topic", back_populates="skill_metadata")

class LearningOutcome(Base):
    __tablename__ = "learning_outcomes"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id")) # Changed from topic_id
    code = Column(String) # LO1, LO2
    description = Column(Text) 
    order = Column(Integer, default=0)

    subject = relationship("Subject", back_populates="learning_outcomes")
    topics = relationship("Topic", secondary=topic_lo_association, overlaps="mapped_los")

class GeneratedBatch(Base):
    """A batch of questions generated from a rubric"""
    __tablename__ = "generated_batches"
    __table_args__ = {'extend_existing': True}
    
    id = Column(String, primary_key=True, index=True)
    rubric_id = Column(String, ForeignKey("rubrics.id"))
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    title = Column(String, nullable=True) # e.g. "Rubric: Midterm"
    
    generated_by = Column(String)  # Faculty user ID
    generated_at = Column(DateTime, default=datetime.utcnow)
    
    total_questions = Column(Integer)
    approved_count = Column(Integer, default=0)
    rejected_count = Column(Integer, default=0)
    pending_count = Column(Integer)
    
    status = Column(String, default="pending")  # pending, in_progress, complete
    
    # Relationships
    rubric = relationship("Rubric")
    questions = relationship("GeneratedQuestion", back_populates="batch")


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=True)
    
    question_text = Column(Text)
    question_type = Column(String) # MCQ, short_answer, essay
    options = Column(Text, nullable=True) # JSON string for MCQs
    correct_answer = Column(Text, nullable=True)
    difficulty = Column(String)
    marks = Column(Integer)
    
    # Generation Mode Flags
    is_reference = Column(Integer, default=0) # SQLite uses Integer for Boolean (0/1)
    rubric_id = Column(String, ForeignKey("rubrics.id"), nullable=True)
    co_id = Column(String, nullable=True) # Stored as string ID (e.g. CO1)
    lo_id = Column(String, nullable=True) # Stored as string ID (e.g. LO1.1)
    
    # Validation & Vetting
    status = Column(String, default="pending") # pending, approved, rejected, quarantined
    rejection_reason = Column(Text, nullable=True)
    rag_context = Column(Text, nullable=True)  # JSON string of retrieved chunks
    approval_feedback = Column(Text, nullable=True)  # JSON: positive notes
    validation_score = Column(Integer, nullable=True)
    
    # Vetting Context
    batch_id = Column(String, ForeignKey("generated_batches.id"), nullable=True) # Link to batch
    
    rubric = relationship("Rubric", foreign_keys=[rubric_id], backref="rubric_questions")
    batch = relationship("GeneratedBatch", foreign_keys=[batch_id], backref="batch_questions")
    
    __table_args__ = (
        Index('idx_question_status', 'status'),
        {'extend_existing': True}
    )



class TopicNotes(Base):
    __tablename__ = "topic_notes"
    
    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    topic_id = Column(Integer, ForeignKey("topics.id"))
    title = Column(String)
    file_path = Column(String)
    
    subject = relationship("Subject")
    topic = relationship("Topic")


# Import additional models so they register with Base.metadata
from .topic_question import TopicQuestion
from .sample_question import SampleQuestion


def init_db():
    """Create all tables and run auto-migrations."""
    Base.metadata.create_all(bind=engine)

    # Auto-migration for schema updates
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            # Check if title column exists in generated_batches
            result = conn.execute(text("PRAGMA table_info(generated_batches)"))
            columns = [row[1] for row in result.fetchall()]

            if "generated_batches" in Base.metadata.tables and "title" not in columns:
                print("Migrating: Adding title column to generated_batches")
                conn.execute(text("ALTER TABLE generated_batches ADD COLUMN title TEXT"))

            # Check for weight column in topic_co_mapping
            result = conn.execute(text("PRAGMA table_info(topic_co_mapping)"))
            columns = [row[1] for row in result.fetchall()]
            if "topic_co_mapping" in Base.metadata.tables and "weight" not in columns:
                print("Migrating: Adding weight column to topic_co_mapping")
                conn.execute(text("ALTER TABLE topic_co_mapping ADD COLUMN weight TEXT DEFAULT 'moderate'"))

            # Check for bloom_distribution in rubrics
            result = conn.execute(text("PRAGMA table_info(rubrics)"))
            columns = [row[1] for row in result.fetchall()]
            if "rubrics" in Base.metadata.tables and "bloom_distribution" not in columns:
                print("Migrating: Adding bloom_distribution column to rubrics")
                conn.execute(text("ALTER TABLE rubrics ADD COLUMN bloom_distribution TEXT"))

            # Check for bloom_level in generated_questions
            result = conn.execute(text("PRAGMA table_info(generated_questions)"))
            columns = [row[1] for row in result.fetchall()]
            if columns and "bloom_level" not in columns:
                print("Migrating: Adding bloom_level column to generated_questions")
                conn.execute(text("ALTER TABLE generated_questions ADD COLUMN bloom_level TEXT"))

    except Exception as e:
        print(f"Migration check failed: {e}")
