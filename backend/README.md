# LMS-SIMATS Backend

Backend service for the LMS-SIMATS exam question generation system.

## Setup

1.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

2.  **Offline Configuration**:
    The system is configured to run fully offline.
    - `HF_HUB_OFFLINE=1`: Sentence Transformers will use cached models.
    - `LLM_MODEL`: Defaults to `phi3.5:latest` (or `llama3.2:3b`).

3.  **Ollama Setup**:
    The backend uses the local Ollama service to run the LLM.
    **Ollama must be running** to access your locally installed models.
    ```bash
    ollama serve
    ```

## Running the API

Start the FastAPI server:
```bash
uvicorn backend.app.main:app --reload
```
The API will be available at `http://localhost:8000`.
Swagger UI documentation is available at `http://localhost:8000/docs`.

## API Endpoints

### `POST /upload-syllabus`
Uploads a syllabus file (PDF or DOCX) to the RAG system.
- **Parameters**: `file` (UploadFile), `subject_id` (string)
- **Response**: JSON with status and message.

### `POST /query`
Queries the RAG system.
- **Body**:
    ```json
    {
        "question": "What is the time complexity of binary search?",
        "subject_id": "CS301",
        "n_results": 5
    }
    ```
- **Response**: JSON with `answer` (from LLM) and `sources` (retrieved chunks).

## Test Data (Phase 2.5)

Comprehensive test data is available in `backend/data/test_data/`.

## Testing

You can run the verification script to test the full pipeline:
```bash
python3 scripts/verify_rag_endpoints.py
```
*Note: Ensure the local LLM is responsive. First request may be slow.*
