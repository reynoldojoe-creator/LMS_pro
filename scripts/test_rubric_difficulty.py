import sys
import os
import json
import logging

# Setup path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.models import database
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("test_rubric")

def test_rubric_item_creation():
    print("--- Testing Rubric Item Creation with Difficulty ---")
    
    # Setup DB
    _BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    _DB_PATH = os.path.join(_BASE_DIR, "backend/data", "lms_simats.db")
    SQLALCHEMY_DATABASE_URL = f"sqlite:///{_DB_PATH}"
    
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    # Ensure tables exist (RubricItem might be new)
    database.Base.metadata.create_all(bind=engine)
    
    try:
        # Mock Request Data
        import uuid
        rubric_id = str(uuid.uuid4())
        
        # Sections configuration with difficulty
        sections_config = {
            "mcq": {"count": 10, "marks_each": 1, "difficulty": "easy"},
            "short_answer": {"count": 5, "marks_each": 5, "difficulty": "medium"},
            "essay": {"count": 2, "marks_each": 10, "difficulty": "hard"}
        }
        
        # manual insertion similar to endpoint logic
        rubric = database.Rubric(
            id=rubric_id,
            title="Test Difficulty Rubric",
            subject_id=1, # Assuming logic needs existing subject, or we bypass foreign key if sqlite not enforcing
            exam_type="final",
            sections=json.dumps(sections_config),
            status="test"
        )
        db.add(rubric)
        db.flush() # get ID ready
        
        # Populate RubricItems
        print("Populating RubricItems...")
        for q_type, config in sections_config.items():
            item = database.RubricItem(
                rubric_id=rubric.id,
                question_type=q_type,
                marks=config.get("marks_each", 1),
                count=config.get("count", 0),
                difficulty=config.get("difficulty", "medium")
            )
            db.add(item)
        
        db.commit()
        
        # Verify
        items = db.query(database.RubricItem).filter(database.RubricItem.rubric_id == rubric_id).all()
        print(f"Created {len(items)} RubricItems")
        
        success = True
        for item in items:
            expected = sections_config[item.question_type]["difficulty"]
            print(f"Type: {item.question_type}, Difficulty: {item.difficulty}, Expected: {expected}")
            if item.difficulty != expected:
                print(f"[FAIL] details mismatch for {item.question_type}")
                success = False
        
        if success and len(items) == 3:
            print("[PASS] RubricItems created correctly with difficulty.")
        else:
            print("[FAIL] RubricItem creation failed.")
            
    except Exception as e:
        print(f"[ERROR] Test failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        # Cleanup
        try:
            # db.query(database.RubricItem).filter(database.RubricItem.rubric_id == rubric_id).delete()
            # db.query(database.Rubric).filter(database.Rubric.id == rubric_id).delete()
            # db.commit()
            pass
        except:
            pass
        db.close()

if __name__ == "__main__":
    test_rubric_item_creation()
