# Prompt templates for Question Generation
# Includes Bloom's Taxonomy instructions and scenario-based generation guidance

# ─── Bloom's Taxonomy Reference ───────────────────────────────────────────

BLOOMS_LEVEL_INSTRUCTIONS = {
    "K1": {
        "name": "Remember",
        "verbs": "Define, List, Name, State, Recall, Identify, Recognize",
        "instruction": "Ask for direct recall of facts, definitions, or terminology. Single concept, one-step.",
    },
    "K2": {
        "name": "Understand",
        "verbs": "Describe, Explain, Summarize, Discuss, Compare, Distinguish",
        "instruction": "Ask the student to explain a concept in their own words, or compare two related ideas.",
    },
    "K3": {
        "name": "Apply",
        "verbs": "Apply, Demonstrate, Calculate, Solve, Use, Illustrate",
        "instruction": "Present a situation and ask the student to apply a known principle to solve it. Include specific parameters or measurements.",
    },
    "K4": {
        "name": "Analyze",
        "verbs": "Analyze, Differentiate, Examine, Categorize, Relate",
        "instruction": "Present a clinical/practical scenario with specific details and ask the student to break it down, identify causes, or differentiate between options. Include patient data, test results, or measurements.",
    },
    "K5": {
        "name": "Evaluate",
        "verbs": "Evaluate, Justify, Critique, Judge, Recommend, Defend",
        "instruction": "Present two or more approaches/treatments and ask the student to judge which is best and WHY, given specific constraints. Requires weighing pros and cons.",
    },
    "K6": {
        "name": "Create",
        "verbs": "Design, Propose, Construct, Plan, Formulate, Develop",
        "instruction": "Give constraints and ask the student to design a solution, treatment plan, or protocol. Open-ended with defined deliverables.",
    },
}

def get_bloom_instruction_for_difficulty(difficulty: str, count: int = 1) -> str:
    """Assign specific Bloom levels to each question based on difficulty.
    When count > 1, distribute questions across appropriate Bloom levels."""
    
    if difficulty == "easy":
        levels = ["K1-Remember", "K2-Understand"]
        scenario_rule = """DIFFICULTY LEVEL: EASY (K1-K2)
- Questions should test RECALL and basic UNDERSTANDING only
- NO clinical scenarios — straightforward factual/conceptual questions ONLY
- Use stems like: "Which of the following best defines...", "What is the primary function of...",
  "The most common indication for...", "Which statement about [concept] is correct?"
- Student should be able to answer after reading the material ONCE
- Keep questions focused on a single concept, one-step reasoning

QUESTION FORMAT per Bloom Level:
- K1-Remember: Direct recall. "What is...?", "Which of the following is...?", "The [term] refers to..."
- K2-Understand: Conceptual comprehension. "Which statement best explains...?", "What is the most scientifically sound explanation for...?"
"""
    elif difficulty == "hard":
        levels = ["K3-Apply", "K4-Analyze", "K5-Evaluate"]
        scenario_rule = """DIFFICULTY LEVEL: HARD (K3-K5)
- Questions MUST vary in format based on their assigned Bloom level:
  * K3-Apply: Brief practical scenario (1-2 sentences of context) + application question
  * K4-Analyze: Detailed clinical vignette with patient data, measurements, and a decision point
  * K5-Evaluate: Complex scenario requiring weighing multiple options, trade-offs, or critiquing an approach
- Require multi-step reasoning or judgment
- Distractors must represent real clinical errors or judgment mistakes

QUESTION FORMAT per Bloom Level (FOLLOW STRICTLY):
- K3-Apply: "During [procedure/situation], which approach is most appropriate?" or a SHORT scenario (no elaborate demographics)
- K4-Analyze: Full clinical vignette: "A [age]-year-old [patient] presents with [finding]. [Data]. Which [action]...?"
- K5-Evaluate: "A [procedure] was performed with [outcome]. Critically evaluate..." or "Which limitation must be acknowledged...?"

CRITICAL: NOT every question should be a long clinical vignette. K3 questions should be CONCISE.
"""
    else:  # medium
        levels = ["K2-Understand", "K3-Apply", "K4-Analyze"]
        scenario_rule = """DIFFICULTY LEVEL: MEDIUM (K2-K4)
- Questions MUST vary in format based on their assigned Bloom level:
  * K2-Understand: Conceptual question — NO scenario needed
  * K3-Apply: Brief clinical context (1-2 sentences) + application question
  * K4-Analyze: Short clinical vignette with specific data + analysis question
- Mix conceptual questions with application/analysis questions

QUESTION FORMAT per Bloom Level (FOLLOW STRICTLY):
- K2-Understand: "Which of the following best describes...?", "The primary advantage of [X] over [Y] is..."
- K3-Apply: "A practitioner observes [finding]. The most appropriate next step is..."
- K4-Analyze: Brief scenario with data: "A patient has [condition] with [measurement]. Which factor most influences...?"

CRITICAL: K2 questions must be DIRECT CONCEPTUAL — NO patient demographics or clinical scenarios.
"""

    # Build per-question Bloom assignments
    assignments = []
    for i in range(count):
        level = levels[i % len(levels)]
        assignments.append(f"  Question {i+1}: bloom_level = \"{level}\"")
    
    assignment_block = "\n".join(assignments)
    
    return f"""
{scenario_rule}
BLOOM'S LEVEL ASSIGNMENTS (follow these EXACTLY for bloom_level field):
{assignment_block}

You MUST set each question's "bloom_level" field to the assigned value above.
You MUST match the QUESTION FORMAT to the assigned Bloom level as described above.
"""


