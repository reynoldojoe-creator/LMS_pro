from typing import Dict, List, Optional
import uuid
import json
from datetime import datetime
from ..models import database
from ..models import rubric_models
from sqlalchemy.orm import Session

EXAM_PRESETS = {
    "final": {
        "total_marks": 100,
        "duration_minutes": 180,
        "units_covered": None,  # All units
        "question_distribution": {
            "mcq": {"count": 20, "marks_each": 2},
            "short_answer": {"count": 5, "marks_each": 6},
            "essay": {"count": 3, "marks_each": 10, "choice": "answer_any_2"}
        },

        "difficulty_distribution": {"easy": 20, "medium": 50, "hard": 30}
    },
    "midterm": {
        "total_marks": 50,
        "duration_minutes": 90,
        "units_covered": [1, 2, 3],  # First 3 units typically
        "question_distribution": {
            "mcq": {"count": 15, "marks_each": 2},
            "short_answer": {"count": 4, "marks_each": 5}
        },

        "difficulty_distribution": {"easy": 30, "medium": 50, "hard": 20}
    },
    "quiz": {
        "total_marks": 20,
        "duration_minutes": 30,
        "units_covered": None,  # Specified by faculty
        "question_distribution": {
            "mcq": {"count": 10, "marks_each": 2}
        },

        "difficulty_distribution": {"easy": 40, "medium": 50, "hard": 10}
    },
    "assignment": {
        # No preset - faculty must configure everything
        "requires_manual_config": True
    }
}

class RubricService:
    
    def get_preset(self, exam_type: str) -> Dict:
        """Get preset configuration for exam type"""
        return EXAM_PRESETS.get(exam_type, {})
    
    def create_rubric(
        self,
        db: Session,
        name: str,
        subject_id: int,
        exam_type: str,
        question_distribution: Optional[Dict],
        co_distribution: Optional[Dict],
        lo_distribution: Optional[Dict] = None,

        difficulty_distribution: Optional[Dict] = None,
        units_covered: Optional[List[int]] = None,
        total_marks: Optional[int] = None,
        duration_minutes: Optional[int] = None,
        assignment_config: Optional[Dict] = None
    ) -> rubric_models.Rubric:
        """
        Create rubric with:
        1. Apply preset defaults for exam type
        2. Override with user-provided values
        3. Validate CO distribution totals 100%
        4. Auto-derive Bloom's from COs if not provided
        """
        print(f"DEBUG: Creating Rubric. Name={name}")
        
        # Get preset
        preset = self.get_preset(exam_type)
        
        # Validate CO distribution
        if co_distribution:
            total_percentage = sum(float(v) for v in co_distribution.values())
            if abs(total_percentage - 100) > 0.1: # Allow small float error
                raise ValueError(f"CO distribution must total 100% (got {total_percentage}%)")
        
        # Auto-derive Bloom's if not provided and we have COs

            
        # Create rubric
        rubric_id = str(uuid.uuid4())
        
        # Prepare distributions merged with presets if needed (though existing logic uses overrides primarily)
        # For simplicity, if not provided, we might rely on GenerationService to default, 
        # or we enforce they are provided for non-assignment types.
        
        final_q_dist = question_distribution or preset.get("question_distribution")
        final_diff_dist = difficulty_distribution or preset.get("difficulty_distribution")

        rubric = rubric_models.Rubric(
            id=rubric_id,
            title=name,
            name=name,  # Legacy column, must be set for DB NOT NULL constraint
            subject_id=subject_id,
            exam_type=exam_type,  # Store as plain string
            total_marks=total_marks or preset.get("total_marks", 100),
            duration=duration_minutes or preset.get("duration_minutes", 180),
            units_covered=json.dumps(units_covered) if units_covered else json.dumps(preset.get("units_covered", [])),
            sections=json.dumps(final_q_dist) if final_q_dist else None,
            co_distribution=json.dumps(co_distribution) if co_distribution else None,
            difficulty_distribution=json.dumps(final_diff_dist) if final_diff_dist else None,
            created_at=datetime.utcnow(),
            status="ready"
        )
        # Serialize and set optional fields
        if hasattr(rubric, 'lo_distribution') and lo_distribution:
             rubric.lo_distribution = json.dumps(lo_distribution)
        if hasattr(rubric, 'assignment_config') and assignment_config:
             rubric.assignment_config = json.dumps(assignment_config)

        db.add(rubric)
        db.commit()
        db.refresh(rubric)
        return rubric
    


rubric_service = RubricService()
