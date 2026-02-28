import asyncio
from app.models import database
from app.models.vetting_models import GeneratedQuestion

def test():
    db = database.SessionLocal()
    try:
        rubric_id = "2f6be0d2-9996-41dd-8767-d173614d7b3f"
        batch = db.query(database.GeneratedBatch).filter(
            database.GeneratedBatch.rubric_id == rubric_id
        ).order_by(database.GeneratedBatch.generated_at.desc()).first()
        
        if not batch:
            print("No batch found")
            return
            
        print("Batch ID:", batch.id)
        
        # Test Query with imported model directly
        questions = db.query(GeneratedQuestion).filter(
            GeneratedQuestion.batch_id == batch.id,
        ).all()
        
        print(f"Total questions found (any status): {len(questions)}")
        
        for idx, q in enumerate(questions[:2]):
            print(f"Q{idx} Status: {q.status}")
            print(f"Q{idx} Text:", q.question_text)
            
    except Exception as e:
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test()
