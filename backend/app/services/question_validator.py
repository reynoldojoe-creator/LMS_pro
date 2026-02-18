import json
import logging
import numpy as np
from typing import Dict, Any, List, Optional

from .. import config
from .llm_service import LLMService
from .embedding_service import EmbeddingService
from ..prompts.validation_prompts import VALIDATION_PROMPT_TEMPLATE

logger = logging.getLogger(__name__)

class QuestionValidator:
    def __init__(self):
        self.llm_service = LLMService()
        self.embedding_service = EmbeddingService()

    def validate_rules(self, question: Dict[str, Any]) -> Dict[str, Any]:
        """
        Performs instant rule-based checks on the question structure.
        """
        issues = []
        
        # 1. Basic Fields Check
        required_fields = ["question_text", "question_type", "bloom_level", "difficulty", "marks"]
        for field in required_fields:
            if field not in question or not question[field]:
                issues.append(f"Missing required field: {field}")

        # 2. MCQ Specific Checks
        if question.get("question_type") == "MCQ":
            options = question.get("options", {})
            
            # Check options count
            if not isinstance(options, dict) or len(options) != 4:
                issues.append(f"MCQ must have exactly 4 options, found {len(options) if isinstance(options, dict) else 'invalid format'}")
            
            # Check distinct options (case insensitive)
            if isinstance(options, dict):
                option_values = [str(v).strip().lower() for v in options.values()]
                if len(set(option_values)) != len(option_values):
                    issues.append("MCQ options must be distinct")
                
                # Check correct answer existence
                correct = question.get("correct_answer")
                if correct not in options:
                    issues.append(f"Correct answer key '{correct}' not found in options")

        return {
            "valid": len(issues) == 0,
            "issues": issues
        }

    def _cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """
        Calculates cosine similarity between two vectors.
        """
        v1 = np.array(vec1)
        v2 = np.array(vec2)
        
        norm1 = np.linalg.norm(v1)
        norm2 = np.linalg.norm(v2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
            
        return float(np.dot(v1, v2) / (norm1 * norm2))

    def check_similarity(self, question_text: str, existing_questions: List[str]) -> float:
        """
        Checks semantic similarity against a list of existing questions.
        Returns the maximum similarity score (0.0 to 1.0).
        """
        if not existing_questions:
            return 0.0
            
        try:
            # Generate embeddings
            q_emb = self.embedding_service.generate_embeddings([question_text])[0]
            exist_embs = self.embedding_service.generate_embeddings(existing_questions)
            
            # Calculate max similarity
            max_sim = 0.0
            for e_emb in exist_embs:
                sim = self._cosine_similarity(q_emb, e_emb)
                if sim > max_sim:
                    max_sim = sim
            
            return max_sim
            
        except Exception as e:
            logger.error(f"Error in similarity check: {e}")
            return 0.0

    def validate_with_llm(self, question: Dict[str, Any], context: str) -> Dict[str, Any]:
        """
        Uses LLM to evaluate complex quality metrics (alignment, clarity, etc.).
        """
        try:
            prompt = VALIDATION_PROMPT_TEMPLATE.format(
                question_json=json.dumps(question, indent=2),
                rag_context=context[:2000] # Truncate context to fit window
            )
            
            # Use the higher quality model for validation if available, 
            # otherwise fallback to FAST_LLM_MODEL is fine, but validation benefits from reasoning.
            # Using LLM_MODEL (phi3.5) as it is better at evaluation than qwen2.5:1.5b usually.
            response_text = self.llm_service.generate_response(
                prompt,
                model=config.LLM_MODEL, 
                stream=False,
                options={"temperature": 0.1}
            )
            
            # Cleanup JSON
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[1].strip()
            
            start_idx = response_text.find("{")
            end_idx = response_text.rfind("}")
            if start_idx != -1 and end_idx != -1:
                 response_text = response_text[start_idx:end_idx+1]
            
            return json.loads(response_text)
            
        except Exception as e:
            logger.error(f"LLM validation failed: {e}")
            return {
                "pass": False, 
                "overall_score": 0, 
                "issues": [f"Validation Error: {str(e)}"]
            }

    def validate_question(
        self, 
        question: Dict[str, Any], 
        context: str, 
        existing_questions: List[str] = [],
        llm_check: bool = True
    ) -> Dict[str, Any]:
        """
        Main validation method combining all checks.
        """
        # 1. Rule-based Checks
        rule_result = self.validate_rules(question)
        if not rule_result["valid"]:
             return {
                 "status": "fail", 
                 "decision": "reject",
                 "reason": "Rule checks failed", 
                 "details": rule_result
             }
             
        # 2. Similarity Check
        sim_score = self.check_similarity(question["question_text"], existing_questions)
        if sim_score > 0.85:
            return {
                "status": "fail", 
                "decision": "reject",
                "reason": f"Duplicate detected (Similarity: {sim_score:.2f})",
                "similarity_score": sim_score
            }
            
        # 3. LLM Evaluation (Optional)
        llm_result = {}
        if llm_check and context:
            llm_result = self.validate_with_llm(question, context)
            if not llm_result.get("pass", False):
                 return {
                    "status": "fail",
                    "decision": "reject",
                    "reason": "LLM Quality Check Failed",
                    "similarity_score": sim_score,
                    "llm_evaluation": llm_result
                 }

        return {
            "status": "success",
            "decision": "approve",
            "similarity_score": sim_score,
            "llm_evaluation": llm_result
        }
