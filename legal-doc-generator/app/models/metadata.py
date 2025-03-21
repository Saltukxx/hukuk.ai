from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class DocumentMetadata(BaseModel):
    court: Optional[str] = None
    decision_date: Optional[datetime] = None
    law_section: Optional[str] = None
    keywords: List[str] = Field(default_factory=list)
    category: str
    language: str = "tr"
    source: Optional[str] = None
    jurisdiction: Optional[str] = None
    document_number: Optional[str] = None
    confidence_score: Optional[float] = None
    processing_status: str = "pending"
    last_processed: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "court": "Yargıtay",
                "decision_date": "2024-01-15T00:00:00",
                "law_section": "Ceza Hukuku",
                "keywords": ["ceza", "hırsızlık", "temyiz"],
                "category": "Ceza Davaları",
                "language": "tr",
                "jurisdiction": "Turkey",
                "document_number": "2024/123",
                "confidence_score": 0.95,
                "processing_status": "completed"
            }
        }