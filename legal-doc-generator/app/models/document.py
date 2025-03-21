# app/models/document.py
from sqlalchemy import Column, String, DateTime, JSON, Text
from sqlalchemy.sql import func
from app.db.base_class import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    title = Column(String, index=True, nullable=False)
    content = Column(Text, nullable=False)
    document_type = Column(String, nullable=False)
    doc_metadata = Column(JSON, nullable=False)  # Changed from metadata to doc_metadata
    references = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "content": self.content,
            "document_type": self.document_type,
            "metadata": self.doc_metadata,  # Note: we still return it as metadata in the dict
            "references": self.references,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }