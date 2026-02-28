from .pdf_parser import PDFParser
from .docx_parser import DocxParser
from .chunker import Chunker
from .embedding_service import EmbeddingService
from .vector_store import VectorStore
from .llm_service import LLMService
from typing import List, Dict, Any
import logging
import uuid
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class RAGService:
    def __init__(self):
        self.pdf_parser = PDFParser()
        self.docx_parser = DocxParser()
        self.chunker = Chunker()  # Now uses RecursiveCharacterTextSplitter
        self.embedding_service = EmbeddingService()
        self.vector_store = VectorStore()  # Default path
        self.llm_service = LLMService()

    def index_document(self, file_path: str, subject_id: str, unit: str = None, topic: str = None):
        """
        Indexes a document into the vector store.
        """
        try:
            # 1. Extract text
            metadata = {
                "source": os.path.basename(file_path),
                "subject_id": subject_id,
                "unit": unit if unit is not None else "",
                "topic": topic if topic is not None else ""
            }
            
            if file_path.lower().endswith('.pdf'):
                # Use page-aware extraction
                pages = self.pdf_parser.extract_text_with_pages(file_path)
                chunks = self.chunker.chunk_text_with_pages(pages, metadata)
            elif file_path.lower().endswith('.docx'):
                text = self.docx_parser.extract_text(file_path)
                chunks = self.chunker.chunk_text(text, metadata)
            elif file_path.lower().endswith('.txt'):
                with open(file_path, 'r', encoding='utf-8') as f:
                    text = f.read()
                chunks = self.chunker.chunk_text(text, metadata)
            else:
                raise ValueError(f"Unsupported file format: {file_path}")

            if not chunks:
                logger.warning(f"No chunks created for {file_path}")
                return

            # 3. Generate embeddings
            chunk_texts = [chunk["text"] for chunk in chunks]
            embeddings = self.embedding_service.generate_embeddings(chunk_texts)

            # 4. Prepare data for Chroma
            ids = [str(uuid.uuid4()) for _ in chunks]
            metadatas = [chunk["metadata"] for chunk in chunks]

            # 5. Store in Vector Store (per-subject collection)
            collection_name = f"subject_{subject_id}"

            self.vector_store.add_documents(
                collection_name=collection_name,
                documents=chunk_texts,
                metadatas=metadatas,
                ids=ids,
                embeddings=embeddings
            )
            logger.info(f"Indexed {len(chunks)} chunks from {file_path} into {collection_name}")

        except Exception as e:
            logger.error(f"Error indexing document {file_path}: {e}")
            raise

    def retrieve_context(
        self,
        query_text: str,
        subject_id: str,
        n_results: int = 12,
        topic_id: str = None,
        use_mmr: bool = True,
    ) -> str:
        """
        Retrieves formatted context string from the vector store.
        Uses MMR (Maximal Marginal Relevance) by default for diverse results.
        """
        chunks = self.retrieve_context_with_metadata(query_text, subject_id, n_results, topic_id, use_mmr)
        if not chunks:
            return ""
        
        # Format explicitly into flat string for backwards compatibility
        return "\n\n---\n\n".join([c["text"] for c in chunks])

    def retrieve_context_with_metadata(
        self,
        query_text: str,
        subject_id: str,
        n_results: int = 12,
        topic_id: str = None,
        use_mmr: bool = True,
    ) -> List[Dict[str, Any]]:
        """
        Retrieves context chunks alongside their metadata (pages, source).
        Returns list of {"text": str, "page_number": int, "source": str}
        """
        try:
            if use_mmr:
                raw_docs, raw_metas = self._mmr_retrieve_with_meta(
                    query_text, subject_id,
                    k=n_results, fetch_k=n_results * 8,
                    topic_id=topic_id,
                )
            else:
                raw_docs, raw_metas = self._raw_retrieve_with_meta(
                    query_text, subject_id,
                    n_results=n_results * 2,
                    topic_id=topic_id,
                )

            # Filter out noisy/boilerplate chunks using the Chunker's noise detector
            from .chunker import Chunker
            filtered_chunks = []
            for doc, meta in zip(raw_docs, raw_metas):
                if not Chunker.is_noisy_chunk(doc):
                    filtered_chunks.append({
                        "text": doc,
                        "page_number": meta.get("page_number"),
                        "source": meta.get("source", "Unknown Source")
                    })

            # Take top n_results
            final_chunks = filtered_chunks[:n_results]

            if not final_chunks:
                logger.warning(f"No usable chunks retrieved for subject {subject_id}")
                return []

            logger.info(f"Retrieved {len(final_chunks)} context chunks for subject {subject_id}")
            return final_chunks

        except Exception as e:
            logger.error(f"Error retrieving context with metadata: {e}")
            return []

    async def get_diverse_subtopics(self, subject_id: str, topic_id: str = None) -> List[str]:
        """
        Extracts unique sub-topics from the vector store chunks for this topic.
        Returns a list of 6-10 distinct sub-concepts to use as RAG queries.
        Uses the first chunks (which contain chapter intro/outline) for better alignment.
        """
        try:
            collection_name = f"subject_{subject_id}"
            
            # Fetch raw chunks for this subject
            results = self.vector_store.get_documents(collection_name)
            
            docs = results.get("documents", [])
            if not docs:
                return []
            
            # Strategy: Use the FIRST chunks (chapter intro/outline) plus a few
            # evenly-spaced chunks from the rest of the document for coverage
            intro_docs = docs[:8]  # First 8 chunks (~12000 chars) - usually chapter intro/outline
            # Also grab a few chunks from the middle and end for full coverage
            stride = max(1, len(docs) // 6)
            spread_docs = docs[stride::stride][:6]  # ~6 evenly-spaced chunks
            
            # Combine intro + spread, deduplicate
            seen = set()
            sample_docs = []
            for d in intro_docs + spread_docs:
                if d not in seen:
                    seen.add(d)
                    sample_docs.append(d)
            
            combined_text = "\n\n---\n\n".join(sample_docs)
            
            prompt = f"""
            Analyze the following text excerpts from a textbook chapter.
            Identify 8-12 DISTINCT, SPECIFIC sub-topics or clinical concepts discussed across these excerpts.
            
            Rules:
            - Return ONLY a JSON list of strings (e.g., ["Implant biomechanics", "Screws and abutments", "Bonding protocols"]).
            - Do not include any other text or markdown block formatting.
            - Make the topics specific enough to retrieve different information, but broad enough to have multiple paragraphs.
            - Focus on the MAJOR sections and key clinical concepts, not minor details.
            
            Excerpts:
            {combined_text[:4000]}
            """
            
            from .. import config
            response = await self.llm_service.generate_response(prompt, model=config.LLM_MODEL)
            
            import json
            import re
            
            # Clean up the output to strictly extract JSON
            clean_str = re.sub(r'```json\n|```|^\s*\[|\]\s*$', '', response.strip())
            clean_str = f"[{clean_str}]"
            
            try:
                subtopics = json.loads(clean_str)
                if isinstance(subtopics, list) and len(subtopics) > 0:
                    logger.info(f"Dynamically extracted subtopics for topic {topic_id}: {subtopics}")
                    return subtopics
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse subtopics JSON: {response}\nError: {e}")
                
            # Fallback if parsing fails or LLM gives garbage
            return ["clinical presentation", "diagnosis", "treatment options", "complications", "materials and techniques", "patient management"]
            
        except Exception as e:
            logger.error(f"Error extracting diverse subtopics: {e}")
            return ["diagnosis", "treatment", "complications"]

    def retrieve_for_subtopic(
        self,
        subtopic: str,
        subject_id: str,
        topic_id: str = None,
        n_results: int = 8
    ) -> List[Dict[str, Any]]:
        """
        Retrieves highly focused and diverse context for a specific sub-topic.
        Returns list of {text, page_number, source} dicts for provenance.
        """
        try:
            query = f"{subtopic}"
            raw_docs, raw_metas = self._mmr_retrieve_with_meta(
                query, subject_id,
                k=n_results, fetch_k=n_results * 8,
                lambda_mult=0.4 # Higher diversity than default
            )

            from .chunker import Chunker
            filtered = []
            for doc, meta in zip(raw_docs, raw_metas):
                if not Chunker.is_noisy_chunk(doc):
                    # Prefer filename over generic 'notes' source label
                    source = meta.get("source", "Unknown Source")
                    filename = meta.get("filename", "")
                    if source == "notes" and filename:
                        source = filename
                    filtered.append({
                        "text": doc,
                        "page_number": meta.get("page_number"),
                        "source": source,
                        "filename": filename,
                    })
            final_chunks = filtered[:n_results]

            if not final_chunks:
                return []

            logger.info(f"Retrieved {len(final_chunks)} chunks for subtopic: '{subtopic}'")
            return final_chunks

        except Exception as e:
            logger.error(f"Error retrieving subtopic context: {e}")
            return []

    def _mmr_retrieve(
        self,
        query_text: str,
        subject_id: str,
        k: int = 12,
        fetch_k: int = 40,
        topic_id: str = None,
        lambda_mult: float = 0.5,
    ) -> List[str]:
        """MMR-based retrieval for diverse, relevant context."""
        try:
            query_embedding = self.embedding_service.generate_embeddings([query_text])
            collection_name = f"subject_{subject_id}"

            # Optional topic filter
            where_filter = None
            if topic_id:
                where_filter = {"topic_id": str(topic_id)}

            results = self.vector_store.query_mmr(
                collection_name=collection_name,
                query_embeddings=query_embedding,
                k=k,
                fetch_k=fetch_k,
                lambda_mult=lambda_mult,
                where=where_filter,
            )

            if results and results.get("documents"):
                return results["documents"][0]
            return []
        except Exception as e:
            logger.error(f"MMR retrieval failed, falling back to similarity: {e}")
            return self._raw_retrieve(query_text, subject_id, n_results=k, topic_id=topic_id)

    def _raw_retrieve(self, query_text: str, subject_id: str, n_results: int, topic_id: str = None) -> List[str]:
        """Cosine-similarity retrieval (fallback)."""
        try:
            query_embedding = self.embedding_service.generate_embeddings([query_text])
            collection_name = f"subject_{subject_id}"

            results = self.vector_store.query_similar(
                collection_name=collection_name,
                query_embeddings=query_embedding,
                n_results=n_results
            )

            if results and results.get("documents"):
                return results["documents"][0]
            return []
        except Exception as e:
            logger.error(f"Raw retrieval failed: {e}")
            return []

    def _mmr_retrieve_with_meta(
        self,
        query_text: str,
        subject_id: str,
        k: int = 12,
        fetch_k: int = 40,
        topic_id: str = None,
        lambda_mult: float = 0.5,
    ) -> tuple[List[str], List[Dict[str, Any]]]:
        """MMR-based retrieval for diverse, relevant context with metadata."""
        try:
            query_embedding = self.embedding_service.generate_embeddings([query_text])
            collection_name = f"subject_{subject_id}"

            where_filter = None
            if topic_id:
                where_filter = {"topic_id": str(topic_id)}

            results = self.vector_store.query_mmr(
                collection_name=collection_name,
                query_embeddings=query_embedding,
                k=k,
                fetch_k=fetch_k,
                lambda_mult=lambda_mult,
                where=where_filter,
            )

            if results and results.get("documents") and results["documents"][0]:
                docs = results["documents"][0]
                metas = results.get("metadatas", [[]])[0] if results.get("metadatas") else [{} for _ in docs]
                return docs, metas
            return [], []
        except Exception as e:
            logger.error(f"MMR with meta retrieval failed: {e}")
            return self._raw_retrieve_with_meta(query_text, subject_id, n_results=k, topic_id=topic_id)

    def _raw_retrieve_with_meta(self, query_text: str, subject_id: str, n_results: int, topic_id: str = None) -> tuple[List[str], List[Dict[str, Any]]]:
        """Cosine-similarity retrieval with metadata (fallback)."""
        try:
            query_embedding = self.embedding_service.generate_embeddings([query_text])
            collection_name = f"subject_{subject_id}"

            results = self.vector_store.query_similar(
                collection_name=collection_name,
                query_embeddings=query_embedding,
                n_results=n_results
            )

            if results and results.get("documents") and results["documents"][0]:
                docs = results["documents"][0]
                metas = results.get("metadatas", [[]])[0] if results.get("metadatas") else [{} for _ in docs]
                return docs, metas
            return [], []
        except Exception as e:
            logger.error(f"Raw with meta retrieval failed: {e}")
            return [], []

    def query(self, query_text: str, subject_id: str, n_results: int = 12, topic_id: str = None) -> Dict[str, Any]:
        """
        Queries the RAG system for relevant context and generates an answer.
        """
        try:
            context = self.retrieve_context(query_text, subject_id, n_results, topic_id)

            prompt = f"""
            Context:
            {context}

            Question:
            {query_text}

            Answer the question based strictly on the context provided above.
            """

            from .. import config
            generated_answer = self.llm_service.generate_response(prompt, model=config.LLM_MODEL)

            return {
                "retrieval_context": context,
                "generated_answer": generated_answer
            }
        except Exception as e:
            logger.error(f"Error querying RAG system: {e}")
            raise
