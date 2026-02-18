from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Any

from ...services.sample_processor import sample_processor
from ..deps import get_db

router = APIRouter()

@router.post("/subjects/{subject_id}/upload-samples")
async def upload_sample_questions(
    subject_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
) -> Any:
    """
    Upload sample questions via CSV.
    """
    if not (file.filename.endswith('.csv') or file.filename.endswith('.xlsx') or file.filename.endswith('.xls')):
        raise HTTPException(status_code=400, detail="Only CSV and Excel files are allowed")
        
    try:
        content = await file.read()
        result = sample_processor.process_file(db, subject_id, content, file.filename)
        
        return JSONResponse(
            status_code=200 if result["status"] == "success" else 207, # 207 Multi-Status if partial
            content=result
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")
