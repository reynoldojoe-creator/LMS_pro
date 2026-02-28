
import ollama
import asyncio
from typing import Optional, Dict, Any
import json
import re
import logging
from .. import config

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LLMService:
    _model_cache = {}  # Class-level cache for loaded models status (simplified)

    def __init__(self):
        self.client = ollama.AsyncClient(host=config.OLLAMA_BASE_URL)
        self.primary_model = config.PRIMARY_MODEL
        self.fallback_model = config.FALLBACK_MODEL
        
    async def query(self, prompt: str, model: str = None, max_tokens: int = 300, temperature: float = 0.7, timeout: int = 30, format: str = None) -> str:
        """
        Query with timeout, retry, and performance options.
        """
        model = model or self.primary_model
        
        # Performance options
        options = {
            'num_predict': max_tokens,
            'temperature': temperature,
            'num_thread': config.OLLAMA_NUM_THREAD,
            'num_ctx': config.OLLAMA_CONTEXT_SIZE,
        }

        # For JSON requests with qwen models, disable thinking mode
        # This covers qwen2.5, qwen3, and any future qwen variants
        actual_prompt = prompt
        if format == "json" and "qwen" in (model or "").lower():
            actual_prompt = prompt + "\n/no_think"

        for attempt in range(3):
            try:
                response = await asyncio.wait_for(
                    self.client.generate(
                        model=model,
                        prompt=actual_prompt,
                        options=options,
                        format=format,
                        stream=False
                    ),
                    timeout=timeout
                )
                raw = response['response']
                # Strip any residual <think>...</think> tags (closed or unclosed)
                cleaned = re.sub(r'<think>[\s\S]*?</think>', '', raw)
                # Also handle unclosed <think> (model ran out of tokens mid-thinking)
                cleaned = re.sub(r'<think>[\s\S]*$', '', cleaned)
                cleaned = cleaned.strip()
                
                if not cleaned and raw:
                    logger.warning(f"Response was entirely thinking block ({len(raw)} chars). Stripping failed.")
                    # Try to extract JSON from inside the thinking block as last resort
                    json_in_think = re.search(r'\{[\s\S]*\}', raw)
                    if json_in_think:
                        cleaned = json_in_think.group(0)
                        logger.info(f"Recovered JSON from thinking block ({len(cleaned)} chars)")
                
                return cleaned
            except asyncio.TimeoutError:
                logger.warning(f"Timeout querying {model} (attempt {attempt+1}/3)")
                if attempt == 2:
                    raise
                await asyncio.sleep(2 ** attempt)
            except Exception as e:
                logger.error(f"Error querying {model}: {e}")
                if attempt == 2:
                    raise
                await asyncio.sleep(1)

    async def generate(
        self,
        prompt: str,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        expect_json: bool = True,
        retry_on_fail: bool = True,
        format: str = None 
    ) -> Dict[str, Any]:
        """
        Generate response with:
        1. Primary model attempt
        2. JSON parsing and validation
        3. Automatic retry with fallback model if needed
        """
        model = model or self.primary_model
        
        try:
            text = await self.query(
                prompt=prompt,
                model=model,
                max_tokens=max_tokens,
                temperature=temperature,
                timeout=config.OLLAMA_TIMEOUT,
                format="json" if expect_json or format == "json" else None
            )
            
            if expect_json:
                if not text:
                    logger.error(f"Empty response from {model} — cannot parse JSON")
                    return {"questions": []}
                return self._parse_json_response(text)
            return {"text": text}
            
        except Exception as e:
            logger.error(f"Generation failed with {model}: {e}")
            if retry_on_fail and model != self.fallback_model and self.fallback_model != self.primary_model:
                logger.info(f"Retrying with fallback model: {self.fallback_model}")
                return await self.generate(
                    prompt=prompt,
                    model=self.fallback_model,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    expect_json=expect_json,
                    retry_on_fail=False,
                    format=format
                )
            raise
    
    def _parse_json_response(self, text: str) -> Dict:
        """
        Extract and parse JSON from LLM response.
        Handles:
        - JSON in code blocks
        - Partial JSON with trailing text
        - Common formatting errors
        - Truncated JSON (close open brackets/braces)
        - Qwen3 <think> tags (shouldn't reach here but just in case)
        """
        original_text = text
        
        # Extra safety: strip any residual <think> tags
        text = re.sub(r'<think>[\s\S]*?</think>', '', text)
        text = re.sub(r'<think>[\s\S]*$', '', text)
        text = text.strip()
        
        if not text:
            logger.error(f"Empty text after cleaning. Original ({len(original_text)} chars): {original_text[:300]}...")
            return {"questions": []}
        
        # Try to find JSON in code blocks
        json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', text)
        if json_match:
            text = json_match.group(1)
        
        # Try to clean up non-JSON text if no blocks
        elif '{' in text:
             # Find first { and last }
             start = text.find('{')
             end = text.rfind('}')
             if start != -1 and end != -1:
                 text = text[start:end+1]
        
        # Parse
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            try:
                # Try to fix common issues
                text = text.replace("'", '"')  # Single to double quotes
                text = re.sub(r',\s*}', '}', text)  # Remove trailing commas
                text = re.sub(r',\s*]', ']', text)
                # Remove comments //
                text = re.sub(r'//.*', '', text)
                return json.loads(text)
            except json.JSONDecodeError:
                # Attempt truncated JSON repair
                repaired = self._repair_truncated_json(text)
                if repaired is not None:
                    logger.info("Recovered partial JSON from truncated LLM output")
                    return repaired
                logger.error(f"Failed to parse JSON. Raw text: {original_text[:200]}...")
                raise

    def _repair_truncated_json(self, text: str) -> Optional[Dict]:
        """
        Attempt to repair truncated JSON by finding the last complete question
        object and discarding any trailing incomplete data.
        Returns parsed dict or None if repair fails.
        """
        try:
            # Find the start of JSON
            start = text.find('{')
            if start == -1:
                return None
            text = text[start:]

            # Strategy: find the last complete "}" that closes a question object
            # by searching for `}, {` or `}]` patterns from right to left
            # and trimming everything after the last complete object.

            # Find all positions of `}` that could end a question object
            brace_positions = [i for i, c in enumerate(text) if c == '}']

            # Try from the last `}` backwards, attempting to close the outer structure
            for pos in reversed(brace_positions):
                candidate = text[:pos + 1]

                # Close any remaining open brackets/braces
                open_braces = candidate.count('{') - candidate.count('}')
                open_brackets = candidate.count('[') - candidate.count(']')

                # Remove trailing comma before closing
                candidate = candidate.rstrip().rstrip(',')

                candidate += ']' * max(0, open_brackets)
                candidate += '}' * max(0, open_braces)

                try:
                    result = json.loads(candidate)
                    if isinstance(result, dict) and 'questions' in result:
                        questions = result['questions']
                        if isinstance(questions, list) and len(questions) > 0:
                            return result
                except json.JSONDecodeError:
                    continue

            return None
        except Exception:
            return None

    async def check_model_available(self, model: str) -> bool:
        """Check if model is available in Ollama"""
        try:
            resp = await self.client.list()
            # ollama list returns {'models': [...]}
            models = resp.get('models', [])
            return any(m['name'].startswith(model) for m in models)
        except Exception as e:
            logger.error(f"Failed to check model availability: {e}")
            return False
    
    async def ensure_model(self, model: str):
        """Pull model if not available"""
        if not await self.check_model_available(model):
            logger.info(f"Pulling model {model}...")
            try:
                await self.client.pull(model)
                logger.info(f"Model {model} pulled successfully")
            except Exception as e:
                logger.error(f"Failed to pull model {model}: {e}")
                raise

    # Legacy wrapper for backward compatibility
    async def generate_response(self, prompt: str, model: str = None, stream: bool = False, options: Optional[Dict[str, Any]] = None) -> str:
        """
        Legacy wrapper.
        """
        model = model or self.primary_model
        return await self.query(prompt, model=model, max_tokens=options.get("num_predict", 1000) if options else 1000)

    async def chat_response(self, messages: list, model: str = None, stream: bool = False, options: Optional[Dict[str, Any]] = None) -> str:
        """
        Legacy wrapper for chat_response.
        """
        model = model or self.primary_model
        opts = options or {}
        
        try:
            response = await self.client.chat(
                model=model,
                messages=messages,
                options=opts
            )
            return response['message']['content']
        except Exception as e:
            logger.error(f"Chat failed: {e}")
            raise