import random as _random

def get_random_answer_letter() -> str:
    """Returns a random A/B/C/D to use as the example correct answer in prompts."""
    return _random.choice(['A', 'B', 'C', 'D'])

# ─── Core Prompt Templates ────────────────────────────────────────────────

MCQ_PROMPT_TEMPLATE = """
You are an experienced university faculty member setting exam questions for {subject_name}.
You create questions the way a knowledgeable professor would — testing real understanding,
not just textbook memorization.

REFERENCE MATERIAL:
{rag_context}

TASK: Generate EXACTLY 1 Multiple Choice Question based on the reference material above.

CONSTRAINTS:
Topic: {topic}
Difficulty: {difficulty}
Course Outcome: {co_desc}
Learning Outcome: {lo_desc}

{bloom_guidance}

{novelty_exclusion}

QUESTION QUALITY RULES:
1. The question MUST test a specific concept from the reference material.
2. The question FORMAT must match the Bloom level assigned above:
   - K1/K2: Direct factual/conceptual question. NO clinical scenario, NO patient demographics.
     Stems like: "Which of the following best defines...", "The primary function of..."
   - K3: Brief practical context (1-2 sentences). Concise, no elaborate demographics.
   - K4: Clinical vignette with specific data and measurements (patient demographics + findings).
   - K5: Complex scenario requiring trade-off evaluation or critique.
3. Distractors (A, B, C, D) must represent plausible errors or common misconceptions.
4. Avoid "All of the above" or "None of the above".
5. NEVER reference source material — no "this book", "the text", "chapter X", "section X", "as discussed in", "the author". Questions must be standalone exam questions.
6. DO NOT use letter prefixes in the option values (write "Restore function" NOT "A) Restore function").

DIVERSITY RULES — FOLLOW STRICTLY:
7. RANDOMIZE which option (A, B, C, or D) is the correct answer. Do NOT always put it at the same position.
8. VARY your question stems. Do NOT always start with "During the...". Use a MIX of these patterns:
   - "Which of the following best describes..."
   - "A [age]-year-old patient presents with..."
   - "What is the primary reason for..."
   - "The most appropriate management for..."
   - "Which factor most significantly influences..."
   - "In the context of [specific procedure]..."
   Pick the stem that naturally matches the Bloom level.
9. Each question must test a DIFFERENT specific concept — do not rephrase the same idea.

ANSWER CORRECTNESS — THIS IS CRITICAL:
10. Before outputting, VERIFY your correct_answer is genuinely THE BEST option. Double-check it.
11. The correct answer must be UNAMBIGUOUSLY correct — no other option should be equally valid.
12. Your "explanation" field MUST clearly state WHY the correct answer is right AND why each wrong option is wrong.
13. If you are NOT confident which answer is correct, choose a DIFFERENT question topic that you ARE confident about.
14. Use facts from the REFERENCE MATERIAL to support your answer. If the reference doesn't cover it well, pick a topic it DOES cover.

OUTPUT FORMAT (strict JSON — reasoning MUST be filled):
{{
  "questions": [
    {{
      "reasoning": "2-3 sentences explaining WHY you chose this question topic and WHICH specific part of the reference material inspired it. This is MANDATORY.",
      "question_text": "...",
      "question_type": "mcq",
      "options": {{"A": "...", "B": "...", "C": "...", "D": "..."}},
      "correct_answer": "{example_answer}",
      "explanation": "{example_answer} is correct because [specific reason from reference]. [Other options] are wrong because [...].",
      "bloom_level": "K2-Understand",
      "difficulty": "{difficulty}",
      "topic": "{topic}",
      "mapped_co": "{co}",
      "mapped_lo": "{lo}",
      "marks": 1
    }}
  ]
}}
"""

