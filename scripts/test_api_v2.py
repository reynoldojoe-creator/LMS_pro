import requests
import os
import json
import time

BASE_URL = "http://localhost:8000"

def test_api():
    print("--- Testing LMS-SIMATS API v2 ---")

    # 1. Create Subject with Syllabus
    print("\n1. creating Subject with Syllabus...")
    file_path = "backend/data/test_data/syllabi/CS301_syllabus.docx"
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return

    files = {'file': open(file_path, 'rb')}
    data = {'name': 'Data Structures', 'code': f'CS301_API_{int(time.time())}'} # Unique code
    
    try:
        response = requests.post(f"{BASE_URL}/subjects", data=data, files=files)
        if response.status_code == 200:
            subject_data = response.json()
            print("[PASS] Subject created.")
            # We need the ID, but the current return is SyllabusExtractionResult which might not include ID directly
            # Let's list subjects to get the ID
        else:
            print(f"[FAIL] Create Subject: {response.text}")
            return
    except Exception as e:
        print(f"[FAIL] Connection error: {e}")
        return

    # 2. Get Subject ID
    print("\n2. Fetching Subject ID...")
    response = requests.get(f"{BASE_URL}/subjects")
    subjects = response.json()
    subject_id = None
    for s in subjects:
        if s['code'] == data['code']:
            subject_id = s['id']
            break
    
    if subject_id:
        print(f"[PASS] Subject ID found: {subject_id}")
    else:
        print("[FAIL] Subject not found in list.")
        return

    # 3. Generate Questions
    print("\n3. Generating Questions...")
    gen_payload = {
        "subject_id": subject_id,
        "question_type": "MCQ",
        "bloom_level": "Apply",
        "difficulty": "Medium",
        "count": 1
    }
    response = requests.post(f"{BASE_URL}/generate/questions", json=gen_payload)
    if response.status_code == 200:
        gen_data = response.json()
        questions = gen_data.get("generated", [])
        if len(questions) > 0:
            question_id = questions[0]['id']
            print(f"[PASS] Generated {len(questions)} questions. QID: {question_id}")
            print(f"Question: {questions[0]['question_text']}")
        else:
            print("[FAIL] No questions returned.")
            return
    else:
        print(f"[FAIL] Generate Questions: {response.text}")
        return

    # 4. List Questions
    print("\n4. Listing Questions...")
    response = requests.get(f"{BASE_URL}/questions?subject_id={subject_id}")
    if response.status_code == 200:
        qs = response.json()
        print(f"[PASS] Retrieved {len(qs)} questions.")
    else:
        print(f"[FAIL] List Questions: {response.text}")

    # 5. Vet Question (Approve)
    print("\n5. Vetting Question (Approve)...")
    response = requests.post(f"{BASE_URL}/vetting/{question_id}/approve", json={})
    if response.status_code == 200:
        print("[PASS] Question approved.")
    else:
        print(f"[FAIL] Vet Question: {response.text}")

    # 6. Verify Status
    response = requests.get(f"{BASE_URL}/questions?status=approved")
    approved_qs = response.json()
    found = any(q['id'] == question_id for q in approved_qs)
    if found:
        print("[PASS] Verified question status is 'approved'.")
    else:
        print("[FAIL] Question not found in approved list.")

if __name__ == "__main__":
    test_api()
