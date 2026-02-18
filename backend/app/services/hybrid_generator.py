
import asyncio
import logging
from typing import Dict, Any, List, Optional
from ..services.llm_service import LLMService
from ..services.upskill_integration import LMSUpskillService
from .. import config

logger = logging.getLogger(__name__)

class HybridGenerationSystem:
    """
    Implements a Council of LLMs approach:
    Stage 1: Load personalized skill (if available)
    Stage 2: Generate 3 variants with different temperatures (Council)
    Stage 3: Chairman selects best variant
    """
    
    def __init__(self):
        self.generator = LLMService()
        self.upskill = LMSUpskillService()
        # Chairman uses the same service but potentially different model alias if configured
        self.chairman_model = config.CHAIRMAN_MODEL
        
    async def generate_question(
        self,
        prompt_template: str,
        topic_id: int,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate a question using the hybrid approach.
        """
        # Stage 1: Check for custom skill
        skill_instructions = ""
        try:
             # We need to access DB to check for skill, or query Upskill service if it tracks it?
             # For now, let's assume the caller passes skill instructions OR we fetch it here.
             # Ideally, we fetch it here to keep logic encapsulated.
             # But TopicSkill is in DB. We need a session. 
             # Let's assume context has 'skill_instructions' if caller fetched it, 
             # OR we keep it simple and just use what's passed in prompt.
             pass
        except Exception as e:
            logger.warn(f"Failed to load skill: {e}")

        # Construct Base Prompt
        base_prompt = prompt_template # Assumes template is already formatted OR we format it here.
        # Let's assume the caller (TopicActionsService) formats the prompt with RAG context etc.
        # But we need to inject skill instructions if they exist and aren't already there.
        
        # Stage 2: Generate 3 variants (The Council)
        # We vary temperature to get diversity
        temperatures = [0.5, 0.7, 0.9]
        variants = []
        
        async def generate_variant(temp):
            return await self.generator.generate(
                prompt=base_prompt,
                model=config.GENERATION_MODEL,
                temperature=temp,
                max_tokens=1000,
                expect_json=True # We expect JSON questions
            )
        
        # Run in parallel
        results = await asyncio.gather(*[generate_variant(t) for t in temperatures], return_exceptions=True)
        
        valid_variants = []
        for i, res in enumerate(results):
            if isinstance(res, dict) and not isinstance(res, Exception):
                # Clean up: existing generic generation often returns a list of questions "questions": [...]
                # We need a SINGLE question for this flow usually?
                # TopicActionsService usually asks for 'count'.
                # IF count > 1, this logic gets complex.
                # Requirement says "Generates 3 variants per question". implies 1 question at a time.
                
                # If res has "questions" list, take the first one?
                if "questions" in res and isinstance(res["questions"], list) and res["questions"]:
                    valid_variants.append({
                        "id": chr(65+len(valid_variants)), # A, B, C
                        "content": res["questions"][0], # The question object
                        "temp": temperatures[i]
                    })
                # Check if it returned a single dict (less likely with current prompts but possible)
                elif "question_text" in res:
                    valid_variants.append({
                         "id": chr(65+len(valid_variants)),
                         "content": res,
                         "temp": temperatures[i]
                    })
        
        if not valid_variants:
            raise Exception("All variants failed generation.")
            
        # Stage 3: Chairman Selection
        # If only 1 variant succeeded, just return it
        if len(valid_variants) == 1:
            return {
                "selected": valid_variants[0]["content"],
                "variants": valid_variants,
                "selection_reason": "Only one variant generated successfully."
            }
            
        # Construct Selection Prompt
        variants_text = "\n\n".join([
            f"Variant {v['id']}:\n{v['content'].get('question_text', '')}" 
            for v in valid_variants
        ])
        
        selection_prompt = f"""You are the Exam Chairman. Select the BEST question variant from the options below.
        
        CRITERIA:
        1. Clarity and unambiguity
        2. Correctness of language
        3. Alignment with academic standards
        
        OPTIONS:
        {variants_text}
        
        OUTPUT FORMAT (JSON):
        {{
            "selected_variant": "A",
            "reason": "Explain why this is the best choice..."
        }}
        """
        
        try:
            choice_response = await self.generator.generate(
                prompt=selection_prompt,
                model=self.chairman_model,
                temperature=0.3,
                expect_json=True
            )
            
            selected_id = choice_response.get("selected_variant", "A")
            reason = choice_response.get("reason", "Default selection")
            
            # Find selected variant
            selected = next((v for v in valid_variants if v['id'] == selected_id), valid_variants[0])
            
            return {
                "selected": selected["content"],
                "variants": valid_variants,
                "selection_reason": reason,
                "chairman_choice": selected_id
            }
            
        except Exception as e:
            logger.error(f"Chairman selection failed: {e}")
            # Fallback: Return first variant
            return {
                "selected": valid_variants[0]["content"],
                "variants": valid_variants,
                "selection_reason": "Chairman failed, fallback to Variant A."
            }

hybrid_generation_system = HybridGenerationSystem()
