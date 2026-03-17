"""
Structured Logging Configuration for Afribok
Uses structlog for consistent, parseable logs
"""

import logging
import structlog
from pathlib import Path


def setup_logging(log_level: str = "INFO"):
    """Configure structured logging"""

    # Create logs directory
    Path("./logs").mkdir(exist_ok=True)

    # Configure structlog
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.processors.JSONRenderer(),
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )

    # Configure Python logging
    logging.basicConfig(
        format="%(message)s",
        level=getattr(logging, log_level.upper()),
        handlers=[
            logging.StreamHandler(),
            logging.FileHandler("./logs/afribok.log"),
        ],
    )


def get_logger(name: str):
    """Get a logger instance"""
    return structlog.get_logger(name)
