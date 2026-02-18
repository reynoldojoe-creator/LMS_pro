
"""
Test script for Reports & Analytics API
"""
import requests
import json
import sys
import os
from datetime import datetime

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.models import database, vetting_models
from sqlalchemy.orm import Session

BASE_URL = "http://localhost:8000"

def seed_data():
    print("Seeding data for reports...")
    db = database.SessionLocal()
    try:
        # Create Subject
        subject = db.query(database.Subject).filter(database.Subject.code == "REP101").first()
        if not subject:
            subject = database.Subject(name="Reports Test Subject", code="REP101")
            db.add(subject)
            db.commit()
            db.refresh(subject)
            
        # Create COs
        cos = ["CO1", "CO2", "CO3"]
        for code in cos:
            if not db.query(database.CourseOutcome).filter(database.CourseOutcome.subject_id == subject.id, database.CourseOutcome.code == code).first():
                db.add(database.CourseOutcome(subject_id=subject.id, code=code, description=f"Test {code}"))
        db.commit()
        
        # Create Topics
        unit = db.query(database.Unit).filter(database.Unit.subject_id == subject.id).first()
        if not unit:
            unit = database.Unit(subject_id=subject.id, number=1, title="Unit 1")
            db.add(unit)
            db.commit()
            
        topic = db.query(database.Topic).filter(database.Topic.unit_id == unit.id).first()
        if not topic:
            topic = database.Topic(unit_id=unit.id, name="Report Analytics Topic")
            db.add(topic)
            db.commit()
            db.refresh(topic)

        # Create Batch
        batch = vetting_models.GeneratedBatch(
            id=f"batch_rep_{int(datetime.now().timestamp())}",
            subject_id=subject.id,
            total_questions=10,
            status="in_progress"
        )
        db.add(batch)
        db.commit()
        
        # Create Questions with mixed status
        statuses = ["approved", "approved", "approved", "rejected", "rejected", "pending", "pending"]
        blooms = ["Remember", "Understand", "Apply", "Analyze", "Remember", "Understand", "Apply"]
        
        for i, status in enumerate(statuses):
            mappings = []
            if i % 2 == 0:
                mappings.append({"co_code": "CO1", "intensity": 3})
            if i % 3 == 0:
                 mappings.append({"co_code": "CO2", "intensity": 2})
                 
            q = vetting_models.GeneratedQuestion(
                id=f"q_rep_{i}_{int(datetime.now().timestamp())}",
                batch_id=batch.id,
                question_text=f"Test Question {i}",
                question_type="short_answer",
                status=status,
                bloom_level=blooms[i],
                topic_id=topic.id,
                co_mappings=json.dumps(mappings),
                vetted_by="vetter1" if status != "pending" else None
            )
            db.add(q)
            
        db.commit()
        print(f"Seeded {len(statuses)} questions for Subject {subject.id}")
        return subject.id
        
    finally:
        db.close()

def test_reports(subject_id):
    print("\n--- Testing Reports API ---")
    
    # Overview
    print("\n1. Overview Stats:")
    try:
        resp = requests.get(f"{BASE_URL}/reports/overview?subject_id={subject_id}")
        if resp.status_code == 200:
            print(json.dumps(resp.json(), indent=2))
        else:
            print(f"Failed: {resp.text}")
    except Exception as e:
        print(f"Error: {e}")

    # CO Coverage
    print("\n2. CO Coverage:")
    try:
        resp = requests.get(f"{BASE_URL}/reports/co-coverage/{subject_id}")
        if resp.status_code == 200:
            print(json.dumps(resp.json(), indent=2))
        else:
            print(f"Failed: {resp.text}")
    except Exception as e:
        print(f"Error: {e}")
        
    # Blooms
    print("\n3. Bloom's Distribution:")
    try:
        resp = requests.get(f"{BASE_URL}/reports/blooms-distribution/{subject_id}")
        if resp.status_code == 200:
            print(json.dumps(resp.json(), indent=2))
        else:
            print(f"Failed: {resp.text}")
    except Exception as e:
        print(f"Error: {e}")

    # Topics
    print("\n4. Topic Coverage:")
    try:
        resp = requests.get(f"{BASE_URL}/reports/topic-coverage/{subject_id}")
        if resp.status_code == 200:
            print(json.dumps(resp.json(), indent=2))
        else:
            print(f"Failed: {resp.text}")
    except Exception as e:
        print(f"Error: {e}")

    # Vetter Stats
    print("\n5. Vetter Stats:")
    try:
        resp = requests.get(f"{BASE_URL}/reports/vetter-stats")
        if resp.status_code == 200:
            print(json.dumps(resp.json(), indent=2))
        else:
            print(f"Failed: {resp.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    sid = seed_data()
    test_reports(sid)
