import requests
import time
import os

BASE_URL = "http://localhost:8000"

def test_health():
    print("\n--- Testing Health Check ---")
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")

def test_subject_creation():
    print("\n--- Testing Subject Creation ---")
    # Mock file upload
    file_content = b"This is a dummy syllabus content for testing."
    files = {'file': ('syllabus.pdf', file_content, 'application/pdf')}
    data = {
        'name': 'Test Subject',
        'code': f'TEST{int(time.time())}', # Unique code
        'department': 'Computer Science',
        'credits': 4
    }
    try:
        response = requests.post(f"{BASE_URL}/subjects", data=data, files=files)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print(f"Response: {response.json()}")
            return response.json().get('subject_code') # Return code for further tests if needed
        else:
            print(f"Error Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
    return None

def test_async_generation():
    print("\n--- Testing Async Generation ---")
    # Need a valid subject ID from DB, hardcoding 1 for test or fetching
    # For now, let's assume subject ID 1 exists (or use the one created above if we parse return correctly)
    
    payload = {
        "subject_id": 1, 
        "question_type": "mcq",
        "bloom_level": "apply",
        "difficulty": "medium",
        "count": 2
    }
    
    try:
        response = requests.post(f"{BASE_URL}/generate/async", json=payload)
        print(f"Start Generation Status: {response.status_code}")
        
        if response.status_code == 200:
            batch_id = response.json().get("batch_id")
            print(f"Batch ID: {batch_id}")
            
            # Poll status
            for _ in range(5):
                time.sleep(1)
                status_res = requests.get(f"{BASE_URL}/generate/{batch_id}/status")
                print(f"Polling Status: {status_res.json()}")
                if status_res.json().get("status") in ["completed", "failed"]:
                    break
        else:
            print(f"Error Response: {response.text}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_health()
    # Uncomment to run state-changing tests
    # created_code = test_subject_creation()
    # test_async_generation()
