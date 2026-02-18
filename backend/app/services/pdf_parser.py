import fitz  # PyMuPDF
import logging

logger = logging.getLogger(__name__)

class PDFParser:
    def extract_text(self, file_path: str) -> str:
        """
        Extracts text from a PDF file using PyMuPDF.
        """
        try:
            doc = fitz.open(file_path)
            text = ""
            for page in doc:
                text += page.get_text()
            return text
        except Exception as e:
            logger.error(f"Error parsing PDF {file_path}: {e}")
            raise
