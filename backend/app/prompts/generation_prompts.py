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
Do not include specific scholar names, years, or book references, Chapter numbers, or Page numbers in the question text.
DO NOT start questions with "According to the text...", "As mentioned in...", or "Based on...".
Options dictionary values must NOT contain the option letter prefix (e.g. "To restore..." NOT "A) To restore...").
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
- Do not include specific scholar names, years, or book references, Chapter numbers, or Page numbers.
- DO NOT start questions with "According to the text...", "As mentioned in...", or "Based on...".

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
      "options": {{"A": "Option text without prefix", "B": "Option text without prefix", "C": "...", "D": "..."}},
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

UNIFIED_GENERATION_PROMPT = """
You are an expert exam question writer for {subject_name}.

CONTEXT FROM SYLLABUS: 
{rag_context}

TASK: Generate {total_questions} questions for Topic: "{topic}"

REQUIRED DISTRIBUTION:
{distribution_text}

CONSTRAINTS:
- Difficulty: {difficulty}
- Course Outcome: {co}
- Learning Outcome: {lo}

BAD QUESTION EXAMPLES (DO NOT generate questions like these):
- "What is X?" (too vague, no context)  
- "Which of the following is true?" (lazy stem)
- Questions that can be answered without reading the options
- Questions where all distractors are obviously wrong
- Questions that reference "Chapter X" or "the text"
- Questions starting with "According to the text..."

GOOD QUESTION PATTERNS:
- "A patient presents with [specific scenario]. What is the most appropriate [action]?"
- "Compare the mechanisms of [X] and [Y]. Which statement correctly describes their difference?"
- Scenario-based stems that test application, not just recall

DISTRACTOR REQUIREMENTS:
- Each distractor must be plausible and from the same domain
- Distractors should represent common misconceptions
- Avoid "All of the above" or "None of the above"
- Distractors must be similar in length to the correct answer
- Order options alphabetically or by logical sequence

CRITICAL REQUIREMENTS:
- Each question MUST test a DIFFERENT concept
- Do NOT duplicate questions
- Vary question stems based on GOOD patterns above
- STRICTLY follow the JSON structure below
- Do not include book references (Chapter/Page numbers)
- MCQs must have 4 options (A,B,C,D)

OUTPUT FORMAT (strict JSON):
{{
  "questions": [
    {{
      "question_text": "...",
      "question_type": "mcq",
      "options": {{"A": "...", "B": "...", "C": "...", "D": "..."}},
      "correct_answer": "B", 
      "marks": 1,
      "difficulty": "{difficulty}",
      "mapped_co": "{co}",
      "mapped_lo": "{lo}"
    }},
    {{
      "question_text": "...",
      "question_type": "short_answer",
      "expected_answer": "...",
      "key_points": ["point1", "point2"],
      "marks": 2,
      "difficulty": "{difficulty}",
      "mapped_co": "{co}",
      "mapped_lo": "{lo}"
    }},
    {{
      "question_text": "...",
        "question_type": "essay",
        "expected_answer_outline": {{
            "introduction": "...",
            "main_points": ["...", "..."],
            "conclusion": "..."
        }},
        "marking_scheme": [
            {{"criteria": "...", "marks": 2}},
            {{"criteria": "...", "marks": 3}}
        ],
        "marks": 5,
        "difficulty": "{difficulty}",
        "mapped_co": "{co}",
        "mapped_lo": "{lo}"
    }}
  ]
}}
"""
