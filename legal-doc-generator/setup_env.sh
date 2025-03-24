#!/bin/bash

echo "Setting up Gemini API key..."

# If API key is provided as argument, use it
if [ ! -z "$1" ]; then
    export GEMINI_API_KEY="$1"
    echo "Using provided API key"
else
    # Prompt user for API key
    echo "Please enter your Gemini API key:"
    read -p "API Key: " API_KEY
    
    if [ ! -z "$API_KEY" ]; then
        export GEMINI_API_KEY="$API_KEY"
    fi
fi

# Verify API key was provided
if [ -z "$GEMINI_API_KEY" ]; then
    echo "No API key provided. Will run in mock mode."
fi

# Start the server
echo "Starting server..."
cd legal-doc-generator
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 