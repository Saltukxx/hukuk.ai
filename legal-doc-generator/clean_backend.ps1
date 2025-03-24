# Clean up backend files script
# This script removes backend Python files while preserving frontend assets

# Delete main Python files in the app root
Remove-Item -Path "app\main.py" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "app\background_tasks.py" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "app\document_generator.py" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "app\test_endpoint.py" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "app\__init__.py" -Force -ErrorAction SilentlyContinue

# Delete API-related files
Remove-Item -Path "app\api" -Recurse -Force -ErrorAction SilentlyContinue

# Delete database-related files
Remove-Item -Path "app\db" -Recurse -Force -ErrorAction SilentlyContinue

# Delete model files
Remove-Item -Path "app\models" -Recurse -Force -ErrorAction SilentlyContinue

# Delete schema files
Remove-Item -Path "app\schemas" -Recurse -Force -ErrorAction SilentlyContinue

# Delete service files
Remove-Item -Path "app\services" -Recurse -Force -ErrorAction SilentlyContinue

# Delete utils files
Remove-Item -Path "app\utils" -Recurse -Force -ErrorAction SilentlyContinue

# Delete core files
Remove-Item -Path "app\core" -Recurse -Force -ErrorAction SilentlyContinue

# Create minimal directory structure for new implementation
New-Item -ItemType Directory -Path "app\services" -Force
New-Item -ItemType Directory -Path "app\schemas" -Force
New-Item -ItemType Directory -Path "app\utils" -Force

# Create an empty __init__.py file
"" | Out-File -FilePath "app\__init__.py" -Encoding utf8

Write-Host "Backend files have been cleaned up. Ready for new implementation!" 