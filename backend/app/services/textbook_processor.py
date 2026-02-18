import fitz  # PyMuPDF
import re
import json
import logging
import uuid
from typing import List, Dict, Any, Optional
from pathlib import Path

from ..services.llm_service import LLMService
from ..services.embedding_service import EmbeddingService
from ..services.vector_store import VectorStore
from ..services.chunker import Chunker
from .. import config

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TextbookProcessor:
    """
    Processes full textbook PDFs into searchable knowledge base with structural awareness.
    Implements Phase A: Textbook Upload & Indexing.
    """
    
    def __init__(self):
        self.semantic_model = LLMService() # Will use config.SEMANTIC_MODEL
        self.embedding_service = EmbeddingService()
        self.vector_store = VectorStore()
        self.chunker = Chunker()
    
    async def process_textbook(self, pdf_path: str, subject_id: str) -> List[Dict[str, Any]]:
        """
        Orchestrates the textbook processing pipeline:
        Step 1: Extract pages
        Step 2: Detect chapters/topics (Hybrid approach)
        Step 3: Chunk content per chapter
        Step 4: Create embeddings & Store in ChromaDB
        """
        logger.info(f"Processing textbook: {pdf_path} for subject {subject_id}")
        
        # Step 1: Extract text by page
        pages = self._extract_pages(pdf_path)
        logger.info(f"Extracted {len(pages)} pages")
        
        # Step 2: Detect structure
        structure = await self.detect_chapters(pdf_path)
        logger.info(f"Detected {len(structure)} structural units (chapters/modules)")
        
        # Step 3 & 4: Chunk, Embed, Store
        all_chunks = []
        
        for chapter in structure:
            # Aggregate text for the chapter
            chapter_pages = [p for p in pages if p['number'] in chapter['pages']]
            chapter_text = "\n".join([p['text'] for p in chapter_pages])
            
            # Create rich metadata
            base_metadata = {
                "subject_id": str(subject_id),
                "chapter": chapter['title'],
                "unit": str(chapter['number']),
                "topics": ", ".join(chapter['topics']) if isinstance(chapter.get('topics'), list) else str(chapter.get('topics', '')),
                "source": f"textbook_unit_{chapter['number']}",
                "page_range": f"{min(chapter['pages'])}-{max(chapter['pages'])}" if chapter['pages'] else "N/A"
            }
            
            # Chunking
            chunks = self.chunker.chunk_text(chapter_text, base_metadata)
            all_chunks.extend(chunks)
        
        if all_chunks:
            logger.info(f"Generated {len(all_chunks)} chunks from textbook")
            
            # Embed and Store
            chunk_texts = [c['text'] for c in all_chunks]
            metadatas = [c['metadata'] for c in all_chunks]
            
            # Batch processing for embeddings to avoid memory issues with large books
            batch_size = 50 
            
            for i in range(0, len(all_chunks), batch_size):
                batch_texts = chunk_texts[i : i + batch_size]
                batch_metadatas = metadatas[i : i + batch_size]
                
                try:
                    embeddings = self.embedding_service.generate_embeddings(batch_texts)
                    ids = [str(uuid.uuid4()) for _ in batch_texts]
                    
                    self.vector_store.add_documents(
                        collection_name=f"subject_{subject_id}",
                        documents=batch_texts,
                        metadatas=batch_metadatas,
                        ids=ids,
                        embeddings=embeddings
                    )
                    logger.info(f"Indexed batch {i//batch_size + 1}/{(len(all_chunks)-1)//batch_size + 1}")
                except Exception as e:
                    logger.error(f"Failed to index batch {i}: {e}")
            
            logger.info(f"Successfully indexed textbook for subject {subject_id}")
            
        else:
            logger.warning("No chunks generated from textbook.")

        return structure

    def _extract_pages(self, pdf_path: str) -> List[Dict[str, Any]]:
        """Extracts text per page from PDF"""
        try:
            doc = fitz.open(pdf_path)
            pages = []
            for i, page in enumerate(doc):
                text = page.get_text()
                # Clean header/footers simply? For now keep raw.
                pages.append({
                    "number": i + 1,
                    "text": text.strip()
                })
            return pages
        except Exception as e:
            logger.error(f"Failed to extract pages from {pdf_path}: {e}")
            raise

    async def detect_chapters(self, pdf_path: str) -> List[Dict[str, Any]]:
        """
        Hybrid approach:
        1. Fast pattern matching for obvious chapters
        2. Semantic validation for ambiguous cases
        Implements Phase 1B logic.
        """
        pages = self._extract_pages(pdf_path)
        chapters = []
        
        # Common patterns for chapter headers
        patterns = [
            r'Chapter\s+(\d+|[IVX]+)\s*[:.\-]?\s*([^\n]{5,100})',
            r'UNIT\s+(\d+|[IVX]+)\s*[:.\-]?\s*([^\n]{5,100})',
            r'Module\s+(\d+|[IVX]+)\s*[:.\-]?\s*([^\n]{5,100})'
        ]
        
        current_chapter = None
        
        for i, page in enumerate(pages):
            text = page['text']
            # Heuristic: Check first 500 chars for header
            header_text = text[:500]
            
            # 1. Try patterns first
            matched = False
            for pattern in patterns:
                match = re.search(pattern, header_text, re.IGNORECASE)
                if match:
                    # Found a clear chapter start
                    if current_chapter:
                        chapters.append(current_chapter)
                        
                    current_chapter = {
                        'number': match.group(1),
                        'title': match.group(2).strip(),
                        'page': page['number'],
                        'pages': [page['number']],
                        'confidence': 0.9,
                        'topics': [match.group(2).strip()]
                    }
                    matched = True
                    logger.info(f"Pattern match: {current_chapter['title']} (Page {page['number']})")
                    break
            
            # 2. If no pattern match and might be a chapter (heuristic)
            if not matched:
                if self._might_be_chapter(page):
                    # Use semantic model (expensive, so only when needed)
                    analysis = await self._semantic_analysis(page)
                    if analysis.get('is_chapter'):
                        if current_chapter:
                            chapters.append(current_chapter)
                            
                        current_chapter = {
                            'number': str(len(chapters) + 1),
                            'title': analysis.get('title', 'Unknown'),
                            'page': page['number'],
                            'pages': [page['number']],
                            'confidence': 0.7,
                            'topics': [analysis.get('title')]
                        }
                        logger.info(f"Semantic match: {current_chapter['title']} (Page {page['number']})")
                    elif current_chapter:
                         current_chapter['pages'].append(page['number'])
                elif current_chapter:
                    current_chapter['pages'].append(page['number'])
        
        if current_chapter:
            chapters.append(current_chapter)
            
        return chapters

    def _might_be_chapter(self, page: Dict[str, Any]) -> bool:
        """Heuristics to avoid unnecessary model calls"""
        text = page['text']
        first_lines = text.strip().split('\n')[:3]
        header = " ".join(first_lines).strip()
        
        # Heuristics:
        # - Short page (< 200 words) might be a title page
        # - First distinct line is title-case or UPPER
        # - Contains numbers at start
        
        word_count = len(text.split())
        is_short = word_count < 200
        
        has_number_start = bool(re.match(r'^\d+|[IVX]+', header))
        is_title_case = header[0].isupper() if header else False
        
        # Refined condition: 
        # Ideally chapter pages have some "Chapter X" or "Unit Y" even if regex missed it (e.g. weird spacing)
        # OR just a big bold title.
        # User heuristics:
        # return (len(text.split()) < 200 and text.strip()[0].isupper() and bool(re.match(r'^\d+', text.strip())))
        
        return (
            word_count < 300 and  # Relaxed slightly
            is_title_case and
            has_number_start
        )

    async def _semantic_analysis(self, page: Dict[str, Any]) -> Dict[str, Any]:
        """Query LLM to analyze page content"""
        prompt = f"""Is this a chapter heading?

{page['text'][:500]}

Respond JSON: {{"is_chapter": true/false, "title": "..."}}"""
        
        try:
            response = await self.semantic_model.generate_response(
                prompt,
                model=config.SEMANTIC_MODEL,
                options={"temperature": 0.1, "json": True}
            )
            
            clean_res = response.strip()
            if "```json" in clean_res:
                 clean_res = clean_res.split("```json")[1].split("```")[0].strip()
            elif "```" in clean_res:
                 clean_res = clean_res.split("```")[1].strip()
            
            return json.loads(clean_res)
        except Exception as e:
            logger.warning(f"Semantic analysis failed: {e}")
            return {"is_chapter": False}
