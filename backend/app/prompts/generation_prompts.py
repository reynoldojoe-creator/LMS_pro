# Prompt templates for Question Generation

MCQ_PROMPT_TEMPLATE = """
You are an expert exam question writer for {subject_name}.

CONTEXT FROM SYLLABUS: 
{rag_context}

TASK: Generate {count} Multiple Choice Question(s).

CONSTRAINTS:
Topic: {topic}
Difficulty: {difficulty}
Course Outcome: {co}
Learning Outcome: {lo}

CRITICAL REQUIREMENTS:
- Each question MUST test a DIFFERENT concept or sub-topic
- Do NOT generate duplicate or near-duplicate questions
- Vary question stems (avoid starting all questions the same way)
- Cover different Bloom's taxonomy levels within the difficulty band
- If generating MCQs, ensure distractor sets are unique across questions

DIFFICULTY GUIDE:
Easy: Direct recall, single concept, from syllabus text
Medium: Application, combines 2 concepts, 1-2 reasoning steps
Hard: Analysis/evaluation, multi-concept, requires inference

OUTPUT FORMAT (strict JSON): 
{{
  "questions": [
    {{
      "question_text": "...",
      "question_type": "MCQ",
      "options": {{
        "A": "...",
        "B": "...",
        "C": "...",
        "D": "..."
      }},
      "correct_answer": "B",
      "explanation": "...",
      "difficulty": "{difficulty}",
      "topic": "{topic}",
      "mapped_co": "{co}",
      "mapped_lo": "{lo}",
      "marks": 1
    }}
  ]
}}

IMPORTANT:
All distractors must be plausible but clearly wrong
Question must be answerable ONLY from the given context
Do not create ambiguous questions with multiple correct answers
Ensure the question matches the requested difficulty level
Do not include specific scholar names, years, or book references in the question text unless they are fundamental to the concept definitions in the syllabus.
DO NOT start questions with "According to the text..." or "As mentioned in..."
"""

SHORT_ANSWER_PROMPT_TEMPLATE = """
You are an expert exam question writer for {subject_name}.

TASK: Generate {count} Short Answer Question(s).

CONSTRAINTS:
Topic: {topic}
Difficulty: {difficulty}
Marks: {marks}
Learning Outcome: {lo}

CRITICAL REQUIREMENTS:
- Each question MUST test a DIFFERENT concept or sub-topic
- Do NOT generate duplicate or near-duplicate questions
- Vary question stems
- Cover different Bloom's taxonomy levels within the difficulty band

CONTEXT FROM SYLLABUS: 
{rag_context}

IMPORTANT:
- Generate exactly {count} questions.
- Output MUST be valid JSON only. No markdown formatting.
- Do not include specific scholar names, years, or book references in the question text unless they are fundamental to the concept definitions.
- DO NOT start questions with "According to the text..." or "As mentioned in..."

OUTPUT FORMAT (strict JSON): 
{{
  "questions": [
    {{
      "question_text": "...",
      "question_type": "short_answer",
      "expected_answer": "...",
      "key_points": ["point1", "point2"],
      "difficulty": "{difficulty}",
      "topic": "{topic}",
      "mapped_co": "{co}",
      "mapped_lo": "{lo}",
      "marks": {marks}
    }}
  ]
}}
"""

ESSAY_PROMPT_TEMPLATE = """
You are an expert exam question writer for {subject_name}.

CONTEXT FROM SYLLABUS: 
{rag_context}

TASK: Generate {count} Essay/Long Answer Question(s).

CONSTRAINTS:
Topic: {topic}
Difficulty: {difficulty}
Marks: {marks}
Learning Outcome: {lo}

CRITICAL REQUIREMENTS:
- Each question MUST test a DIFFERENT concept or sub-topic
- Do NOT generate duplicate or near-duplicate questions
- Vary question stems
- Cover different Bloom's taxonomy levels within the difficulty band

OUTPUT FORMAT (strict JSON): 
{{
  "questions": [
    {{
      "question_text": "...",
      "question_type": "essay",
      "expected_answer_outline": {{
        "introduction": "...",
        "main_points": ["...", "...", "..."],
        "conclusion": "..."
      }},
      "marking_scheme": [
        {{"criteria": "...", "marks": 3}},
        {{"criteria": "...", "marks": 4}},
        {{"criteria": "...", "marks": 3}}
      ],
      "difficulty": "{difficulty}",
      "topic": "{topic}",
      "mapped_co": "{co}",
      "mapped_lo": "{lo}",
      "marks": {marks}
    }}
  ]
}}
"""

# Few-Shot Learning Prompts
MCQ_GENERATION_WITH_FEWSHOT = '''You are an expert exam question writer.

SUBJECT: {subject_name}
TOPIC: {topic_name}
COURSE OUTCOMES MAPPED: {co_mappings}

SYLLABUS CONTEXT:
---
{rag_context}
---

MAPPED LEARNING OUTCOMES: {lo_mappings}

{few_shot_section}

TASK: Generate {count} Multiple Choice Question(s).

REQUIREMENTS:
- Difficulty: {difficulty}
- Each question must be answerable from the syllabus context
- Follow the style and quality of the example questions above
- Map each question to relevant CO(s)

OUTPUT FORMAT (strict JSON):
{{
  "questions": [
    {{
      "question_text": "...",
      "options": {{"A": "...", "B": "...", "C": "...", "D": "..."}},
      "correct_answer": "B",
      "explanation": "...",
      "mapped_co": ["CO1"],
      "mapped_lo": "LO1",
      "difficulty": "{difficulty}"
    }}
  ]
}}
'''

def build_few_shot_section(sample_questions: list) -> str:
    """Build few-shot examples section from sample questions"""
    if not sample_questions:
        return "No example questions available. Generate based on syllabus content."
    
    examples = "EXAMPLE QUESTIONS (Follow this style and quality):\\n---\\n"
    for i, q in enumerate(sample_questions, 1):
        examples += f"Example {i}:\\n"
        examples += f"Q: {q.get('question_text', '')}\\n"
        if q.get('options'):
            for opt, text in q['options'].items():
                examples += f"   {opt}) {text}\\n"
        examples += f"Answer: {q.get('correct_answer', 'N/A')}\\n"
        examples += f"CO: {q.get('mapped_co', q.get('co_mapping', 'N/A'))}\\n\\n"
    examples += "---\\n"
    return examples
