import json
import logging
from typing import List, Dict, Any, Optional
from .. import config
from .llm_service import LLMService
from .rag_service import RAGService
from ..prompts.generation_prompts import MCQ_PROMPT_TEMPLATE, SHORT_ANSWER_PROMPT_TEMPLATE, ESSAY_PROMPT_TEMPLATE

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class QuestionGenerator:
    def __init__(self):
        self.llm_service = LLMService()
        self.rag_service = RAGService()

    async def generate_questions(
        self,
        subject_name: str,
        subject_id: str,
        topic: str,
        question_type: str,
        difficulty: str,
        db: Optional[Any] = None, # Added db support
        count: int = 1,
        co: str = "N/A",
        lo: str = "N/A",
        marks: int = 1
    ) -> Dict[str, Any]:
        """
        Generates questions based on the provided parameters and retrieved context.
        """
        try:
            # 1. Check for Custom Skill
            skill_instructions = ""
            if db and topic:
                try:
                    from ..models import database
                    # Find topic by name/id - simpler if we had topic_id, but here we only have name
                    # Let's try to find topic by name if topic_id not passed (which it isn't in signature)
                    # Ideally signature should have topic_id
                    
                    found_topic = db.query(database.Topic).filter(database.Topic.name == topic).first()
                    if found_topic:
                        skill = db.query(database.TopicSkill).filter(database.TopicSkill.topic_id == found_topic.id).first()
                        if skill:
                            # Skill found!
                            import os
                            skill_path = os.path.join(skill.skill_path, "SKILL.md")
                            if os.path.exists(skill_path):
                                with open(skill_path, "r") as f:
                                    skill_instructions = f.read()
                                logger.info(f"Using custom skill for topic: {topic}")
                except Exception as e:
                    logger.warning(f"Failed to load skill: {e}")

            # 2. Retrieve Context
            # Construct a meaningful query from available info
            query_parts = []
            if topic and topic.strip():
                query_parts.append(topic.strip())
            if lo and lo.strip() and lo != "N/A":
                query_parts.append(lo.strip())
            if subject_name and subject_name.strip():
                query_parts.append(subject_name.strip())
            query_text = " ".join(query_parts) if query_parts else subject_name
            logger.info(f"RAG query: '{query_text}' for collection subject_{subject_id}")
            rag_context = self.rag_service.retrieve_context(query_text, subject_id)
            
            if not rag_context:
                logger.warning(f"No context found for query: {query_text}")
                rag_context = "No specific context available from the uploaded syllabus/materials. Generate based on general knowledge of the topic."

            # 2. Select Prompt Template
            qt = question_type.lower().strip()
            if qt in ("mcq", "multiple_choice"):
                prompt_template = MCQ_PROMPT_TEMPLATE
            elif qt in ("short", "short_answer"):
                prompt_template = SHORT_ANSWER_PROMPT_TEMPLATE
            elif qt == "essay":
                prompt_template = ESSAY_PROMPT_TEMPLATE
            else:
                raise ValueError(f"Unsupported question type: {question_type}")

            # 3. Format Prompt
            # Calculation for word count hint in short answer
            word_count = marks * 30 
            
            prompt = prompt_template.format(
                subject_name=subject_name,
                rag_context=rag_context[:3000], # Truncate context to avoid overflow
                count=count,
                topic=topic,
                difficulty=difficulty,
                co=co,
                lo=lo,
                marks=marks,
                word_count=word_count
            )
            
            # Prepend skill instructions if available
            if skill_instructions:
                prompt = f"{skill_instructions}\n\n{prompt}"

            # 4. Generate Response
            response_text = await self.llm_service.generate_response(
                prompt,
                model=config.FAST_LLM_MODEL, # Use faster model for generation
                stream=False,
                options={"temperature": 0.7} # Creativity allowed for question generation
            )

            # 5. Parse JSON
            try:
                response_text = response_text.strip()
                if not response_text:
                    raise ValueError("Empty response from LLM")

                # Cleanup: extract JSON substring if embedded in text
                if "```json" in response_text:
                    response_text = response_text.split("```json")[1].split("```")[0].strip()
                elif "```" in response_text:
                    response_text = response_text.split("```")[1].strip()
                
                # Find first '{' and last '}'
                start_idx = response_text.find("{")
                end_idx = response_text.rfind("}")
                if start_idx != -1 and end_idx != -1:
                     response_text = response_text[start_idx:end_idx+1]
                else:
                    # If no braces found, it might be raw text or malformed.
                    # Try to see if it's a list wrapped in []
                    start_list = response_text.find("[")
                    end_list = response_text.rfind("]")
                    if start_list != -1 and end_list != -1:
                         # Wrap in object expected by schema
                         response_text = '{"questions": ' + response_text[start_list:end_list+1] + '}'
                
                # Fix common JSON issues from LLMs
                import re
                # Remove trailing commas before } or ]
                response_text = re.sub(r',\s*([}\]])', r'\1', response_text)
                
                data = json.loads(response_text)
                
                # Ensure "questions" key exists
                if "questions" not in data and isinstance(data, list):
                    data = {"questions": data}
                    
                return data

            except (json.JSONDecodeError, ValueError) as e:
                logger.error(f"Failed to parse generation output: {e}\nRaw: {response_text[:500]}")
                # Return a fallback question so generation isn't completely lost
                return {
                    "questions": [{
                        "question_text": response_text[:500] if response_text else "Generation produced unparseable output",
                        "question_type": question_type,
                        "correct_answer": "Parse error - review manually",
                        "difficulty": difficulty,
                        "marks": marks,
                        "mapped_co": co,
                        "mapped_lo": lo
                    }]
                }

        except Exception as e:
            logger.error(f"Error generating questions: {e}")
            raise
