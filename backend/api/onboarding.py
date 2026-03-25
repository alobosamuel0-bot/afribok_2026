"""
Onboarding & OTP API Endpoints
Handles universal login, AI-guided onboarding, and training courses
"""

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from pydantic import BaseModel, EmailStr
from typing import Optional, List
import structlog
from datetime import datetime

from security.auth import (
    generate_otp, store_otp, verify_otp, create_access_token, 
    get_current_user, User
)
from core.config import settings

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/api/v1/onboarding", tags=["Onboarding"])

# ============= SCHEMAS =============

class OTPRequest(BaseModel):
    identifier: str  # Email or Phone number

class OTPVerify(BaseModel):
    identifier: str
    otp: str

class OnboardingResponse(BaseModel):
    message: str
    next_step: str
    guidelines: List[str]

class DataIntegrationRequest(BaseModel):
    has_emr: bool
    integration_method: str  # "voice" or "text"
    content: Optional[str] = None

# ============= ENDPOINTS =============

@router.post("/request-otp")
async def request_otp(request: OTPRequest, background_tasks: BackgroundTasks):
    """Request a One-Time Password via Email or SMS"""
    otp = generate_otp(settings.OTP_LENGTH)
    store_otp(request.identifier, otp)
    
    # In a real system, send via Twilio or SMTP
    logger.info("otp_requested", identifier=request.identifier, otp=otp)
    
    # Mock sending
    if "@" in request.identifier:
        logger.info("sending_email_otp", to=request.identifier)
    else:
        logger.info("sending_sms_otp", to=request.identifier)
        
    return {"message": "OTP sent successfully", "expires_in_minutes": settings.OTP_EXPIRATION_MINUTES}

@router.post("/verify-otp")
async def verify_otp_endpoint(request: OTPVerify):
    """Verify OTP and return access token"""
    if not verify_otp(request.identifier, request.otp):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired OTP"
        )
    
    # Create token for the user
    access_token = create_access_token(
        data={"sub": request.identifier, "username": request.identifier, "role": "admin"}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "is_new_user": True  # Simplified for demo
    }

@router.get("/welcome", response_model=OnboardingResponse)
async def welcome_guidelines(current_user: User = Depends(get_current_user)):
    """Get welcome guidelines and first onboarding step"""
    return OnboardingResponse(
        message=f"Welcome to Afribok, {current_user.username}! We're here to help you transform your clinic.",
        next_step="emr_check",
        guidelines=[
            "Step 1: Connect your existing data or start fresh with our AI assistant.",
            "Step 2: Explore the predictive dashboard to see future patient loads.",
            "Step 3: Complete the 2-hour certification course to master the system.",
            "Step 4: Practice in the risk-free Demo Environment."
        ]
    )

@router.post("/integrate-data")
async def integrate_data(request: DataIntegrationRequest, current_user: User = Depends(get_current_user)):
    """Handle AI-driven data integration (Voice or Text)"""
    if not request.has_emr:
        message = "That's perfectly okay! We can start exactly where you are. Our AI will help you build your digital foundation."
    else:
        message = "Great! We'll help you sync your EMR data seamlessly."
    
    if request.integration_method == "voice":
        # In a real system, this would trigger speech-to-text processing
        processing_info = "Voice note received. Our AI is extracting clinical data points..."
    else:
        processing_info = "Text data received. Analyzing for predictive patterns..."
        
    return {
        "status": "success",
        "message": message,
        "processing_info": processing_info,
        "next_step": "website_check"
    }

@router.get("/training-course")
async def get_training_course():
    """Get the 2-hour training course structure and content"""
    return {
        "course_title": "Afribok Mastery: Enterprise Healthcare Management",
        "duration": "2 Hours",
        "modules": [
            {
                "id": 1,
                "title": "System Architecture & Offline-First Benefits",
                "duration": "30 mins",
                "content": "Learn how Afribok keeps your clinic running even without internet..."
            },
            {
                "id": 2,
                "title": "AI Predictions & Risk Scoring",
                "duration": "45 mins",
                "content": "Deep dive into how we calculate patient risk and forecast bed demand..."
            },
            {
                "id": 3,
                "title": "Data Privacy & Compliance (HIPAA/GDPR)",
                "duration": "25 mins",
                "content": "Understanding the immutable audit trail and your responsibilities..."
            },
            {
                "id": 4,
                "title": "Advanced Workflows & Troubleshooting",
                "duration": "20 mins",
                "content": "Mastering complex scenarios and system maintenance..."
            }
        ]
    }

@router.get("/demo-environment")
async def setup_demo_env(current_user: User = Depends(get_current_user)):
    """Initialize a safe demo environment for practice"""
    return {
        "message": "Demo environment initialized. You can now practice without affecting real data.",
        "demo_patients": [
            {"id": "DEMO-1", "name": "John Doe (Demo)", "condition": "Fever", "risk": "Medium"},
            {"id": "DEMO-2", "name": "Jane Smith (Demo)", "condition": "Critical Injury", "risk": "High"}
        ],
        "instructions": "Try admitting a patient or recording vitals to see the AI in action."
    }
