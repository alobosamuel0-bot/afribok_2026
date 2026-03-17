"""Pytest configuration and fixtures."""
import pytest
from datetime import datetime
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from unittest.mock import AsyncMock, MagicMock

from backend.db.models import Base
from backend.core.config import settings


@pytest.fixture
async def db_engine():
    """Create test database engine."""
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        echo=False,
        future=True
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest.fixture
async def db_session(db_engine):
    """Create test database session."""
    async_session = sessionmaker(
        db_engine,
        class_=AsyncSession,
        expire_on_commit=False
    )
    async with async_session() as session:
        yield session
        await session.rollback()


@pytest.fixture
def sample_hospital():
    """Sample hospital data."""
    return {
        "hospital_id": "HOSP001",
        "name": "Test Hospital",
        "location": "Test City",
        "capacity": 100,
        "created_at": datetime.utcnow()
    }


@pytest.fixture
def sample_patient():
    """Sample patient data."""
    return {
        "hospital_id": "HOSP001",
        "first_name": "John",
        "last_name": "Doe",
        "national_id": "ID123456",
        "external_id": "P001",
        "age": 45,
        "gender": "M",
        "disease": ["Hypertension"],
        "chronic_conditions": ["Diabetes"],
        "emergency_contact": "+1234567890",
        "status": "admitted"
    }


@pytest.fixture
def sample_vitals():
    """Sample vital signs data."""
    return {
        "temperature": 37.5,
        "heart_rate": 75,
        "systolic_bp": 120,
        "diastolic_bp": 80,
        "oxygen_saturation": 98,
        "respiratory_rate": 16,
        "recorded_at": datetime.utcnow()
    }


@pytest.fixture
def mock_redis():
    """Mock Redis client."""
    redis_mock = AsyncMock()
    redis_mock.get = AsyncMock(return_value=None)
    redis_mock.set = AsyncMock(return_value=True)
    redis_mock.delete = AsyncMock(return_value=1)
    redis_mock.hgetall = AsyncMock(return_value={})
    redis_mock.expire = AsyncMock(return_value=True)
    return redis_mock


@pytest.fixture
def mock_jwt_token():
    """Generate mock JWT token."""
    return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMjAyNiIsImV4cCI6OTk5OTk5OTk5OX0.test_signature"


@pytest.fixture
def auth_headers(mock_jwt_token):
    """Authorization headers with JWT token."""
    return {"Authorization": f"Bearer {mock_jwt_token}"}


@pytest.fixture
def sync_queue_item():
    """Sample sync queue item."""
    return {
        "entity": "patient",
        "operation": "create",
        "local_id": "L001",
        "server_id": None,
        "data": {
            "first_name": "Jane",
            "last_name": "Smith",
            "age": 30,
            "disease": ["Asthma"]
        },
        "status": "pending",
        "retry_count": 0,
        "created_at": datetime.utcnow(),
        "last_retry_at": None
    }


@pytest.fixture
def audit_log_item():
    """Sample audit log item."""
    return {
        "user_id": "USER001",
        "action": "patient_admitted",
        "entity": "patient",
        "entity_id": "P001",
        "old_data": None,
        "new_data": {
            "first_name": "John",
            "status": "admitted"
        },
        "hospital_id": "HOSP001",
        "timestamp": datetime.utcnow()
    }
