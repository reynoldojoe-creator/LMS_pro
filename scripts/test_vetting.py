import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

import requests
import json
import uuid
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import vetting_models, database, rubric_models

# Database connection
SQLALCHEMY_DATABASE_URL = "sqlite:///backend/data/lms_simats.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

BASE_URL = "http://localhost:8000"

def seed_data():
    """Seed a generated batch and questions for testing"""
    db = SessionLocal()
    try:
        # Create models/tables if not exist
        vetting_models.Base.metadata.create_all(bind=engine)
        
        # Check if batch already exists
        existing = db.query(vetting_models.GeneratedBatch).filter(vetting_models.GeneratedBatch.id == "test-batch-1").first()
        if existing:
            print("Test batch already exists.")
            return

        print("Seeding test batch...")
        
        # Create Batch
        batch = vetting_models.GeneratedBatch(
            id="test-batch-1",
            rubric_id="rubric-1", 
            subject_id=1, 
            generated_by="faculty-1",
            total_questions=2,
            pending_count=2,
            status="pending"
        )
        db.add(batch)
        
        # Create Question 1 (MCQ)
        q1 = vetting_models.GeneratedQuestion(
            id="q-1",
            batch_id="test-batch-1",
            question_text="What is a class?",
            question_type="MCQ",
            options={"A": "Blueprint", "B": "Object", "C": "Method", "D": "Variable"},
            correct_answer="A",
            co_mappings=[{"co_code": "CO1", "intensity": 2}],
            bloom_level="Remember",
            difficulty="Easy",
            marks=2,
            status="pending"
        )
        db.add(q1)
        
        # Create Question 2 (Essay)
        q2 = vetting_models.GeneratedQuestion(
            id="q-2",
            batch_id="test-batch-1",
            question_text="Explain OOP principles.",
            question_type="Essay",
            correct_answer="Encapsulation, Inheritance...",
            co_mappings=[{"co_code": "CO2", "intensity": 3}],
            bloom_level="Understand",
            difficulty="Medium",
            marks=10,
            status="pending"
        )
        db.add(q2)
        
        db.commit()
        print("Seeding complete.")
    except Exception as e:
        print(f"Seeding failed: {e}")
        db.rollback()
    finally:
        db.close()

def test_api():
    print("\nTesting Vetting API...")
    
    # 1. Get Pending Batches
    resp = requests.get(f"{BASE_URL}/vetting/pending")
    print(f"GET /pending: {resp.status_code}")
    if resp.status_code == 200:
        print(json.dumps(resp.json(), indent=2))
        
    # 2. Get Batch Detail
    resp = requests.get(f"{BASE_URL}/vetting/batches/test-batch-1")
    print(f"GET /batches/test-batch-1: {resp.status_code}")
    if resp.status_code == 200:
        data = resp.json()
        print(f"Questions: {len(data['sections']['mcq'])} MCQ, {len(data['sections']['essay'])} Essay")

    # 3. Approve Question
    # Note: Using form data as defined in API
    resp = requests.post(
        f"{BASE_URL}/vetting/q-1/approve", 
        data={"vetter_id": "vetter-1", "co_adjustment": json.dumps([{"co_code": "CO1", "intensity": 3}])}
    )
    print(f"POST /approve q-1: {resp.status_code}")
    if resp.status_code == 200:
        print(resp.json())

    # 4. Reject Question
    resp = requests.post(
        f"{BASE_URL}/vetting/q-2/reject",
        data={"vetter_id": "vetter-1", "category": "ambiguous", "reason": "Too vague", "notes": "Please clarify"}
    )
    print(f"POST /reject q-2: {resp.status_code}")
    if resp.status_code == 200:
        print(resp.json())

    # 5. Check Analytics
    resp = requests.get(f"{BASE_URL}/vetting/analytics")
    print(f"GET /analytics: {resp.status_code}")
    if resp.status_code == 200:
        print(resp.json())

if __name__ == "__main__":
    seed_data()
    test_api()
