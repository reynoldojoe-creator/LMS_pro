# Checking database.py for Rubric definition before editing rubric_models.py
# If it's not here, I'll check database.py.
from sqlalchemy.orm import relationship
import enum
from datetime import datetime
from .database import Base

class ExamType(enum.Enum):
    FINAL = "final"
    MIDTERM = "midterm"
    QUIZ = "quiz"
    ASSIGNMENT = "assignment"

# Check if Rubric is already in registry to avoid double registration
# We now defined it in database.py to fix circular imports.
# This file can just import it or be deprecated.
if "Rubric" in Base.registry._class_registry:
    Rubric = Base.registry._class_registry["Rubric"]
else:
    # If for some reason it's not there (standalone usage), define it?
    # Better to raise error or just rely on database.py
    from .database import Rubric