SHORT_ANSWER_PROMPT_TEMPLATE = """
You are an experienced university faculty member setting exam questions for {subject_name}.

REFERENCE MATERIAL:
{rag_context}

TASK: Generate EXACTLY 1 Short Answer Question based on the reference material above.

CONSTRAINTS:
Topic: {topic}
Difficulty: {difficulty}
Marks: {marks}
Course Outcome: {co_desc}
Learning Outcome: {lo_desc}

{bloom_guidance}

{novelty_exclusion}

QUESTION QUALITY RULES:
1. The question MUST test a specific concept from the reference material.
2. The question FORMAT must match the Bloom level assigned above:
   - K2-Understand: Direct conceptual — "Explain the difference between...", "Describe the mechanism of..."
   - K3-Apply: Brief context + application — "A practitioner encounters [situation]. What steps should be taken?"
   - K4-Analyze: Clinical scenario with data — "Given [measurements/findings], analyze..."
   - K5-Evaluate: Complex scenario — "Critically evaluate the approach used in..."
3. Questions must be SELF-CONTAINED — never reference "this book", "the text", "the chapter".
4. Expected answers should be concise but cover key points.
5. NOT every question needs a patient scenario — conceptual questions are equally valid.

OUTPUT FORMAT (strict JSON — reasoning MUST be filled):
{{
  "questions": [
    {{
      "reasoning": "2-3 sentences explaining WHY you chose this question topic and WHICH specific part of the reference material inspired it. This is MANDATORY.",
      "question_text": "...",
      "question_type": "short_answer",
      "expected_answer": "...",
      "key_points": ["point1", "point2"],
      "bloom_level": "K3-Apply",
      "difficulty": "{difficulty}",
      "topic": "{topic}",
      "mapped_co": "{co_code}",
      "mapped_lo": "{lo_code}",
      "marks": {marks}
    }}
  ]
}}
"""

ESSAY_PROMPT_TEMPLATE = """
You are an experienced university faculty member setting exam questions for {subject_name}.

REFERENCE MATERIAL:
{rag_context}

TASK: Generate EXACTLY 1 Essay/Long Answer Question based on the reference material above.

CONSTRAINTS:
Topic: {topic}
Difficulty: {difficulty}
Marks: {marks}
Course Outcome: {co_desc}
Learning Outcome: {lo_desc}

{bloom_guidance}

{novelty_exclusion}

QUESTION QUALITY RULES:
1. The question MUST test a specific concept from the reference material.
2. The question FORMAT must match the Bloom level assigned above:
   - K3-Apply: "Describe the steps involved in..." or brief clinical context + question
   - K4-Analyze: Clinical scenario with specific data — "A patient presents with [findings]. Analyze..."
   - K5-Evaluate: "Critically evaluate...", "Compare and contrast...", or a complex clinical dilemma
3. Questions must be SELF-CONTAINED — never reference "this book", "the text", "the chapter".
4. Include marking scheme with specific criteria.
5. NOT every essay question needs a patient case — analytical/comparative prompts are equally valid.

OUTPUT FORMAT (strict JSON — reasoning MUST be filled):
{{
  "questions": [
    {{
      "reasoning": "2-3 sentences explaining WHY you chose this question topic and WHICH specific part of the reference material inspired it. This is MANDATORY.",
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
      "bloom_level": "K4-Analyze",
      "difficulty": "{difficulty}",
      "topic": "{topic}",
      "mapped_co": "{co_code}",
      "mapped_lo": "{lo_code}",
      "marks": {marks}
    }}
  ]
}}
"""


