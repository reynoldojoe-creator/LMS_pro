import sys
import os
import asyncio
from sqlalchemy.orm import Session
import logging

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models import database
from app.services.syllabus_extractor import SyllabusExtractor
from app.services.rag_service import RAGService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize
syllabus_extractor = SyllabusExtractor()
rag_service = RAGService()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data", "test_data")
SYLLABI_DIR = os.path.join(DATA_DIR, "syllabi")
MATERIALS_DIR = os.path.join(DATA_DIR, "course_materials")

VALUES_TO_REPAIR = ["ENG101", "PHY201", "CS301"]

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

def repair_subject(subject_code: str, db: Session):
    logger.info(f"--- Repairing {subject_code} ---")
    
    subject = db.query(database.Subject).filter(database.Subject.code == subject_code).first()
    if not subject:
        logger.warning(f"Subject {subject_code} not found in DB. Creating...")
        subject = database.Subject(
             name=f"Repaired {subject_code}",
             code=subject_code,
             terminology_detected="Course Objectives"
        )
        db.add(subject)
        db.commit()
        db.refresh(subject)
    
    # 1. Syllabus Extraction
    # Check if units exist
    if not subject.units:
        logger.info(f"Subject {subject_code} has no units. Attempting extraction...")
        syllabus_file = os.path.join(SYLLABI_DIR, f"{subject_code}_syllabus.docx")
        if not os.path.exists(syllabus_file):
            syllabus_file = os.path.join(SYLLABI_DIR, f"{subject_code}_syllabus.txt")
        
        if os.path.exists(syllabus_file):
            try:
                # Add explicit timeout or retry logic if needed, but here we just call it
                result = syllabus_extractor.extract_and_store_syllabus(syllabus_file, subject.id)
                logger.info(f"Syllabus extracted for {subject_code}")
                # Update name
                if result.get("subject_name"):
                    subject.name = result.get("subject_name")
                    db.commit()
            except Exception as e:
                logger.error(f"Failed to extract syllabus for {subject_code}: {e}")
        else:
            logger.warning(f"No syllabus file found for {subject_code}")
    else:
        logger.info(f"Subject {subject_code} already has units. Skipping extraction.")

    # 2. RAG Indexing
    # We should index regardless, or check if collection exists?
    # VectorStore doesn't easily expose "exists". We'll just re-index. It might duplicate if no ID check.
    # But for now, ensuring data is better than missing.
    subject_materials_dir = os.path.join(MATERIALS_DIR, subject_code)
    if os.path.exists(subject_materials_dir):
        logger.info(f"Indexing materials for {subject_code}...")
        for filename in os.listdir(subject_materials_dir):
            if filename.lower().endswith(('.pdf', '.docx', '.txt')):
                file_path = os.path.join(subject_materials_dir, filename)
                try:
                    rag_service.index_document(file_path, str(subject.id))
                    logger.info(f"Indexed {filename}")
                except Exception as e:
                    logger.error(f"Failed to index {filename}: {e}")
    else:
        logger.warning(f"No materials folder for {subject_code}")

def main():
    database.init_db()
    db = next(get_db())
    
    for code in VALUES_TO_REPAIR:
        repair_subject(code, db)

if __name__ == "__main__":
    main()
