import sys
import os
import logging

# Add the backend directory to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.services.vector_store import VectorStore

def check_offline_chroma():
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)

    try:
        # Initialize VectorStore
        # If telemetry is disabled, this should NOT attempt to contact PostHog
        store = VectorStore()
        logger.info("VectorStore initialized successfully (telemetry should be disabled).")
        
        # basic check
        collections = store.client.list_collections()
        logger.info(f"Existing collections: {[c.name for c in collections]}")
        
    except Exception as e:
        logger.error(f"Failed to initialize VectorStore: {e}")
        sys.exit(1)

if __name__ == "__main__":
    check_offline_chroma()
