import hashlib
import re
from typing import List, Dict, Any
from langchain_text_splitters import RecursiveCharacterTextSplitter


class Chunker:
    """
    Semantic chunker using LangChain's RecursiveCharacterTextSplitter.
    Splits on natural boundaries (paragraphs → sentences → words) and
    deduplicates chunks via SHA-256 hashing.
    Includes boilerplate stripping to remove publisher/TOC/author noise.
    """

    # Patterns that indicate boilerplate content (publisher info, TOC, etc.)
    _BOILERPLATE_PATTERNS = [
        re.compile(r'(?i)all\s+rights\s+reserved'),
        re.compile(r'(?i)published\s+by\b'),
        re.compile(r'(?i)copyright\s*[©\(]'),
        re.compile(r'(?i)\bISBN[\s:\-]*[\dX\-]{10,}'),
        re.compile(r'(?i)printed\s+in\b'),
        re.compile(r'(?i)library\s+of\s+congress'),
        re.compile(r'(?i)cataloging[\-\s]in[\-\s]publication'),
        re.compile(r'(?i)edition\s+published'),
        re.compile(r'(?i)no\s+part\s+of\s+this\s+(publication|book)'),
        re.compile(r'(?i)reproduced.*without.*permission'),
        re.compile(r'(?i)mosby|elsevier|wiley|springer|mcgraw|pearson|saunders'),
        re.compile(r'(?i)acquisitions?\s+editor'),
        re.compile(r'(?i)managing\s+editor'),
        re.compile(r'(?i)production\s+manager'),
        re.compile(r'(?i)cover\s+design'),
        re.compile(r'(?i)typeset\s+(by|in)\b'),
    ]

    # Patterns for noisy retrieval chunks (page headers, numbers-only, etc.)
    _NOISE_PATTERNS = [
        re.compile(r'^[\s\d\.\,\-]+$'),  # Just numbers/punctuation
        re.compile(r'(?i)^(chapter|unit|section|part)\s+\d+\s*$'),  # Bare headings
        re.compile(r'(?i)table\s+of\s+contents'),
        re.compile(r'(?i)^(preface|foreword|acknowledgment|dedication|about\s+the\s+author)'),
        re.compile(r'(?i)^(index|bibliography|references|glossary)\s*$'),
    ]

    def __init__(self, chunk_size: int = 2000, overlap: int = 400):
        self.chunk_size = chunk_size
        self.overlap = overlap
        self._splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=overlap,
            separators=["\n\n", "\n", ". ", " ", ""],
            length_function=len,
        )

    @staticmethod
    def _snap_to_sentence(text: str) -> str:
        """Snap chunk boundaries to the nearest sentence end.
        Trims leading partial sentence and trailing partial sentence."""
        if not text:
            return text

        # Trim leading partial sentence: find the first '. ' or start-of-text
        first_period = text.find('. ')
        # If there's a period in the first 25% of the text, the start is likely a fragment
        if first_period > 0 and first_period < len(text) * 0.25:
            text = text[first_period + 2:]

        # Trim trailing partial sentence: find the last '. '
        last_period = text.rfind('. ')
        if last_period > len(text) * 0.5:
            text = text[:last_period + 1]

        return text.strip()

    @classmethod
    def strip_boilerplate(cls, text: str) -> str:
        """Remove publisher info, copyright, TOC, author bios from raw text.
        Applied BEFORE chunking so noisy content never enters the vector store."""
        if not text:
            return text

        lines = text.split('\n')
        clean_lines = []

        for line in lines:
            stripped = line.strip()
            if not stripped:
                clean_lines.append(line)
                continue

            # Skip lines matching boilerplate patterns
            is_boilerplate = False
            for pattern in cls._BOILERPLATE_PATTERNS:
                if pattern.search(stripped):
                    is_boilerplate = True
                    break

            if not is_boilerplate:
                clean_lines.append(line)

        return '\n'.join(clean_lines)

    @classmethod
    def is_noisy_chunk(cls, text: str) -> bool:
        """Check if a retrieved chunk is noisy/low-quality and should be skipped.
        Applied DURING retrieval to filter out junk that slipped through."""
        if not text or len(text.strip()) < 80:
            return True

        stripped = text.strip()

        # Check noise patterns
        for pattern in cls._NOISE_PATTERNS:
            if pattern.search(stripped):
                return True

        # Check if chunk is mostly boilerplate
        boilerplate_hits = sum(
            1 for p in cls._BOILERPLATE_PATTERNS if p.search(stripped)
        )
        if boilerplate_hits >= 2:
            return True

        # Check ratio of alphanumeric content (filter pages of just numbers/symbols)
        alpha_chars = sum(1 for c in stripped if c.isalpha())
        if len(stripped) > 0 and alpha_chars / len(stripped) < 0.4:
            return True

        return False

    def chunk_text(self, text: str, metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Splits text into chunks with overlap, preserving metadata.
        Strips boilerplate before splitting.
        Deduplicates chunks within the same indexing batch via SHA-256.
        """
        if not text or not text.strip():
            return []

        # Strip boilerplate before chunking
        text = self.strip_boilerplate(text)

        parts = self._splitter.split_text(text)

        # SHA-256 dedup within this batch
        seen_hashes = set()
        chunks = []

        for i, part in enumerate(parts):
            part = self._snap_to_sentence(part.strip())
            if not part or len(part) < 50:
                continue  # Skip very short fragments (headers, TOC lines)

            # Skip noisy chunks
            if self.is_noisy_chunk(part):
                continue

            h = hashlib.sha256(part.lower().encode("utf-8")).hexdigest()
            if h in seen_hashes:
                continue
            seen_hashes.add(h)

            chunk_meta = metadata.copy()
            chunk_meta["chunk_index"] = i

            chunks.append({
                "text": part,
                "metadata": chunk_meta,
            })

        return chunks

    def chunk_text_with_pages(self, pages: List[Dict[str, Any]], metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Splits page-segmented text into chunks, preserving the page spans in metadata.
        Input `pages` format: [{"text": "content...", "page_number": 1}, ...]
        Returns chunks that can span multiple pages if needed (e.g., page_number: "4-5")
        """
        if not pages:
            return []
            
        # 1. Combine text and build a map of character offset -> page number
        combined_text = ""
        page_mapping = []  # List of (end_char_index, page_number)
        
        for page in pages:
            page_text = page.get("text", "")
            page_num = page.get("page_number", 1)
            
            if not page_text or not page_text.strip():
                continue
                
            stripped = self.strip_boilerplate(page_text)
            if not stripped.strip():
                continue
                
            combined_text += stripped + "\n\n"
            page_mapping.append((len(combined_text), page_num))
            
        if not combined_text:
            return []
            
        # 2. Split the combined text natively (overlap logic works across pages now)
        parts = self._splitter.split_text(combined_text)
        
        seen_hashes = set()
        chunks = []
        chunk_idx = 0
        search_start = 0
        
        for part in parts:
            part = self._snap_to_sentence(part.strip())
            if not part or len(part) < 50:
                continue
                
            if self.is_noisy_chunk(part):
                continue
                
            h = hashlib.sha256(part.lower().encode("utf-8")).hexdigest()
            if h in seen_hashes:
                continue
            seen_hashes.add(h)
            
            # Find part index in combined text to locate its page span
            part_index = combined_text.find(part, search_start)
            if part_index == -1:
                part_index = search_start  # Fallback
            
            part_end = part_index + len(part)
            search_start = part_index + 1  # Advance search cursor slightly
            
            # Map character span to page numbers
            start_page = None
            end_page = None
            
            for end_char, p_num in page_mapping:
                if start_page is None and part_index < end_char:
                    start_page = p_num
                if end_page is None and part_end <= end_char:
                    end_page = p_num
                    break
                    
            # Fallback if text goes past known pages for some reason
            if start_page is None:
                start_page = page_mapping[-1][1] if page_mapping else 1
            if end_page is None:
                end_page = page_mapping[-1][1] if page_mapping else 1
                
            chunk_meta = metadata.copy()
            chunk_meta["chunk_index"] = chunk_idx
            
            # Record it as a span if it crosses pages
            if str(start_page) == str(end_page):
                chunk_meta["page_number"] = start_page
            else:
                chunk_meta["page_number"] = f"{start_page}-{end_page}"
                
            chunks.append({
                "text": part,
                "metadata": chunk_meta,
            })
            chunk_idx += 1
                
        return chunks
