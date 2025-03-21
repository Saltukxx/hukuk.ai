# app/core/config.py
from typing import List
from pydantic import field_validator  # Add this import
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Project info
    PROJECT_NAME: str = "Legal Document Generator"
    API_V1_STR: str = "/api/v1"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["*"]
    
    # Database
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "Saltukalp123"
    POSTGRES_DB: str = "legal_docs"
    DATABASE_URL: str = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_SERVER}/{POSTGRES_DB}"
    
    # Search (optional for now)
    ELASTICSEARCH_HOST: str | None = None
    PINECONE_API_KEY: str | None = None
    PINECONE_ENVIRONMENT: str | None = None
    
    # Security
    SECRET_KEY: str = "your-secret-key-here"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Use ConfigDict instead of Config class
    model_config = SettingsConfigDict(
        case_sensitive=True,
        env_file=".env",
        extra="allow"  # Allow extra fields
    )
    
    @field_validator("BACKEND_CORS_ORIGINS", mode='before')
    def assemble_cors_origins(cls, v: str | List[str]) -> List[str] | str:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

settings = Settings()