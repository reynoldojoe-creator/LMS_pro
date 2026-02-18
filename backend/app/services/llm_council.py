from typing import Dict, Any, List
from ..models.council_result import CouncilResult
from .llm_service import LLMService
from .council_cache import council_cache
import logging
import json

logger = logging.getLogger(__name__)

COUNCIL_PROMPT = """
You are an academic quality assurance system with three expert perspectives.
Evaluate the following question from all three angles:

**QUESTION TO EVALUATE:**
{question_text}

**CONTEXT:**
- Topic: {topic_name}
- Subject: {subject_name}
- Target Course Outcome: {co_description}
- Target Bloom's Level: {blooms_level}
- Question Type: {question_type}

**EVALUATE AS THREE EXPERTS:**

1. **CONTENT EXPERT** - Syllabus Alignment
   - Does the question accurately reflect the topic content?
   - Is it aligned with the specified Course Outcome (CO)?
   - Are there any factual errors or ambiguities?
   Score: 0-10

2. **PEDAGOGY EXPERT** - Educational Quality
   - Is the Bloom's taxonomy level appropriate?
   - Is the difficulty suitable for the target audience?
   - Does it assess the intended learning outcome?
   Score: 0-10

3. **QUALITY EXPERT** - Technical Quality
   - Is the language clear and unambiguous?
   - Is the grammar and formatting correct?
   - Are answer options balanced (if MCQ)?
   Score: 0-10

**OUTPUT FORMAT (JSON):**
{{
  "content_expert": {{
    "score": <0-10>,
    "feedback": "<specific issues or approval>",
    "verdict": "APPROVE|REVISE|REJECT"
  }},
  "pedagogy_expert": {{
    "score": <0-10>,
    "feedback": "<specific issues or approval>",
    "verdict": "APPROVE|REVISE|REJECT"
  }},
  "quality_expert": {{
    "score": <0-10>,
    "feedback": "<specific issues or approval>",
    "verdict": "APPROVE|REVISE|REJECT"
  }},
  "overall_verdict": "APPROVE|REVISE|REJECT",
  "aggregate_score": <average of three scores>,
  "critical_issues": ["<list any blocking issues>"],
  "suggested_improvements": ["<list suggested fixes>"]
}}
"""

class LLMCouncil:
    def __init__(self):
        self.llm_service = LLMService()

    async def evaluate_question(
        self,
        question_text: str,
        topic_name: str,
        subject_name: str,
        co_description: str,
        blooms_level: str,
        question_type: str
    ) -> CouncilResult:
        """
        Evaluates a question using a unified multi-perspective prompt.
        Uses caching to avoid redundant calls.
        """
        
        async def _run_evaluation():
            try:
                prompt = COUNCIL_PROMPT.format(
                    question_text=question_text,
                    topic_name=topic_name,
                    subject_name=subject_name,
                    co_description=co_description,
                    blooms_level=blooms_level,
                    question_type=question_type
                )
                
                # Use JSON mode in Ollama
                response = await self.llm_service.generate(
                    prompt,
                    format="json",  # Enforces JSON output
                    temperature=0.2, # Lower temp for consistent structured output
                    expect_json=True
                )
                
                # Parse into Pydantic model
                return CouncilResult(**response)
                
            except Exception as e:
                logger.error(f"Council evaluation failed: {e}")
                # Return a fallback/error result or raise?
                raise

        # Use cache wrapper
        return await council_cache.get_or_evaluate(
            question_text, 
            question_type, 
            blooms_level, 
            _run_evaluation
        )

llm_council = LLMCouncil()
