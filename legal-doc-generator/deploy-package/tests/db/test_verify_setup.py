# app/db/verify_setup.py
from sqlalchemy import inspect
from sqlalchemy import create_engine
from app.core.config import settings

def verify_setup():
    engine = create_engine(settings.DATABASE_URL)
    inspector = inspect(engine)
    
    print("\nDatabase tables:")
    for table_name in inspector.get_table_names():
        print(f"\n📋 Table: {table_name}")
        for column in inspector.get_columns(table_name):
            print(f"  └─ {column['name']}: {column['type']}")

if __name__ == "__main__":
    verify_setup()