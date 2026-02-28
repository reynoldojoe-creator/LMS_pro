from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

class QueryRequest(BaseModel):
    subject_id: str
    question: str
    n_results: int = 5

class Source(BaseModel):
    text: str
    metadata: Dict[str, Any]

class QueryResponse(BaseModel):
    answer: str
    sources: List[Source]

class SyllabusUploadResponse(BaseModel):
    filename: str
    status: str
    chunks_created: int
    filename: str
    status: str
    chunks_created: int
    subject_id: str

class UserSchema(BaseModel):
    id: int
    regNo: str
    name: str
    roles: List[str]

    class Config:
        from_attributes = True

class TokenSchema(BaseModel):
    access_token: str
    token_type: str
    user: UserSchema

class LoginRequest(BaseModel):
    username: str
    password: str

class LearningOutcomeSchema(BaseModel):
    id: int
    subject_id: int
    code: str
    description: str
    
    class Config:
        from_attributes = True

class TopicSchema(BaseModel):
    id: Optional[int] = None
    subject_id: Optional[int] = None
    name: str
    order: int = 0
    
    class Config:
        from_attributes = True


    
class CourseOutcomeSchema(BaseModel):
    id: int
    code: str
    description: str
    
    class Config:
        from_attributes = True

class SyllabusExtractionResult(BaseModel):
    subject_name: Optional[str] = None
    subject_code: Optional[str] = None
    topics: List[TopicSchema]

# Creation Schemas
class CourseOutcomeCreate(BaseModel):
    code: str
    description: str
    
class LearningOutcomeCreate(BaseModel):
    code: str
    description: str

class COMappingRequest(BaseModel):
    co_id: int
    weight: str # 'High', 'Moderate', 'Low', 'None'

class TopicOutcomeMappingRequest(BaseModel):
    co_mappings: List[COMappingRequest]
    lo_ids: List[int]

class SubjectSchema(BaseModel):
    id: int
    name: str
    code: str
    department: Optional[str] = None # Added
    credits: Optional[int] = None # Added
    terminology_detected: Optional[str] = None
    created_at: Optional[datetime] = Field(None, alias="createdAt")
    
    # Relationships for Detail View
    course_outcomes: List[CourseOutcomeSchema] = Field(default=[], alias="courseOutcomes")
    learning_outcomes: List[LearningOutcomeSchema] = Field(default=[], alias="learningOutcomes") # Added
    topics: List[TopicSchema] = []
    total_questions: int = Field(default=0, alias="totalQuestions")
    
    class Config:
        from_attributes = True
        populate_by_name = True

# Question Generation Schemas
class GenerateQuestionRequest(BaseModel):
    subject_id: int
    topic_id: Optional[int] = None
    question_type: str # MCQ, short_answer, essay
    difficulty: str
    count: int = 1
    co_id: Optional[str] = None
    lo_id: Optional[str] = None
    rubric_id: Optional[int] = None

class QuickGenerateRequest(BaseModel):
    subject_id: int
    topic_id: Optional[int] = None
    question_type: str
    count: int = 1
    count: int = 1
    difficulty: Optional[str] = "medium"

class QuestionSchema(BaseModel):
    id: Optional[int] = None
    question_text: str
    question_type: str
    options: Optional[Dict[str, str]] = None # Assuming Dict for mapped options? Or just generic Dict
    correct_answer: Optional[str] = None
    difficulty: str
    marks: int
    status: str = "pending"
    validation_score: Optional[int] = None
    
    # Enhanced fields for consistency with frontend expectations
    topic_id: Optional[int] = None
    co_id: Optional[str] = None
    lo_id: Optional[str] = None
    rejection_reason: Optional[str] = None

    class Config:
        from_attributes = True

class VettingActionRequest(BaseModel):
    reason: Optional[str] = None
    notes: Optional[str] = None

class GenerationStatusResponse(BaseModel):
    batch_id: str
    status: str  # 'queued' | 'processing' | 'completed' | 'failed'
    progress: int
    questions_generated: int
    questions_validated: int
    # result: Optional[GenerationResultResponse] = None # Define if needed
    error: Optional[str] = None

class VettingBatchResponse(BaseModel):
    id: str
    rubric_id: Optional[str]
    subject_code: str
    subject_name: str
    exam_title: str
    generated_by: str  # Faculty name
    total_questions: int
    approved_count: int
    rejected_count: int
    pending_count: int
    created_at: datetime
    
# Rubric Schemas
class QuestionDistributionItem(BaseModel):
    count: int
    marks_each: int
    difficulty: Optional[str] = "medium" # easy, medium, hard
    choice: Optional[str] = None # e.g. "answer_any_2"

class RubricCreateRequest(BaseModel):
    name: str
    subject_id: int
    exam_type: str # final, midterm, quiz, assignment
    total_marks: Optional[int] = None
    duration_minutes: Optional[int] = None
    units_covered: Optional[List[int]] = None
    
    question_distribution: Optional[Dict[str, QuestionDistributionItem]] = None
    # e.g. {"mcq": {"count": 10, "marks_each": 2}}
    
    co_distribution: Optional[Dict[str, float]] = None
    # e.g. {"CO1": 20.0, "CO2": 30.0}
    
    lo_distribution: Optional[Dict[str, float]] = None
    # e.g. {"LO1": 10.0}
    
    difficulty_distribution: Optional[Dict[str, float]] = None
    
    # Assignment specific
    assignment_config: Optional[Dict[str, Any]] = None
    # e.g. {"submission_type": "group", "tasks": [...]}

# Topic Question Schemas
class TopicQuestionBase(BaseModel):
    question_text: str
    question_type: str
    difficulty: str
    bloom_level: str
    options: Optional[Dict[str, str]] = None
    correct_answer: Optional[str] = None

class TopicQuestionCreate(TopicQuestionBase):
    topic_id: int

class TopicQuestionResponse(TopicQuestionBase):
    id: int
    topic_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class TopicQuestionGenerationRequest(BaseModel):
    count: int = 5
    question_types: List[str] = ["MCQ", "Short"]
    difficulty: str = "Medium"
    blooms_levels: List[str] = ["Remember", "Understand"]
