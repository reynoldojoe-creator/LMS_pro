"""
Re-index a subject's documents in ChromaDB with page-level metadata.
Usage: python reindex_subject.py <subject_id>
"""
import sys
import os
import glob
import chromadb

# Make sure app modules are importable
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.rag_service import RAGService

def reindex_subject(subject_id: str):
    rag = RAGService()

    # 1. Delete the old collection
    collection_name = f"subject_{subject_id}"
    try:
        client = chromadb.PersistentClient(path="data/chroma_data")
        existing = [c.name for c in client.list_collections()]
        if collection_name in existing:
            client.delete_collection(collection_name)
            print(f"✅ Deleted old collection: {collection_name}")
        else:
            print(f"ℹ️  No existing collection '{collection_name}' found")
    except Exception as e:
        print(f"⚠️  Error deleting collection: {e}")

    # 2. Find all document files for this subject
    base_dirs = [
        f"data/subjects/SUBJ{subject_id}",
        f"data/subjects/{subject_id}",
    ]
    
    pdf_files = []
    for base in base_dirs:
        if os.path.isdir(base):
            for ext in ("*.pdf", "*.docx", "*.txt"):
                pdf_files.extend(glob.glob(os.path.join(base, "**", ext), recursive=True))
    
    if not pdf_files:
        print(f"❌ No documents found for subject {subject_id}")
        print(f"   Searched: {base_dirs}")
        return

    print(f"\n📄 Found {len(pdf_files)} documents to re-index:")
    for f in pdf_files:
        print(f"   • {os.path.basename(f)}")

    # 3. Re-index each file
    for filepath in pdf_files:
        try:
            print(f"\n🔄 Indexing: {os.path.basename(filepath)}...")
            rag.index_document(filepath, subject_id)
            print(f"   ✅ Done")
        except Exception as e:
            print(f"   ❌ Error: {e}")

    # 4. Verify
    try:
        client = chromadb.PersistentClient(path="data/chroma_data")
        col = client.get_collection(collection_name)
        count = col.count()
        peek = col.peek(limit=3)
        print(f"\n🎉 Re-indexing complete! Collection '{collection_name}' has {count} chunks")
        
        if peek and peek.get("metadatas"):
            sample_meta = peek["metadatas"][0]
            has_page = "page_number" in sample_meta
            print(f"   page_number present: {'✅ Yes' if has_page else '❌ No'}")
            print(f"   Sample metadata: {sample_meta}")
    except Exception as e:
        print(f"⚠️  Verify error: {e}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python reindex_subject.py <subject_id>")
        print("Example: python reindex_subject.py 12")
        sys.exit(1)
    
    subject_id = sys.argv[1]
    print(f"🔧 Re-indexing subject {subject_id} with page-level metadata...\n")
    reindex_subject(subject_id)
