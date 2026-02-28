import os
import json
import csv
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional, Union
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
    # Scenario parameter pools for sub-batch diversity
    SCENARIO_SEEDS = [
        {"age_range": "18-25 year old", "focus": "initial diagnosis and treatment planning", "setting": "outpatient clinic"},
        {"age_range": "40-55 year old", "focus": "complications and management modifications", "setting": "hospital setting"},
        {"age_range": "60-75 year old", "focus": "rehabilitation and long-term outcomes", "setting": "prosthetic lab"},
        {"age_range": "30-45 year old", "focus": "material selection and design principles", "setting": "clinical practice"},
        {"age_range": "55-70 year old", "focus": "contraindications and alternative approaches", "setting": "multidisciplinary team meeting"},
    ]
    
    RAG_QUERY_VARIATIONS = [
        "diagnosis classification types",
        "treatment protocol techniques procedures",
        "complications management modifications",
        "materials properties design principles",
        "rehabilitation outcomes prognosis",
    ]

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
        Sub-batch generation for faculty reference:
        When count > 3, generates in sub-batches of 2-3 with:
        - Different RAG context per batch (different queries)
        - Unique scenario parameters per batch (diff patient, focus, setting)
        - This forces structural diversity: same question logic, different parameters
        """
        logger.info(f"Quick generating {count} {question_type} questions for topic {topic_id}")
        
        # Step 1: Get topic and its CO mappings
        topic = await self._get_topic_with_cos(db, subject_id, topic_id)
        
        # Get subject name for prompt context
        subject = db.query(database.Subject).filter(database.Subject.id == subject_id).first()
        subject_name = subject.name if subject else "Subject"
        
        # Step 2: Get sample questions for few-shot learning (shared across batches)
        sample_questions = await self._get_sample_questions(
            db,
            subject_id,
            topic_id,
            question_type,
            limit=3
        )
        
        # Step 3: Check for trained skill (shared across batches)
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

        # Step 4: Per-Question Generation Strategy
        import random
        
        context = ""  # Used by fallback inside loop or pre_retrieved

        if pre_retrieved_context:
            # PER-QUESTION generation even for bulk path to ensure diversity
            logger.info("Using pre-retrieved context — per-question generation for diversity")
            questions = []
            exclusion_texts = [sq.get('question_text', '') for sq in sample_questions if sq.get('question_text')]
            
            for i in range(count):
                # Build novelty instruction from exclusion list
                novelty_instruction = ""
                if exclusion_texts:
                    novelty_instruction = "\nNOVELTY ENFORCEMENT - YOU MUST NOT REPEAT THESE SCENARIOS:\n"
                    for idx, ext in enumerate(exclusion_texts[-5:], 1):
                        novelty_instruction += f"{idx}. {ext[:150]}...\n"
                    novelty_instruction += "\nYOUR NEW QUESTION MUST:\n"
                    novelty_instruction += "- Test a COMPLETELY DIFFERENT clinical concept from the above.\n"
                    novelty_instruction += "- Use totally different patient parameters/measurements.\n"
                    novelty_instruction += "- Use a different question stem structure.\n"
                
                logger.info(f"Bulk path: generating question {i+1}/{count}")
                q_result = await self._generate_with_few_shot(
                    context=pre_retrieved_context,
                    topic=topic,
                    question_type=question_type,
                    count=1,
                    sample_questions=sample_questions,
                    difficulty=difficulty,
                    skill_instructions=skill_instructions,
                    subject_name=subject_name,
                    scenario_seed=novelty_instruction,
                    existing_texts=exclusion_texts,
                )
                if q_result:
                    questions.extend(q_result)
                    for q in q_result:
                        if q.get('question_text'):
                            exclusion_texts.append(q['question_text'])
        else:
            # PER-QUESTION GENERATION: 1 question per call with unique sub-topics
            # This is slower but guarantees high diversity and novelty (no repetition)
            questions = []
            
            # Extract 6-10 distinct clinical sub-topics from the vector store for this topic
            subtopics = await self.rag_service.get_diverse_subtopics(str(subject_id), str(topic_id))
            
            # Shuffle subtopics so repeated generations aren't predictable
            import random
            if subtopics:
                random.shuffle(subtopics)
            else:
                # Fallback: use the topic name itself as the only subtopic
                subtopics = [topic.get('name', 'general topic')]
            
            # Keep track of ALL generated text (samples + newly generated) to prevent repetition
            exclusion_texts = [sq.get('question_text', '') for sq in sample_questions if sq.get('question_text')]
            
            for i in range(count):
                # Pick a subtopic for this question, cycling if we run out
                current_subtopic = subtopics[i % len(subtopics)]
                
                # Retrieve highly focused, diverse chunks for THIS specific subtopic
                # Returns List[Dict] with {text, page_number, source} per chunk
                q_context = self.rag_service.retrieve_for_subtopic(
                    subtopic=current_subtopic,
                    subject_id=str(subject_id),
                    topic_id=str(topic_id),
                    n_results=8  # 8 diverse chunks per question for richer context
                )
                
                if not q_context:
                    # Fallback: use the pre-retrieved bulk context (structured or flat)
                    if context:
                        q_context = context
                    else:
                        q_context = self.rag_service.retrieve_context_with_metadata(
                            query_text=topic['name'], subject_id=str(subject_id), n_results=8
                        )
                
                # Build the explicit exclusion prompt
                # Send the last 5 generated questions so the model knows what NOT to do
                novelty_instruction = "\nNOVELTY ENFORCEMENT - YOU MUST NOT REPEAT THESE SCENARIOS:\n"
                if exclusion_texts:
                    recent_exclusions = exclusion_texts[-5:]
                    for idx, ext in enumerate(recent_exclusions, 1):
                        novelty_instruction += f"{idx}. {ext[:150]}...\n"
                    novelty_instruction += "\nYOUR NEW QUESTION MUST:\n"
                    novelty_instruction += "- Test a COMPLETELY DIFFERENT clinical concept from the above.\n"
                    novelty_instruction += "- Use totally different patient parameters/measurements.\n"
                else:
                    novelty_instruction += "(No previous questions. You may start fresh.)\n"

                logger.info(f"Generating Question {i+1}/{count} | Focus: {current_subtopic}")
                
                # Generate exactly 1 question per call
                q_result = await self._generate_with_few_shot(
                    context=q_context,
                    topic=topic,
                    question_type=question_type,
                    count=1,  # Strictly 1 per call
                    sample_questions=sample_questions,
                    difficulty=difficulty,
                    skill_instructions=skill_instructions,
                    subject_name=subject_name,
                    scenario_seed=novelty_instruction, # Misused seed param for novelty injection
                    existing_texts=exclusion_texts,
                )
                
                if q_result:
                    # POST-GENERATION VALIDATION + SELF-CORRECTION for MCQs
                    if question_type.lower() == 'mcq':
                        validated = []
                        for q in q_result:
                            # Layer 1: Programmatic pre-filter (instant, no LLM cost)
                            precheck = self._programmatic_quality_check(q)
                            if not precheck["passed"]:
                                # Skip LLM validation — go straight to correction
                                validation = {"passed": False, "issues": precheck["issues"], "suggested_answer": None}
                            else:
                                # Layer 2: LLM validation (only if pre-filter passed)
                                validation = await self._validate_mcq(q, q_context)
                            if validation["passed"]:
                                validated.append(q)
                            else:
                                # SELF-CORRECTION with RETRY LOOP: up to 3 attempts since 3b model is fast
                                MAX_CORRECTION_RETRIES = 3
                                correction_succeeded = False
                                current_q = q
                                current_validation = validation
                                
                                for retry in range(MAX_CORRECTION_RETRIES):
                                    logger.info(f"Correction attempt {retry+1}/{MAX_CORRECTION_RETRIES} for: {current_q.get('question_text', '')[:60]}...")
                                    corrected = await self._correct_mcq(current_q, q_context, current_validation)
                                    if corrected:
                                        re_validation = await self._revalidate_mcq(corrected)
                                        if re_validation["passed"]:
                                            logger.info(f"✅ Self-correction SUCCEEDED on attempt {retry+1}")
                                            validated.append(corrected)
                                            correction_succeeded = True
                                            break
                                        else:
                                            logger.warning(f"Correction attempt {retry+1} failed: {re_validation.get('issues', [])}")
                                            # Feed the corrected question back for next retry
                                            current_q = corrected
                                            current_validation = re_validation
                                    else:
                                        logger.warning(f"Correction attempt {retry+1} returned empty result")
                                        break  # No point retrying if model returns nothing
                                
                                if not correction_succeeded:
                                    logger.warning(f"❌ All {MAX_CORRECTION_RETRIES} correction attempts failed, discarding question")
                        
                        questions.extend(validated)
                    else:
                        questions.extend(q_result)
                    
                    # Add to exclusion list regardless
                    for q in q_result:
                        text = q.get('question_text', '')
                        if text:
                            exclusion_texts.append(text)
                            
            logger.info(f"Per-question generation complete: {len(questions)} distinct questions generated.")
        
        # Step 5: Save (is_reference=True, auto-approved)
        saved_questions = []
        for q in questions:
            # Extract bloom_level from LLM output (e.g. "K3-Apply")
            bloom_level = q.get("bloom_level") or None
            
            db_q = database.Question(
                subject_id=subject_id,
                topic_id=topic_id,
                question_text=q.get("question_text") or q.get("question"),
                question_type=question_type,
                options=json.dumps(q.get("options")) if q.get("options") else None,
                correct_answer=q.get("answer") or q.get("correct_answer"),
                difficulty=q.get("difficulty") or difficulty,  # Prefer LLM's output, fallback to request param
                bloom_level=bloom_level,
                marks=1 if question_type.lower() == 'mcq' else (10 if question_type.lower() == 'essay' else 5),
                is_reference=1, # True
                rubric_id=None,
                status="approved", # No vetting needed
                co_id=q.get("mapped_co") or q.get("co_mapping"),
                lo_id=q.get("mapped_lo") or q.get("lo_mapping"),
                rag_context=json.dumps({
                    "context": q.get("source_context", [context] if context else []),
                    "reasoning": q.get("reasoning", "No reasoning provided by model.")
                })
            )
            
            # Handle list formats for CO/LO
            if isinstance(db_q.co_id, list):
                db_q.co_id = ", ".join(str(x) for x in db_q.co_id)
            if isinstance(db_q.lo_id, list):
                db_q.lo_id = ", ".join(str(x) for x in db_q.lo_id)
                
            # Only use topic-level CO/LO codes as FALLBACK when model didn't map specific ones
            # This ensures question-specific CO/LO mappings are preserved
            if not db_q.co_id:
                topic_co_codes = ", ".join(topic.get('co_codes', []))
                if topic_co_codes:
                    db_q.co_id = topic_co_codes
            if not db_q.lo_id:
                topic_lo_codes = ", ".join(topic.get('lo_codes', []))
                if topic_lo_codes:
                    db_q.lo_id = topic_lo_codes

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
        
        # Step 2: Save to database (append timestamp to make each upload unique)
        from datetime import datetime as dt
        unique_filename = f"{dt.now().strftime('%Y%m%d_%H%M%S')}_{filename}"
        saved = await self._save_sample_questions(
            db,
            subject_id,
            topic_id,
            questions,
            question_type,
            filename=unique_filename
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
        
        # Step 2: Extract text and chunk with page awareness for PDFs
        if filename.lower().endswith('.pdf'):
            # Use page-aware extraction for proper page numbers
            from .pdf_parser import PDFParser
            pdf_parser = PDFParser()
            pages = pdf_parser.extract_text_with_pages(str(file_path))
            chunks = self.chunker.chunk_text_with_pages(
                pages,
                metadata={
                    "subject_id": str(subject_id),
                    "topic_id": str(topic_id),
                    "source": filename,
                    "filename": filename
                }
            )
        else:
            # Fallback for non-PDF files
            text = await self._extract_text(str(file_path))
            chunks = self.chunker.chunk_text(
                text,
                metadata={
                    "subject_id": str(subject_id),
                    "topic_id": str(topic_id),
                    "source": filename,
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
        """Get topic with its CO mappings including full descriptions"""
        topic = db.query(database.Topic).filter(database.Topic.id == topic_id).first()
        if not topic:
            raise ValueError(f"Topic {topic_id} not found")
        
        # Get CO mappings with weights from TopicCOMapping
        topic_co_mappings = db.query(database.TopicCOMapping).filter(database.TopicCOMapping.topic_id == topic_id).all()
        
        co_mappings = []
        co_codes = []
        for mapping in topic_co_mappings:
            co = db.query(database.CourseOutcome).filter(database.CourseOutcome.id == mapping.course_outcome_id).first()
            if co:
                # Include full description so the LLM understands what this CO means
                weight_str = f" ({mapping.weight} Priority)" if mapping.weight and mapping.weight != "None" else ""
                desc = f": {co.description}" if co.description else ""
                co_mappings.append(f"{co.code}{weight_str}{desc}")
                co_codes.append(co.code)
                
        lo_mappings = []
        lo_codes = []
        for lo in topic.mapped_los:
            desc = f": {lo.description}" if lo.description else ""
            lo_mappings.append(f"{lo.code}{desc}")
            lo_codes.append(lo.code)
        
        return {
            "id": topic.id,
            "name": topic.name,
            "co_mappings": co_mappings,
            "lo_mappings": lo_mappings,
            "co_codes": co_codes,
            "lo_codes": lo_codes
        }
    # ─── Programmatic Pre-Filter (Layer 1) ─────────────────────────────────
    
    # Banned phrases in options — these are K1/K2 throwaway patterns
    _BANNED_OPTION_PHRASES = [
        "focus solely on", "focusing solely on",
        "ignore the", "ignoring the", "ignoring any",
        "avoid ", "avoiding ",
        "prioritize ease", "prioritizing ease",
        "without utilizing", "without considering",
        "not a medical issue", "not a concern",
        "solely on", "altogether due to",
        "advise against any", "suggest against any",
    ]
    
    _ABSOLUTE_QUALIFIERS = ["solely", "altogether", "never", "always"]
    
    def _programmatic_quality_check(self, question: Dict) -> Dict:
        """Layer 1: Instant programmatic check for banned option patterns.
        Returns {passed: bool, issues: list}. No LLM cost."""
        issues = []
        options = question.get("options", {})
        
        if isinstance(options, dict):
            opt_items = list(options.items())
        elif isinstance(options, list):
            opt_items = [(chr(65+i), o) for i, o in enumerate(options)]
        else:
            return {"passed": True, "issues": []}
        
        for key, value in opt_items:
            value_lower = value.lower().strip()
            
            # Check banned phrases
            for phrase in self._BANNED_OPTION_PHRASES:
                if phrase in value_lower:
                    issues.append(f"Option {key} contains throwaway phrase: '{phrase}' → \"{value[:60]}\"")
                    break
            
            # Check absolute qualifiers count (2+ = suspicious)
            qualifier_count = sum(1 for q in self._ABSOLUTE_QUALIFIERS if q in value_lower)
            if qualifier_count >= 2:
                issues.append(f"Option {key} has {qualifier_count} absolute qualifiers → \"{value[:60]}\"")
        
        passed = len(issues) == 0
        if not passed:
            logger.info(f"⚡ Programmatic pre-filter FAILED: {issues}")
        
        return {"passed": passed, "issues": issues}
    
    async def _validate_mcq(self, question: Dict, context: Any) -> Dict:
        """Validate a generated MCQ question against its source context.
        Returns dict with {passed: bool, issues: list, suggested_answer: str|None}."""
        try:
            from ..prompts.generation_prompts import MCQ_VALIDATION_PROMPT
            
            # Build context string from structured or flat context
            if isinstance(context, list):
                context_text = "\n".join(
                    c.get("text", str(c)) if isinstance(c, dict) else str(c)
                    for c in context
                )
            else:
                context_text = str(context) if context else "No context available"
            
            # Format options for validation
            options = question.get("options", {})
            if isinstance(options, dict):
                options_str = "\n".join(f"{k}: {v}" for k, v in options.items())
            elif isinstance(options, list):
                options_str = "\n".join(f"{chr(65+i)}: {o}" for i, o in enumerate(options))
            else:
                options_str = str(options)
            
            prompt = MCQ_VALIDATION_PROMPT.format(
                context=context_text[:3000],
                question_text=question.get("question_text", ""),
                options=options_str,
                correct_answer=question.get("correct_answer") or question.get("answer", ""),
                explanation=question.get("explanation", "No explanation provided"),
            )
            
            response = await self.llm_service.generate(
                prompt=prompt, 
                max_tokens=300, 
                temperature=0.1,
            )
            
            if not response:
                logger.warning("Validation LLM returned empty — defaulting to PASS")
                return {"passed": True, "issues": [], "suggested_answer": None}
            
            # Parse validation result
            result = response if isinstance(response, dict) else {}
            passed = result.get("pass", True)
            issues = result.get("issues", [])
            suggested = result.get("suggested_correct_answer")
            
            if not passed:
                logger.info(f"Validation FAILED: {issues}")
            else:
                logger.info(f"Validation PASSED for: {question.get('question_text', '')[:60]}...")
            
            return {"passed": bool(passed), "issues": issues, "suggested_answer": suggested}
            
        except Exception as e:
            logger.warning(f"Validation error (defaulting to PASS): {e}")
            return {"passed": True, "issues": [], "suggested_answer": None}
    
    async def _correct_mcq(self, question: Dict, context: Any, validation: Dict) -> Optional[Dict]:
        """Use the model to fix a failed question based on specific validation issues.
        Returns corrected question dict or None if correction fails."""
        try:
            from ..prompts.generation_prompts import MCQ_CORRECTION_PROMPT
            
            # Build context string
            if isinstance(context, list):
                context_text = "\n".join(
                    c.get("text", str(c)) if isinstance(c, dict) else str(c)
                    for c in context
                )
            else:
                context_text = str(context) if context else "No context available"
            
            # Format options
            options = question.get("options", {})
            if isinstance(options, dict):
                options_str = "\n".join(f"{k}: {v}" for k, v in options.items())
            elif isinstance(options, list):
                options_str = "\n".join(f"{chr(65+i)}: {o}" for i, o in enumerate(options))
            else:
                options_str = str(options)
            
            # Build issues text
            issues = validation.get("issues", [])
            issues_text = "\n".join(f"- {issue}" for issue in issues) if issues else "- General quality issue"
            
            # Build suggested fix text
            suggested = validation.get("suggested_answer")
            suggested_fix = f"REVIEWER'S SUGGESTED CORRECT ANSWER: {suggested}" if suggested else ""
            
            prompt = MCQ_CORRECTION_PROMPT.format(
                context=context_text[:3000],
                question_text=question.get("question_text", ""),
                options=options_str,
                correct_answer=question.get("correct_answer") or question.get("answer", ""),
                explanation=question.get("explanation", ""),
                issues=issues_text,
                suggested_fix=suggested_fix,
                bloom_level=question.get("bloom_level", "K2-Understand"),
                co_code=question.get("mapped_co", ""),
                lo_code=question.get("mapped_lo", ""),
                difficulty=question.get("difficulty", "medium"),
            )
            
            response = await self.llm_service.generate(
                prompt=prompt,
                max_tokens=1000,
                temperature=0.3,
            )
            
            if not response or not isinstance(response, dict):
                return None
            
            # Ensure the corrected question has required fields
            if not response.get("question_text") and not response.get("question"):
                return None
            
            # Normalize field names
            if "question" in response and "question_text" not in response:
                response["question_text"] = response.pop("question")
            
            # Carry over source context from original
            response["source_context"] = question.get("source_context", [])
            
            # Build correction breakdown reasoning for the vetter
            original_q = question.get("question_text", "")
            original_answer = question.get("correct_answer") or question.get("answer", "")
            corrected_answer = response.get("correct_answer") or response.get("answer", "")
            issues_list = validation.get("issues", [])
            
            correction_breakdown = f"CORRECTION APPLIED:\n"
            correction_breakdown += f"Original Question: {original_q[:200]}\n"
            correction_breakdown += f"Original Answer: {original_answer}\n"
            correction_breakdown += f"Issues Found: {'; '.join(issues_list) if issues_list else 'General quality issue'}\n"
            if str(original_answer) != str(corrected_answer):
                correction_breakdown += f"Answer Changed: {original_answer} → {corrected_answer}\n"
            corrected_q = response.get("question_text", "")
            if original_q != corrected_q:
                correction_breakdown += f"Question was rewritten for accuracy.\n"
            
            # Prepend the correction breakdown to any model reasoning
            existing_reasoning = response.get("reasoning", "")
            response["reasoning"] = correction_breakdown + (f"\nModel Reasoning: {existing_reasoning}" if existing_reasoning else "")
            
            logger.info(f"Correction produced: {response.get('question_text', '')[:60]}...")
            return response
            
        except Exception as e:
            logger.warning(f"Correction error: {e}")
            return None
    
    async def _revalidate_mcq(self, question: Dict) -> Dict:
        """Light sanity check for corrected questions.
        Only checks if the answer is wrong or the question is garbled.
        Does NOT check against reference material (to avoid scope-based rejections)."""
        try:
            from ..prompts.generation_prompts import MCQ_REVALIDATION_PROMPT
            
            options = question.get("options", {})
            if isinstance(options, dict):
                options_str = "\n".join(f"{k}: {v}" for k, v in options.items())
            elif isinstance(options, list):
                options_str = "\n".join(f"{chr(65+i)}: {o}" for i, o in enumerate(options))
            else:
                options_str = str(options)
            
            prompt = MCQ_REVALIDATION_PROMPT.format(
                question_text=question.get("question_text", ""),
                options=options_str,
                correct_answer=question.get("correct_answer") or question.get("answer", ""),
            )
            
            response = await self.llm_service.generate(
                prompt=prompt,
                max_tokens=150,
                temperature=0.1,
            )
            
            if not response:
                return {"passed": True, "issues": []}
            
            result = response if isinstance(response, dict) else {}
            passed = result.get("pass", True)
            issues = result.get("issues", [])
            
            if passed:
                logger.info(f"Re-validation PASSED for corrected question")
            else:
                logger.info(f"Re-validation FAILED: {issues}")
            
            return {"passed": bool(passed), "issues": issues}
            
        except Exception as e:
            logger.warning(f"Re-validation error (defaulting to PASS): {e}")
            return {"passed": True, "issues": []}
    
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

            # Handle co_mapping types
            co_val = s.co_mapping
            if isinstance(co_val, dict):
                co_val = ", ".join(co_val.keys())
            elif isinstance(co_val, list):
                co_val = ", ".join(str(x) for x in co_val)
            elif not co_val:
                co_val = s.co_ids or "N/A"

            result.append({
                "question_text": s.question_text,
                "options": options,
                "correct_answer": s.correct_answer or "N/A",
                "co_mapping": co_val
            })
        
        return result
    
    @staticmethod
    def _sanitize_rag_context(context: str) -> str:
        """Remove source-material references from RAG context so the LLM
        never sees phrases like 'this book' and can't mirror them."""
        import re
        # Patterns that cause the LLM to say "this book", "the textbook", etc.
        patterns = [
            (r'\b(this|the|our)\s+(book|textbook|text|volume|manual|handbook)\b', 'this material'),
            (r'\b(this|the)\s+chapter\b', 'this section'),
            (r'\bas\s+discussed\s+in\s+(this|the)\s+\w+', ''),
            (r'\baccording\s+to\s+(this|the)\s+(book|text|chapter|author)\b', ''),
            (r'\b(the\s+)?author(s)?\s+(discuss|describe|explain|mention|note|state|suggest|argue|present)(s|ed)?\b', ''),
            (r'\bin\s+this\s+(book|chapter|text|section|volume)\b', ''),
        ]
        cleaned = context
        for pattern, replacement in patterns:
            cleaned = re.sub(pattern, replacement, cleaned, flags=re.IGNORECASE)
        # Collapse multiple spaces
        cleaned = re.sub(r'  +', ' ', cleaned)
        return cleaned

    @staticmethod
    def _clean_question_text(text: str) -> str:
        """Post-process a generated question to strip any source references
        that the LLM still managed to include."""
        import re
        # Remove trailing source-reference clauses
        patterns = [
            r'\s+as\s+discussed\s+in\s+(this|the)\s+\w+[\?\.]?',
            r'\s+as\s+mentioned\s+in\s+(this|the)\s+\w+[\?\.]?',
            r'\s+according\s+to\s+(this|the)\s+(book|textbook|text|chapter)[\?\.]?',
            r'\s+in\s+this\s+(book|textbook|text|chapter)[\?\.]?',
            r'\s+from\s+(this|the)\s+(book|textbook|text)[\?\.]?',
        ]
        cleaned = text
        for pattern in patterns:
            cleaned = re.sub(pattern, '', cleaned, flags=re.IGNORECASE)
        # Replace inline references
        cleaned = re.sub(r'\b(this|the)\s+(book|textbook)\b', 'the subject', cleaned, flags=re.IGNORECASE)
        # Ensure the question still ends with ?
        cleaned = cleaned.strip()
        if cleaned and not cleaned.endswith('?') and text.strip().endswith('?'):
            cleaned += '?'
        return cleaned

    async def _generate_with_few_shot(
        self,
        context: Union[str, List[Dict]],
        topic: Dict,
        question_type: str,
        count: int,
        sample_questions: List[Dict],
        difficulty: str,
        skill_instructions: str = "",
        subject_name: str = "Subject",
        scenario_seed: str = "",
        existing_texts: List[str] = None,
    ) -> List[Dict]:
        """Generate questions using few-shot learning.
        scenario_seed: injected per-batch to force diverse scenarios.
        existing_texts: previously generated texts for cross-batch dedup.
        """
        from ..prompts.generation_prompts import (
            build_few_shot_section, MCQ_GENERATION_WITH_FEWSHOT,
            SHORT_ANSWER_PROMPT_TEMPLATE, ESSAY_PROMPT_TEMPLATE,
            ASSIGNMENT_PROMPT_TEMPLATE,
            get_bloom_instruction_for_difficulty
        )
        
        few_shot_section = build_few_shot_section(sample_questions)
        co_desc_str = "\n".join(topic.get('co_mappings', [])) or "None Mapped"
        lo_desc_str = "\n".join(topic.get('lo_mappings', [])) or "None Mapped"
        
        co_codes_str = ", ".join(topic.get('co_codes', [])) or "N/A"
        lo_codes_str = ", ".join(topic.get('lo_codes', [])) or "N/A"
        
        # 1. Handle structured vs flat context
        structured_context = []
        flat_context_str = ""
        
        if isinstance(context, list):
            structured_context = context
            # Convert to flat string for the LLM prompt
            flat_context_str = "\n\n---\n\n".join([c.get("text", "") for c in context])
        else:
            flat_context_str = context
            
        # Clean source-material references from RAG context
        context_str = self._sanitize_rag_context(flat_context_str)
        
        # Get Bloom's taxonomy guidance based on difficulty (with per-question assignments)
        bloom_guidance = get_bloom_instruction_for_difficulty(difficulty, count)
        
        # Build novelty exclusion block
        novelty_exclusion = scenario_seed or ""
        if existing_texts:
            if not novelty_exclusion:
                novelty_exclusion = "\nNOVELTY ENFORCEMENT - DO NOT REPEAT THESE:\n"
            for idx, t in enumerate(existing_texts[-5:], 1):
                novelty_exclusion += f"{idx}. {t[:150]}...\n"
            novelty_exclusion += "\nYour question MUST test a COMPLETELY DIFFERENT concept, use different measurements, and a different question stem.\n"
        
        # Use appropriate prompt template
        if question_type.lower() in ('mcq', 'multiple_choice'):
            from ..prompts.generation_prompts import get_random_answer_letter
            prompt = MCQ_GENERATION_WITH_FEWSHOT.format(
                subject_name=subject_name,
                topic_name=topic['name'],
                co_desc=co_desc_str,
                lo_desc=lo_desc_str,
                co_code=co_codes_str,
                lo_code=lo_codes_str,
                rag_context=context_str[:10000],
                few_shot_section=few_shot_section,
                count=count,
                difficulty=difficulty,
                bloom_guidance=bloom_guidance,
                novelty_exclusion=novelty_exclusion,
                example_answer=get_random_answer_letter()
            )
        elif question_type.lower() in ('short_answer', 'short'):
            prompt = SHORT_ANSWER_PROMPT_TEMPLATE.format(
                subject_name=subject_name,
                rag_context=context_str[:3000],
                count=count,
                topic=topic['name'],
                difficulty=difficulty,
                marks=6,
                co_desc=co_desc_str,
                lo_desc=lo_desc_str,
                co_code=co_codes_str,
                lo_code=lo_codes_str,
                bloom_guidance=bloom_guidance,
                novelty_exclusion=novelty_exclusion
            )
        elif question_type.lower() in ('essay', 'long_answer'):
            prompt = ESSAY_PROMPT_TEMPLATE.format(
                subject_name=subject_name,
                rag_context=context_str[:4000],
                count=count,
                topic=topic['name'],
                difficulty=difficulty,
                marks=10,
                co_desc=co_desc_str,
                lo_desc=lo_desc_str,
                co_code=co_codes_str,
                lo_code=lo_codes_str,
                bloom_guidance=bloom_guidance,
                novelty_exclusion=novelty_exclusion
            )
        elif question_type.lower() == 'assignment':
            prompt = ASSIGNMENT_PROMPT_TEMPLATE.format(
                subject_name=subject_name,
                rag_context=context_str[:3000],
                count=count,
                topic=topic['name'],
                difficulty=difficulty,
                marks=10,
            )
        else:
            # Generic fallback — still request JSON
            prompt = f"""Generate {count} {question_type} questions about {topic['name']}.

CONTEXT: {context_str[:3000]}

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
            # Optimize skill instructions to save context
            relevant_skill = self._extract_skill_section(skill_instructions, question_type)
            prompt = f"{relevant_skill}\n\n{prompt}"
        
        # Inject scenario parameters for sub-batch diversity
        if scenario_seed:
            prompt = f"{scenario_seed}\n\n{prompt}"
        
        # Direct single-call generation (replaces slow hybrid council)
        logger.info(f"Generating {count} {question_type} questions directly")
        
        try:
            # Request slightly more to allow for valid JSON parsing and dedup availability
            # But the prompt says {count}. Let's stick to {count} for now to avoid confusion.
            
            result = await self.llm_service.generate(
                prompt=prompt,
                model=config.GENERATION_MODEL,
                temperature=0.7,
                max_tokens=3000 if count <= 3 else 4000,
                expect_json=True
            )
            
            # Handle case where result is a string instead of dict
            if isinstance(result, str):
                try:
                    result = json.loads(result)
                except (json.JSONDecodeError, TypeError):
                    logger.error(f"LLM returned unparseable string: {result[:200]}")
                    return []
            
            generated_questions = result.get("questions", []) if isinstance(result, dict) else []
            
            # Post-process: strip source-material references from question text + inject metadata
            for q in generated_questions:
                if 'question_text' in q:
                    q['question_text'] = self._clean_question_text(q['question_text'])
                
                # Re-inject the structured source context so the caller can save it to DB
                if structured_context:
                    q['source_context'] = structured_context
                
                # Keep reasoning field intact directly from LLM output (already parsed in JSON)
                if 'reasoning' not in q:
                    q['reasoning'] = "No reasoning provided by model."
            
            # Type validation: ensure questions match the requested type
            type_validated = []
            for q in generated_questions:
                if question_type.lower() in ('mcq', 'multiple_choice'):
                    # MCQ must have options dict with at least 3 entries
                    if q.get('options') and isinstance(q.get('options'), dict) and len(q.get('options', {})) >= 3:
                        type_validated.append(q)
                    else:
                        logger.warning(f"Discarding non-MCQ question from MCQ generation: {q.get('question_text', '')[:60]}")
                elif question_type.lower() in ('short_answer', 'short'):
                    # Short answer should NOT have 4 MCQ-style options
                    if not (q.get('options') and isinstance(q.get('options'), dict) and len(q.get('options', {})) >= 4):
                        type_validated.append(q)
                    else:
                        logger.warning(f"Discarding MCQ question from short_answer generation")
                else:
                    type_validated.append(q)
            
            if len(type_validated) < len(generated_questions):
                logger.info(f"Type validation: kept {len(type_validated)}/{len(generated_questions)} questions")
            
            # Deduplication — two-tier:
            # 1. Against sample questions (strict, 0.6 threshold) — prevent copying
            # 2. Against other generated questions (relaxed, 0.75 threshold) — allow structural variation
            unique_questions = []
            seen_texts = []
            from difflib import SequenceMatcher
            
            # Pre-populate with sample question texts (strict anti-copying)
            sample_texts = [sq.get('question_text', '') for sq in sample_questions if sq.get('question_text')]
            
            # Also include existing_texts from previous sub-batches for cross-batch dedup
            cross_batch_texts = list(existing_texts) if existing_texts else []
            
            for q in type_validated:
                q_text = q.get("question_text", "")
                if not q_text or len(q_text) < 5: continue
                
                is_dup = False
                
                # Check against sample questions (strict: 0.6)
                for st in sample_texts:
                    ratio = SequenceMatcher(None, q_text.lower(), st.lower()).ratio()
                    if ratio > 0.6:
                        is_dup = True
                        logger.info(f"Dedup: Too similar to sample question (ratio={ratio:.2f}): {q_text[:60]}")
                        break
                
                # Check against cross-batch texts (moderate: 0.7)
                if not is_dup:
                    for cbt in cross_batch_texts:
                        ratio = SequenceMatcher(None, q_text.lower(), cbt.lower()).ratio()
                        if ratio > 0.7:
                            is_dup = True
                            logger.info(f"Dedup: Too similar to previous batch (ratio={ratio:.2f}): {q_text[:60]}")
                            break
                
                # Check against this batch's already-accepted questions (relaxed: 0.75)
                if not is_dup:
                    for seen in seen_texts:
                        ratio = SequenceMatcher(None, q_text.lower(), seen.lower()).ratio()
                        if ratio > 0.75:
                            is_dup = True
                            logger.info(f"Dedup: Too similar within batch (ratio={ratio:.2f}): {q_text[:60]}")
                            break
                
                if not is_dup:
                    unique_questions.append(q)
                    seen_texts.append(q_text)
            
            # Retry once if we got fewer valid questions than requested
            if len(unique_questions) < count:
                logger.warning(f"Only got {len(unique_questions)}/{count} valid {question_type} questions. Retrying for remaining...")
                try:
                    remaining = count - len(unique_questions)
                    retry_result = await self.llm_service.generate(
                        prompt=prompt + f"\n\nIMPORTANT: Generate {remaining} more {question_type} questions. Previous attempt was insufficient.",
                        model=config.GENERATION_MODEL,
                        temperature=0.8,
                        max_tokens=3000,
                        expect_json=True
                    )
                    if isinstance(retry_result, str):
                        try:
                            retry_result = json.loads(retry_result)
                        except (json.JSONDecodeError, TypeError):
                            retry_result = {}
                    
                    retry_questions = retry_result.get("questions", []) if isinstance(retry_result, dict) else []
                    for q in retry_questions:
                        q_text = q.get("question_text", "")
                        if not q_text or len(q_text) < 5: continue
                        # Type validation for retry
                        if question_type.lower() in ('mcq', 'multiple_choice'):
                            if not (q.get('options') and isinstance(q.get('options'), dict) and len(q.get('options', {})) >= 3):
                                continue
                        is_dup = any(SequenceMatcher(None, q_text.lower(), s.lower()).ratio() > 0.75 for s in seen_texts)
                        if not is_dup:
                            unique_questions.append(q)
                            seen_texts.append(q_text)
                            if len(unique_questions) >= count:
                                break
                except Exception as retry_err:
                    logger.warning(f"Retry generation failed: {retry_err}")
            
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
        question_type: str,
        filename: str = None
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
                file_path=filename
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
    
    # ===== ACTION 4: Unified Batch Generation (Multi-Type) =====
    async def generate_mixed_batch(
        self,
        db: Session,
        subject_id: int,
        topic_id: int,
        specs: List[Dict], # [{type, count, marks, difficulty}]
        pre_retrieved_context: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate multiple question types in ONE LLM call.
        1. Retrieve context (if not provided)
        2. Construct Unified Prompt
        3. Call LLM
        4. Parse and return questions (NOT saved to DB here, separate step)
        """
        logger.info(f"Generating mixed batch for topic {topic_id}: {specs}")

        # 1. Get topic metadata
        topic = await self._get_topic_with_cos(db, subject_id, topic_id)
        
        subject = db.query(database.Subject).filter(database.Subject.id == subject_id).first()
        subject_name = subject.name if subject else "Subject"

        # 2. Context
        if pre_retrieved_context:
            context = pre_retrieved_context
        else:
            context = self.rag_service.retrieve_context(
                query_text=topic['name'],
                subject_id=str(subject_id),
                n_results=10, # Deeper context for mixed generation
                topic_id=str(topic_id)
            )

        # 3. Build Distribution Text for Prompt
        # Example: 
        # - 5 MCQ question(s) (1 marks each)
        # - 2 Short Answer question(s) (5 marks each)
        distribution_lines = []
        total_questions = 0
        overall_difficulty = "medium"
        
        for s in specs:
            distribution_lines.append(f"- {s['count']} {s['type']} question(s) ({s.get('marks', 1)} marks)")
            total_questions += s['count']
            overall_difficulty = s.get('difficulty', overall_difficulty)

        distribution_text = "\n".join(distribution_lines)

        # 4. Construct Prompt
        from ..prompts.generation_prompts import UNIFIED_GENERATION_PROMPT, get_bloom_instruction_for_difficulty
        
        co_str = ", ".join(topic['co_mappings']) or "CO1"
        lo_str = ", ".join(topic['lo_mappings']) or "LO1"
        
        # Get per-question Bloom assignments based on difficulty and total count
        bloom_guidance = get_bloom_instruction_for_difficulty(overall_difficulty, total_questions)
        
        # Add diversity seed
        import random
        diversity_seed = random.choice([
            "Focus on clinical application scenarios",
            "Focus on comparative analysis (differences/similarities)", 
            "Focus on cause-and-effect relationships",
            "Focus on diagnostic reasoning and steps",
            "Focus on treatment planning and contraindications", 
            "Focus on mechanism of action and underlying principles"
        ])
        
        from ..prompts.generation_prompts import get_random_answer_letter
        prompt = UNIFIED_GENERATION_PROMPT.format(
            subject_name=subject_name,
            rag_context=context[:6000], 
            total_questions=total_questions,
            topic=topic['name'],
            distribution_text=distribution_text,
            difficulty=overall_difficulty,
            co=co_str,
            lo=lo_str,
            bloom_guidance=bloom_guidance,
            example_answer=get_random_answer_letter()
        )
        
        # Inject diversity instruction at the start
        prompt = f"GENERATION FOCUS: {diversity_seed}\n\n" + prompt
        
        # 5. Call LLM
        try:
            result = await self.llm_service.generate(
                prompt=prompt,
                model=config.GENERATION_MODEL, 
                temperature=0.7,
                max_tokens=4000, 
                expect_json=True
            )
            
            questions = result.get("questions", [])
            logger.info(f"Generated {len(questions)} questions in mixed batch")
            
            # Post-process: Ensure correct mapped CO/LO and types
            final_questions = []
            import re
            
            for q in questions:
                # Normalize type
                q_type = q.get("question_type", "mcq").lower()
                if "choice" in q_type: q_type = "mcq"
                elif "essay" in q_type or "long" in q_type: q_type = "essay"
                elif "short" in q_type: q_type = "short_answer"
                
                q_text = q.get("question_text", "")
                
                # Cleanup: Remove "Chapter X" or "Textbook" references
                if "Chapter" in q_text or "text" in q_text.lower():
                    q_text = re.sub(
                        r'(as (mentioned|described|stated) in (the )?(text|chapter|book)[\w\s,]*)',
                        '', q_text, flags=re.IGNORECASE
                    ).strip()
                    # Clean up any leading punctuation left behind
                    q_text = re.sub(r'^[,.\-]\s*', '', q_text).strip()
                    # Capitalize first letter
                    if q_text:
                        q_text = q_text[0].upper() + q_text[1:]
                    q["question_text"] = q_text

                # Normalize options for MCQs
                if q_type == "mcq" and "options" in q:
                    # Remove prefixes "A) " etc if present
                    opts = q["options"]
                    if isinstance(opts, dict):
                        new_opts = {}
                        for k, v in opts.items():
                             # Ensure value is string
                            val_str = str(v)
                            # Remove "A)", "A.", "(A)" prefix
                            clean_val = re.sub(r'^[\(]?[A-D][\)\.]\s*', '', val_str).strip()
                            new_opts[k] = clean_val
                        q["options"] = new_opts


                # Ensure CO/LO match request if missing
                if not q.get("mapped_co"): q["mapped_co"] = co_str
                if not q.get("mapped_lo"): q["mapped_lo"] = lo_str
                
                # Add RAG context for verification
                q["rag_context"] = json.dumps([context]) 
                
                final_questions.append(q)
                
            return {
                "questions": final_questions,
                "metadata": {
                    "topic": topic['name'],
                    "generated_at": datetime.now().isoformat()
                }
            }

        except Exception as e:
            logger.error(f"Unified generation failed: {e}", exc_info=True)
            # Fallback? No, just fail for now.
            return {"questions": [], "error": str(e)}

    async def _extract_text(self, file_path: str) -> str:
        """Extract text from file"""
        if file_path.lower().endswith('.pdf'):
            return self.pdf_parser.extract_text(file_path)
        elif file_path.lower().endswith('.docx'):
            return self.docx_parser.extract_text(file_path)
        else:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                return f.read()

    def _extract_skill_section(self, skill_text: str, question_type: str) -> str:
        """
        Extract only the relevant section from skill instructions to save context.
        Always includes global rules, but filters type-specific examples.
        """
        lines = skill_text.split('\n')
        relevant_lines = []
        
        # Always include Role, COs, LOs, and Key Rules
        in_relevant = False
        skip_until_next_heading = False
        
        for line in lines:
            # Always include top-level instructions and Rule sections
            if line.startswith('# ') or \
               line.startswith('## Role') or \
               line.startswith('## Course') or \
               line.startswith('## Learning') or \
               line.startswith('## Key Rules'):
                in_relevant = True
                skip_until_next_heading = False
                relevant_lines.append(line)
                continue
            
            # Check for specific question type sections
            qt_lower = question_type.lower()
            if '### MCQ' in line:
                if qt_lower in ('mcq', 'multiple_choice'):
                    in_relevant = True
                    skip_until_next_heading = False
                    relevant_lines.append(line)
                else:
                    skip_until_next_heading = True
                    in_relevant = False
                continue
            elif '### Short' in line:
                if qt_lower in ('short_answer', 'short'):
                    in_relevant = True
                    skip_until_next_heading = False
                    relevant_lines.append(line)
                else:
                    skip_until_next_heading = True
                    in_relevant = False
                continue
            elif '### Essay' in line:
                if qt_lower in ('essay', 'long_answer'):
                    in_relevant = True
                    skip_until_next_heading = False
                    relevant_lines.append(line)
                else:
                    skip_until_next_heading = True
                    in_relevant = False
                continue
            elif line.startswith('### ') and in_relevant:
                # We hit a different type section/unknown section
                # If we are already in relevant mode, this might be a subsection we want?
                # But if it looks like a type header, we should have caught it above.
                # Let's assume other H3s are generic and keep them if in_relevant.
                pass
            
            if in_relevant and not skip_until_next_heading:
                relevant_lines.append(line)
        
        result = '\n'.join(relevant_lines)
        # Limit to 1000 chars to save context window, but keep enough for rules
        return result[:1200]


topic_actions_service = TopicActionsService()
