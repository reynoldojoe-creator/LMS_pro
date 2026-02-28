import asyncio
from app.db.setup import SessionLocal
from app.services.rag_service import rag_service
from app.services.topic_actions_service import topic_actions_service

async def test_generation():
    db = SessionLocal()
    try:
        # Generate 2 MCQs for topic 10 (Clinical Protocols)
        # This will test if pre_retrieved_context=None correctly forces per-question retrieval
        result = await topic_actions_service.quick_generate_questions(
            db=db,
            subject_id=12,  # Fixed Prosthodontics
            topic_id=10,    # Clinical Protocols
            question_type="mcq",
            count=2,
            difficulty="medium",
            pre_retrieved_context=None
        )
        print("Generated questions:", len(result.get("questions", [])))
        
        for idx, q in enumerate(result.get("questions", [])):
            print(f"\n--- Question {idx+1} ---")
            print(q.get("question_text"))
            context = q.get("source_context", [])
            print(f"Number of retrieved chunks for this question: {len(context)}")
            
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(test_generation())
