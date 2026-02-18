import os
import sys
from sentence_transformers import SentenceTransformer

# Add the backend directory to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.config import EMBEDDING_MODEL, EMBEDDING_MODEL_PATH

def download_embedding_model():
    """
    Downloads the embedding model to the local directory specified in config.
    """
    print(f"Checking for embedding model at: {EMBEDDING_MODEL_PATH}")
    
    if os.path.exists(EMBEDDING_MODEL_PATH):
        print(f"Model already exists at {EMBEDDING_MODEL_PATH}")
        return

    print(f"Downloading model {EMBEDDING_MODEL}...")
    try:
        model = SentenceTransformer(EMBEDDING_MODEL)
        os.makedirs(os.path.dirname(EMBEDDING_MODEL_PATH), exist_ok=True)
        model.save(EMBEDDING_MODEL_PATH)
        print(f"Model saved to {EMBEDDING_MODEL_PATH}")
    except Exception as e:
        print(f"Failed to download model: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # Ensure offline mode is OFF for download
    if 'HF_HUB_OFFLINE' in os.environ:
        del os.environ['HF_HUB_OFFLINE']
    if 'TRANSFORMERS_OFFLINE' in os.environ:
        del os.environ['TRANSFORMERS_OFFLINE']
        
    download_embedding_model()
