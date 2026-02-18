
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
        
        # Add format if specified (e.g. "json")
        if format:
            options['format'] = format

        for attempt in range(3):
            try:
                # We use asyncio.wait_for for timeout since Ollama client might not support it directly per request
                response = await asyncio.wait_for(
                    self.client.generate(
                        model=model,
                        prompt=prompt,
                        options=options,
                        format=format, # Pass format to generate call
                        stream=False
                    ),
                    timeout=timeout
                )
                return response['response']
            except asyncio.TimeoutError:
                logger.warning(f"Timeout querying {model} (attempt {attempt+1}/3)")
                if attempt == 2:
                    raise
                await asyncio.sleep(2 ** attempt) # Exponential backoff
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
            # Check capabilities
            # (Simplified for now)

            text = await self.query(
                prompt=prompt,
                model=model,
                max_tokens=max_tokens,
                temperature=temperature,
                timeout=config.OLLAMA_TIMEOUT,
                format="json" if expect_json or format == "json" else None
            )
            
            if expect_json:
                return self._parse_json_response(text)
            return {"text": text}
            
        except Exception as e:
            logger.error(f"Generation failed with {model}: {e}")
            if retry_on_fail and model != self.fallback_model:
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
        """
        original_text = text
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
                logger.error(f"Failed to parse JSON. Raw text: {original_text[:200]}...")
                raise

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
