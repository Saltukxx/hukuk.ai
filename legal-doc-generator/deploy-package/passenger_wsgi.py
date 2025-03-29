"""
Passenger WSGI configuration for Hostinger
This file is required for Python applications running on Hostinger's shared hosting
"""

import sys, os

# Add your application directory to Python path
# This will need to be adjusted based on Hostinger's specific setup
INTERP = os.path.join(os.environ.get('HOME', ''), 'public_html', 'venv', 'bin', 'python3')
if sys.executable != INTERP:
    os.execl(INTERP, INTERP, *sys.argv)

# Add application directory to the Python path
sys.path.append(os.getcwd())

# Import your FastAPI application
from wsgi import app

# Wrap with WSGI middleware for compatibility with Passenger
from fastapi.middleware.wsgi import WSGIMiddleware
application = WSGIMiddleware(app) 