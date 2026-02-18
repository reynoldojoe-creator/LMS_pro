import sys
import os
import json
import logging

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app.services.question_validator import QuestionValidator

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_validation():
    validator = QuestionValidator()
    
    print("\n--- 1. Testing Valid MCQ ---")
    valid_mcq = {
        "question_text": "What is the time complexity of Binary Search?",
        "question_type": "MCQ",
        "options": {
            "A": "O(n)",
            "B": "O(log n)",
            "C": "O(n^2)",
            "D": "O(1)"
        },
        "correct_answer": "B",
        "bloom_level": "Understand",
        "difficulty": "Medium",
        "marks": 1
    }
    # Mock context
    context = "Binary Search is a search algorithm that finds the position of a target value within a sorted array. Binary search compares the target value to the middle element of the array. The time complexity of binary search is O(log n)."
    
    result = validator.validate_question(valid_mcq, context, llm_check=True)
    print(f"Result: {result.get('decision')} (Status: {result.get('status')})")
    if result.get("decision") == "approve":
        print("[PASS] Valid MCQ passed.")
    else:
        print(f"[FAIL] Valid MCQ rejected: {result}")

    print("\n--- 2. Testing Invalid MCQ (Duplicate Options) ---")
    invalid_mcq = valid_mcq.copy()
    invalid_mcq["options"] = {
        "A": "O(n)",
        "B": "O(log n)",
        "C": "O(n)", # Duplicate
        "D": "O(1)"
    }
    result = validator.validate_question(invalid_mcq, context, llm_check=False) # Skip LLM for speed
    if result.get("decision") == "reject" and "Rule checks failed" in result.get("reason"):
        print("[PASS] Invalid MCQ rejected correctly.")
    else:
        print(f"[FAIL] Invalid MCQ not rejected correctly: {result}")

    print("\n--- 3. Testing Similarity Check ---")
    existing_questions = [
        "Explain the time complexity of Binary Search.",
        "How fast is Binary Search?"
    ]
    # High similarity expected
    new_q = "What is the time complexity of Binary Search algorithm?" 
    
    # We expose the check_similarity method directly for testing
    sim_score = validator.check_similarity(new_q, existing_questions)
    print(f"Similarity Score: {sim_score:.4f}")
    if sim_score > 0.8:
        print("[PASS] High similarity detected.")
    else:
        print(f"[FAIL] Similarity check underperformed (Score: {sim_score})")

if __name__ == "__main__":
    test_validation()
