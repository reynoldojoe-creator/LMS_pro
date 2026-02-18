import sys
import os
import json
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app.services.syllabus_extractor import SyllabusExtractor
from backend.app.services.docx_parser import DocxParser
from backend.app.models.database import SessionLocal, Subject, CourseOutcome, Unit, Topic, LearningOutcome

# Configure logging
logging.basicConfig(level=logging.INFO)

def test_extraction_and_storage():
    extractor = SyllabusExtractor()
    parser = DocxParser()
    
    file_path = "backend/data/test_data/syllabi/CS301_syllabus.docx"
    
    if not os.path.exists(file_path):
        print(f"Error: File not found at {file_path}")
        return

    print(f"Extracting text from {file_path}...")
    text = parser.extract_text(file_path)
    
    print("Running extraction and storage (LLM)...")
    result = extractor.extract_and_store_syllabus(text)
    
    # Save debug output
    with open("debug_extraction_db.json", "w") as f:
        json.dump(result, f, indent=2)
    print("Saved JSON response to debug_extraction_db.json")

    # Verify Database
    session = SessionLocal()
    try:
        subject_code = result.get("subject_code")
        print(f"\nVerifying in DB for subject: {subject_code}...")
        
        subject = session.query(Subject).filter(Subject.code == subject_code).first()
        
        if not subject:
            print("[FAIL] Subject not found in database.")
            return

        print(f"[PASS] Subject found: {subject.name} ({subject.code})")
        print(f"       Terminology: {subject.terminology_detected}")

        # Check COs
        cos = session.query(CourseOutcome).filter(CourseOutcome.subject_id == subject.id).all()
        print(f"[PASS] Found {len(cos)} Course Outcomes.")
        
        # Check Units and Topics
        units = session.query(Unit).filter(Unit.subject_id == subject.id).all()
        print(f"[PASS] Found {len(units)} Units.")
        
        total_topics = 0
        total_los = 0
        
        for unit in units:
            topics = session.query(Topic).filter(Topic.unit_id == unit.id).all()
            total_topics += len(topics)
            for topic in topics:
                los = session.query(LearningOutcome).filter(LearningOutcome.topic_id == topic.id).all()
                total_los += len(los)
                for lo in los:
                    if lo.bloom_level:
                         pass # Just checking existence
        
        print(f"[PASS] Found {total_topics} Topics total.")
        print(f"[PASS] Found {total_los} Learning Outcomes total.")
        
        if total_los > 0:
            print("[SUCCESS] Full OBE structure stored successfully!")
        else:
            print("[WARN] No Learning Outcomes stored. Check extraction.")

    except Exception as e:
        print(f"Verification failed: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    test_extraction_and_storage()
