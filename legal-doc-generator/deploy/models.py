from typing import Dict, List, Optional, Any, Union
from pydantic import BaseModel, Field

class DocumentRequest(BaseModel):
    template_name: str
    case_description: str
    case_category: str
    template_data: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None

class AIDocumentRequest(BaseModel):
    template_name: str
    case_description: str
    case_category: str
    template_data: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None

class LawReference(BaseModel):
    title: str
    content: str

class CourtDecision(BaseModel):
    court: str
    number: str
    content: str

class LegalAnalysis(BaseModel):
    relevant_laws: Optional[List[LawReference]] = None
    relevant_decisions: Optional[List[CourtDecision]] = None
    recommendations: Optional[str] = None

class DocumentResponse(BaseModel):
    document_id: str
    title: str
    document_type: str
    content: str
    metadata: Optional[Dict[str, Any]] = None
    analysis: Optional[LegalAnalysis] = None 