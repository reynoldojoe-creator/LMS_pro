# Prompt templates for Question Validation

VALIDATION_PROMPT_TEMPLATE = """
You are a question quality evaluator.

QUESTION: 
{question_json}

SYLLABUS CONTEXT: 
{rag_context}

EVALUATE on these criteria (score 0-100 each):

SYLLABUS_ALIGNMENT: Is the question answerable from the given syllabus content?

CLARITY: Is the question unambiguous and clearly worded?
DIFFICULTY_MATCH: Does the question match the claimed difficulty?
OPTION_QUALITY (MCQ only): Are distractors plausible but clearly wrong?

OUTPUT FORMAT (strict JSON): 
{{
  "scores": {{
    "syllabus_alignment": 85,

    "clarity": 95,
    "difficulty_match": 80,
    "option_quality": 88
  }},
  "overall_score": 87.6,
  "pass": true,
  "issues": ["Minor: Could be more specific about..."],
  "suggestions": ["Consider rephrasing to..."]
}}

PASS THRESHOLD: overall_score >= 70
"""
