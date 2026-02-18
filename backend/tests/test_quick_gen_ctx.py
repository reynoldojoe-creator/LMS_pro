
import unittest
from unittest.mock import MagicMock, patch, AsyncMock
import sys
import os
import asyncio

# Add backend to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Add backend to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import main to ensure models are loaded
try:
    from app import main
except ImportError:
    pass

from app.services.topic_actions_service import TopicActionsService
from app.services.rag_service import RAGService
from app.services.vector_store import VectorStore

class TestQuickGenContext(unittest.TestCase):
    def setUp(self):
        self.mock_db = MagicMock()
        
    @patch('app.services.topic_actions_service.TopicActionsService._get_topic_with_cos', new_callable=AsyncMock)
    @patch('app.services.topic_actions_service.TopicActionsService._get_sample_questions', new_callable=AsyncMock)
    @patch('app.services.rag_service.RAGService.retrieve_context')
    @patch('app.services.hybrid_generator.HybridGenerationSystem.generate_question', new_callable=AsyncMock)
    def test_quick_generate_passes_topic_id(self, mock_gen, mock_retrieve, mock_get_samples, mock_get_topic):
        # Setup
        service = TopicActionsService()
        
        # Mock returns
        mock_get_topic.return_value = {"id": 123, "name": "Test Topic", "co_mappings": []}
        mock_get_samples.return_value = []
        mock_retrieve.return_value = "Retrieved Context"
        mock_gen.return_value = {"selected": {"question_text": "Q1"}}
        
        # Execute
        asyncio.run(service.quick_generate_questions(
            db=self.mock_db,
            subject_id=1,
            topic_id=123,
            question_type="mcq",
            count=1
        ))
        
        # Verify retrieve_context was called with topic_id
        mock_retrieve.assert_called_with(
            query_text="Test Topic",
            subject_id="1",
            n_results=5,
            topic_id="123"
        )
        print("✓ Verified: topic_id '123' passed to retrieve_context")

if __name__ == '__main__':
    unittest.main()
