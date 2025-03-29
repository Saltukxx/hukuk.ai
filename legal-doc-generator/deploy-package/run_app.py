"""
Run the FastAPI application
"""

import uvicorn
import os

# Create required directories
os.makedirs("app/logs", exist_ok=True)
os.makedirs("app/output", exist_ok=True)

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True) 