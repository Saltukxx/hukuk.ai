# C:\Users\satog\OneDrive\Desktop\Hukuk.AI\legal-doc-generator\app\db\test_connection.py
from sqlalchemy import create_engine
from app.core.config import settings

def test_connection():
    try:
        engine = create_engine(settings.DATABASE_URL)
        with engine.connect() as connection:
            print("Successfully connected to the database!")
    except Exception as e:
        print(f"Error connecting to the database: {e}")

if __name__ == "__main__":
    test_connection()