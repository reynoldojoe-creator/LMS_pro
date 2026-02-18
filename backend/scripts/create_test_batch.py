import asyncio
import sys
import os

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from backend.app.models import database, vetting_models
from backend.app.services.generation_manager import generation_manager
from sqlalchemy.orm import Session

# Override DB URL for script execution if needed, but SessionLocal usually picks it up. 
# Ensure database.py points to correct DB.

def create_test_batch():
    session = database.SessionLocal()
    try:
        # Create a dummy rubric if not exists or use existing
        rubric = session.query(database.Rubric).first()
        if not rubric:
            print("No rubric found, cannot create test batch linked to rubric.")
            return

        # clean up old test batch
        old_batch_id = f"test_batch_{rubric.id[:5]}"
        existing = session.query(vetting_models.GeneratedBatch).filter_by(id=old_batch_id).first()
        if existing:
             # delete related questions first
             session.query(vetting_models.GeneratedQuestion).filter_by(batch_id=old_batch_id).delete()
             session.delete(existing)
             session.commit()
             print(f"Cleaned up old batch {old_batch_id}")

        batch_id = f"test_batch_{rubric.id[:5]}_v2"
        
        print(f"Creating test batch {batch_id} for Rubric '{rubric.title}'...")
        
        batch = vetting_models.GeneratedBatch(
            id=batch_id,
            rubric_id=str(rubric.id),
            subject_id=rubric.subject_id,
            title=rubric.title,
            generated_by="System Test",
            total_questions=10,
            pending_count=10,
            status="in_progress"
        )
        session.add(batch)
        session.commit()
        print("Batch created successfully with title:", batch.title)
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    create_test_batch()
