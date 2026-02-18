import requests
import json
import os

BASE_URL = "http://localhost:8000"

def test_create_subject():
    print("Testing Subject Creation Flow...")
    
    # 1. Create a dummy syllabus file
    syllabus_content = "This is a dummy syllabus for Introduction to Testing.\n\nCourse Objectives:\n1. Understand testing.\n2. Apply testing.\n\nUnit 1: Basics\nTopics: Unit Testing, Integration Testing."
    with open("dummy_syllabus.txt", "w") as f:
        f.write(syllabus_content)
        
    try:
        # 2. Send POST request
        print("Sending request...")
        files = {'syllabus_file': ('dummy_syllabus.txt', open('dummy_syllabus.txt', 'rb'), 'text/plain')}
        data = {
            'name': 'Introduction to Testing',
            'code': 'TEST101',
            'department': 'CSE',
            'credits': 4,
            'paper_type': 'core'
        }
        
        response = requests.post(f"{BASE_URL}/subjects", data=data, files=files)
        
        if response.status_code == 200:
            print("✅ Subject created successfully!")
            print(json.dumps(response.json(), indent=2))
            subject_id = response.json()['id']
            return subject_id
        else:
            print(f"❌ Failed to create subject: {response.status_code}")
            print(response.text)
            return None
            
    finally:
        if os.path.exists("dummy_syllabus.txt"):
            os.remove("dummy_syllabus.txt")

def test_get_subject(subject_id):
    if not subject_id:
        return
        
    print(f"\nTesting Get Subject {subject_id}...")
    response = requests.get(f"{BASE_URL}/subjects/{subject_id}")
    
    if response.status_code == 200:
        print("✅ Subject retrieval successful!")
        print(json.dumps(response.json(), indent=2))
    else:
        print(f"❌ Failed to get subject: {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    sid = test_create_subject()
    test_get_subject(sid)
