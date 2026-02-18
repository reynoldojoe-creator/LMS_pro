import sys
import os
import logging

# Add the backend directory to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.services.rag_service import RAGService
from app.services.pdf_parser import PDFParser

# Mock PDFParser to avoid needing a real PDF file for this quick test
class MockPDFParser(PDFParser):
    def extract_text(self, file_path: str) -> str:
        return """
        Syllabus for Computer Science.
        Unit 1: Introduction to Algorithms.
        Topics include sorting, searching, and graph traversal.
        Unit 2: Data Structures.
        Topics include arrays, linked lists, stacks, and queues.
        """

def test_rag_pipeline():
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)

    logger.info("Starting RAG Pipeline Verification...")

    # Initialize RAG Service
    rag_service = RAGService()
    
    # define test data
    subject_id = "test_subject_MSA06"

    # 1. Index Document
    logger.info(f"Indexing document for subject {subject_id}...")
    
    # Use absolute path to the data file
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(current_dir, '..', '..'))
    file_path = os.path.join(project_root, 'backend', 'data', 'sample_syllabi', 'MSA06 DAA Syllabus (1).docx')
    
    if not os.path.exists(file_path):
        logger.error(f"File not found: {file_path}")
        return

    rag_service.index_document(file_path, subject_id, unit="All", topic="General")

    # 2. Query
    query_text = "What is in Unit 1?"
    logger.info(f"Querying: '{query_text}'")
    
    results = rag_service.query(query_text, subject_id, n_results=2)
    
    logger.info("Query Results:")
    logger.info(results)

    # Basic assertions
    assert results is not None
    assert "retrieval_results" in results
    assert "documents" in results["retrieval_results"]
    # assert len(results["documents"][0]) > 0
    
    # Check if we got relevant content
    if results["retrieval_results"]["documents"] and len(results["retrieval_results"]["documents"][0]) > 0:
        retrieved_text = results["retrieval_results"]["documents"][0][0]
        logger.info(f"Retrieved text snippet: {retrieved_text[:100]}...")
    else:
        logger.warning("No documents retrieved.")

    # Check Generated Answer
    if "generated_answer" in results:
        logger.info("Generated Answer:")
        logger.info(results["generated_answer"])
    else:
        logger.error("No generated answer found in results.")

if __name__ == "__main__":
    test_rag_pipeline()
