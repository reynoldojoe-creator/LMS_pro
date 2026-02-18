
import asyncio
import sys
import os
import json
from unittest.mock import MagicMock, AsyncMock

# Add project root to path
sys.path.append(os.getcwd())

from backend.app.services.outcome_mapper import OutcomeMappingService
from backend.app.models.database import Topic, CourseOutcome, Unit, TopicCOMapping

async def verify_mapping_service():
    print("\n[TEST] Verifying Outcome Mapping Service...")
    
    # Mock DB Session
    mock_db = MagicMock()
    
    # Mock Entities
    mock_co = CourseOutcome(id=1, code="CO1", description="Understand basic concepts")
    mock_topic1 = Topic(id=101, name="Introduction to Algorithms")
    mock_topic1.unit = Unit(number=1, subject_id=1)
    mock_topic2 = Topic(id=102, name="Sorting Techniques")
    mock_topic2.unit = Unit(number=1, subject_id=1)
    
    mock_db.query.return_value.filter.return_value.first.return_value = mock_co
    mock_db.query.return_value.join.return_value.filter.return_value.all.return_value = [mock_topic1, mock_topic2]
    
    service = OutcomeMappingService()
    
    # Mock LLM Service Response
    async def mock_generate(*args, **kwargs):
        return {"topic_ids": [101], "reasoning": "Intro helps understand basics"}
    
    service.llm_service.generate = AsyncMock(side_effect=mock_generate)
    
    # Test Auto Suggest
    print("  Testing Auto Suggest...")
    suggestion = await service.auto_suggest_mappings(mock_db, subject_id=1, co_id=1)
    print(f"  Suggestion: {suggestion}")
    
    if suggestion.get("topic_ids") == [101]:
        print("[PASS] Auto-suggest returned expected topics.")
    else:
        print("[FAIL] Auto-suggest mismatch.")

    # Test Bulk Map
    print("  Testing Bulk Map...")
    # Mock query for existing to return None
    mock_db.query.return_value.filter_by.return_value.first.return_value = None
    
    service.bulk_map(mock_db, co_id=1, topic_ids=[101, 102], weight='high')
    
    # check db.add called
    if mock_db.add.call_count == 2:
        print("[PASS] Bulk map added 2 mappings.")
    else:
        print(f"[FAIL] Expected 2 adds, got {mock_db.add.call_count}")

async def main():
    await verify_mapping_service()

if __name__ == "__main__":
    asyncio.run(main())