# ─── Few-Shot MCQ Prompt (primary path for rubric generation) ─────────────

MCQ_GENERATION_WITH_FEWSHOT = '''You are an experienced university faculty member writing exam questions.
You create questions like a professor who has been teaching this subject for 20 years —
testing deep understanding through scenarios AND direct conceptual knowledge.

SUBJECT: {subject_name}
TOPIC: {topic_name}
COURSE OUTCOMES: {co_desc}
LEARNING OUTCOMES: {lo_desc}

REFERENCE MATERIAL:
---
{rag_context}
---

{few_shot_section}

{bloom_guidance}

{novelty_exclusion}

TASK: Generate EXACTLY {count} Multiple Choice Question(s).

BANNED PHRASES — NEVER use these to start a question (instant fail):
- "In the context of..."
- "During the process of..."
- "Considering the principles of..."
- "According to the principles discussed..."
- "When managing a patient with..."
Do NOT use any of the above patterns. Vary your question openings completely.

QUESTION DEPTH RULES — NO BASIC QUESTIONS:
- NEVER ask simple recall or definition questions like:
  "What is the function of...?", "Which of the following defines...?", "The most common indication for...?",
  "What is the primary purpose of...?", "Which of the following is true about...?"
- Every question MUST require REASONING, APPLICATION, or ANALYSIS — not just memorization.
- The student should need to THINK through the answer, not just recall a fact from memory.
- Even "Easy" questions should test understanding of WHY something works, not just WHAT it is.
  BAD (basic): "What is the function of the posterior palatal seal?"
  GOOD (applied): "Which preparation design is most suitable for lithium disilicate crowns in the anterior region?"

ADVANCED QUESTION RULES — CRITICAL:
1. SCENARIO-BASED: Hard questions MUST present a SPECIFIC situation with 
   real data (numbers, measurements, named concepts) from the reference material.
   BAD: "What approach is best for this problem?"
   GOOD: Present a scenario with 2-3 specific constraints, then ask which solution resolves them.

2. SPECIFICITY IN OPTIONS: Every option must name a SPECIFIC method, 
   technique, concept, or value — NOT vague approaches.
   BAD: "Improve the process", "Focus on quality"
   GOOD: Name actual methods/techniques from the reference material.

3. ANTI-REVEAL RULES — THE ANSWER MUST NOT BE OBVIOUS:
   - The question stem must NOT contain the exact key term from the correct option.
     BAD: "Given that occlusal wear can be minimized by providing a perfected occlusion, 
           what should be prioritized?" → Answer: "Ensuring precise occlusal relationships"
     The word "occlusion/occlusal" appears in BOTH the stem AND the answer, making it a word-match guess.
   - All 4 options should look equally plausible to a student reading the stem.
   - A student who has NOT studied should NOT be able to guess the answer by elimination.

4. DISTRACTOR RULES — ALL OPTIONS MUST BE K3/K4 LEVEL:
   - EVERY option (A, B, C, D) must be a REAL, PLAUSIBLE concept from the subject domain.
   - BANNED throwaway patterns (instant fail):
     * "Avoiding [X] altogether"
     * "Focusing solely on [X]"
     * "Ignoring [X]"
     * "Prioritizing ease of [X] over functionality"
     * Any option with "solely", "altogether", "never", "always" as absolute qualifiers
   - Each wrong option should be something a student who PARTIALLY understands 
     would genuinely consider correct.
   - The wrong options should be real techniques/methods that apply to SIMILAR 
     but DIFFERENT situations — not absurd choices.

5. EXPERIMENTAL QUESTIONS: At least one question should combine TWO 
   concepts from different parts of the reference material — forcing the 
   student to synthesize knowledge across sub-topics.

6. DIFFICULTY CALIBRATION:
   - Easy: Requires choosing the correct specific concept (not definitions)
   - Moderate: Requires applying a concept to a specific situation
   - Hard: Requires analyzing a complex scenario with multiple constraints

7. LOGICAL SOUNDNESS — NON-NEGOTIABLE:
   - The question stem, scenario, and correct answer must form a 
     LOGICALLY CONSISTENT chain — no contradictions between them.
   - The correct answer MUST be UNAMBIGUOUSLY the best choice. If two 
     options could both be correct, rewrite until only one clearly fits.
   - The scenario must be REALISTIC and PLAUSIBLE within the subject domain.
   - Options must not contradict facts stated in the question stem itself.
   - Before finalizing, verify: "Does the correct answer ACTUALLY solve 
     the problem described in the stem?" If not, fix it.

YOUR QUESTIONS MUST FOLLOW THESE PATTERNS — use specific concepts, techniques, classifications, and measurements from the text. Do NOT write generic management questions.

STRICT RULES:
1. Return EXACTLY {count} MCQs — no more, no less
2. Every question MUST have an "options" field with exactly 4 options (A, B, C, D)
3. Questions are SELF-CONTAINED — NEVER say "this book", "the textbook", "the author", "as discussed in"
4. Option values must NOT have letter prefixes (write "Restore function" NOT "A) Restore function")
5. Each question tests a DIFFERENT concept from the reference material
6. Distractors must be plausible — they should represent real clinical errors or misconceptions
7. NOT every question should follow the same pattern — mix vignettes with direct questions
8. RANDOMIZE which option (A, B, C, or D) is the correct answer across questions

OUTPUT FORMAT (strict JSON — reasoning MUST be filled):
{{
  "questions": [
    {{
      "reasoning": "2-3 sentences explaining WHY you chose this question topic and WHICH specific part of the reference material inspired it. This is MANDATORY.",
      "question_text": "...",
      "question_type": "mcq",
      "options": {{"A": "...", "B": "...", "C": "...", "D": "..."}},
      "correct_answer": "{example_answer}",
      "explanation": "...",
      "bloom_level": "K3-Apply",
      "mapped_co": "{co_code}",
      "mapped_lo": "{lo_code}",
      "difficulty": "{difficulty}"
    }}
  ]
}}
'''


