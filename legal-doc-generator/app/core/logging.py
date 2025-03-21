import logging
import sys
from typing import Any, Dict
from loguru import logger
import json

class InterceptHandler(logging.Handler):
    def emit(self, record: logging.LogRecord) -> None:
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno

        frame, depth = logging.currentframe(), 2
        while frame.f_code.co_filename == logging.__file__:
            frame = frame.f_back
            depth += 1

        logger.opt(depth=depth, exception=record.exc_info).log(
            level, record.getMessage()
        )

class CustomJSONFormatter:
    def __init__(
        self,
        *,
        keywords: list[str] = None,
        indent: int = None,
        ensure_ascii: bool = True,
        sort_keys: bool = False,
    ) -> None:
        self.keywords = keywords or []
        self.indent = indent
        self.ensure_ascii = ensure_ascii
        self.sort_keys = sort_keys

    def __call__(self, record: Dict[str, Any]) -> str:
        log_record = {
            "timestamp": record["time"].strftime("%Y-%m-%d %H:%M:%S"),
            "level": record["level"].name,
            "message": record["message"],
            "module": record["name"],
        }

        if "exception" in record:
            log_record["exception"] = record["exception"]

        return json.dumps(
            log_record,
            indent=self.indent,
            ensure_ascii=self.ensure_ascii,
            sort_keys=self.sort_keys,
        )

def setup_logging() -> None:
    # Remove all existing handlers
    logging.root.handlers = []
    
    # Set logging level for all third-party modules
    logging.root.setLevel(logging.INFO)
    
    # Add interceptor for standard library logging
    logging.root.addHandler(InterceptHandler())
    
    # Configure loguru
    logger.configure(
        handlers=[
            {
                "sink": sys.stdout,
                "format": CustomJSONFormatter(),
                "level": "INFO",
            },
            {
                "sink": "logs/error.log",
                "format": CustomJSONFormatter(),
                "level": "ERROR",
                "rotation": "500 MB",
                "retention": "1 week",
            }
        ]
    )

    # Intercept standard library logging
    for _log in ["uvicorn", "uvicorn.error", "fastapi"]:
        _logger = logging.getLogger(_log)
        _logger.handlers = [InterceptHandler()]

    return logger