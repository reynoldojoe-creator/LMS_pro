import sys
import os
import json
import logging

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app.services.rag_service import RAGService
from backend.app.services.question_generator import QuestionGenerator

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_question_generation():
    rag_service = RAGService()
    generator = QuestionGenerator()
    
    subject_id = "CS301_TEST"
    subject_name = "Data Structures and Algorithms"
    file_path = "backend/data/test_data/syllabi/CS301_syllabus.docx" # Ensure this exists

    if not os.path.exists(file_path):
        print(f"Error: File not found at {file_path}")
        return

    # 1. Index Document (to ensure context exists)
    print(f"Indexing {file_path} for subject {subject_id}...")
    try:
        rag_service.index_document(file_path, subject_id)
        print("Indexing complete.")
    except Exception as e:
        print(f"Indexing failed: {e}")
        return

    # 2. Test MCQ Generation
    print("\n--- Testing MCQ Generation ---")
    try:
        mcq = generator.generate_questions(
            subject_name=subject_name,
            subject_id=subject_id,
            topic="Binary Search",
            question_type="MCQ",
            bloom_level="Apply",
            difficulty="Medium",
            count=1,
            co="CO1",
            lo="LO1.1"
        )
        print(json.dumps(mcq, indent=2))
        
        if "questions" in mcq and len(mcq["questions"]) > 0:
            print("[PASS] MCQ generated.")
        else:
            print("[FAIL] No MCQ generated.")

    except Exception as e:
        print(f"MCQ Generation failed: {e}")

    # 3. Test Short Answer Generation
    print("\n--- Testing Short Answer Generation ---")
    try:
        sa = generator.generate_questions(
            subject_name=subject_name,
            subject_id=subject_id,
            topic="Graph Traversal",
            question_type="short_answer",
            bloom_level="Understand",
            difficulty="Easy",
            count=1,
            marks=5
        )
        print(json.dumps(sa, indent=2))
        
        if "questions" in sa and len(sa["questions"]) > 0:
             print("[PASS] Short Ans generated.")
        else:
             print("[FAIL] No Short Ans generated.")

    except Exception as e:
         print(f"Short Answer Generation failed: {e}")

    # 4. Test Essay Generation
    print("\n--- Testing Essay Generation ---")
    try:
        essay = generator.generate_questions(
            subject_name=subject_name,
            subject_id=subject_id,
            topic="Balanced Trees",
            question_type="essay",
            bloom_level="Analyze",
            difficulty="Hard",
            count=1,
            marks=10
        )
        print(json.dumps(essay, indent=2))
        
        if "questions" in essay and len(essay["questions"]) > 0:
             q = essay["questions"][0]
             if "marking_scheme" in q:
                 print("[PASS] Essay generated with Marking Scheme.")
             else:
                 print("[FAIL] Essay generated but MISSING Marking Scheme.")
        else:
             print("[FAIL] No Essay generated.")

    except Exception as e:
         print(f"Essay Generation failed: {e}")

if __name__ == "__main__":
    test_question_generation()
