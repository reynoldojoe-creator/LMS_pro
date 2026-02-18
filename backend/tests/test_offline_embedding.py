import sys
import os
import logging
from unittest.mock import patch, MagicMock

# Add the backend directory to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

# Set offline environment variables BEFORE importing anything else if possible,
# or patch them during the test.
os.environ['HF_HUB_OFFLINE'] = '1'
os.environ['TRANSFORMERS_OFFLINE'] = '1'

from app.services.embedding_service import EmbeddingService
from app.config import EMBEDDING_MODEL_PATH

def test_offline_embedding_initialization():
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)
    
    logger.info("Starting Offline Embedding Service Verification...")
    
    # Verify environment variables
    logger.info(f"HF_HUB_OFFLINE: {os.environ.get('HF_HUB_OFFLINE')}")
    logger.info(f"TRANSFORMERS_OFFLINE: {os.environ.get('TRANSFORMERS_OFFLINE')}")
    
    # Check if local model path exists
    if not os.path.exists(EMBEDDING_MODEL_PATH):
        logger.error(f"Local model path does not exist: {EMBEDDING_MODEL_PATH}")
        # We cannot proceed with offline test if model is missing
        return

    try:
        service = EmbeddingService()
        logger.info("Successfully initialized EmbeddingService in offline mode.")
        
        # Test generation
        texts = ["This is a test sentence.", "Another test sentence."]
        embeddings = service.generate_embeddings(texts)
        
        logger.info(f"Generated embeddings for {len(texts)} texts.")
        logger.info(f"Embedding dimension: {len(embeddings[0])}")
        
        if len(embeddings) == 2 and len(embeddings[0]) > 0:
             logger.info("Verification SUCCESSFUL: Embeddings generated offline.")
        else:
             logger.error("Verification FAILED: Embeddings empty or incorrect count.")

    except Exception as e:
        logger.error(f"Verification FAILED: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_offline_embedding_initialization()
