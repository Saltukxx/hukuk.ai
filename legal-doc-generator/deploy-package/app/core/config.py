"""
Configuration settings for the legal document generator application.
"""

import os
from typing import Optional
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
# Look for .env file in project root
env_path = Path(__file__).resolve().parent.parent.parent / '.env'
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
    print(f"Loaded environment variables from {env_path}")
else:
    load_dotenv()  # Try to load from default locations
    print("No .env file found at root, attempting to load from default locations")

# Base directories
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
APP_DIR = ROOT_DIR / "app"
OUTPUT_DIR = APP_DIR / "output"
LOGS_DIR = APP_DIR / "logs"
DATA_DIR = APP_DIR / "data"

# Ensure directories exist
OUTPUT_DIR.mkdir(exist_ok=True)
LOGS_DIR.mkdir(exist_ok=True)
DATA_DIR.mkdir(exist_ok=True)

# Application settings
APP_NAME = "Hukuk.AI Legal Document Generator"
APP_VERSION = "1.0.0"
DEBUG = os.getenv("DEBUG", "False").lower() in ("true", "1", "t")

# API Keys
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if GEMINI_API_KEY:
    print("Gemini API key found in environment variables")
else:
    print("Warning: No Gemini API key found in environment variables")

# API Settings
API_USE_MOCK_DATA = os.getenv("API_USE_MOCK_DATA", "False").lower() in ("true", "1", "t")

# Logging configuration
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOG_FILE = LOGS_DIR / "app.log"

# Document generation settings
DEFAULT_TEMPLATE = DATA_DIR / "templates" / "default_template.docx"
MAX_FILE_SIZE_MB = 10

# Function to get the API key safely
def get_gemini_api_key() -> Optional[str]:
    """
    Returns the Gemini API key if available
    
    Returns:
        Optional[str]: The API key or None if not configured
    """
    return GEMINI_API_KEY if GEMINI_API_KEY else None 