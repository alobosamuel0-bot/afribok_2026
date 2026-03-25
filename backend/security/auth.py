"""
Security & Authentication Module
HIPAA/GDPR compliant authentication and authorization
"""

from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
import structlog
import random
import string
from core.config import settings


logger = structlog.get_logger(__name__)

# In-memory OTP store (In production, use Redis)
otp_store = {}


def generate_otp(length: int = 6) -> str:
    """Generate a numeric OTP"""
    return "".join(random.choices(string.digits, k=length))


def store_otp(identifier: str, otp: str):
    """Store OTP with expiration"""
    expires_at = datetime.utcnow() + timedelta(minutes=settings.OTP_EXPIRATION_MINUTES)
    otp_store[identifier] = {"otp": otp, "expires_at": expires_at}


def verify_otp(identifier: str, otp: str) -> bool:
    """Verify OTP and check expiration"""
    if identifier not in otp_store:
        return False
    
    stored = otp_store[identifier]
    if datetime.utcnow() > stored["expires_at"]:
        del otp_store[identifier]
        return False
    
    if stored["otp"] == otp:
        del otp_store[identifier]
        return True
    
    return False

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token", scopes={
    "read": "Read patient data",
    "write": "Write patient data",
    "admin": "Admin access"
})


# ============= PASSWORD UTILITIES =============

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash password"""
    return pwd_context.hash(password)


# ============= JWT UTILITIES =============

def create_access_token(
    data: dict,
    expires_delta: Optional[timedelta] = None,
    scopes: list = None
) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRATION_HOURS)
    
    to_encode.update({"exp": expire, "scopes": scopes or []})
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    
    return encoded_jwt


def decode_token(token: str) -> dict:
    """Decode and validate JWT token"""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError as e:
        logger.error("token_decode_error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"}
        )


# ============= ROLE-BASED ACCESS CONTROL =============

class User:
    """Current user from JWT"""
    def __init__(
        self,
        user_id: str,
        username: str,
        email: str,
        role: str,
        hospital_id: Optional[int] = None,
        scopes: list = None
    ):
        self.user_id = user_id
        self.username = username
        self.email = email
        self.role = role  # admin, doctor, nurse, receptionist, patient
        self.hospital_id = hospital_id
        self.scopes = scopes or []

    def has_scope(self, scope: str) -> bool:
        """Check if user has scope"""
        return scope in self.scopes

    def is_admin(self) -> bool:
        return self.role == "admin"

    def is_clinician(self) -> bool:
        return self.role in ["doctor", "nurse", "clinician"]

    def is_patient(self) -> bool:
        return self.role == "patient"


async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    """Get current user from token"""
    payload = decode_token(token)
    
    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )
    
    # TODO: Load user details from database
    # For now, we'll construct from payload
    
    user = User(
        user_id=user_id,
        username=payload.get("username", ""),
        email=payload.get("email", ""),
        role=payload.get("role", "patient"),
        hospital_id=payload.get("hospital_id"),
        scopes=payload.get("scopes", [])
    )
    
    logger.info("user_authenticated", user_id=user_id, role=user.role)
    
    return user


def check_permission(required_role: str):
    """Require specific role"""
    async def verify_role(user: User = Depends(get_current_user)):
        if user.role != required_role and not user.is_admin():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires {required_role} role"
            )
        return user
    return verify_role


def check_scope(required_scope: str):
    """Require specific scope"""
    async def verify_scope(user: User = Depends(get_current_user)):
        if not user.has_scope(required_scope):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Missing required scope: {required_scope}"
            )
        return user
    return verify_scope


# ============= AUDIT & TRACEABILITY =============

def audit_action(
    user: User,
    action: str,
    resource: str,
    details: dict = None,
    ip_address: str = None
):
    """Log action for audit trail"""
    logger.info(
        "audit_action",
        user_id=user.user_id,
        role=user.role,
        action=action,
        resource=resource,
        details=details,
        ip_address=ip_address
    )


# ============= ENCRYPTION UTILITIES =============

def encrypt_sensitive_data(data: str) -> str:
    """Encrypt sensitive data (PII)"""
    # TODO: Implement proper encryption with Fernet
    # This is a placeholder
    return data


def decrypt_sensitive_data(encrypted_data: str) -> str:
    """Decrypt sensitive data"""
    # TODO: Implement proper decryption
    # This is a placeholder
    return encrypted_data
