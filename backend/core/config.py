"""
Afribok Core Configuration
Centralized settings for the entire application
"""

from pydantic_settings import BaseSettings
from typing import Optional, List
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # ============= APP =============
    APP_NAME: str = "Afribok"
    APP_VERSION: str = "2026.1.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"

    # ============= DATABASE =============
    LOCAL_DB_URL: str = "sqlite+aiosqlite:///./data/afribok_local.db"
    CENTRAL_DB_URL: Optional[str] = None
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 10
    DB_ECHO: bool = False

    # ============= REDIS/CACHE =============
    REDIS_URL: str = "redis://localhost:6379/0"
    CACHE_TTL: int = 600

    # ============= SECURITY =============
    JWT_SECRET_KEY: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24
    OTP_EXPIRATION_MINUTES: int = 10
    OTP_LENGTH: int = 6
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]

    # ============= FILES =============
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 100

    # ============= SYNC =============
    SYNC_ENABLED: bool = True
    SYNC_INTERVAL_SECONDS: int = 300
    SYNC_BATCH_SIZE: int = 1000
    OFFLINE_MODE: bool = False

    # ============= ML/AI =============
    ML_MODEL_PATH: str = "./models"
    PREDICTION_CACHE_TTL: int = 3600
    ENABLE_PREDICTIONS: bool = True

    # ============= ALERTS =============
    ALERT_ENABLED: bool = True
    ALERT_CAPACITY_THRESHOLD: float = 0.85
    ALERT_EMAIL_ENABLED: bool = False
    ALERT_SMS_ENABLED: bool = False

    # ============= EXTERNAL SERVICES =============
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_PHONE_NUMBER: Optional[str] = None
    SMTP_SERVER: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None

    # ============= MONITORING =============
    SENTRY_DSN: Optional[str] = None
    STORE_AUDIT_LOGS: bool = True
    AUDIT_LOG_DIR: str = "./logs"

    # ============= PERFORMANCE =============
    ENABLE_RESPONSE_CACHING: bool = True
    ENABLE_QUERY_OPTIMIZATION: bool = True
    DATABASE_SLOW_QUERY_THRESHOLD_MS: int = 1000

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# Global settings instance
settings = Settings()


# Validation
if not settings.JWT_SECRET_KEY or settings.JWT_SECRET_KEY == "change-me-in-production":
    if settings.ENVIRONMENT == "production":
        raise ValueError("JWT_SECRET_KEY must be set in production!")


def get_settings() -> Settings:
    """Get application settings"""
    return settings
