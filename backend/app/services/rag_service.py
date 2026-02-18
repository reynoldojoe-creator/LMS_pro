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
        self.chunker = Chunker()
        self.embedding_service = EmbeddingService()
        self.vector_store = VectorStore() # Default path
        self.llm_service = LLMService()

    def index_document(self, file_path: str, subject_id: str, unit: str = None, topic: str = None):
        """
        Indexes a document into the vector store.
        """
        try:
            # 1. Extract text
            if file_path.lower().endswith('.pdf'):
                text = self.pdf_parser.extract_text(file_path)
            elif file_path.lower().endswith('.docx'):
                text = self.docx_parser.extract_text(file_path)
            elif file_path.lower().endswith('.txt'):
                with open(file_path, 'r', encoding='utf-8') as f:
                    text = f.read()
            else:
                raise ValueError(f"Unsupported file format: {file_path}")
            
            # 2. Chunk text
            # Ensure all metadata values are valid for ChromaDB (str, int, float, bool)
            metadata = {
                "source": os.path.basename(file_path),
                "subject_id": subject_id,
                "unit": unit if unit is not None else "",
                "topic": topic if topic is not None else ""
            }
            chunks = self.chunker.chunk_text(text, metadata)
            
            if not chunks:
                 logger.warning(f"No chunks created for {file_path}")
                 return

            # 3. Generate embeddings
            chunk_texts = [chunk["text"] for chunk in chunks]
            embeddings = self.embedding_service.generate_embeddings(chunk_texts)
            
            # 4. Prepare data for Chroma
            ids = [str(uuid.uuid4()) for _ in chunks]
            metadatas = [chunk["metadata"] for chunk in chunks]

            # 5. Store in Vector Store
            # Use subject_id as collection name for segregation
            collection_name = f"subject_{subject_id}"
            
            self.vector_store.add_documents(
                collection_name=collection_name,
                documents=chunk_texts,
                metadatas=metadatas,
                ids=ids,
                embeddings=embeddings
            )
            logger.info(f"Successfully indexed document {file_path} into collection {collection_name}")
            
        except Exception as e:
            logger.error(f"Error indexing document {file_path}: {e}")
            raise

    def retrieve_context(self, query_text: str, subject_id: str, n_results: int = 8, topic_id: str = None) -> str:
        """
        Retrieves context string from the vector store for a given query.
        """
        try:
             # 1. Embed query
            query_embedding = self.embedding_service.generate_embeddings([query_text])
            
            # 2. Retrieve from Vector Store
            collection_name = f"subject_{subject_id}"
            
            where_filter = None
            if topic_id:
                where_filter = {"topic_id": str(topic_id)}
                
            results = self.vector_store.query_similar(
                collection_name=collection_name,
                query_embeddings=query_embedding,
                n_results=n_results,
                where=where_filter
            )
            
            # 3. Format context
            context = ""
            if results["documents"]:
                 # Flatten list of lists if needed, currently assuming output is [ [doc1, doc2] ]
                 docs = results["documents"][0] 
                 context = "\n\n".join(docs)
            
            return context
        except Exception as e:
            logger.error(f"Error retrieving context: {e}")
            raise

    def query(self, query_text: str, subject_id: str, n_results: int = 8, topic_id: str = None) -> Dict[str, Any]:
        """
        Queries the RAG system for relevant context.
        """
        try:
            # Re-use the retrieval logic
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
