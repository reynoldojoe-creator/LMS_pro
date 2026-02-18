import json
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class SampleParser:
    def parse(self, file_content: bytes, filename: str) -> List[Dict[str, Any]]:
        """
        Parses uploaded file content into a list of question dictionaries.
        Supports JSON. (PDF/Docx for future - simple text extraction)
        """
        try:
            if filename.lower().endswith('.json'):
                return self._parse_json(file_content)
            elif filename.lower().endswith('.txt'):
                 # Minimal support for quick copy-paste text files if needed
                 # Format: Q: ... \n A: ...
                 pass
            
            # Default/Fallback
            raise ValueError("Unsupported file format. Please upload a JSON file.")

        except Exception as e:
            logger.error(f"Error parsing sample file: {e}")
            raise

    def _parse_json(self, content: bytes) -> List[Dict[str, Any]]:
        data = json.loads(content.decode('utf-8'))
        
        # Expecting {"questions": [...]} or just [...]
        if isinstance(data, dict) and "questions" in data:
            return data["questions"]
        elif isinstance(data, list):
            return data
        else:
            raise ValueError("Invalid JSON structure. Expected a list of questions.")