def build_few_shot_section(sample_questions: list) -> str:
    """Build few-shot examples section from sample questions.
    Extracts structural patterns (blueprints) instead of full text to prevent copying."""
    if not sample_questions:
        return ""

    examples = """STRUCTURAL BLUEPRINTS (from your uploaded samples):
You MUST use these blueprints to understand the ARCHITECTURE of a good question,
but you MUST NOT copy the clinical content. You must invent your own!

"""
    for i, q in enumerate(sample_questions, 1):
        q_text = q.get('question_text', '')
        
        # Determine archetype based on text
        archetype = "Direct Concept Question"
        if "year-old" in q_text.lower() or "patient" in q_text.lower() or "presents" in q_text.lower():
            archetype = "Clinical Vignette ([Patient Demographics] + [Specific Measurements/Findings] -> [Clinical Decision Point])"
        elif "mm" in q_text.lower() or "cm" in q_text.lower() or "degree" in q_text.lower():
            archetype = "Data-Driven Scenario ([Measurements/Parameters] -> [Technical Calculation/Evaluation])"
            
        examples += f"Blueprint {i}: {archetype}\n"
        
        if q.get('options'):
            # Randomize which option is labeled as correct in the blueprint
            correct_pos = _random.choice(['A', 'B', 'C', 'D'])
            other_labels = ['Common misconception/error', 'Outdated or universally incorrect approach', 'Plausible but completely wrong domain']
            _random.shuffle(other_labels)
            label_idx = 0
            for letter in ['A', 'B', 'C', 'D']:
                if letter == correct_pos:
                    examples += f"- Option {letter}: Correct evidence-based approach\n"
                else:
                    examples += f"- Option {letter}: {other_labels[label_idx]}\n"
                    label_idx += 1
            
        examples += "\n"
        
    examples += """YOUR TASK vs BLUPRINTS:
Match the *complexity* and *structure* of these blueprints, but for a COMPLETELY DIFFERENT 
clinical topic from the reference material, with totally different fictional measurements and data.
"""
    return examples


