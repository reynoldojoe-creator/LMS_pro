import docx
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DocxParser:
    def __init__(self):
        pass

    def extract_text(self, file_path: str) -> str:
        """
        Extracts text from a .docx file.

        Args:
            file_path (str): Path to the .docx file.

        Returns:
            str: Extracted text content.
        """
        try:
            doc = docx.Document(file_path)
            full_text = []
            for para in doc.paragraphs:
                full_text.append(para.text)
            text = '\n'.join(full_text)
            logger.info(f"Successfully extracted text from {file_path}")
            return text
        except Exception as e:
            logger.error(f"Error extracting text from {file_path}: {e}")
            raise
