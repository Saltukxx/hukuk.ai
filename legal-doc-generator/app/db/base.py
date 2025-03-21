# app/db/base.py
from app.db.base_class import Base  # This must be imported first
from app.models.document import Document  # Then import the models

# This file is used to import all models
# so that Alembic can detect them when creating migrations