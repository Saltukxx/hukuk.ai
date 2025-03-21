from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class DocumentMetadata(BaseModel):
    court: Optional[str] = None
    decision_date: Optional[datetime] = None
    law_section: Optional[str] = None
    keywords: List[str] = []
    category: str
    language: str = "tr"

class DocumentBase(BaseModel):
    title: str
    document_type: str
    metadata: DocumentMetadata

class DocumentCreate(DocumentBase):
    pass

class DocumentResponse(DocumentBase):
    id: str
    content: str
    references: List[str] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class DocumentList(BaseModel):
    documents: List[DocumentResponse]
    total: int