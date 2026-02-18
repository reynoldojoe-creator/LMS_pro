from functools import lru_cache
import hashlib
import logging
from typing import Any, Callable
from ..models.council_result import CouncilResult

logger = logging.getLogger(__name__)

class CouncilCache:
    def __init__(self):
        self._cache = {} # Simple in-memory cache
    
    def get_cache_key(self, question_text: str, question_type: str, blooms_level: str) -> str:
        """Generate hash of question content"""
        # Normalize content to avoid cache misses on whitespace
        content = f"{question_text.strip()}:{question_type}:{blooms_level}"
        return hashlib.md5(content.encode()).hexdigest()
    
    async def get_or_evaluate(
        self,
        question_text: str,
        question_type: str,
        blooms_level: str,
        evaluator_func: Callable,
        *args, **kwargs
    ) -> CouncilResult:
        cache_key = self.get_cache_key(question_text, question_type, blooms_level)
        
        if cache_key in self._cache:
            logger.info("Council cache hit")
            return self._cache[cache_key]
        
        logger.info("Council cache miss - evaluating")
        result = await evaluator_func(*args, **kwargs)
        
        self._cache[cache_key] = result
        return result

council_cache = CouncilCache()
