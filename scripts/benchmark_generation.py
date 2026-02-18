import requests
import time
import json
import statistics
from datetime import datetime

BASE_URL = "http://localhost:8000"
OUTPUT_FILE = "benchmark_results.json"

def get_subjects():
    try:
        resp = requests.get(f"{BASE_URL}/subjects")
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        print(f"Error fetching subjects: {e}")
        return []

def run_test(name, payload):
    print(f"\n--- Running Test: {name} ---")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    start_time = time.time()
    try:
        resp = requests.post(f"{BASE_URL}/generate/questions", json=payload, timeout=600) # 10 min timeout
        duration = time.time() - start_time
        
        if resp.status_code == 200:
            data = resp.json()
            question_count = len(data.get("generated", []))
            print(f"✅ Success! Generated {question_count} questions in {duration:.2f}s")
            return {
                "name": name,
                "status": "success",
                "duration": duration,
                "questions_generated": question_count,
                "response": data,
                "payload": payload
            }
        else:
            print(f"❌ Failed! Status: {resp.status_code}")
            print(f"Response: {resp.text}")
            return {
                "name": name,
                "status": "failed",
                "duration": duration,
                "error": resp.text,
                "payload": payload
            }
            
    except Exception as e:
        duration = time.time() - start_time
        print(f"❌ Exception: {e}")
        return {
            "name": name,
            "status": "error",
            "duration": duration,
            "error": str(e),
            "payload": payload
        }

def main():
    print(f"Starting Benchmark at {datetime.now()}")
    
    # 1. Fetch Subjects
    subjects = get_subjects()
    if not subjects:
        print("No subjects found to test against. Exiting.")
        return

    print(f"Found {len(subjects)} subjects.")
    subject_dsa = next((s for s in subjects if "Data Structures" in s['name']), subjects[0])
    subject_eng = next((s for s in subjects if "English" in s['name']), subjects[0])
    
    print(f"Using Subject A: {subject_dsa['name']} (ID: {subject_dsa['id']})")
    print(f"Using Subject B: {subject_eng['name']} (ID: {subject_eng['id']})")

    tests = [
        {
            "name": "MCQ Generation (Short Context)",
            "payload": {
                "subject_id": subject_dsa['id'],
                "question_type": "mcq",
                "bloom_level": "remember",
                "difficulty": "easy",
                "count": 3,
                "topic_id": None # Random topic
            }
        },
        {
            "name": "Short Answer (Reasoning)",
            "payload": {
                "subject_id": subject_dsa['id'],
                "question_type": "short_answer",
                "bloom_level": "analyze",
                "difficulty": "medium",
                "count": 2,
                "topic_id": None
            }
        },
        {
            "name": "Essay (Long Context)",
            "payload": {
                "subject_id": subject_eng['id'], # Try English for essay if available, else DSA
                "question_type": "essay",
                "bloom_level": "create",
                "difficulty": "hard",
                "count": 1,
                "topic_id": None
            }
        }
    ]

    results = []
    for test in tests:
        result = run_test(test['name'], test['payload'])
        results.append(result)
        time.sleep(2) # Cooldown

    # Summary
    print("\n=== Benchmark Summary ===")
    succ_tests = [r for r in results if r['status'] == 'success']
    if succ_tests:
        avg_time = statistics.mean([r['duration'] for r in succ_tests])
        total_qs = sum([r['questions_generated'] for r in succ_tests])
        print(f"Total Successful Tests: {len(succ_tests)}/{len(tests)}")
        print(f"Total Questions: {total_qs}")
        print(f"Average Request Latency: {avg_time:.2f}s")
        print(f"Average Time per Question: {avg_time/total_qs if total_qs else 0:.2f}s")
    else:
        print("No successful tests.")

    with open(OUTPUT_FILE, "w") as f:
        json.dump(results, f, indent=2)
    print(f"\nResults saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
