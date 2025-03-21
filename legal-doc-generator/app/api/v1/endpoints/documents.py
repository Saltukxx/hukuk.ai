from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
from app.schemas.document import DocumentResponse, DocumentList
from datetime import datetime
import uuid

router = APIRouter()

@router.post("/", response_model=DocumentResponse)
async def upload_document(file: UploadFile = File(...)):
    """
    Upload a new legal document (PDF)
    """
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    # Mock response for now
    return DocumentResponse(
        id=str(uuid.uuid4()),
        title=file.filename,
        document_type="COURT_DECISION",
        content="Sample content",
        metadata={
            "category": "Criminal",
            "language": "tr",
            "keywords": []
        },
        references=[],
        created_at=datetime.now(),
        updated_at=datetime.now()
    )

@router.get("/", response_model=DocumentList)
async def list_documents(skip: int = 0, limit: int = 10):
    """
    List all documents with pagination
    """
    # Mock response for now
    return DocumentList(
        documents=[],
        total=0
    )

@router.get("/{document_id}")
async def get_document(document_id: str):
    """
    Get a specific document by ID
    """
    return {"document_id": document_id}