# app/db/test_document.py
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from app.core.config import settings
from app.models.document import Document

def test_create_document():
    # Create engine and session
    engine = create_engine(settings.DATABASE_URL)
    session = Session(engine)

    try:
        # Create a test document
        doc = Document(
            title="Test Document",
            content="This is a test document content.",
            document_type="test",
            doc_metadata={"type": "test", "version": "1.0"},
            references=[]
        )
        
        # Add and commit
        session.add(doc)
        session.commit()
        
        # Print the created document
        print("\nCreated document:")
        print(f"ID: {doc.id}")
        print(f"Title: {doc.title}")
        print(f"Created at: {doc.created_at}")
        
    except Exception as e:
        print(f"Error: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    test_create_document()