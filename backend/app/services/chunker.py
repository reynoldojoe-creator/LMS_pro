from typing import List, Dict, Any

class Chunker:
    def __init__(self, chunk_size: int = 1000, overlap: int = 200):
        self.chunk_size = chunk_size
        self.overlap = overlap

    def chunk_text(self, text: str, metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Splits text into chunks with overlap, preserving metadata.

        Args:
            text (str): The text to chunk.
            metadata (Dict[str, Any]): Metadata associated with the text.

        Returns:
            List[Dict[str, Any]]: List of chunks with text and metadata.
        """
        chunks = []
        start = 0
        text_len = len(text)

        while start < text_len:
            end = start + self.chunk_size
            chunk_text = text[start:end]
            
            # Avoid splitting words in half
            if end < text_len:
                last_space = chunk_text.rfind(' ')
                if last_space > self.chunk_size // 2:  # Only adjust if space is in 2nd half
                    end = start + last_space
                    chunk_text = text[start:end]
            
            chunk = {
                "text": chunk_text.strip(),
                "metadata": metadata.copy()
            }
            if chunk["text"]:  # Skip empty chunks
                chunks.append(chunk)

            start += self.chunk_size - self.overlap
        
        return chunks
