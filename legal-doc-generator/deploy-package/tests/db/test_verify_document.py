# app/db/verify_document.py
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, select
from app.core.config import settings
from app.models.document import Document

def verify_documents():
    # Create engine and session
    engine = create_engine(settings.DATABASE_URL)
    session = Session(engine)

    try:
        # Query all documents
        stmt = select(Document)
        documents = session.execute(stmt).scalars().all()
        
        print("\nAll documents in database:")
        for doc in documents:
            print("\n📄 Document:")
            print(f"  └─ ID: {doc.id}")
            print(f"  └─ Title: {doc.title}")
            print(f"  └─ Type: {doc.document_type}")
            print(f"  └─ Metadata: {doc.doc_metadata}")
            print(f"  └─ Created: {doc.created_at}")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    verify_documents()