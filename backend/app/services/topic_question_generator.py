from sqlalchemy.orm import Session
from ..models.topic_question import TopicQuestion
from ..models.database import Topic, Subject
from .rag_service import RAGService
from .llm_service import LLMService
from .sample_vector_store import SampleVectorStore # New

import json


import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class TopicQuestionGenerator:
    def __init__(self):
        self.rag_service = RAGService()
        self.llm_service = LLMService()
        self.sample_store = SampleVectorStore()

    async def generate_questions(
        self, 
        db: Session, 
        topic_id: int, 
        count: int, 
        config: Dict[str, Any]
    ) -> List[TopicQuestion]:
        """
        Generates practice questions for a topic using RAG context.
        """
        # 1. Fetch Topic Context
        topic = db.query(Topic).filter(Topic.id == topic_id).first()
        if not topic:
            raise ValueError("Topic not found")
        
        subject = db.query(Subject).filter(Subject.id == topic.subject_id).first()
        
        # Get RAG context
        # We search for the topic name + subject name
        query = f"{topic.name} in {subject.name}"
        context_text = self.rag_service.retrieve_context(
            query_text=query,
            subject_id=str(subject.id),
            n_results=5
        )
        
        # 2. Retrieve Few-Shot Examples
        examples = self.sample_store.retrieve_similar(
            topic_id=topic_id,
            query=topic.name, # Or use difficulty as query/filter?
            k=3
        )
        
        example_text = ""
        if examples:
            formatted_examples = []
            for i, ex in enumerate(examples):
                formatted_examples.append(f"Example {i+1}:\n{ex.page_content}")
            example_text = "\n\n".join(formatted_examples)
            
        # 3. Build Prompt
        prompt = self._build_prompt(topic.name, subject.name, count, config, context_text, example_text)
        
        # 4. Generate with LLM
        response_text = await self.llm_service.query(
            prompt=prompt,
            max_tokens=2000,
            temperature=0.7,
            timeout=120
        )
        
        # 4. Parse Response
        questions_data = self._parse_response(response_text)
        
        # 5. Save to DB
        saved_questions = []
        for q_data in questions_data:
            tq = TopicQuestion(
                topic_id=topic_id,
                question_text=q_data.get("question_text"),
                question_type=q_data.get("question_type"),
                difficulty=q_data.get("difficulty"),
                bloom_level=q_data.get("bloom_level"),
                options=q_data.get("options"), # JSON or Dict
                correct_answer=q_data.get("correct_answer")
            )
            db.add(tq)
            saved_questions.append(tq)
            
        db.commit()
        return saved_questions

    def _build_prompt(self, topic_name: str, subject_name: str, count: int, config: Dict, context: str, examples: str = "") -> str:
        prompt = f"""
        You are an expert exam question generator.
        Generate {count} practice questions for:
        Topic: {topic_name}
        Subject: {subject_name}
        
        Configuration:
        - difficulty: {config.get('difficulty')}
        - question_types: {', '.join(config.get('question_types', []))}
        - bloom_levels: {', '.join(config.get('blooms_levels', []))}
        
        Context Material:
        {context}
        """
        
        if examples:
            prompt += f"""
            
            Few-Shot Examples (Follow this style):
            {examples}
            """
            
        prompt += """
        
        OUTPUT FORMAT (Strict JSON Array):
        [
            {
                "question_text": "...",
                "question_type": "MCQ" or "Short" or "Essay",
                "difficulty": "Easy" or "Medium" or "Hard",
                "bloom_level": "Remember",
                "options": {{"A": "...", "B": "..."}} (for MCQ only, else null),
                "correct_answer": "..."
            }}
        ]
        """
        return prompt

    def _parse_response(self, text: str) -> List[Dict]:
        try:
            # Clean markdown code blocks
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0]
            elif "```" in text:
                text = text.split("```")[1].split("```")[0]
                
            return json.loads(text.strip())
        except Exception as e:
            logger.error(f"Failed to parse LLM response: {e}")
            return []

topic_question_generator = TopicQuestionGenerator()
