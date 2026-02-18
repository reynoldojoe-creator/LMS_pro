import requests
import json
import os

BASE_URL = "http://localhost:8000"

def test_create_rubric():
    """Test creating a rubric with simplified inputs"""
    print("Testing Create Rubric...")
    
    # We need a subject ID first
    # Using the one from previous tests if available, or fetch one
    try:
        response = requests.get(f"{BASE_URL}/subjects")
        subjects = response.json()
        if not subjects:
            print("❌ No subjects found. Please run subject creation test first.")
            return
            
        subject_id = subjects[0]['id']
        print(f"Using Subject ID: {subject_id}")
        
        # Test Data matching simplified frontend input
        data = {
            "name": "Midterm Exam Verification",
            "subject_id": subject_id,
            "exam_type": "midterm",
            "question_distribution": json.dumps({
                "mcq": {"count": 10, "marks_each": 2},
                "short_answer": {"count": 5, "marks_each": 6}
            }),
            "co_distribution": json.dumps({
                "CO1": 50,
                "CO2": 50
            }),
            # Bloom's should be optional/auto-derived
            # Total marks and duration from preset or override
            "total_marks": 50,
            "duration_minutes": 90
        }
        
        response = requests.post(f"{BASE_URL}/rubrics", data=data)
        
        if response.status_code == 200:
            print("✅ Rubric creation successful!")
            result = response.json()
            print(json.dumps(result, indent=2))
        else:
            print(f"❌ Failed: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ Error: {e}")

def test_get_presets():
    """Test fetching exam presets"""
    print("\nTesting Get Presets...")
    try:
        response = requests.get(f"{BASE_URL}/rubrics/presets/final")
        if response.status_code == 200:
            print("✅ Fetch presets successful!")
            print(json.dumps(response.json(), indent=2))
        else:
            print(f"❌ Failed to fetch presets: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    print("=" * 60)
    print("Testing Rubric System")
    print("=" * 60)
    
    test_get_presets()
    test_create_rubric()
    
    print("\n" + "=" * 60)
    print("Testing Complete")
    print("=" * 60)
