"""
Patient API Endpoints
REST API for patient management
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import datetime
import structlog

from db.connection import get_local_db
from db.models import Patient, PatientVitals
from security.auth import get_current_user, check_scope, User
from services.patient_service import PatientService


logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/api/v1/patients", tags=["Patients"])


# ============= SCHEMAS (Pydantic models) =============
# These would typically be in a separate schemas.py file

from pydantic import BaseModel, Field
from typing import Optional


class PatientAdmitRequest(BaseModel):
    """Patient admission request"""
    name: str
    age: int
    gender: Optional[str] = None
    phone: Optional[str] = None
    national_id: Optional[str] = None
    disease_id: Optional[int] = None
    allergies: Optional[str] = None
    chronic_conditions: Optional[str] = None
    medications: Optional[str] = None
    admission_source: str = "walk-in"


class PatientResponse(BaseModel):
    """Patient response"""
    patient_id: int
    name: str
    age: int
    gender: Optional[str] = None
    risk_level: str
    risk_score: float
    status: str
    admission_time: datetime
    expected_discharge_time: Optional[datetime] = None


class VitalsRequest(BaseModel):
    """Record patient vitals"""
    temperature_celsius: Optional[float] = None
    heart_rate: Optional[int] = None
    blood_pressure_systolic: Optional[int] = None
    blood_pressure_diastolic: Optional[int] = None
    respiratory_rate: Optional[int] = None
    oxygen_saturation: Optional[float] = None


# ============= ENDPOINTS =============

@router.post(
    "/admit",
    response_model=PatientResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Admit patient to hospital",
    dependencies=[Depends(check_scope("write"))]
)
async def admit_patient(
    request: PatientAdmitRequest,
    hospital_id: int = Query(..., description="Hospital ID"),
    department_id: int = Query(..., description="Department ID"),
    db: AsyncSession = Depends(get_local_db),
    current_user: User = Depends(get_current_user)
):
    """
    Admit a new patient with validation and safety checks
    
    **PATIENT SAFETY**: 
    - Validates contact information
    - Checks for duplicate admissions
    - Calculates risk level
    - Assigns appropriate bed
    """
    try:
        patient = await PatientService.admit_patient(
            db,
            hospital_id,
            department_id,
            request.dict(),
            current_user
        )

        return PatientResponse(
            patient_id=patient.patient_id,
            name=patient.name,
            age=patient.age,
            gender=patient.gender,
            risk_level=patient.risk_level,
            risk_score=patient.risk_score,
            status=patient.status,
            admission_time=patient.admission_time,
            expected_discharge_time=patient.expected_discharge_time
        )

    except ValueError as e:
        logger.error("admission_validation_error", error=str(e), user_id=current_user.user_id)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error("admission_error", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to admit patient"
        )


@router.get(
    "/{patient_id}",
    response_model=PatientResponse,
    summary="Get patient details",
    dependencies=[Depends(check_scope("read"))]
)
async def get_patient(
    patient_id: int,
    db: AsyncSession = Depends(get_local_db),
    current_user: User = Depends(get_current_user)
):
    """Get patient details"""
    
    patient = await db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )

    return PatientResponse(
        patient_id=patient.patient_id,
        name=patient.name,
        age=patient.age,
        gender=patient.gender,
        risk_level=patient.risk_level,
        risk_score=patient.risk_score,
        status=patient.status,
        admission_time=patient.admission_time,
        expected_discharge_time=patient.expected_discharge_time
    )


@router.post(
    "/{patient_id}/vitals",
    status_code=status.HTTP_201_CREATED,
    summary="Record patient vitals",
    dependencies=[Depends(check_scope("write"))]
)
async def record_vitals(
    patient_id: int,
    request: VitalsRequest,
    db: AsyncSession = Depends(get_local_db),
    current_user: User = Depends(get_current_user)
):
    """Record patient vital signs"""
    
    # Verify patient exists
    patient = await db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )

    # Create vitals record
    vitals = PatientVitals(
        patient_id=patient_id,
        temperature_celsius=request.temperature_celsius,
        heart_rate=request.heart_rate,
        blood_pressure_systolic=request.blood_pressure_systolic,
        blood_pressure_diastolic=request.blood_pressure_diastolic,
        respiratory_rate=request.respiratory_rate,
        oxygen_saturation=request.oxygen_saturation,
        recorded_by=current_user.username,
        source="manual"
    )

    # Check for critical values
    if request.temperature_celsius and request.temperature_celsius > 40:
        vitals.is_critical = True
        logger.warning(
            "critical_vital_recorded",
            patient_id=patient_id,
            vital="temperature",
            value=request.temperature_celsius
        )

    db.add(vitals)
    await db.commit()

    return {
        "vital_id": vitals.vital_id,
        "patient_id": patient_id,
        "recorded_at": vitals.recorded_at,
        "is_critical": vitals.is_critical
    }


@router.post(
    "/{patient_id}/discharge",
    status_code=status.HTTP_200_OK,
    summary="Discharge patient",
    dependencies=[Depends(check_scope("write"))]
)
async def discharge_patient(
    patient_id: int,
    reason: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_local_db),
    current_user: User = Depends(get_current_user)
):
    """Discharge patient from hospital"""
    
    try:
        patient = await PatientService.discharge_patient(
            db,
            patient_id,
            current_user,
            reason
        )

        return {
            "patient_id": patient.patient_id,
            "status": patient.status,
            "discharge_time": patient.actual_discharge_time,
            "message": "Patient discharged successfully"
        }

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error("discharge_error", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to discharge patient"
        )


@router.get(
    "",
    summary="List patients",
    dependencies=[Depends(check_scope("read"))]
)
async def list_patients(
    hospital_id: int = Query(...),
    department_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(100, le=1000),
    offset: int = Query(0),
    db: AsyncSession = Depends(get_local_db),
    current_user: User = Depends(get_current_user)
):
    """List patients with filters"""
    
    from sqlalchemy import select
    
    query = select(Patient).where(
        Patient.hospital_id == hospital_id,
        Patient.is_deleted == False
    )

    if department_id:
        query = query.where(Patient.department_id == department_id)
    
    if status:
        query = query.where(Patient.status == status)

    query = query.limit(limit).offset(offset)
    
    result = await db.execute(query)
    patients = result.scalars().all()

    return {
        "count": len(patients),
        "patients": [
            {
                "patient_id": p.patient_id,
                "name": p.name,
                "age": p.age,
                "risk_level": p.risk_level,
                "status": p.status,
                "admission_time": p.admission_time
            }
            for p in patients
        ]
    }
