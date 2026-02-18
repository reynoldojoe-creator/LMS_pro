"""
Model configuration for LMS-SIMATS
"""

import os

# Offline Configuration
os.environ['HF_HUB_OFFLINE'] = '1'
os.environ['TRANSFORMERS_OFFLINE'] = '1'

# Primary model (largest, best quality — use when RAM allows)
PRIMARY_MODEL = "qwen2.5:3b"

# Generation model (question generation — good balance of quality & RAM)
GENERATION_MODEL = "qwen2.5:3b"

# Extraction model (syllabus parsing — fast, good at structured output)
# Using Qwen 2.5 1.5B for better structured output
EXTRACTION_MODEL = "qwen2.5:1.5b"

# Fallback model (smallest usable)
FALLBACK_MODEL = "qwen2.5:1.5b"
FAST_GENERATION_MODEL = "qwen2.5:1.5b"

# Semantic model (for structure detection/textbook processing)
SEMANTIC_MODEL = "qwen2.5:3b"

# Upskill Models
UPSKILL_MODEL = "qwen2.5:3b"
CHAIRMAN_MODEL = "qwen2.5:3b"

# Performance settings
OLLAMA_NUM_THREAD = 6  # Optimized for M2 Air (8 cores)
OLLAMA_CONTEXT_SIZE = 2048 # Keep moderate for speed
MAX_TOKENS = 800 
TEMPERATURE = 0.7

# Legacy aliases for backward compatibility
LLM_MODEL = PRIMARY_MODEL
FAST_LLM_MODEL = GENERATION_MODEL

# Model capabilities
MODEL_CAPABILITIES = {
    "llama3.2:1b": {
        "max_context": 128000, 
        "json_reliable": True,
        "best_for": ["mcq", "short_answer", "essay", "extraction"],
        "avg_tokens_per_second": 50,
    },
    "qwen2.5:3b": {
        "max_context": 32768,
        "json_reliable": True,
        "best_for": ["mcq", "short_answer", "essay", "reasoning"],
        "avg_tokens_per_second": 35,  
    },
    "qwen2.5:1.5b": {
        "max_context": 32768,
        "json_reliable": True,
        "best_for": ["extraction", "fast_generation"],
        "avg_tokens_per_second": 55,
    }
}

# Generation settings
GENERATION_SETTINGS = {
    "mcq": {
        "temperature": 0.7,
        "max_tokens": 1000,
        "model": GENERATION_MODEL
    },
    "short_answer": {
        "temperature": 0.8,
        "max_tokens": 1500,
        "model": GENERATION_MODEL
    },
    "essay": {
        "temperature": 0.9,
        "max_tokens": 2500,
        "model": GENERATION_MODEL
    }
}

# Ollama settings
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
LLM_BASE_URL = OLLAMA_BASE_URL # Legacy alias
OLLAMA_TIMEOUT = 120  # Reduced to 2 minutes for faster fail/retry

# RAG Configuration
EMBEDDING_MODEL = "nomic-embed-text"
EMBEDDING_MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "ml_models", "all-MiniLM-L6-v2")
CHROMA_DB_PATH = "backend/data/chroma_data"
# RAG Configuration Paths (for clarity/compatibility)
RAG_VECTOR_DB_PATH = CHROMA_DB_PATH
CHUNKS_METADATA_PATH = "backend/data/chroma_data/chroma.sqlite3" # Chroma stores metadata internally
UPLOAD_DIR = "backend/data/temp_uploads"

DIFFICULTY_LEVELS = ['easy', 'medium', 'hard']
