import sys
import os
import json
import logging

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app.services.syllabus_extractor import SyllabusExtractor
from backend.app.services.docx_parser import DocxParser

# Configure logging
logging.basicConfig(level=logging.INFO)

def test_extraction():
    extractor = SyllabusExtractor()
    parser = DocxParser()
    
    file_path = "backend/data/test_data/syllabi/CS301_syllabus.docx"
    
    if not os.path.exists(file_path):
        print(f"Error: File not found at {file_path}")
        return

    print(f"Extracting text from {file_path}...")
    text = parser.extract_text(file_path)
    
    print("Running LLM extraction (this may take a moment)...")
    result = extractor.extract_structured_syllabus(text)
    
    with open("debug_extraction.json", "w") as f:
        json.dump(result, f, indent=2)
    print("Saved result to debug_extraction.json")

    print("\n--- Extracted Data ---")
    # print(json.dumps(result, indent=2)) # Commented out to reduce noise
    
    # Validation
    if "course_outcomes" in result and len(result["course_outcomes"]) > 0:
        print("\n[PASS] Course Outcomes found.")
    else:
        print("\n[FAIL] No Course Outcomes found.")

    if "units" in result and len(result["units"]) > 0:
        first_unit = result["units"][0]
        if "learning_outcomes" in first_unit:
             print("[PASS] Learning Outcomes found in units.")
        else:
             print("[FAIL] No Learning Outcomes found in units.")
    else:
        print("\n[FAIL] No units found.")

if __name__ == "__main__":
    test_extraction()
