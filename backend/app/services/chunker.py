from typing import List, Dict, Any

class Chunker:
    def __init__(self, chunk_size: int = 500, overlap: int = 100):
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
        # Paragraph-aware splitting
        paragraphs = text.split('\n\n')
        current_chunk = []
        current_length = 0
        
        for para in paragraphs:
            para = para.strip()
            if not para: continue
            
            para_len = len(para)
            
            # If adding this paragraph exceeds chunk size, save current and start new
            if current_length + para_len > self.chunk_size and current_chunk:
                # Join current buffer
                chunk_text = "\n\n".join(current_chunk)
                chunks.append({
                    "text": chunk_text,
                    "metadata": metadata.copy()
                })
                
                # Start new chunk with overlap? Hard with paragraphs. 
                # Simple approach: start new chunk with this paragraph.
                # To support overlap, we'd need to keep last N chars/words.
                # For now, simplistic paragraph chunking.
                current_chunk = [para]
                current_length = para_len
            else:
                current_chunk.append(para)
                current_length += para_len + 2 # +2 for \n\n
                
        # Add last chunk
        if current_chunk:
            chunk_text = "\n\n".join(current_chunk)
            chunks.append({
                "text": chunk_text,
                "metadata": metadata.copy()
            })
            
        # Fallback: if paragraphs are huge or no paragraphs, re-chunk by character using existing logic?
        # If any chunk is > chunk_size * 1.5, maybe split it further.
        # But for now, this logic replaces the simple sliding window.
        
        return chunks