# ─── Unified + Assignment Prompts ─────────────────────────────────────────

UNIFIED_GENERATION_PROMPT = """
You are an experienced university faculty member setting exam questions for {subject_name}.

REFERENCE MATERIAL:
{rag_context}

TASK: Generate {total_questions} questions for Topic: "{topic}"

REQUIRED DISTRIBUTION:
{distribution_text}

CONSTRAINTS:
- Difficulty: {difficulty}
- Course Outcome: {co}
- Learning Outcome: {lo}

{bloom_guidance}

QUESTION QUALITY RULES:
- NEVER reference source material in any way. This includes: "this book", "the text", "the chapter", "in chapter X", "section X", "as discussed in", "according to the textbook", "the author states", "as mentioned in". Questions must read as standalone exam questions with NO trace of where the content came from.
- Each question must test a DIFFERENT concept
- For medium/hard MCQs, create scenarios with specific details
- MCQs must have 4 options (A,B,C,D) with plausible distractors
- Vary question stems — avoid repetitive patterns

OUTPUT FORMAT (strict JSON):
{{
  "questions": [
    {{
      "question_text": "...",
      "reasoning": "...",
      "question_type": "mcq",
      "options": {{"A": "...", "B": "...", "C": "...", "D": "..."}},
      "correct_answer": "{example_answer}",
      "bloom_level": "K2-Understand",
      "marks": 1,
      "difficulty": "{difficulty}",
      "mapped_co": "{co}",
      "mapped_lo": "{lo}"
    }},
    {{
      "question_text": "...",
      "reasoning": "...",
      "question_type": "short_answer",
      "expected_answer": "...",
      "key_points": ["point1", "point2"],
      "bloom_level": "K3-Apply",
      "marks": 2,
      "difficulty": "{difficulty}",
      "mapped_co": "{co}",
      "mapped_lo": "{lo}"
    }},
    {{
      "question_text": "...",
      "reasoning": "...",
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
      "bloom_level": "K4-Analyze",
      "marks": 5,
      "difficulty": "{difficulty}",
      "mapped_co": "{co}",
      "mapped_lo": "{lo}"
    }}
  ]
}}
"""

ASSIGNMENT_PROMPT_TEMPLATE = """
You are an experienced university faculty member creating assignments for {subject_name}.

REFERENCE MATERIAL:
{rag_context}

TASK: Generate {count} assignment question(s) / task(s) for the topic "{topic}".

These are ASSIGNMENT tasks — not exam questions. They should be:
- Practical, applied, and in-depth
- Suitable for take-home work (students have time to research and write)
- Testing higher-order thinking: analysis, application, evaluation, creation
- Clear with specific deliverables and expectations
- SELF-CONTAINED — never reference "this book" or "the text"

Difficulty: {difficulty}
Marks per question: {marks}

OUTPUT FORMAT (strict JSON):
{{
  "questions": [
    {{
      "question_text": "A detailed assignment task description...",
      "reasoning": "...",
      "question_type": "assignment",
      "expected_deliverables": ["deliverable 1", "deliverable 2"],
      "marking_scheme": [
        {{"criteria": "...", "marks": 5}},
        {{"criteria": "...", "marks": 5}}
      ],
      "difficulty": "{difficulty}",
      "topic": "{topic}",
      "marks": {marks}
    }}
  ]
}}
"""


# ─── Post-Generation Validation Prompt ─────────────────────────────────────

