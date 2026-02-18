"""
Prompts for syllabus extraction that:
1. Can handle syllabi WITH explicit COs
2. Can INFER COs if not present
3. Extracts topics and maps to COs
4. Assigns Bloom's levels
"""

SYLLABUS_EXTRACTION_PROMPT = '''You are an expert educational content analyzer specializing in Outcome-Based Education (OBE).

TASK: Analyze this university syllabus and extract structured data.

SYLLABUS TEXT:
---
{syllabus_text}
---

SUBJECT: {subject_name} ({subject_code})

INSTRUCTIONS:
1. COURSE OUTCOMES (COs):
   - If the syllabus explicitly lists COs/Course Objectives, extract them verbatim
   - If NOT explicitly listed, INFER 4-6 appropriate COs based on the content
   - Each CO must start with an action verb (Analyze, Design, Implement, Evaluate, etc.)
   - Mark each CO as "explicit" or "inferred"

2. TOPICS/UNITS:
   - Extract all units/modules (or Chapters) and their sub-topics
   - Topic Names MUST be concise noun phrases (2-6 words). DO NOT use full sentences.
   - For each topic, provide a brief description
   - Estimate teaching hours if not specified

3. CO-TOPIC MAPPING:
   - Map each topic to relevant CO(s)
   - Assign intensity: 1 (Low), 2 (Medium), 3 (High)
   - A topic can map to multiple COs

OUTPUT FORMAT (strict JSON):
{{
  "course_outcomes": [
    {{
      "code": "CO1",
      "description": "Analyze and compare different sorting algorithms",
      "source": "explicit"
    }}
  ],
  "units": [
    {{
      "number": 1,
      "title": "Introduction to Algorithms",
      "hours": 8,
      "topics": [
        {{
          "name": "Algorithm Complexity Analysis",
          "description": "Big O notation, time and space complexity",
          "co_mappings": [
            {{"co_code": "CO1", "intensity": 3}},
            {{"co_code": "CO2", "intensity": 1}}
          ]
        }}
      ]
    }}
  ],
  "metadata": {{
    "total_hours": 45,
    "has_explicit_cos": true,
    "extraction_confidence": 0.85
  }}
}}

IMPORTANT:
- If COs are not in the document, you MUST infer them intelligently
- Ensure every topic maps to at least one CO
- Be conservative with confidence scores
'''
