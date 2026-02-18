import asyncio
import time
import sys
import os
import logging

# Setup path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.services.topic_actions_service import topic_actions_service
from app.models import database

# Configure logging to see RAG retrieval info
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app.services.topic_actions_service")
logger.setLevel(logging.INFO)

async def test_generation():
    print("--- Starting End-to-End Generation Test ---")
    
    # Setup DB session
    db = database.SessionLocal()
    
    try:
        # Configuration
        SUBJECT_ID = 7   # ADAA (contains SwEng topics per previous finding)
        TOPIC_ID = 11998 # "Waterfall Model"
        QUESTION_TYPE = "short_answer"
        COUNT = 1
        
        print(f"Target: Subject {SUBJECT_ID}, Topic {TOPIC_ID}, Type {QUESTION_TYPE}")
        
        # Start Timer
        start_time = time.time()
        
        # Call Service
        result = await topic_actions_service.quick_generate_questions(
            db=db,
            subject_id=SUBJECT_ID,
            topic_id=TOPIC_ID,
            question_type=QUESTION_TYPE,
            count=COUNT,
            difficulty="medium",
            bloom_level="Understand"
        )
        
        # End Timer
        end_time = time.time()
        duration = end_time - start_time
        
        # Output Results
        print("\n--- Test Results ---")
        print(f"Time Taken: {duration:.4f} seconds")
        
        if duration < 10:
            print("[PASS] Time is under 10 seconds.")
        else:
            print("[FAIL] Time exceeded 10 seconds.")
            
        questions = result.get("questions", [])
        if questions:
            q = questions[0]
            print(f"\nGenerated Question:\n{q.question_text}")
            print(f"Correct Answer/Key:\n{q.correct_answer}")
            
            # Simple content check (manual mostly, but we can look for keywords)
            keywords = ["waterfall", "phase", "requirement", "design"]
            text_lower = q.question_text.lower()
            if any(k in text_lower for k in keywords):
                 print("[PASS] Question contains relevant keywords.")
            else:
                 print("[WARN] Question might be generic.")
        else:
            print("[FAIL] No questions generated.")
            
    except Exception as e:
        print(f"[ERROR] Test failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(test_generation())
