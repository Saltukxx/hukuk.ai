@echo off
echo Setting up Gemini API key...

REM If API key is provided as argument, use it
if not "%~1"=="" (
    set GEMINI_API_KEY=%~1
    echo Using provided API key
) else (
    REM Prompt user for API key
    echo Please enter your Gemini API key:
    set /p GEMINI_API_KEY=API Key: 
)

REM Verify API key was provided
if "%GEMINI_API_KEY%"=="" (
    echo No API key provided. Will run in mock mode.
)

REM Start the server
echo Starting server...
cd legal-doc-generator
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

pause 