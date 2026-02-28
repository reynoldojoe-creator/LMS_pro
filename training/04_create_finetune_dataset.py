"""
Script 4: Create Fine-tuning Dataset from Question Bank
Run: python scripts/04_create_finetune_dataset.py

This creates a JSONL dataset for fine-tuning Qwen 2.5 on question generation.
"""
import os
import sys
import json
import random

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import *

# Question Bank Data (extracted from your question bank document)
QUESTION_BANK = {
    # 2 MARKS QUESTIONS
    2: [
        # Unit 1: Intro & Processes
        {"q": "Define Software Engineering.", "unit": 1, "blooms": "K1", "topic": "se_basics"},
        {"q": "What is the Waterfall Model?", "unit": 1, "blooms": "K1", "topic": "process_models"},
        {"q": "List two advantages of Agile methodology.", "unit": 1, "blooms": "K1", "topic": "agile"},
        {"q": "Define SDLC.", "unit": 1, "blooms": "K1", "topic": "se_basics"},
        {"q": "What is a legacy system?", "unit": 1, "blooms": "K1", "topic": "se_basics"},
        {"q": "Mention two agile frameworks.", "unit": 1, "blooms": "K1", "topic": "agile"},
        {"q": "What is extreme programming (XP)?", "unit": 1, "blooms": "K1", "topic": "agile"},
        {"q": "Define software prototype.", "unit": 1, "blooms": "K1", "topic": "process_models"},
        {"q": "What is a sociotechnical system?", "unit": 1, "blooms": "K1", "topic": "se_basics"},
        {"q": "List two professional responsibilities of a software engineer.", "unit": 1, "blooms": "K1", "topic": "ethics"},

        # Unit 2: Requirements
        {"q": "Define functional requirement.", "unit": 2, "blooms": "K1", "topic": "requirements"},
        {"q": "What is non-functional requirement?", "unit": 2, "blooms": "K1", "topic": "requirements"},
        {"q": "Define requirements elicitation.", "unit": 2, "blooms": "K1", "topic": "requirements"},
        {"q": "What is a Use Case?", "unit": 2, "blooms": "K1", "topic": "modeling"},
        {"q": "Define SRS.", "unit": 2, "blooms": "K1", "topic": "requirements"},
        {"q": "What is requirements validation?", "unit": 2, "blooms": "K1", "topic": "validation"},
        {"q": "List two techniques for requirements discovery.", "unit": 2, "blooms": "K1", "topic": "requirements"},
        {"q": "What is a sequence diagram?", "unit": 2, "blooms": "K1", "topic": "modeling"},
        {"q": "Define feasibility study.", "unit": 2, "blooms": "K1", "topic": "validation"},
        {"q": "What is Ethnography in requirement gathering?", "unit": 2, "blooms": "K1", "topic": "requirements"},

        # Unit 3: Design
        {"q": "Define Software Architecture.", "unit": 3, "blooms": "K1", "topic": "architecture"},
        {"q": "What is loose coupling.", "unit": 3, "blooms": "K1", "topic": "design_principles"},
        {"q": "Define high cohesion.", "unit": 3, "blooms": "K1", "topic": "design_principles"},
        {"q": "What is the MVC pattern?", "unit": 3, "blooms": "K1", "topic": "architecture"},
        {"q": "Define Design Pattern.", "unit": 3, "blooms": "K1", "topic": "patterns"},
        {"q": "What is data hiding?", "unit": 3, "blooms": "K1", "topic": "design_principles"},
        {"q": "List two structural design patterns.", "unit": 3, "blooms": "K1", "topic": "patterns"},
        {"q": "What is the Repository pattern?", "unit": 3, "blooms": "K1", "topic": "architecture"},
        {"q": "Define UML interface.", "unit": 3, "blooms": "K1", "topic": "design_principles"},
        {"q": "What is the Singleton pattern?", "unit": 3, "blooms": "K1", "topic": "patterns"},

        # Unit 4: Testing
        {"q": "Define Unit Testing.", "unit": 4, "blooms": "K1", "topic": "testing_strategies"},
        {"q": "What is Black-box testing?", "unit": 4, "blooms": "K1", "topic": "testing_techniques"},
        {"q": "Define Verification.", "unit": 4, "blooms": "K1", "topic": "verification"},
        {"q": "What is Validation?", "unit": 4, "blooms": "K1", "topic": "verification"},
        {"q": "Define Regression testing.", "unit": 4, "blooms": "K1", "topic": "testing_techniques"},
        {"q": "What is equivalence partitioning?", "unit": 4, "blooms": "K1", "topic": "testing_techniques"},
        {"q": "Define Alpha testing.", "unit": 4, "blooms": "K1", "topic": "testing_strategies"},
        {"q": "What is a software inspection?", "unit": 4, "blooms": "K1", "topic": "verification"},
        {"q": "Define test case.", "unit": 4, "blooms": "K1", "topic": "testing_techniques"},
        {"q": "What is stress testing?", "unit": 4, "blooms": "K1", "topic": "testing_strategies"},

        # Unit 5: Maintenance & Management
        {"q": "Define Software Maintenance.", "unit": 5, "blooms": "K1", "topic": "maintenance"},
        {"q": "What is Software Re-engineering?", "unit": 5, "blooms": "K1", "topic": "maintenance"},
        {"q": "Define COCOMO.", "unit": 5, "blooms": "K1", "topic": "project_mgmt"},
        {"q": "What is Risk Management?", "unit": 5, "blooms": "K1", "topic": "project_mgmt"},
        {"q": "Define CMMI.", "unit": 5, "blooms": "K1", "topic": "quality"},
        {"q": "What is Refactoring?", "unit": 5, "blooms": "K1", "topic": "maintenance"},
        {"q": "List two software cost estimation techniques.", "unit": 5, "blooms": "K1", "topic": "project_mgmt"},
        {"q": "What is Software Quality Assurance (SQA)?", "unit": 5, "blooms": "K1", "topic": "quality"},
        {"q": "Define project scheduling.", "unit": 5, "blooms": "K1", "topic": "project_mgmt"},
        {"q": "What is Lehman's Law?", "unit": 5, "blooms": "K1", "topic": "maintenance"},
    ],

    # 5 MARKS QUESTIONS
    5: [
        {"q": "Explain the Waterfall model involves with its phases.", "unit": 1, "blooms": "K2", "topic": "process_models"},
        {"q": "Discuss the advantages and disadvantages of Agile methods.", "unit": 1, "blooms": "K2", "topic": "agile"},
        {"q": "Describe the ACM/IEEE code of ethics.", "unit": 1, "blooms": "K2", "topic": "ethics"},
        {"q": "Explain the Spiral model with a diagram.", "unit": 1, "blooms": "K2", "topic": "process_models"},

        {"q": "Differentiate between functional and non-functional requirements with examples.", "unit": 2, "blooms": "K3", "topic": "requirements"},
        {"q": "Explain the structure of an SRS document.", "unit": 2, "blooms": "K2", "topic": "requirements"},
        {"q": "Discuss Use Case modeling with an example diagram.", "unit": 2, "blooms": "K3", "topic": "modeling"},
        {"q": "Explain the requirements elicitation and analysis process.", "unit": 2, "blooms": "K2", "topic": "requirements"},

        {"q": "Explain the MVC architectural pattern.", "unit": 3, "blooms": "K2", "topic": "architecture"},
        {"q": "Discuss the difference between coupling and cohesion.", "unit": 3, "blooms": "K4", "topic": "design_principles"},
        {"q": "Explain the Observer design pattern with a UML diagram.", "unit": 3, "blooms": "K2", "topic": "patterns"},
        {"q": "Describe the Layered architecture style.", "unit": 3, "blooms": "K2", "topic": "architecture"},

        {"q": "Differentiate between Black-box and White-box testing.", "unit": 4, "blooms": "K4", "topic": "testing_techniques"},
        {"q": "Explain the V-model of development and testing.", "unit": 4, "blooms": "K2", "topic": "verification"},
        {"q": "Describe the process of boundary value analysis.", "unit": 4, "blooms": "K3", "topic": "testing_techniques"},
        {"q": "Discuss the integration testing strategies.", "unit": 4, "blooms": "K2", "topic": "testing_strategies"},

        {"q": "Explain the different types of software maintenance.", "unit": 5, "blooms": "K2", "topic": "maintenance"},
        {"q": "Discuss the Risk Management process.", "unit": 5, "blooms": "K2", "topic": "project_mgmt"},
        {"q": "Explain the COCOMO II model.", "unit": 5, "blooms": "K2", "topic": "project_mgmt"},
        {"q": "Describe the factors affecting SQA.", "unit": 5, "blooms": "K2", "topic": "quality"},
    ],

    # 12 MARKS QUESTIONS
    12: [
        {"q": "Compare and contrast Waterfall, Incremental, and Agile models. Which one would you choose for a startup and why?", "unit": 1, "blooms": "K5", "topic": "process_models"},
        {"q": "Explain the Scrum framework in detail, focusing on roles, events, and artifacts.", "unit": 1, "blooms": "K4", "topic": "agile"},
        {"q": "Discuss professional and ethical responsibilities using the ACM/IEEE code of ethics.", "unit": 1, "blooms": "K4", "topic": "ethics"},

        {"q": "Develop a complete SRS outline for a Library Management System, specifying functional and non-functional requirements.", "unit": 2, "blooms": "K6", "topic": "requirements"},
        {"q": "Create a Use Case diagram and Class diagram for an ATM system.", "unit": 2, "blooms": "K6", "topic": "modeling"},
        {"q": "Explain the requirements engineering process validation techniques in detail.", "unit": 2, "blooms": "K4", "topic": "validation"},

        {"q": "Explain 5 key architectural patterns with their pros and cons.", "unit": 3, "blooms": "K4", "topic": "architecture"},
        {"q": "Design a system architecture for an E-commerce website using the MVC pattern.", "unit": 3, "blooms": "K6", "topic": "architecture"},
        {"q": "Analyze the importance of Modularity, Coupling, and Cohesion in software design.", "unit": 3, "blooms": "K4", "topic": "design_principles"},

        {"q": "Explain the software testing life cycle. Discuss various verification and validation techniques.", "unit": 4, "blooms": "K4", "topic": "verification"},
        {"q": "Apply equivalence partitioning and boundary value analysis to test a date validation function.", "unit": 4, "blooms": "K6", "topic": "testing_techniques"},
        {"q": "Compare System Testing, Acceptance Testing, and Regression Testing.", "unit": 4, "blooms": "K4", "topic": "testing_strategies"},

        {"q": "Discuss the software legacy system evolution strategies. When should you re-engineer vs replace?", "unit": 5, "blooms": "K5", "topic": "maintenance"},
        {"q": "Explain Algorithmic Cost Modeling (COCOMO) in detail.", "unit": 5, "blooms": "K4", "topic": "project_mgmt"},
        {"q": "Design a Risk Management Plan for a mission-critical software project.", "unit": 5, "blooms": "K6", "topic": "project_mgmt"},
    ]
}


