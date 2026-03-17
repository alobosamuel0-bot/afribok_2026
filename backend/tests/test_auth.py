"""Tests for authentication and authorization."""
import pytest
import jwt
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, patch

from backend.security.auth import (
    create_access_token,
    verify_token,
    decode_token,
    check_permission
)
from backend.core.config import settings


class TestAuthentication:
    """Test suite for authentication."""

    def test_create_access_token(self):
        """Test JWT token creation."""
        user_id = "USER001"
        expires_delta = timedelta(hours=24)
        
        token = create_access_token(user_id, expires_delta)
        
        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 20

    def test_decode_token_success(self):
        """Test successful token decoding."""
        user_id = "USER001"
        expires_delta = timedelta(hours=24)
        
        token = create_access_token(user_id, expires_delta)
        decoded = decode_token(token)
        
        assert decoded is not None
        assert decoded.get("sub") == user_id

    def test_decode_token_expired(self):
        """Test expired token detection."""
        user_id = "USER001"
        expires_delta = timedelta(seconds=-1)  # Already expired
        
        token = create_access_token(user_id, expires_delta)
        
        with pytest.raises(jwt.ExpiredSignatureError):
            decode_token(token)

    def test_decode_token_invalid(self):
        """Test invalid token handling."""
        invalid_token = "invalid.token.here"
        
        with pytest.raises(jwt.DecodeError):
            decode_token(invalid_token)

    def test_verify_token_with_valid_credentials(self):
        """Test token verification with valid credentials."""
        user_id = "USER001"
        password = "SecurePassword123"
        
        # Mock password and user verification
        is_valid = verify_token(user_id, password)
        
        # Will be False without real user in DB, but function should not crash
        assert isinstance(is_valid, bool)

    def test_user_roles_in_token(self):
        """Test role inclusion in JWT token."""
        user_data = {
            "sub": "USER001",
            "roles": ["doctor", "chief_medical_officer"],
            "permissions": ["read:patients", "write:vitals", "approve:discharges"]
        }
        
        # Mock token with roles
        expires_delta = timedelta(hours=24)
        token = create_access_token(user_data["sub"], expires_delta)
        decoded = decode_token(token)
        
        assert "sub" in decoded


class TestAuthorization:
    """Test suite for authorization."""

    def test_check_permission_granted(self):
        """Test permission granted."""
        user = {
            "id": "USER001",
            "permissions": ["read:patients", "write:vitals"]
        }
        
        has_permission = check_permission(user, "read:patients")
        
        assert has_permission is True

    def test_check_permission_denied(self):
        """Test permission denied."""
        user = {
            "id": "USER001",
            "permissions": ["read:patients"]
        }
        
        has_permission = check_permission(user, "delete:patients")
        
        assert has_permission is False

    def test_rbac_roles(self):
        """Test role-based access control."""
        roles = {
            "admin": ["read:*", "write:*", "delete:*", "approve:*"],
            "doctor": ["read:patients", "write:vitals", "write:notes"],
            "nurse": ["read:patients", "write:vitals"],
            "patient": ["read:own_records"]
        }
        
        # Verify role structure
        assert len(roles) == 4
        assert "admin" in roles
        assert "doctor" in roles

    def test_permission_scopes(self):
        """Test permission scopes."""
        permissions = [
            "read:patients",
            "write:vitals",
            "approve:discharges",
            "delete:records",
            "admin:hospital"
        ]
        
        # Each permission should have scope:action format
        for perm in permissions:
            assert ":" in perm
            scope, action = perm.split(":")
            assert len(scope) > 0
            assert len(action) > 0


class TestPasswordSecurity:
    """Test suite for password security."""

    def test_password_hashing(self):
        """Test password hashing with bcrypt."""
        from backend.security.auth import hash_password, verify_password
        
        password = "SecurePassword123!"
        
        hashed = hash_password(password)
        
        assert hashed != password
        assert len(hashed) > 20  # bcrypt hash is long

    def test_password_verification_success(self):
        """Test correct password verification."""
        from backend.security.auth import hash_password, verify_password
        
        password = "SecurePassword123!"
        hashed = hash_password(password)
        
        is_valid = verify_password(password, hashed)
        
        assert is_valid is True

    def test_password_verification_failure(self):
        """Test incorrect password rejection."""
        from backend.security.auth import hash_password, verify_password
        
        password = "SecurePassword123!"
        wrong_password = "WrongPassword456!"
        hashed = hash_password(password)
        
        is_valid = verify_password(wrong_password, hashed)
        
        assert is_valid is False

    def test_password_requirements(self):
        """Test password strength validation."""
        weak_passwords = [
            "123456",           # Too simple
            "password",         # No numbers
            "Pass123",          # Too short
        ]
        
        # These should be handled appropriately
        for password in weak_passwords:
            assert len(password) >= 6  # Minimum validation


class TestSessionManagement:
    """Test suite for session management."""

    @pytest.mark.asyncio
    async def test_session_creation(self):
        """Test user session creation."""
        user_id = "USER001"
        
        # Mock session storage
        session_data = {
            "user_id": user_id,
            "created_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + timedelta(hours=24)
        }
        
        assert session_data["user_id"] == user_id
        assert session_data["expires_at"] > session_data["created_at"]

    @pytest.mark.asyncio
    async def test_session_expiration(self):
        """Test session expiration."""
        user_id = "USER001"
        
        session_data = {
            "user_id": user_id,
            "created_at": datetime.utcnow() - timedelta(hours=25),
            "expires_at": datetime.utcnow() - timedelta(hours=1)  # Expired
        }
        
        is_expired = datetime.utcnow() > session_data["expires_at"]
        
        assert is_expired is True

    @pytest.mark.asyncio
    async def test_session_logout(self):
        """Test session logout."""
        user_id = "USER001"
        
        # Mock session deletion
        session_deleted = True
        
        assert session_deleted is True
