import chromadb
import numpy as np
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
        Queries a collection for similar documents (cosine similarity).
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

    def query_mmr(
        self,
        collection_name: str,
        query_embeddings: List[List[float]],
        k: int = 12,
        fetch_k: int = 40,
        lambda_mult: float = 0.7,
        where: Dict[str, Any] = None,
    ) -> Dict[str, Any]:
        """
        Maximal Marginal Relevance (MMR) retrieval.
        Fetches `fetch_k` candidates by similarity, then re-ranks to select
        `k` results that balance relevance AND diversity.

        Args:
            collection_name: ChromaDB collection to query.
            query_embeddings: Embedding of the query (list of one vector).
            k: Number of final results to return.
            fetch_k: Number of initial candidates to fetch.
            lambda_mult: 0-1, higher = more relevance, lower = more diversity.
            where: Optional metadata filter.

        Returns:
            Dict with 'documents' and 'metadatas' keys (same shape as query_similar).
        """
        try:
            collection = self.get_or_create_collection(collection_name)

            # Step 1: Fetch a broad set of candidates with embeddings
            results = collection.query(
                query_embeddings=query_embeddings,
                n_results=min(fetch_k, collection.count() or fetch_k),
                where=where,
                include=["documents", "metadatas", "embeddings", "distances"],
            )

            if not results or not results.get("documents") or not results["documents"][0]:
                return {"documents": [[]], "metadatas": [[]]}

            docs = results["documents"][0]
            metas = results["metadatas"][0]
            embeddings_list = results.get("embeddings", [[]])[0]

            # If no embeddings returned (collection doesn't store them), fall back
            if embeddings_list is None or (hasattr(embeddings_list, '__len__') and len(embeddings_list) == 0):
                logger.warning("MMR fallback: no embeddings in results, returning top-k by similarity")
                return {
                    "documents": [docs[:k]],
                    "metadatas": [metas[:k]],
                }

            # Step 2: MMR re-ranking
            query_vec = np.array(query_embeddings[0], dtype=np.float32)
            doc_vecs = np.array(embeddings_list, dtype=np.float32)

            # Normalise for cosine similarity
            query_norm = query_vec / (np.linalg.norm(query_vec) + 1e-10)
            doc_norms = doc_vecs / (np.linalg.norm(doc_vecs, axis=1, keepdims=True) + 1e-10)

            # Similarity of each candidate to the query
            sim_to_query = doc_norms @ query_norm  # shape (fetch_k,)

            selected_indices: List[int] = []
            candidate_indices = list(range(len(docs)))

            for _ in range(min(k, len(docs))):
                if not candidate_indices:
                    break

                best_idx = None
                best_score = -float("inf")

                for idx in candidate_indices:
                    relevance = float(sim_to_query[idx])

                    # Max similarity to any already-selected document
                    if selected_indices:
                        selected_vecs = doc_norms[selected_indices]
                        redundancy = float(np.max(selected_vecs @ doc_norms[idx]))
                    else:
                        redundancy = 0.0

                    mmr_score = float(lambda_mult * relevance - (1 - lambda_mult) * redundancy)

                    if mmr_score > best_score:
                        best_score = mmr_score
                        best_idx = idx

                if best_idx is not None:
                    selected_indices.append(best_idx)
                    candidate_indices.remove(best_idx)

            # Step 3: Return re-ranked results
            mmr_docs = [docs[i] for i in selected_indices]
            mmr_metas = [metas[i] for i in selected_indices]

            logger.info(f"MMR: fetched {len(docs)} candidates, selected {len(mmr_docs)} diverse results")
            return {
                "documents": [mmr_docs],
                "metadatas": [mmr_metas],
            }

        except Exception as e:
            logger.error(f"Error in MMR query for {collection_name}: {e}")
            # Fallback to simple similarity
            return self.query_similar(collection_name, query_embeddings, n_results=k, where=where)

    def get_documents(self, collection_name: str, where: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Fetches documents from a collection that match the given metadata filter.
        Does not use embeddings/similarity.
        """
        try:
            collection = self.get_or_create_collection(collection_name)
            results = collection.get(where=where, include=["documents", "metadatas"])
            return results
        except Exception as e:
            logger.error(f"Error getting documents from {collection_name}: {e}")
            return {"documents": [], "metadatas": []}
