import requests
import json
import os

BASE_URL = "http://localhost:8000"

def test_quick_generate():
    """Test quick question generation"""
    print("Testing Quick Generate...")
    
    # Assuming we have subject_id=1 and topic_id=1 from previous setup
    data = {
        'question_type': 'mcq',
        'count': 3,
        'difficulty': 'medium',
        'bloom_level': 'Understand'
    }
    
    response = requests.post(f"{BASE_URL}/subjects/1/topics/1/quick-generate", data=data)
    
    if response.status_code == 200:
        print("✅ Quick generate successful!")
        result = response.json()
        print(f"Generated {len(result.get('questions', []))} questions")
        print(f"Few-shot examples used: {result.get('metadata', {}).get('few_shot_examples_used', 0)}")
        print(json.dumps(result, indent=2))
    else:
        print(f"❌ Failed: {response.status_code}")
        print(response.text)

def test_upload_sample_questions():
    """Test uploading sample questions"""
    print("\nTesting Upload Sample Questions...")
    
    # Create a sample CSV file
    csv_content = """question,answer
What is Python?,A programming language
What is FastAPI?,A web framework
What is SQLAlchemy?,An ORM"""
    
    with open("sample_questions.csv", "w") as f:
        f.write(csv_content)
    
    try:
        files = {'file': ('sample_questions.csv', open('sample_questions.csv', 'rb'), 'text/csv')}
        data = {'question_type': 'short_answer'}
        
        response = requests.post(f"{BASE_URL}/subjects/1/topics/1/upload-questions", data=data, files=files)
        
        if response.status_code == 200:
            print("✅ Upload sample questions successful!")
            print(json.dumps(response.json(), indent=2))
        else:
            print(f"❌ Failed: {response.status_code}")
            print(response.text)
    finally:
        if os.path.exists("sample_questions.csv"):
            os.remove("sample_questions.csv")

def test_upload_notes():
    """Test uploading notes"""
    print("\nTesting Upload Notes...")
    
    # Create a sample notes file
    notes_content = """Python Programming Notes
    
Python is a high-level, interpreted programming language.
It emphasizes code readability and simplicity.
Key features include dynamic typing, automatic memory management, and extensive standard library."""
    
    with open("sample_notes.txt", "w") as f:
        f.write(notes_content)
    
    try:
        files = {'file': ('sample_notes.txt', open('sample_notes.txt', 'rb'), 'text/plain')}
        
        response = requests.post(f"{BASE_URL}/subjects/1/topics/1/upload-notes", files=files)
        
        if response.status_code == 200:
            print("✅ Upload notes successful!")
            print(json.dumps(response.json(), indent=2))
        else:
            print(f"❌ Failed: {response.status_code}")
            print(response.text)
    finally:
        if os.path.exists("sample_notes.txt"):
            os.remove("sample_notes.txt")

def test_trigger_training():
    """Test mock training endpoint"""
    print("\nTesting Trigger Training...")
    
    response = requests.post(f"{BASE_URL}/subjects/1/topics/1/train")
    
    if response.status_code == 200:
        print("✅ Training trigger successful!")
        print(json.dumps(response.json(), indent=2))
    else:
        print(f"❌ Failed: {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    print("=" * 60)
    print("Testing Topic-Level Actions")
    print("=" * 60)
    
    # Test in sequence
    test_upload_sample_questions()
    test_upload_notes()
    test_trigger_training()
    test_quick_generate()
    
    print("\n" + "=" * 60)
    print("Testing Complete")
    print("=" * 60)
