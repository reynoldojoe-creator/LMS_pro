import requests
import json
import os
import time

def verify_endpoints():
    base_url = "http://localhost:8000"
    
    # Wait for server to start
    print("Waiting for server to start...")
    for _ in range(10):
        try:
            response = requests.get(base_url)
            if response.status_code == 200:
                print("Server is up!")
                break
        except requests.exceptions.ConnectionError:
            time.sleep(1)
    else:
        print("Server failed to start.")
        return

    # 1. Upload Syllabus
    print("\n[TEST] Uploading CS301 Syllabus...")
    syllabus_path = "backend/data/test_data/syllabi/CS301_syllabus.docx"
    
    if not os.path.exists(syllabus_path):
        print(f"Error: Syllabus file not found at {syllabus_path}")
        return

    with open(syllabus_path, "rb") as f:
        files = {"file": ("CS301_syllabus.docx", f, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
        response = requests.post(f"{base_url}/upload-syllabus", files=files, params={"subject_id": "CS301"})
    
    if response.status_code == 200:
        print("Upload successful:", response.json())
    else:
        print("Upload failed:", response.text)
        return

    # 2. Query RAG
    print("\n[TEST] Querying RAG...")
    queries_path = "backend/data/test_data/test_queries/CS301_test_queries.json"
    
    with open(queries_path, "r") as f:
        queries_data = json.load(f)
        first_query = queries_data["test_queries"][0]
        question = first_query["query"]
        print(f"Question: {question}")
    
    payload = {
        "question": question,
        "subject_id": "CS301",
        "n_results": 3
    }
    
    try:
        response = requests.post(f"{base_url}/query", json=payload)
        if response.status_code == 200:
            result = response.json()
            print("Answer:", result["answer"])
            print("\nSources:")
            for source in result["sources"]:
                print(f"- {source['text'][:100]}...")
        else:
            print("Query failed:", response.text)
    except Exception as e:
        print(f"Query error: {e}")

if __name__ == "__main__":
    verify_endpoints()