MCQ_VALIDATION_PROMPT = '''You are a strict exam quality reviewer. Check if this MCQ meets HIGH standards.

REFERENCE MATERIAL:
---
{context}
---

QUESTION: {question_text}
OPTIONS: {options}
MARKED ANSWER: {correct_answer}
EXPLANATION: {explanation}

VALIDATE ALL OF THESE — be ruthless:

1. ANSWER CHECK: Is the marked correct answer actually THE BEST answer? If another option is better, FAIL.

2. FACTUAL CHECK: Does the question contain any factual ERROR or CONTRADICTION?

3. FORMAT CHECK: Is the question GARBLED, INCOMPLETE, or does it reference source material?

4. AMBIGUITY CHECK: Could TWO or more options be equally correct? If yes, FAIL.

5. DISTRACTOR QUALITY CHECK — CRITICAL:
   - Are ALL 4 options REAL, SPECIFIC concepts from the subject domain?
   - FAIL if any option uses vague/generic phrasing like:
     "Focus solely on...", "Ignore the...", "Avoid...", "Without considering..."
   - FAIL if any option is an obviously absurd statement no student would pick
   - Every wrong option should be a real technique/method that applies to a SIMILAR situation

6. ELIMINATION TEST:
   - Could a student who has NOT studied guess the answer by eliminating obviously wrong options?
   - If 2+ options are clearly absurd, the question is TOO EASY regardless of the stem — FAIL.

7. WORD-MATCH TEST:
   - Does the question stem contain a unique keyword that appears ONLY in the correct option?
   - If yes, a student could guess without knowledge — FAIL.

FAIL the question if ANY of checks 1-7 reveals a problem.

OUTPUT (strict JSON):
{{
  "pass": true or false,
  "issues": ["specific problems found, empty if pass=true"],
  "suggested_correct_answer": "only if marked answer is wrong, else null"
}}
'''


# ─── Light Re-Validation After Correction ──────────────────────────────────

MCQ_REVALIDATION_PROMPT = '''A medical MCQ was corrected after review. Do a quick sanity check.

QUESTION: {question_text}
OPTIONS: {options}
MARKED ANSWER: {correct_answer}

Is the marked answer clearly WRONG? (yes/no)
Is the question text GARBLED or NONSENSICAL? (yes/no)

OUTPUT (strict JSON):
{{
  "pass": true or false,
  "issues": ["only if pass=false"]
}}

If the question reads well and the answer is reasonable, return {{"pass": true, "issues": []}}.
'''


# ─── Post-Validation Self-Correction Prompt ────────────────────────────────

MCQ_CORRECTION_PROMPT = '''You are an exam question editor. Fix the specific problems found in this MCQ.

REFERENCE MATERIAL:
---
{context}
---

ORIGINAL QUESTION:
Question: {question_text}
Options: {options}
Marked Correct Answer: {correct_answer}
Explanation: {explanation}

PROBLEMS FOUND:
{issues}

{suggested_fix}

CORRECTION RULES:
1. If the issue is "not in reference material" — rewrite the question to focus on a concept that IS in the reference material above, keeping the same difficulty and topic area
2. If the issue is "wrong answer" — fix the correct answer and adjust options/explanation
3. If the issue is "ambiguous options" — make the correct option clearly the best choice
4. If the issue mentions "throwaway", "weak distractors", "elimination", or "vague options" — replace EACH weak option with a REAL, SPECIFIC technique, method, or concept from the reference material that applies to a SIMILAR but DIFFERENT situation. ALL 4 options must be plausible.
5. If the issue mentions "word-match" — rewrite the question stem so it does NOT share unique keywords with only the correct option
6. Keep exactly 4 options (A, B, C, D)
7. The explanation must justify why the correct answer is right
8. NEVER reference source material (no "in chapter X", "the textbook", "as discussed in", etc.)

OUTPUT the corrected question as strict JSON:
{{
  "question_text": "corrected question text",
  "options": {{"A": "...", "B": "...", "C": "...", "D": "..."}},
  "correct_answer": "letter of correct option",
  "explanation": "why this answer is correct based on the reference material",
  "reasoning": "what was fixed and why",
  "bloom_level": "{bloom_level}",
  "mapped_co": "{co_code}",
  "mapped_lo": "{lo_code}",
  "difficulty": "{difficulty}"
}}
'''