def create_training_example(question_data, marks):
    """Create a single training example in chat format"""
    
    unit = question_data["unit"]
    blooms = question_data["blooms"]
    topic = question_data["topic"]
    question = question_data["q"]
    
    # System message
    system_msg = """You are an expert exam question generator for Software Engineering. Generate questions that:
1. Follow Bloom's Taxonomy levels strictly
2. Match the specified marks and complexity
3. Use proper academic language
4. Are clear and unambiguous"""
    
    # User prompt
    user_msg = f"""Generate a {marks}-mark exam question for Software Engineering.

Requirements:
- Unit: {unit}
- Topic: {topic}
- Bloom's Level: {blooms} ({BLOOMS_LEVELS.get(blooms, blooms)})
- Marks: {marks}

Generate only the question text, nothing else."""
    
    # Assistant response (the actual question)
    assistant_msg = question
    
    return {
        "messages": [
            {"role": "system", "content": system_msg},
            {"role": "user", "content": user_msg},
            {"role": "assistant", "content": assistant_msg}
        ],
        "metadata": {
            "unit": unit,
            "marks": marks,
            "blooms": blooms,
            "topic": topic
        }
    }


def create_dataset():
    """Create the complete fine-tuning dataset"""
    
    print("=" * 60)
    print("CREATING FINE-TUNING DATASET")
    print("=" * 60)
    
    all_examples = []
    
    # Process each marks category
    for marks, questions in QUESTION_BANK.items():
        print(f"\nProcessing {marks}-mark questions: {len(questions)} questions")
        
        for q_data in questions:
            example = create_training_example(q_data, marks)
            all_examples.append(example)
    
    # Shuffle the dataset
    random.seed(42)
    random.shuffle(all_examples)
    
    # Split into train/val
    split_idx = int(len(all_examples) * 0.9)
    train_data = all_examples[:split_idx]
    val_data = all_examples[split_idx:]
    
    # Save training data
    train_file = os.path.join(FINETUNE_DIR, "train.jsonl")
    with open(train_file, 'w', encoding='utf-8') as f:
        for example in train_data:
            f.write(json.dumps(example, ensure_ascii=False) + '\n')
    
    # Save validation data
    val_file = os.path.join(FINETUNE_DIR, "val.jsonl")
    with open(val_file, 'w', encoding='utf-8') as f:
        for example in val_data:
            f.write(json.dumps(example, ensure_ascii=False) + '\n')
    
    # Save full dataset for reference
    full_file = os.path.join(FINETUNE_DIR, "full_dataset.jsonl")
    with open(full_file, 'w', encoding='utf-8') as f:
        for example in all_examples:
            f.write(json.dumps(example, ensure_ascii=False) + '\n')
    
    print(f"\n{'=' * 60}")
    print("DATASET CREATION COMPLETE")
    print(f"{'=' * 60}")
    print(f"Total examples: {len(all_examples)}")
    print(f"Training set: {len(train_data)} examples -> {train_file}")
    print(f"Validation set: {len(val_data)} examples -> {val_file}")
    
    # Statistics
    print("\nDataset Statistics:")
    marks_counts = {}
    unit_counts = {}
    blooms_counts = {}
    
    for ex in all_examples:
        meta = ex["metadata"]
        marks_counts[meta["marks"]] = marks_counts.get(meta["marks"], 0) + 1
        unit_counts[meta["unit"]] = unit_counts.get(meta["unit"], 0) + 1
        blooms_counts[meta["blooms"]] = blooms_counts.get(meta["blooms"], 0) + 1
    
    print("\nBy Marks:")
    for marks in sorted(marks_counts.keys()):
        print(f"  {marks} marks: {marks_counts[marks]}")
    
    print("\nBy Unit:")
    for unit in sorted(unit_counts.keys()):
        print(f"  Unit {unit}: {unit_counts[unit]}")
    
    print("\nBy Bloom's Level:")
    for bloom in sorted(blooms_counts.keys()):
        print(f"  {bloom}: {blooms_counts[bloom]}")
    
    # Print sample
    print("\n--- Sample Training Example ---")
    sample = train_data[0]
    print(json.dumps(sample, indent=2, ensure_ascii=False)[:500] + "...")


if __name__ == "__main__":
    create_dataset()
