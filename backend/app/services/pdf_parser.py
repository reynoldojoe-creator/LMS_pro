import fitz  # PyMuPDF
import logging

logger = logging.getLogger(__name__)

class PDFParser:
    def extract_text(self, file_path: str) -> str:
        """
        Extracts text from a PDF file using PyMuPDF (flat string for legacy).
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

    def extract_text_with_pages(self, file_path: str) -> list:
        """
        Extracts text from a PDF file using PyMuPDF, preserving page numbers.
        Uses page labels (printed page numbers) when available rather than
        physical index, so front-matter pages don't cause offset errors.
        Returns a list of dicts: {"text": str, "page_number": int or str}
        """
        try:
            doc = fitz.open(file_path)
            pages = []
            for page_num, page in enumerate(doc, start=1):
                text = page.get_text()
                if text.strip():
                    # Prefer the printed page label (e.g., "42") over physical index
                    label = page.get_label()
                    if label and label.strip():
                        # Try to convert to int for numeric labels
                        try:
                            page_label = int(label.strip())
                        except ValueError:
                            # Keep roman numerals or other labels as-is
                            page_label = label.strip()
                    else:
                        page_label = page_num
                    pages.append({"text": text, "page_number": page_label})
            return pages
        except Exception as e:
            logger.error(f"Error parsing PDF with pages {file_path}: {e}")
            raise
