# Legal Document Generator Application Startup Script
# This script sets up the environment and starts the application

# Navigate to script directory
cd $PSScriptRoot

# Ensure necessary directories exist
New-Item -ItemType Directory -Force -Path "app/logs"
New-Item -ItemType Directory -Force -Path "app/data"

# Check if dependencies have been installed before
$dependenciesFlag = "app/.dependencies_installed"

if (-not (Test-Path $dependenciesFlag)) {
    # Install required packages
    Write-Host "First run or dependencies not installed. Installing required packages..." -ForegroundColor Green
    pip install -r requirements.txt
    
    # Create the flag file to indicate dependencies are installed
    New-Item -ItemType File -Force -Path $dependenciesFlag
} else {
    Write-Host "Dependencies already installed. Skipping installation." -ForegroundColor Green
}

# Initialize database if it doesn't exist
if (-not (Test-Path "app/data/legal_database.db")) {
    Write-Host "Initializing database..." -ForegroundColor Green
    python -c "from app.services.legal_database_service import LegalDatabaseService; import asyncio; db = LegalDatabaseService(); asyncio.run(db.populate_sample_data())"
}

# Start the application
Write-Host "Starting the application..." -ForegroundColor Green
python -m uvicorn app.main:app --reload 