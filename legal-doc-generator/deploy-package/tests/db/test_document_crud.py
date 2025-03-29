# tests/db/test_document_crud.py
import pytest
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from app.core.config import settings
from app.models.document import Document

@pytest.fixture
def db_session():
    engine = create_engine(settings.DATABASE_URL)
    session = Session(engine)
    try:
        yield session
    finally:
        session.close()

def test_create_and_read_document(db_session):
    # Create document
    doc = Document(
        title="Test CRUD",
        content="Testing Create and Read operations",
        document_type="test",
        doc_metadata={"operation": "crud_test"},
        references=[]
    )
    db_session.add(doc)
    db_session.commit()
    
    # Read document
    read_doc = db_session.query(Document).filter_by(id=doc.id).first()
    assert read_doc is not None
    assert read_doc.title == "Test CRUD"
    
def test_update_document(db_session):
    # Create document
    doc = Document(
        title="Original Title",
        content="Original content",
        document_type="test",
        doc_metadata={"version": "1.0"},
        references=[]
    )
    db_session.add(doc)
    db_session.commit()
    
    # Update document
    doc.title = "Updated Title"
    db_session.commit()
    
    # Verify update
    updated_doc = db_session.query(Document).filter_by(id=doc.id).first()
    assert updated_doc.title == "Updated Title"
    
def test_delete_document(db_session):
    # Create document
    doc = Document(
        title="To be deleted",
        content="This document will be deleted",
        document_type="test",
        doc_metadata={},
        references=[]
    )
    db_session.add(doc)
    db_session.commit()
    
    # Delete document
    db_session.delete(doc)
    db_session.commit()
    
    # Verify deletion
    deleted_doc = db_session.query(Document).filter_by(id=doc.id).first()
    assert deleted_doc is None