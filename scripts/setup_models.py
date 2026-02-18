
"""
Script to set up required models for LMS-SIMATS
"""

import ollama
import sys
import os

# Add backend to path for config import
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))
from app import config

REQUIRED_MODELS = [
    config.PRIMARY_MODEL,
    config.FALLBACK_MODEL
]

def setup_models():
    # client = ollama.Client(host=config.OLLAMA_BASE_URL)
    # Using default client or specific host if needed. 
    # ollama python lib checks OLLAMA_HOST env var, config uses OLLAMA_BASE_URL.
    
    print(f"Connecting to Ollama at {config.OLLAMA_BASE_URL}...")
    client = ollama.Client(host=config.OLLAMA_BASE_URL)
    
    print("Checking and pulling required models...")
    
    for model in REQUIRED_MODELS:
        try:
            # Check if exists (list models and check name)
            models_resp = client.list()
            # print(f"DEBUG: list response type: {type(models_resp)}")
            # print(f"DEBUG: list response: {models_resp}")
            
            # Handle both dict and object response
            models = []
            if hasattr(models_resp, 'models'):
                raw_models = models_resp.models
            elif isinstance(models_resp, dict) and 'models' in models_resp:
                raw_models = models_resp['models']
            else:
                raw_models = []

            for m in raw_models:
                # Check if object or dict
                name = getattr(m, 'model', getattr(m, 'name', None))
                if not name and isinstance(m, dict):
                    name = m.get('name') or m.get('model')
                
                if name:
                    models.append(name)

            
            # Simple check if model name starts with the required model string
            # e.g. "qwen2.5:7b" matches "qwen2.5:7b" or "qwen2.5:7b-instruct..."
            # Adjust match logic if needed.
            
            found = False
            for m in models:
                if m.startswith(model):
                    found = True
                    break
            
            if found:
                print(f"✓ {model} already available")
            else:
                print(f"↓ Pulling {model}...")
                # Pull (streaming=True to see progress if supported, but simple pull is fine)
                client.pull(model)
                print(f"✓ {model} downloaded")
                
        except Exception as e:
            print(f"Error checking/pulling {model}: {e}")

    print("\nAll models ready!")
    
    # Quick test
    print("\nTesting generation...")
    try:
        response = client.generate(
            model=REQUIRED_MODELS[0],
            prompt="Generate a simple MCQ about Python. Respond in JSON format with question, options (A,B,C,D), and correct_answer fields.",
            options={"temperature": 0.7, "num_predict": 200}
        )
        print(f"Test response:\n{response['response'][:300]}...")
    except Exception as e:
        print(f"Test generation failed: {e}")

if __name__ == "__main__":
    setup_models()
