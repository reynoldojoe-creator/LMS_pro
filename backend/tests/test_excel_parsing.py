
import sys
import os
import pandas as pd
import io
import asyncio

# Add backend to path
# Add backend to path (parent directory of tests)
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.topic_actions_service import TopicActionsService

def test_excel_parsing():
    print("Testing Excel parsing...")
    
    # Create sample data
    data = {
        "Question": ["What is 2+2?", "Capital of France?"],
        "Option A": ["3", "London"],
        "Option B": ["4", "Paris"],
        "Option C": ["5", "Berlin"],
        "Answer": ["4", "Paris"],
        "Marks": [1, 1],
        "CO Mapping": ["CO1", "CO2"],
        "LO Mapping": ["LO1", "LO2"]
    }
    
    df = pd.DataFrame(data)
    
    # Save to bytes
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False)
    
    file_content = output.getvalue()
    
    # Initialize service
    service = TopicActionsService()
    
    # Parse
    questions = service._parse_excel_questions(file_content, "mcq")
    
    # Verify
    assert len(questions) == 2
    
    q1 = questions[0]
    assert q1['question_text'] == "What is 2+2?"
    assert q1['options']['Option B'] == "4"
    assert q1['correct_answer'] == "4"
    assert q1['co_ids'] == "CO1"
    
    q2 = questions[1]
    assert q2['question_text'] == "Capital of France?"
    assert q2['correct_answer'] == "Paris"
    
    print("✓ Excel parsing test passed!")

if __name__ == "__main__":
    test_excel_parsing()
