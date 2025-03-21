# app/services/template_manager.py
from typing import Dict, Any, Optional, List
import json
import os
from pathlib import Path
from jinja2 import Environment, FileSystemLoader, select_autoescape
from datetime import datetime

class TemplateManager:
    """Manages document templates and their data"""
    
    def __init__(self):
        self.template_dir = Path("app/templates")
        self.template_dir.mkdir(parents=True, exist_ok=True)
        
        # Setup Jinja2 environment
        self.env = Environment(
            loader=FileSystemLoader(str(self.template_dir)),
            autoescape=select_autoescape(['html', 'xml']),
            trim_blocks=True,
            lstrip_blocks=True
        )
        
        # Load template metadata
        self.templates_meta = self._load_template_metadata()

    def _load_template_metadata(self) -> Dict[str, Any]:
        """Load metadata for all templates"""
        meta_file = self.template_dir / "templates_meta.json"
        if meta_file.exists():
            return json.loads(meta_file.read_text(encoding='utf-8'))
        return {}

    def get_template_schema(self, template_name: str) -> Dict[str, Any]:
        """Get the required fields schema for a template"""
        return self.templates_meta.get(template_name, {}).get('schema', {})

    def validate_template_data(self, template_name: str, data: Dict[str, Any]) -> List[str]:
        """Validate template data against schema"""
        schema = self.get_template_schema(template_name)
        errors = []
        
        for field, field_info in schema.items():
            if field_info.get('required', False) and field not in data:
                errors.append(f"Missing required field: {field}")
            
            if field in data:
                field_type = field_info.get('type', 'str')
                if not self._validate_field_type(data[field], field_type):
                    errors.append(f"Invalid type for field {field}: expected {field_type}")
        
        return errors

    def _validate_field_type(self, value: Any, expected_type: str) -> bool:
        """Validate field type"""
        type_checks = {
            'str': lambda x: isinstance(x, str),
            'int': lambda x: isinstance(x, int),
            'float': lambda x: isinstance(x, (int, float)),
            'date': lambda x: isinstance(x, (str, datetime)),
            'dict': lambda x: isinstance(x, dict),
            'list': lambda x: isinstance(x, list)
        }
        return type_checks.get(expected_type, lambda x: True)(value)