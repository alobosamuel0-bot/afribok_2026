"""
Database Connection Management
Supports both local SQLite (offline) and central PostgreSQL (online)
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, AsyncEngine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool
from typing import Optional, AsyncGenerator
import structlog

from core.config import settings


logger = structlog.get_logger(__name__)


class DatabaseManager:
    """Manage database connections for offline-first architecture"""

    _local_engine: Optional[AsyncEngine] = None
    _central_engine: Optional[AsyncEngine] = None
    _local_session_factory: Optional[sessionmaker] = None
    _central_session_factory: Optional[sessionmaker] = None

    @classmethod
    async def init_local_db(cls):
        """Initialize local SQLite database for offline mode"""
        if cls._local_engine is not None:
            return

        logger.info("database.init_local", url=settings.LOCAL_DB_URL)

        cls._local_engine = create_async_engine(
            settings.LOCAL_DB_URL,
            echo=settings.DB_ECHO,
            future=True,
            connect_args={"timeout": 10},
        )

        cls._local_session_factory = sessionmaker(
            cls._local_engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autokommit=False,
            autoflush=False,
        )

    @classmethod
    async def init_central_db(cls):
        """Initialize central PostgreSQL database for online sync"""
        if cls._central_engine is not None or not settings.CENTRAL_DB_URL:
            return

        logger.info("database.init_central", url=settings.CENTRAL_DB_URL)

        cls._central_engine = create_async_engine(
            settings.CENTRAL_DB_URL,
            echo=settings.DB_ECHO,
            future=True,
            pool_size=settings.DB_POOL_SIZE,
            max_overflow=settings.DB_MAX_OVERFLOW,
            pool_pre_ping=True,
        )

        cls._central_session_factory = sessionmaker(
            cls._central_engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autocommit=False,
            autoflush=False,
        )

    @classmethod
    async def get_local_session(cls) -> AsyncGenerator[AsyncSession, None]:
        """Get local database session"""
        if cls._local_engine is None:
            await cls.init_local_db()

        async with cls._local_session_factory() as session:
            yield session

    @classmethod
    async def get_central_session(cls) -> AsyncGenerator[AsyncSession, None]:
        """Get central database session"""
        if not settings.CENTRAL_DB_URL:
            raise RuntimeError("CENTRAL_DB_URL not configured")

        if cls._central_engine is None:
            await cls.init_central_db()

        async with cls._central_session_factory() as session:
            yield session

    @classmethod
    async def close_all(cls):
        """Close all database connections"""
        if cls._local_engine:
            await cls._local_engine.dispose()
            logger.info("database.local_closed")

        if cls._central_engine:
            await cls._central_engine.dispose()
            logger.info("database.central_closed")


# Dependency injection functions
async def get_local_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency: Get local database session"""
    async for session in DatabaseManager.get_local_session():
        yield session


async def get_central_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency: Get central database session"""
    async for session in DatabaseManager.get_central_session():
        yield session
