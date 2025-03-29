"""
Database connection setup for Hostinger deployment
This file configures SQLAlchemy to connect to the MySQL database on Hostinger
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get database credentials from environment
DB_USER = os.getenv("POSTGRES_USER", "default_user")
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD", "default_password")
DB_HOST = os.getenv("POSTGRES_SERVER", "localhost")
DB_NAME = os.getenv("POSTGRES_DB", "default_db")

# Check if we have a full DATABASE_URL
DATABASE_URL = os.getenv("DATABASE_URL")

# If no explicit URL, construct it
if not DATABASE_URL:
    # Check if we're on production (Hostinger) to use MySQL
    if os.getenv("ENVIRONMENT") == "production":
        DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}"
    else:
        # Default to PostgreSQL for development
        DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}"

# Create SQLAlchemy engine and session
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for SQLAlchemy models
Base = declarative_base()

# Dependency function to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 