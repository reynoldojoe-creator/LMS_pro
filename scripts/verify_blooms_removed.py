import sys
import os
import sqlite3
import asyncio
from unittest.mock import MagicMock

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))

from app.models import database
from app.services.topic_actions_service import TopicActionsService
from app.services.llm_service import LLMService

async def verify_blooms_removed():
    print("--- Verifying Bloom's Taxonomy Removal ---")
    
    # 1. Database Schema Check
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    db_path = os.path.join(base_dir, "backend/data", "lms_simats.db")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check Questions Table
    cursor.execute("PRAGMA table_info(questions)")
    columns = [row[1] for row in cursor.fetchall()]
    
    if "bloom_level" in columns:
        print("[FAIL] bloom_level still exists in questions table")
    else:
        print("[PASS] bloom_level removed from questions table")
        
    if "difficulty" in columns:
        print("[PASS] difficulty exists in questions table")
    else:
        print("[FAIL] difficulty missing in questions table")

    # Check Course Outcomes Table
    cursor.execute("PRAGMA table_info(course_outcomes)")
    co_columns = [row[1] for row in cursor.fetchall()]
    if "bloom_level" in co_columns:
        print("[FAIL] bloom_level still exists in course_outcomes table")
    else:
        print("[PASS] bloom_level removed from course_outcomes table")
        
    conn.close()

    # 2. Service Logic Check (Method Signature)
    # We can't easily check method signature at runtime without inspection, but we can try to call it
    # and see if it accepts bloom_level (it shouldn't)
    
    service = TopicActionsService()
    
    # Mock dependencies to avoid actual LLM calls
    service.llm_service.generate_response = MagicMock(return_value='{"questions": [{"question_text": "Test Q", "options": {"A": "1", "B": "2"}, "correct_answer": "A", "difficulty": "medium"}]}')
    service.rag_service.retrieve_context = MagicMock(return_value="Context")
    service._get_topic_with_cos = MagicMock(return_value={"id": 1, "name": "Test Topic", "co_mappings": ["CO1"]})
    service._get_sample_questions = MagicMock(return_value=[])
    
    print("\n--- Testing Service Method Signature ---")
    try:
        # Intentionally passing bloom_level to see if it fails (it should if we removed it from definition)
        # Wait, Python accepts kwargs if **kwargs used, but we defined explicit args.
        # If we removed it, passing it as keyword arg will raise TypeError.
        try:
            await service.quick_generate_questions(
                db=MagicMock(),
                subject_id=1,
                topic_id=1,
                question_type="mcq",
                count=1,
                difficulty="medium",
                bloom_level="Understand" # This should cause error
            )
            print("[FAIL] Service accepted bloom_level argument (it should have been removed)")
        except TypeError as e:
            if "unexpected keyword argument 'bloom_level'" in str(e):
                print("[PASS] Service correctly rejected bloom_level argument")
            else:
                print(f"[WARN] Service raised TypeError but maybe not for bloom_level: {e}")
                
    except Exception as e:
        print(f"[ERROR] Service check failed with unexpected error: {e}")

    print("\n--- Verification Complete ---")

if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(verify_blooms_removed())
