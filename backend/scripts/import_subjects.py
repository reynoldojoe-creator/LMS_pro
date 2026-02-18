import sys
import os
import asyncio
from sqlalchemy.orm import Session
from datetime import datetime

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models import database, schemas
from app.services.syllabus_extractor import SyllabusExtractor
from app.services.rag_service import RAGService
from app.services.question_generator import QuestionGenerator

# Initialize services
syllabus_extractor = SyllabusExtractor()
rag_service = RAGService()

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data", "test_data")
SYLLABI_DIR = os.path.join(DATA_DIR, "syllabi")
MATERIALS_DIR = os.path.join(DATA_DIR, "course_materials")

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

def import_subject(subject_code: str, db: Session):
    print(f"Processing subject: {subject_code}")
    
    # 1. Check/Create Subject
    subject = db.query(database.Subject).filter(database.Subject.code == subject_code).first()
    if not subject:
        print(f"Creating placeholder subject for {subject_code}")
        subject = database.Subject(
            name=f"Imported {subject_code}",
            code=subject_code,
            terminology_detected="Course Objectives"
        )
        db.add(subject)
        db.commit()
        db.refresh(subject)
    else:
        print(f"Subject {subject_code} already exists (ID: {subject.id})")

    # 2. Extract Syllabus
    syllabus_file = os.path.join(SYLLABI_DIR, f"{subject_code}_syllabus.docx")
    if not os.path.exists(syllabus_file):
        # Try .txt fallback
        syllabus_file = os.path.join(SYLLABI_DIR, f"{subject_code}_syllabus.txt")
    
    if os.path.exists(syllabus_file):
        print(f"Extracting syllabus from {syllabus_file}...")
        try:
            result = syllabus_extractor.extract_and_store_syllabus(syllabus_file, subject.id)
            
            # Update Subject Name if extracted
            if result.get("subject_name") and result.get("subject_name") != f"Imported {subject_code}":
                subject.name = result.get("subject_name")
                db.commit()
                print(f"Updated subject name to: {subject.name}")
                
        except Exception as e:
            print(f"Error extracting syllabus: {e}")
    else:
        print(f"No syllabus file found for {subject_code}")

    # 3. Index Course Materials
    subject_materials_dir = os.path.join(MATERIALS_DIR, subject_code)
    if os.path.exists(subject_materials_dir):
        print(f"Indexing materials from {subject_materials_dir}...")
        for filename in os.listdir(subject_materials_dir):
            if filename.lower().endswith(('.pdf', '.docx', '.txt')):
                file_path = os.path.join(subject_materials_dir, filename)
                print(f"  Indexing {filename}...")
                try:
                    rag_service.index_document(file_path, str(subject.id))
                except Exception as e:
                    print(f"  Error indexing {filename}: {e}")
    else:
        print(f"No course materials directory found for {subject_code}")

    # 4. Index Syllabus itself (Optional but good for RAG context)
    if os.path.exists(syllabus_file):
         print(f"Indexing syllabus file for RAG context...")
         try:
            rag_service.index_document(syllabus_file, str(subject.id))
         except Exception as e:
            print(f"Error indexing syllabus for RAG: {e}")

    print(f"Completed processing {subject_code}\n")

def main():
    database.init_db()
    db = next(get_db())
    
    # Iterate through folders in course_materials to find subjects
    # Or iterate syllabi files?
    # User said folder structure: course_materials/CODE
    
    if not os.path.exists(MATERIALS_DIR):
        print(f"Error: {MATERIALS_DIR} not found")
        return

    subject_codes = [d for d in os.listdir(MATERIALS_DIR) if os.path.isdir(os.path.join(MATERIALS_DIR, d))]
    
    if not subject_codes:
        print("No subject folders found in course_materials. Checking syllabi...")
        # Fallback: exact codes from syllabi filenames
        for f in os.listdir(SYLLABI_DIR):
            if f.endswith("_syllabus.docx"):
                code = f.replace("_syllabus.docx", "")
                if code not in subject_codes:
                    subject_codes.append(code)

    print(f"Found subjects: {subject_codes}")

    for code in subject_codes:
        import_subject(code, db)

if __name__ == "__main__":
    main()
