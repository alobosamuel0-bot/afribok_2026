"""
Data Validation & Error Handling
Comprehensive validation for patient safety
"""

from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime
import re


# ============= RESPONSES =============

class APIResponse(BaseModel):
    """Standard API response"""
    status: str = "success"
    data: dict = None
    message: str = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ErrorResponse(BaseModel):
    """Error response"""
    status: str = "error"
    error: str
    message: str
    details: Optional[dict] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# ============= VALIDATORS =============

class PatientValidator:
    """Validate patient data for safety"""

    @staticmethod
    def validate_age(age: int) -> bool:
        """Validate reasonable age"""
        return 0 <= age <= 150

    @staticmethod
    def validate_phone(phone: str) -> bool:
        """Validate phone number format"""
        pattern = r'^[\d\+\-\(\)\s]+$'
        return bool(re.match(pattern, phone)) and len(phone.replace(" ", "")) >= 10

    @staticmethod
    def validate_national_id(national_id: str) -> bool:
        """Validate national ID format"""
        # This varies by country - implement based on requirements
        return len(national_id) >= 5

    @staticmethod
    def validate_vitals(vitals: dict) -> tuple[bool, list]:
        """Validate patient vital signs"""
        errors = []

        temp = vitals.get("temperature_celsius")
        if temp is not None:
            if temp < 35.0 or temp > 42.0:
                errors.append("Temperature out of reasonable range (35-42°C)")

        hr = vitals.get("heart_rate")
        if hr is not None:
            if hr < 30 or hr > 200:
                errors.append("Heart rate out of reasonable range (30-200 BPM)")

        rr = vitals.get("respiratory_rate")
        if rr is not None:
            if rr < 8 or rr > 60:
                errors.append("Respiratory rate out of reasonable range (8-60)")

        spo2 = vitals.get("oxygen_saturation")
        if spo2 is not None:
            if spo2 < 50 or spo2 > 100:
                errors.append("Oxygen saturation out of range (50-100%)")

        return len(errors) == 0, errors

    @staticmethod
    def validate_allergies(allergies: str) -> bool:
        """Validate allergy format"""
        if not allergies:
            return True
        # CSV format: "Penicillin,Aspirin,Latex"
        items = [a.strip() for a in allergies.split(",")]
        return all(len(item) > 0 and len(item) < 100 for item in items)


# ============= CUSTOM EXCEPTIONS =============

class AfribokException(Exception):
    """Base Afribok exception"""
    def __init__(self, message: str, code: str = "ERR_UNKNOWN", status_code: int = 500):
        self.message = message
        self.code = code
        self.status_code = status_code
        super().__init__(self.message)


class PatientNotFoundError(AfribokException):
    """Patient not found"""
    def __init__(self, patient_id: int):
        super().__init__(
            f"Patient {patient_id} not found",
            "ERR_PATIENT_NOT_FOUND",
            404
        )


class DuplicateAdmissionError(AfribokException):
    """Patient already admitted"""
    def __init__(self, patient_id: int):
        super().__init__(
            f"Patient {patient_id} already admitted",
            "ERR_DUPLICATE_ADMISSION",
            409
        )


class NoBedAvailableError(AfribokException):
    """No bed available"""
    def __init__(self, hospital_id: int):
        super().__init__(
            f"No beds available in hospital {hospital_id}",
            "ERR_NO_BEDS_AVAILABLE",
            503
        )


class ValidationError(AfribokException):
    """Data validation error"""
    def __init__(self, message: str, field: str = None):
        super().__init__(
            f"Validation error: {message}",
            "ERR_VALIDATION",
            400
        )
        self.field = field


class AuthenticationError(AfribokException):
    """Authentication failed"""
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message, "ERR_AUTHENTICATION", 401)


class AuthorizationError(AfribokException):
    """Not authorized"""
    def __init__(self, message: str = "Not authorized"):
        super().__init__(message, "ERR_AUTHORIZATION", 403)


class SyncError(AfribokException):
    """Synchronization error"""
    def __init__(self, message: str):
        super().__init__(message, "ERR_SYNC_FAILED", 500)


class DatabaseError(AfribokException):
    """Database error"""
    def __init__(self, message: str):
        super().__init__(message, "ERR_DATABASE", 500)


# ============= ERROR HANDLERS =============

async def handle_exception(exc: Exception):
    """Convert exceptions to API responses"""
    
    if isinstance(exc, AfribokException):
        return ErrorResponse(
            error=exc.code,
            message=exc.message,
            status_code=exc.status_code
        )
    else:
        return ErrorResponse(
            error="ERR_INTERNAL_SERVER_ERROR",
            message="An unexpected error occurred",
            status_code=500
        )
