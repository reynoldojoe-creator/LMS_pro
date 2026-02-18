"""
Script to validate RAG indexing for all subjects.
Run from backend/: python -m scripts.validate_rag
"""
import chromadb
from chromadb.config import Settings
import os

chroma_path = os.path.join(os.getcwd(), "data", "chroma_data")
client = chromadb.PersistentClient(
    path=chroma_path, 
    settings=Settings(anonymized_telemetry=False)
)

print("=== RAG Validation Report ===\n")

# List all collections
collections = client.list_collections()
print(f"Total collections: {len(collections)}\n")

for col in collections:
    collection = client.get_collection(col.name)
    count = collection.count()
    print(f"Collection: {col.name}")
    print(f"  Documents: {count}")
    
    if count > 0:
        # Peek at first 3 documents
        peek = collection.peek(limit=3)
        for i, doc in enumerate(peek['documents']):
            meta = peek['metadatas'][i] if peek['metadatas'] else {}
            preview = doc[:100].replace('\n', ' ')
            print(f"  Sample {i+1}: [{meta.get('source', 'unknown')}] {preview}...")
        
        # Check avg chunk length
        all_docs = collection.get()
        lengths = [len(d) for d in all_docs['documents']]
        avg_len = sum(lengths) / len(lengths)
        min_len = min(lengths)
        max_len = max(lengths)
        print(f"  Chunk stats: avg={avg_len:.0f}, min={min_len}, max={max_len} chars")
    print()

print("=== End Report ===")
