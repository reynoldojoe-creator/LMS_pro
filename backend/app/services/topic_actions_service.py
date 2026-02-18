import os
import json
import csv
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from ..models import database
from ..models.sample_question import SampleQuestion
from ..services.llm_service import LLMService
from ..services.rag_service import RAGService
from ..services.pdf_parser import PDFParser
from ..services.docx_parser import DocxParser
from ..services.chunker import Chunker
from ..services.vector_store import VectorStore
from ..services.embedding_service import EmbeddingService
from ..services.hybrid_generator import HybridGenerationSystem
from .. import config

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TopicActionsService:
    def __init__(self, data_dir: str = "data/subjects"):
        self.base_dir = Path(os.getcwd()) / data_dir
        self.llm_service = LLMService()
        self.rag_service = RAGService()
        self.pdf_parser = PDFParser()
        self.docx_parser = DocxParser()
        self.chunker = Chunker()
        self.vector_store = VectorStore()
        self.vector_store = VectorStore()
        self.embedding_service = EmbeddingService()
        self.hybrid_generator = HybridGenerationSystem()
    
    # ===== ACTION 1: Quick Generate (No Rubric) =====
    async def quick_generate_questions(
        self,
        db: Session,
        subject_id: int,
        topic_id: int,
        question_type: str,  # 'mcq', 'short_answer', 'essay'
        count: int,
        difficulty: str = 'medium',
        pre_retrieved_context: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Quick generation for faculty reference:
        1. Retrieve RAG context for topic (or use provided)
        2. Fetch sample questions for few-shot examples
        3. Generate questions using LLM
        4. Return questions (NOT saved to vetting queue)
        """
        logger.info(f"Quick generating {count} {question_type} questions for topic {topic_id}")
        
        # Step 1: Get topic and its CO mappings
        topic = await self._get_topic_with_cos(db, subject_id, topic_id)
        
        # Step 2: Retrieve relevant syllabus content (RAG)
        if pre_retrieved_context:
            context = pre_retrieved_context
        else:
            context = self.rag_service.retrieve_context(
                query_text=topic['name'],
                subject_id=str(subject_id),
                n_results=5,
                topic_id=str(topic_id)
            )
        
        # Step 3: Get sample questions for few-shot learning
        sample_questions = await self._get_sample_questions(
            db,
            subject_id,
            topic_id,
            question_type,
            limit=3
        )
        
        # Step 4: Check for trained skill
        skill_instructions = ""
        try:
             skill = db.query(database.TopicSkill).filter(database.TopicSkill.topic_id == topic_id).first()
             if skill:
                 import os
                 skill_path = os.path.join(skill.skill_path, "SKILL.md")
                 if os.path.exists(skill_path):
                     with open(skill_path, "r") as f:
                         skill_instructions = f.read()
                     logger.info(f"Using custom skill for topic {topic_id}")
        except Exception as e:
            logger.warning(f"Failed to load skill: {e}")

        # Step 5: Generate questions
        questions = await self._generate_with_few_shot(
            context=context,
            topic=topic,
            question_type=question_type,
            count=count,
            sample_questions=sample_questions,
            difficulty=difficulty,
            skill_instructions=skill_instructions
        )
        
        # Step 5: Save (is_reference=True, auto-approved)
        saved_questions = []
        for q in questions:
            db_q = database.Question(
                subject_id=subject_id,
                topic_id=topic_id,
                question_text=q.get("question_text") or q.get("question"),
                question_type=question_type,
                options=json.dumps(q.get("options")) if q.get("options") else None,
                correct_answer=q.get("answer") or q.get("correct_answer"),
                difficulty=difficulty,
                marks=1 if question_type.lower() == 'mcq' else 5,
                is_reference=1, # True
                rubric_id=None,
                status="approved", # No vetting needed
                co_id=q.get("mapped_co") or q.get("co_mapping"),
                lo_id=q.get("mapped_lo") or q.get("lo_mapping")
            )
            
            # Handle list formats for CO/LO
            if isinstance(db_q.co_id, list):
                db_q.co_id = ", ".join(db_q.co_id)
            if isinstance(db_q.lo_id, list):
                db_q.lo_id = ", ".join(db_q.lo_id)
                
            # Fallback to topic mappings if missing
            if not db_q.co_id:
                db_q.co_id = ", ".join(topic.get('co_mappings', []))
            if not db_q.lo_id:
                db_q.lo_id = ", ".join(topic.get('lo_mappings', []))

            db.add(db_q)
            saved_questions.append(db_q)
        
        db.commit()
        
        # Refresh to get IDs
        for q in saved_questions:
            db.refresh(q)

        return {
            "questions": saved_questions,
            "metadata": {
                "topic": topic['name'],
                "co_mappings": topic['co_mappings'],
                "generated_for": "faculty_reference",
                "generated_at": datetime.now().isoformat(),
                "few_shot_examples_used": len(sample_questions)
            }
        }
    
    # ===== ACTION 2: Upload Sample Questions =====
    async def upload_sample_questions(
        self,
        db: Session,
        subject_id: int,
        topic_id: int,
        file_content: bytes,
        filename: str,
        question_type: str
    ) -> Dict[str, Any]:
        """
        Process uploaded sample questions:
        1. Parse file (CSV/PDF/DOC)
        2. Extract individual questions
        3. Store in database with metadata
        4. These will be used as few-shot examples
        """
        logger.info(f"Uploading sample questions from {filename}")
        
        # Decode filename to handle spaces
        from urllib.parse import unquote
        filename = unquote(filename)
        
        # Step 1: Determine file type and parse
        if filename.endswith('.csv'):
            questions = self._parse_csv_questions(file_content, question_type)
        elif filename.endswith(('.xlsx', '.xls')):
            questions = self._parse_excel_questions(file_content, question_type)
        elif filename.endswith('.pdf'):
            questions = await self._parse_pdf_questions(file_content, question_type)
        elif filename.endswith(('.doc', '.docx')):
            questions = await self._parse_doc_questions(file_content, question_type)
        else:
            raise ValueError(f"Unsupported file type: {filename}")
        
        # Step 2: Save to database
        saved = await self._save_sample_questions(
            db,
            subject_id,
            topic_id,
            questions,
            question_type
        )
        
        return {
            "parsed_count": len(questions),
            "saved_count": saved,
            "question_type": question_type,
            "message": f"Successfully uploaded {saved} {question_type} questions"
        }
    
    # ===== ACTION 3: Upload Notes =====
    async def upload_topic_notes(
        self,
        db: Session,
        subject_id: int,
        topic_id: int,
        file_content: bytes,
        filename: str
    ) -> Dict[str, Any]:
        """
        Process uploaded notes:
        1. Extract text from file
        2. Chunk and embed
        3. Add to topic's ChromaDB collection
        4. Enhances RAG retrieval for this topic
        """
        logger.info(f"Uploading notes: {filename}")
        
        # Step 1: Save file
        file_path = self._save_notes_file(subject_id, topic_id, file_content, filename)
        
        # Step 2: Extract text
        text = await self._extract_text(str(file_path))
        
        # Step 3: Chunk with topic metadata
        chunks = self.chunker.chunk_text(
            text,
            metadata={
                "subject_id": str(subject_id),
                "topic_id": str(topic_id),
                "source": "notes",
                "filename": filename
            }
        )
        
        # Step 4: Generate embeddings and add to ChromaDB
        chunk_texts = [chunk["text"] for chunk in chunks]
        embeddings = self.embedding_service.generate_embeddings(chunk_texts)
        metadatas = [chunk["metadata"] for chunk in chunks]
        
        import uuid
        ids = [str(uuid.uuid4()) for _ in chunks]
        
        self.vector_store.add_documents(
            collection_name=f"subject_{subject_id}",
            documents=chunk_texts,
            metadatas=metadatas,
            ids=ids,
            embeddings=embeddings
        )
        
        # Step 5: Save to database
        note_record = database.TopicNotes(
            subject_id=subject_id,
            topic_id=topic_id,
            title=filename,
            file_path=str(file_path)
        )
        db.add(note_record)
        db.commit()
        
        return {
            "filename": filename,
            "chunks_indexed": len(chunks),
            "message": "Notes indexed successfully. RAG context enhanced."
        }
    
    # ===== HELPER METHODS =====
    
    async def _get_topic_with_cos(self, db: Session, subject_id: int, topic_id: int) -> Dict:
        """Get topic with its CO mappings"""
        topic = db.query(database.Topic).filter(database.Topic.id == topic_id).first()
        if not topic:
            raise ValueError(f"Topic {topic_id} not found")
        
        # Get CO mappings directly from topic
        co_mappings = [co.code for co in topic.mapped_cos]
        lo_mappings = [lo.code for lo in topic.mapped_los]
        
        return {
            "id": topic.id,
            "name": topic.name,
            "co_mappings": co_mappings,
            "lo_mappings": lo_mappings
        }
    
    async def _get_sample_questions(
        self,
        db: Session,
        subject_id: int,
        topic_id: int,
        question_type: str,
        limit: int = 3
    ) -> List[Dict]:
        """Fetch sample questions for few-shot learning"""
        # Try to filter by topic_id first if possible, or topic name
        topic = db.query(database.Topic).filter(database.Topic.id == topic_id).first()
        topic_name = topic.name if topic else ""

        # Filter by subject and type. 
        # Ideally we'd filter by topic_id if SampleQuestion had it. 
        # Based on previous context, SampleQuestion has topic_id.
        
        query = db.query(SampleQuestion).filter(
            SampleQuestion.subject_id == subject_id,
            SampleQuestion.question_type == question_type
        )
        
        # Prefer ID match, fallback to name
        if hasattr(SampleQuestion, 'topic_id'):
             query = query.filter(SampleQuestion.topic_id == topic_id)
        else:
             query = query.filter(SampleQuestion.topic == topic_name)
             
        samples = query.limit(limit).all()
        
        result = []
        for s in samples:
            # Parse options if JSON string
            options = s.options
            if isinstance(options, str):
                try:
                    import json
                    options = json.loads(options)
                except:
                    options = {}
            elif not options:
                options = {}

            result.append({
                "question_text": s.question_text,
                "options": options,
                "correct_answer": s.correct_answer or "N/A",
                "co_mapping": s.co_mapping or "N/A"
            })
        
        return result
    
    async def _generate_with_few_shot(
        self,
        context: str,
        topic: Dict,
        question_type: str,
        count: int,
        sample_questions: List[Dict],
        difficulty: str,
        skill_instructions: str = ""
    ) -> List[Dict]:
        """Generate questions using few-shot learning"""
        from ..prompts.generation_prompts import (
            build_few_shot_section, MCQ_GENERATION_WITH_FEWSHOT,
            SHORT_ANSWER_PROMPT_TEMPLATE, ESSAY_PROMPT_TEMPLATE
        )
        
        few_shot_section = build_few_shot_section(sample_questions)
        co_mappings_str = ", ".join(topic.get('co_mappings', [])) or "CO1"
        lo_mappings_str = ", ".join(topic.get('lo_mappings', [])) or "LO1"
        
        # Use appropriate prompt template
        if question_type.lower() in ('mcq', 'multiple_choice'):
            prompt = MCQ_GENERATION_WITH_FEWSHOT.format(
                subject_name="Subject",
                topic_name=topic['name'],
                co_mappings=co_mappings_str,
                lo_mappings=lo_mappings_str,
                rag_context=context[:5000],
                few_shot_section=few_shot_section,
                count=count,
                difficulty=difficulty
            )
        elif question_type.lower() in ('short_answer', 'short'):
            prompt = SHORT_ANSWER_PROMPT_TEMPLATE.format(
                subject_name="Subject",
                rag_context=context[:3000], # Increased context
                count=count,
                topic=topic['name'],
                difficulty=difficulty,
                marks=6,
                word_count=100,
                co=co_mappings_str,
                lo=lo_mappings_str
            )
        elif question_type.lower() in ('essay', 'long_answer'):
            prompt = ESSAY_PROMPT_TEMPLATE.format(
                subject_name="Subject",
                rag_context=context[:5000],
                count=count,
                topic=topic['name'],
                difficulty=difficulty,
                marks=10,
                co=co_mappings_str,
                lo=lo_mappings_str
            )
        else:
            # Generic fallback — still request JSON
            prompt = f"""Generate {count} {question_type} questions about {topic['name']}.

CONTEXT: {context[:3000]}

OUTPUT FORMAT (strict JSON):
{{
  "questions": [
    {{
      "question_text": "...",
      "question_type": "{question_type}",
      "difficulty": "{difficulty}",
      "marks": 5
    }}
  ]
}}"""
            
        if skill_instructions:
            prompt = f"{skill_instructions}\n\n{prompt}"
        
        # Direct single-call generation (replaces slow hybrid council)
        logger.info(f"Generating {count} {question_type} questions directly")
        
        try:
            # Request slightly more to allow for valid JSON parsing and dedup availability
            # But the prompt says {count}. Let's stick to {count} for now to avoid confusion.
            
            result = await self.llm_service.generate_json(
                prompt=prompt,
                model=config.GENERATION_MODEL, # Verify config.GENERATION_MODEL exists/is correct
                temperature=0.7,
                max_tokens=3000 if count <= 3 else 4000
            )
            
            generated_questions = result.get("questions", [])
            
            # Deduplication
            unique_questions = []
            seen_texts = []
            from difflib import SequenceMatcher
            
            for q in generated_questions:
                q_text = q.get("question_text", "")
                if not q_text or len(q_text) < 5: continue
                
                is_dup = False
                for seen in seen_texts:
                    ratio = SequenceMatcher(None, q_text.lower(), seen.lower()).ratio()
                    if ratio > 0.75:
                        is_dup = True
                        break
                
                if not is_dup:
                    unique_questions.append(q)
                    seen_texts.append(q_text)
            
            # If we lost too many to dedup, we might need to generate more using the loop logic?
            # For now, just return what we have.
            return unique_questions[:count]

        except Exception as e:
            logger.error(f"Generation failed: {e}")
            return []
    
    def _parse_csv_questions(self, file_content: bytes, question_type: str) -> List[Dict]:
        """Parse CSV file with questions"""
        import io
        content = file_content.decode('utf-8')
        reader = csv.DictReader(io.StringIO(content))
        
        questions = []
        for row in reader:
            # Extract options dynamically
            options = {}
            for key, value in row.items():
                if key.lower().startswith('option') and value and value.strip():
                    options[key] = value.strip()
            
            questions.append({
                "question_text": row.get("question", row.get("Question", "")),
                "options": options,
                "correct_answer": row.get("correct_answer", row.get("Answer", "")),
                "marks": int(row.get("marks", row.get("Marks", 1))),
                "co_ids": row.get("co_ids", row.get("CO Mapping", "")),
                "lo_ids": row.get("lo_ids", row.get("LO Mapping", "")),
                "type": question_type
            })
        
        return questions

    def _parse_excel_questions(self, file_content: bytes, question_type: str) -> List[Dict]:
        """Parse Excel file with questions"""
        import pandas as pd
        import io
        
        # Read Excel
        df = pd.read_excel(io.BytesIO(file_content))
        
        # Replace NaN with empty string
        df = df.fillna("")
        
        questions = []
        for _, row in df.iterrows():
            # Convert row to dict for easier access
            row_dict = row.to_dict()
            
            # Extract options dynamically
            options = {}
            for key, value in row_dict.items():
                if str(key).lower().startswith('option') and value and str(value).strip():
                    options[key] = str(value).strip()
            
            # Helper to get value case-insensitively
            def get_val(keys, default=""):
                for k in keys:
                    if k in row_dict and row_dict[k]:
                        return row_dict[k]
                return default

            questions.append({
                "question_text": str(get_val(["question", "Question", "QUESTION"], "")),
                "options": options,
                "correct_answer": str(get_val(["correct_answer", "Answer", "ANSWER", "Correct Answer"], "")),
                "marks": int(get_val(["marks", "Marks", "MARKS"], 1) or 1),
                "co_ids": str(get_val(["co_ids", "CO Mapping", "CO"], "")),
                "lo_ids": str(get_val(["lo_ids", "LO Mapping", "LO"], "")),
                "type": question_type
            })
        
        return questions
    
    async def _parse_pdf_questions(self, file_content: bytes, question_type: str) -> List[Dict]:
        """Parse PDF file with questions"""
        # Save temp file
        import tempfile
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
            tmp.write(file_content)
            tmp_path = tmp.name
        
        try:
            text = self.pdf_parser.extract_text(tmp_path)
            # Simple parsing: split by double newlines
            questions = []
            for q_text in text.split('\n\n'):
                if q_text.strip():
                    questions.append({
                        "question_text": q_text.strip(),
                        "options": {},
                        "correct_answer": "",
                        "type": question_type
                    })
            return questions
        finally:
            os.unlink(tmp_path)
    
    async def _parse_doc_questions(self, file_content: bytes, question_type: str) -> List[Dict]:
        """Parse DOC/DOCX file with questions"""
        import tempfile
        with tempfile.NamedTemporaryFile(delete=False, suffix='.docx') as tmp:
            tmp.write(file_content)
            tmp_path = tmp.name
        
        try:
            text = self.docx_parser.extract_text(tmp_path)
            questions = []
            for q_text in text.split('\n\n'):
                if q_text.strip():
                    questions.append({
                        "question_text": q_text.strip(),
                        "options": {},
                        "correct_answer": "",
                        "type": question_type
                    })
            return questions
        finally:
            os.unlink(tmp_path)
    
    async def _save_sample_questions(
        self,
        db: Session,
        subject_id: int,
        topic_id: int,
        questions: List[Dict],
        question_type: str
    ) -> int:
        """Save sample questions to database"""
        saved_count = 0
        for q in questions:
            sample = SampleQuestion(
                subject_id=subject_id,
                topic_id=topic_id,
                question_text=q.get("question_text", ""),
                question_type=question_type,
                options=json.dumps(q.get("options")) if q.get("options") else None,
                correct_answer=q.get("correct_answer"),
                marks=q.get("marks", 1),
                co_ids=q.get("co_ids"),
                lo_ids=q.get("lo_ids"),
                file_path=None
            )
            db.add(sample)
            saved_count += 1
        
        db.commit()
        return saved_count
    
    def _save_notes_file(
        self,
        subject_id: int,
        topic_id: int,
        file_content: bytes,
        filename: str
    ) -> Path:
        """Save notes file to subject folder"""
        subject_folder = self.base_dir / f"SUBJ{subject_id}"
        notes_dir = subject_folder / "notes"
        notes_dir.mkdir(parents=True, exist_ok=True)
        
        file_path = notes_dir / f"topic{topic_id}_{filename}"
        with open(file_path, "wb") as f:
            f.write(file_content)
        
        return file_path
    
    async def _extract_text(self, file_path: str) -> str:
        """Extract text from file"""
        if file_path.lower().endswith('.pdf'):
            return self.pdf_parser.extract_text(file_path)
        elif file_path.lower().endswith('.docx'):
            return self.docx_parser.extract_text(file_path)
        else:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                return f.read()

topic_actions_service = TopicActionsService()
