#!/usr/bin/env python
"""
Prepare Deployment Package for Hostinger

This script creates a deployment package with all necessary files for 
hosting the FastAPI application on Hostinger.

Usage:
    python prepare_for_hostinger.py
"""

import os
import shutil
import sys
from pathlib import Path

# Directories and files to exclude from deployment
EXCLUDE_DIRS = [
    '.git',
    '__pycache__',
    'venv',
    '.pytest_cache',
    'legal_doc_generator.egg-info',
    'deploy-package',
    'deploy'
]

EXCLUDE_FILES = [
    '.gitignore',
    'Dockerfile',
    'docker-compose.yml',
    'setup.py',
    'clean_backend.ps1',
    'start_app.ps1',
    'run_app.ps1',
    'test_api.py',
    'test_gemini.py',
    'simple_google_ai_test.py',
    'requirements_full.txt'
]

def copy_files(src_dir, dest_dir, exclude_dirs=None, exclude_files=None):
    """Copy files from source to destination, excluding specified directories and files."""
    if exclude_dirs is None:
        exclude_dirs = []
    if exclude_files is None:
        exclude_files = []
    
    # Create destination directory if it doesn't exist
    os.makedirs(dest_dir, exist_ok=True)
    
    for item in os.listdir(src_dir):
        src_path = os.path.join(src_dir, item)
        dest_path = os.path.join(dest_dir, item)
        
        if os.path.isdir(src_path):
            if item not in exclude_dirs and not item.startswith('.') and not item.startswith('__'):
                copy_files(src_path, dest_path, exclude_dirs, exclude_files)
        else:
            if item not in exclude_files and not item.startswith('.'):
                shutil.copy2(src_path, dest_path)

def main():
    """Main function to prepare deployment package."""
    # Get the current script location
    script_dir = Path(__file__).parent.resolve()
    
    # Get the project root (one level up from script location)
    root_dir = script_dir.parent
    
    # Set deployment package directory
    deploy_package_dir = root_dir / 'deploy-package'
    
    # Create deployment package directory if it doesn't exist
    os.makedirs(deploy_package_dir, exist_ok=True)
    
    # Copy files excluding specified directories and files
    copy_files(root_dir, deploy_package_dir, EXCLUDE_DIRS, EXCLUDE_FILES)
    
    # Copy deployment-specific files
    shutil.copy2(root_dir / 'wsgi.py', deploy_package_dir / 'wsgi.py')
    shutil.copy2(root_dir / 'passenger_wsgi.py', deploy_package_dir / 'passenger_wsgi.py')
    shutil.copy2(root_dir / '.htaccess', deploy_package_dir / '.htaccess')
    shutil.copy2(root_dir / 'requirements-prod.txt', deploy_package_dir / 'requirements.txt')
    
    # Create empty .env file if it doesn't exist
    if os.path.exists(root_dir / '.env.production'):
        shutil.copy2(root_dir / '.env.production', deploy_package_dir / '.env')
    else:
        # Create a placeholder .env file
        with open(deploy_package_dir / '.env', 'w') as f:
            f.write('# Production environment variables\n')
            f.write('ENVIRONMENT=production\n')
    
    print(f"Deployment package created at {deploy_package_dir}")
    print("Remember to update the .env file with proper production values")

if __name__ == "__main__":
    main() 