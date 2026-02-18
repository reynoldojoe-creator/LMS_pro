
import asyncio
import sys
import os
import re
from unittest.mock import MagicMock, AsyncMock

# Add project root to path
sys.path.append(os.getcwd())

from backend.app.services.syllabus_extractor import SyllabusExtractor

async def verify_parser():
    print("\n[TEST] Verifying Hybrid Syllabus Parser...")
    
    extractor = SyllabusExtractor()
    
    # Mock LLM Service
    async def mock_generate(*args, **kwargs):
        return {"valid": True, "corrected_title": "Unit 1: Validated Title", "confidence": 0.95}
    
    extractor.llm_service.generate = AsyncMock(side_effect=mock_generate)
    
    # Test Data: Typical Syllabus Text
    raw_text = """
    SYLLABUS
    
    UNIT I: INTRODUCTION TO ALGORITHMS
    History of algorithms. Complexity analysis.
    - Sorting
    - Searching
    - Graph Traversal
    
    Unit 2 - Data Structures
    Arrays, Linked Lists, Stacks.
    1.1 Queues
    1.2 Trees
    
    CHAPTER 3: ADVANCED DESIGN
    Dynamic Programming. Greedy Algorithms.
    
    """
    
    print("\n[1] Testing Pattern Extraction...")
    extractor._extract_text_from_pdf = MagicMock(return_value=raw_text)
    
    # We can test private method _extract_with_patterns directly
    units = extractor._extract_with_patterns(raw_text)
    
    print(f"  Found {len(units)} units.")
    for u in units:
        print(f"  - {u['title']} (Conf: {u['confidence']:.2f})")
    
    if len(units) >= 3:
        print("[PASS] Pattern extraction found all units.")
    else:
        print("[FAIL] Pattern extraction missed units.")
        
    print("\n[2] Testing Topics Extraction...")
    final_units = extractor._extract_topics_for_units(units, raw_text)
    
    unit1 = next((u for u in final_units if u['number'] == 1), None)
    if unit1:
        topics = [t['name'] for t in unit1['topics']]
        print(f"  Unit 1 Topics: {topics}")
        if "Sorting" in topics and "Searching" in topics:
            print("[PASS] Unit 1 topics extracted.")
        else:
            print("[FAIL] Unit 1 topics missing.")
            
    print("\n[3] Testing LLM Validation (Mocked)...")
    # Simulate low confidence unit
    low_conf_unit = {'number': 4, 'title': 'weird_noise', 'confidence': 0.4, 'raw_header': 'weird_noise'}
    validated = await extractor._validate_with_model(low_conf_unit)
    print(f"  Validated: {validated['title']} (Conf: {validated['confidence']})")
    
    if validated['confidence'] > 0.9:
        print("[PASS] LLM validation corrected confidence.")
    else:
        print("[FAIL] LLM validation failed.")

if __name__ == "__main__":
    asyncio.run(verify_parser())
