
import asyncio
import sys
import os
from unittest.mock import MagicMock, AsyncMock, patch

# Add project root to path
sys.path.append(os.getcwd())

from backend.app.services.hybrid_generator import HybridGenerationSystem
from backend.app.services.topic_actions_service import TopicActionsService

async def verify_hybrid_generation():
    print("\n[TEST] Verifying Hybrid Generation (Council of LLMs)...")
    
    system = HybridGenerationSystem()
    
    # Mock LLMService to return different responses for different temps
    # And a chairman response
    
    async def mock_generate(*args, **kwargs):
        prompt = kwargs.get('prompt', '')
        if "Exam Chairman" in prompt:
            # Chairman selection
            return {
                "selected_variant": "B",
                "reason": "Variant B is most clear."
            }
        else:
            # Variant generation
            temp = kwargs.get('temperature', 0.7)
            return {
                "question_text": f"Question generated at temp {temp}",
                "questions": [{ "question_text": f"Question generated at temp {temp}" }]
            }

    system.generator.generate = AsyncMock(side_effect=mock_generate)
    
    result = await system.generate_question(
        prompt_template="Generate question",
        topic_id=1,
        context={}
    )
    
    print(f"  Selected Variant: {result.get('selected')}")
    print(f"  Chairman Choice: {result.get('chairman_choice')}")
    print(f"  Reason: {result.get('selection_reason')}")
    
    if result.get('chairman_choice') == "B":
        print("[PASS] Chairman selected variant B.")
    else:
        print(f"[FAIL] Expected Chairman choice B, got {result.get('chairman_choice')}")
        
    if len(result.get('variants', [])) == 3:
        print("[PASS] 3 Variants generated.")
    else:
        print(f"[FAIL] Expected 3 variants, got {len(result.get('variants', []))}")

async def main():
    await verify_hybrid_generation()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception as e:
        print(f"Error: {e}")
