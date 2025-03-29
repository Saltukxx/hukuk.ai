"""
WSGI entry point for Hostinger deployment
This file is used to start the FastAPI application on Hostinger's hosting service
"""

from app.main import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("wsgi:app", host="0.0.0.0", port=8000) 