import asyncio
from app.models import database

def test():
    db = database.SessionLocal()
    try:
        rubric_id = "2f6be0d2-9996-41dd-8767-d173614d7b3f"
        
        # Test Query with Question model directly
        questions = db.query(database.Question).filter(
            database.Question.rubric_id == rubric_id,
        ).all()
        
        print(f"Total Question rows found by rubric_id: {len(questions)}")
        
        # Test Query with batch_id
        batch = db.query(database.GeneratedBatch).filter(database.GeneratedBatch.rubric_id == rubric_id).first()
        if batch:
            questions_by_batch = db.query(database.Question).filter(database.Question.batch_id == batch.id).all()
            print(f"Total Question rows found by batch_id: {len(questions_by_batch)}")
            
    finally:
        db.close()

if __name__ == "__main__":
    test()
