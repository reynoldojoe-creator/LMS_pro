import chromadb
from chromadb.config import Settings
from typing import List, Dict, Any, Optional
import logging
from pathlib import Path
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Compute absolute path to chroma_data based on this file's location
_BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_DEFAULT_CHROMA_PATH = os.path.join(_BASE_DIR, "data", "chroma_data")

class VectorStore:
    def __init__(self, persistence_path: str = None):
        try:
            if persistence_path is None:
                persistence_path = _DEFAULT_CHROMA_PATH
            # Ensure the directory exists
            Path(persistence_path).mkdir(parents=True, exist_ok=True)
            
            self.client = chromadb.PersistentClient(
                path=persistence_path,
                settings=Settings(anonymized_telemetry=False)
            )
            logger.info(f"Initialized ChromaDB at {persistence_path}")
        except Exception as e:
            logger.error(f"Failed to initialize ChromaDB: {e}")
            raise

    def get_or_create_collection(self, name: str):
        """
        Gets or creates a collection in ChromaDB.
        """
        try:
            return self.client.get_or_create_collection(name=name)
        except Exception as e:
            logger.error(f"Error getting/creating collection {name}: {e}")
            raise

    def add_documents(self, collection_name: str, documents: List[str], metadatas: List[Dict[str, Any]], ids: List[str], embeddings: Optional[List[List[float]]] = None):
        """
        Adds documents to a collection.
        """
        try:
            collection = self.get_or_create_collection(collection_name)
            collection.add(
                documents=documents,
                metadatas=metadatas,
                ids=ids,
                embeddings=embeddings
            )
            logger.info(f"Added {len(documents)} documents to collection {collection_name}")
        except Exception as e:
            logger.error(f"Error adding documents to {collection_name}: {e}")
            raise

    def query_similar(self, collection_name: str, query_embeddings: List[List[float]], n_results: int = 5, where: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Queries a collection for similar documents.
        """
        try:
            collection = self.get_or_create_collection(collection_name)
            results = collection.query(
                query_embeddings=query_embeddings,
                n_results=n_results,
                where=where 
            )
            return results
        except Exception as e:
            logger.error(f"Error querying collection {collection_name}: {e}")
            raise
