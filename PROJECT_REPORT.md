# LMS-SIMATS: Project Technical Report

This report provides a comprehensive overview of the LMS-SIMATS project, detailing the technical architecture, RAG implementation, AI configuration, and application flow.

---

## 1. Overall Logic and Architecture

The application is built as a **Learning Management System (LMS)** specifically designed for automated assessment generation and quality control (vetting).

### High-Level Architecture
- **Frontend**: React Native (Expo) mobile application with role-based access control (Faculty and Vetter).
- **Backend**: FastAPI (Python) orchestration layer.
- **Database**: SQLite (SQLAlchemy ORM) for relational data and batches.
- **Vector DB**: Chroma DB for Retrieval-Augmented Generation (RAG).
- **AI Engine**: Ollama running local LLMs (Qwen2.5 and Llama3.2).

### Core Orchestration
- **`GenerationManager`**: Manages asynchronous generation tasks, ensuring only one batch runs at a time to respect memory constraints (8GB RAM optimization).
- **`TopicActionsService`**: The primary business logic layer that coordinates parsing, indexing, and the complex question generation pipeline.

---

## 2. RAG (Retrieval-Augmented Generation) Implementation

The system implements a sophisticated RAG pipeline to ensure generated questions are grounded in specific textbook material.

### Data Ingestion Pipeline
1. **Extraction**: `PDFParser` and `DocxParser` extract text with **page-awareness**, ensuring provenance (linking questions back to specific pages).
2. **Chunking**: Uses `RecursiveCharacterTextSplitter` with a specific chunk size optimized for educational content.
3. **Noise Filtering**: A custom noise detector (`Chunker.is_noisy_chunk`) filters out boilerplate text, headers, and footers before indexing.
4. **Embedding**: Generates vectors using the `nomic-embed-text` model via Ollama.

### Advanced Retrieval Strategy
- **MMR (Maximal Marginal Relevance)**: Instead of simple similarity search, the system uses MMR to ensure a diverse set of context chunks, avoiding redundant information in the prompt.
- **Dynamic Subtopic Extraction**: For a single topic, the LLM first identifies 8-12 distinct sub-concepts. It then performs **separate RAG queries** for each sub-topic. This ensures that a batch of 10 questions doesn't all come from the first three pages of a chapter.

---

## 3. Model Configuration

The system is configured for **high reliability and offline capability**.

- **Primary Model**: `qwen2.5:7b`
    - Chosen for its superior reasoning capabilities and world-class JSON formatting reliability.
    - Used for the primary generation, syllabus extraction, and complex validation.
- **Fallback Model**: `llama3.2:3b`
    - used for faster operations and as an automatic fallback if the 7B model fails or times out.
- **Optimizations**:
    - **Context Window**: Hard-capped at 8192 tokens to balanced performance and memory.
    - **Prompt Engineering**: Uses `/no_think` injection for Qwen models to enforce direct JSON output without internal reasoning blocks cluttering the response.
    - **JSON Repair**: A robust `_repair_truncated_json` utility handles partial LLM outputs by closing open brackets and extracting the last valid object.

---

## 4. Generation Prompts (Rules & Constraints)

The system uses highly structured prompts based on educational theory and quality standards.

### Bloom's Taxonomy Integration
Questions are mapped to **Bloom's Levels (K1-K6)**:
- **K1-K2 (Easy)**: Focus on direct recall and understanding.
- **K3 (Medium)**: Focus on application (short scenarios).
- **K4-K5 (Hard)**: Focus on analysis and evaluation (complex clinical vignettes with patient measurements).

### Blueprinting (Few-Shot Learning)
The system uses **Structural Blueprints** extracted from faculty-uploaded sample questions. It replicates the *architecture* of a good question (e.g., "Clinical Vignette with Measurements") without copying the actual medical content.

### The Validation & Correction Loop
To ensure "No Bad Questions," the system employs a 3-layer check:
1. **Programmatic Pre-filter**: Instantly rejects questions with "banned" phrases (e.g., "None of the above," "Focus solely on").
2. **LLM Quality Review**: A second LLM pass checks for factual accuracy, ambiguity, and distractor quality.
3. **Self-Correction**: If a question fails validation, the system sends the feedback back to the LLM to "fix" the specific issues (e.g., "Replace weak distractor D with a plausible clinical error").

---

## 5. Frontend Flow (The User Experience)

The app's flow is specialized by user role.

### Faculty Flow
1. **Subject Setup**: Faculty upload a syllabus PDF; the AI extracts Units and Topics into a structured tree.
2. **Material Indexing**: Faculty upload textbooks or notes to specific Topics. The system chunks and indexes them into the RAG vector store.
3. **Rubric Creation**: Define the blueprint for an assessment (e.g., "20 MCQs, 5 Short Answers, 2 Essays").
4. **Generation**: Triggers the `GenerationManager`. Faculty can watch real-time progress as batches are created.
5. **Question Bank**: Explore all generated and approved questions, filtered by Topic or Bloom's level.

### Vetter Flow
1. **Review Queue**: Vetters see a dashboard of pending batches.
2. **Vetting Interface**: Questions are presented one-by-one with full context (RAG source + explanation).
3. **Actions**:
    - **Approve**: Moves question to the subject's final bank.
    - **Reject**: Removes the question (requires reason).
    - **Quarantine**: Marks for further review/correction.
4. **Analytics**: Track batch progress and overall quality metrics.

---

*This report encompasses the current state of the LMS-SIMATS project as of February 28, 2026.*
