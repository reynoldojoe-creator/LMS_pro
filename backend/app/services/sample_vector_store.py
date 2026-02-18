from langchain_community.vectorstores import FAISS
from langchain_ollama import OllamaEmbeddings
from langchain_core.documents import Document
import os
import logging
from typing import List, Dict, Any
from .. import config

logger = logging.getLogger(__name__)

class SampleVectorStore:
    def __init__(self):
        # Initialize embeddings with optimal model
        try:
            self.embeddings = OllamaEmbeddings(
                base_url=config.OLLAMA_BASE_URL,
                model=config.EMBEDDING_MODEL
            )
        except Exception as e:
            logger.error(f"Failed to initialize embeddings: {e}")
            raise

    def _get_store_path(self, topic_id: int) -> str:
        # data/vectors/topic_{topic_id}
        base_dir = os.path.join(os.getcwd(), "data", "vectors")
        os.makedirs(base_dir, exist_ok=True)
        return os.path.join(base_dir, f"topic_{topic_id}")

    def add_samples(self, topic_id: int, questions: List[Dict[str, Any]]):
        """
        Embeds and indexes sample questions for a topic.
        """
        try:
            docs = []
            for q in questions:
                # Content to embed: The question text itself
                content = q.get("question_text", "")
                if not content:
                    continue
                    
                # Store metadata for filtering/retrieval
                metadata = {
                    "type": q.get("type", "unknown"),
                    "difficulty": q.get("difficulty", "medium"),
                    "full_json": str(q) # Store full object to reconstruct example
                }
                
                docs.append(Document(page_content=content, metadata=metadata))
            
            if not docs:
                return

            store_path = self._get_store_path(topic_id)
            
            # Check if store already exists to append
            if os.path.exists(os.path.join(store_path, "index.faiss")):
                vector_store = FAISS.load_local(store_path, self.embeddings, allow_dangerous_deserialization=True)
                vector_store.add_documents(docs)
            else:
                vector_store = FAISS.from_documents(docs, self.embeddings)
            
            vector_store.save_local(store_path)
            logger.info(f"Indexed {len(docs)} samples for topic {topic_id}")
            
        except Exception as e:
            logger.error(f"Error adding samples to vector store: {e}")
            raise

    def retrieve_similar(self, topic_id: int, query: str, k: int = 3, filter_dict: Dict = None) -> List[Document]:
        """
        Retrieves similar sample questions.
        """
        try:
            store_path = self._get_store_path(topic_id)
            if not os.path.exists(os.path.join(store_path, "index.faiss")):
                return []
                
            vector_store = FAISS.load_local(store_path, self.embeddings, allow_dangerous_deserialization=True)
            
            # Perform search
            # Note: FAISS filter support varies, simple filter might need post-processing
            # But langchain vectorstores often support basic dict filtering
            results = vector_store.similarity_search(query, k=k, filter=filter_dict)
            
            return results
        except Exception as e:
            logger.error(f"Error retrieving samples: {e}")
            return []
