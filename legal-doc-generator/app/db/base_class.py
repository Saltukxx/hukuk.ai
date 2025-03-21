# app/db/base_class.py
from typing import Any
from sqlalchemy.ext.declarative import declared_attr
from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    """Base class for all database models"""
    
    id: Any
    __name__: str
    
    # Generate __tablename__ automatically
    @declared_attr
    def __tablename__(cls) -> str:
        """
        Automatically generates table name from class name
        Example: UserModel -> usermodel
        """
        return cls.__name__.lower()

    def dict(self) -> dict:
        """Convert model instance to dictionary"""
        return {
            column.name: getattr(self, column.name)
            for column in self.__table__.columns
        }

    def __repr__(self) -> str:
        """String representation of the model"""
        return f"<{self.__class__.__name__}(id={self.id})>"