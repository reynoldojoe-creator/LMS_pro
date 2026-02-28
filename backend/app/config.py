"""
Model configuration for LMS-SIMATS
"""

import os

# Offline Configuration
os.environ['HF_HUB_OFFLINE'] = '1'
os.environ['TRANSFORMERS_OFFLINE'] = '1'

# Primary model — qwen2.5:7b for strong reasoning + reliable JSON
PRIMARY_MODEL = "qwen2.5:7b"

# Generation model (question generation)
GENERATION_MODEL = "qwen2.5:7b"

# Extraction model (syllabus parsing)
EXTRACTION_MODEL = "qwen2.5:7b"

# Fallback model (use llama3.2:3b as fallback — fast + lightweight)
FALLBACK_MODEL = "llama3.2:3b"
FAST_GENERATION_MODEL = "qwen2.5:7b"

# Semantic model (for structure detection/textbook processing)
SEMANTIC_MODEL = "qwen2.5:7b"

# Upskill Models
UPSKILL_MODEL = "qwen2.5:7b"
CHAIRMAN_MODEL = "qwen2.5:7b"

# Performance settings — tuned for qwen2.5:7b
OLLAMA_NUM_THREAD = 6  # Optimized for M2 Air (8 cores)
OLLAMA_CONTEXT_SIZE = 8192  # qwen2.5 supports up to 32k, 8k is safe for RAM
MAX_TOKENS = 2000  # 7B model can generate longer, more complete JSON
TEMPERATURE = 0.7

# Legacy aliases for backward compatibility
LLM_MODEL = PRIMARY_MODEL
FAST_LLM_MODEL = GENERATION_MODEL

# Model capabilities
MODEL_CAPABILITIES = {
    "qwen2.5:7b": {
        "max_context": 32768,
        "json_reliable": True,
        "best_for": ["mcq", "short_answer", "essay", "reasoning", "extraction"],
        "avg_tokens_per_second": 25,
    },
    "llama3.2:3b": {
        "max_context": 128000, 
        "json_reliable": True,
        "best_for": ["mcq", "short_answer", "fast_generation"],
        "avg_tokens_per_second": 50,
    },
    "qwen2.5:3b": {
        "max_context": 32768,
        "json_reliable": True,
        "best_for": ["mcq", "short_answer", "essay", "reasoning"],
        "avg_tokens_per_second": 35,  
    },
}

# Generation settings
GENERATION_SETTINGS = {
    "mcq": {
        "temperature": 0.7,
        "max_tokens": 1500,
        "model": GENERATION_MODEL
    },
    "short_answer": {
        "temperature": 0.8,
        "max_tokens": 2000,
        "model": GENERATION_MODEL
    },
    "essay": {
        "temperature": 0.9,
        "max_tokens": 3000,
        "model": GENERATION_MODEL
    }
}

# Ollama settings
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
LLM_BASE_URL = OLLAMA_BASE_URL # Legacy alias
OLLAMA_TIMEOUT = 600  # 10 minutes — 7B model needs more time

# RAG Configuration
EMBEDDING_MODEL = "nomic-embed-text"
EMBEDDING_MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "ml_models", "all-MiniLM-L6-v2")
CHROMA_DB_PATH = "data/chroma_data"
# RAG Configuration Paths (for clarity/compatibility)
RAG_VECTOR_DB_PATH = CHROMA_DB_PATH
CHUNKS_METADATA_PATH = "data/chroma_data/chroma.sqlite3"
UPLOAD_DIR = "data/temp_uploads"

DIFFICULTY_LEVELS = ['easy', 'medium', 'hard']
