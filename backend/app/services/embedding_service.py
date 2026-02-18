from sentence_transformers import SentenceTransformer
from typing import List
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EmbeddingService:
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        from app.config import EMBEDDING_MODEL_PATH
        import os

        try:
            # Check if local model exists
            if os.path.exists(EMBEDDING_MODEL_PATH):
                logger.info(f"Loading embedding model from local path: {EMBEDDING_MODEL_PATH}")
                self.model = SentenceTransformer(EMBEDDING_MODEL_PATH)
            else:
                logger.warning(f"Local model not found at {EMBEDDING_MODEL_PATH}. Downloading from Hugging Face.")
                self.model = SentenceTransformer(model_name)
            
            logger.info(f"Loaded embedding model: {model_name}")
        except Exception as e:
            logger.error(f"Failed to load embedding model {model_name}: {e}")
            raise

    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Generates embeddings for a list of texts.

        Args:
            texts (List[str]): List of texts to embed.

        Returns:
            List[List[float]]: List of embeddings.
        """
        try:
            embeddings = self.model.encode(texts)
            return embeddings.tolist()
        except Exception as e:
            logger.error(f"Error generating embeddings: {e}")
            raise
