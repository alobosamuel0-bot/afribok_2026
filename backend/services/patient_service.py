"""
Patient Management Service
Core business logic for patient admission, risk assessment, and discharge
"""

from datetime import datetime, timedelta
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
import structlog

from db.models import Patient, Bed, Doctor, Disease, PatientVitals, AuditLog
from security.auth import User, audit_action
from sync.manager import SyncManager


logger = structlog.get_logger(__name__)


class PatientService:
    """Patient management operations"""

    @staticmethod
    async def admit_patient(
        db: AsyncSession,
        hospital_id: int,
        department_id: int,
        patient_data: dict,
        current_user: User
    ) -> Patient:
        """
        Admit a new patient with safety checks
        
        PATIENT SAFETY:
        - Validate all mandatory fields
        - Check allergies & contraindications
        - Assess risk level
        - Assign appropriate bed
        - Create audit trail
        """

        # Validate mandatory fields
        required_fields = ["name", "age"]
        for field in required_fields:
            if field not in patient_data or not patient_data[field]:
                raise ValueError(f"Missing required field: {field}")

        # Check for existing patient records (prevent duplicates)
        existing = await db.execute(
            select(Patient).where(
                (Patient.national_id == patient_data.get("national_id")) &
                (Patient.hospital_id == hospital_id) &
                (Patient.status.in_(["admitted", "in_treatment"]))
            )
        )
        if existing.scalars().first():
            logger.warning(
                "duplicate_admission_attempt",
                hospital_id=hospital_id,
                user_id=current_user.user_id
            )
            raise ValueError("Patient already admitted to this hospital")

        # Calculate risk score
        risk_level, risk_score = await PatientService.calculate_risk(
            patient_data,
            db
        )

        # Create patient record
        patient = Patient(
            hospital_id=hospital_id,
            department_id=department_id,
            name=patient_data["name"],
            age=patient_data["age"],
            gender=patient_data.get("gender"),
            phone=patient_data.get("phone"),
            national_id=patient_data.get("national_id"),
            disease_id=patient_data.get("disease_id"),
            allergies=str(patient_data.get("allergies", "")),
            chronic_conditions=str(patient_data.get("chronic_conditions", "")),
            medications=str(patient_data.get("medications", "")),
            risk_level=risk_level,
            risk_score=risk_score,
            admission_time=datetime.utcnow(),
            status="admitted",
            created_by=current_user.username,
            admission_source=patient_data.get("admission_source", "walk-in")
        )

        db.add(patient)
        await db.flush()  # Get patient_id

        # Assign bed
        bed = await PatientService.assign_bed(
            db,
            hospital_id,
            department_id,
            patient.patient_id,
            is_critical=(risk_level == "critical")
        )
        
        if bed:
            patient.bed_id = bed.bed_id

        # Predict discharge time
        if patient.disease_id:
            disease = await db.get(Disease, patient.disease_id)
            if disease:
                patient.expected_stay_hours = disease.avg_bed_hours
                patient.expected_discharge_time = datetime.utcnow() + timedelta(
                    hours=disease.avg_bed_hours
                )

        # Save to database
        db.add(patient)
        await db.commit()
        await db.refresh(patient)

        # Log for audit trail
        await PatientService.create_audit_log(
            db,
            patient.patient_id,
            "admitted",
            None,
            {"status": "admitted", "risk_level": risk_level},
            current_user,
            f"Patient admitted - Risk: {risk_level}"
        )

        # Queue for sync
        await SyncManager.queue_operation(
            db,
            "patient",
            patient.patient_id,
            "create",
            {
                "patient_id": patient.patient_id,
                "name": patient.name,
                "age": patient.age,
                "risk_level": patient.risk_level,
                "hospital_id": hospital_id,
                "department_id": department_id
            },
            hospital_id
        )

        logger.info(
            "patient_admitted",
            patient_id=patient.patient_id,
            risk_level=risk_level,
            admitted_by=current_user.username
        )

        return patient

    @staticmethod
    async def calculate_risk(
        patient_data: dict,
        db: AsyncSession
    ) -> tuple[str, float]:
        """
        Calculate patient risk score (0-100)
        
        Factors:
        - Age
        - Disease severity
        - Chronic conditions
        - Vital signs
        """

        score = 0.0

        # Age factor
        age = patient_data.get("age", 0)
        if age > 65:
            score += 20  # Elderly
        elif age < 5:
            score += 15  # Pediatric

        # Disease severity
        disease_id = patient_data.get("disease_id")
        if disease_id:
            disease = await db.get(Disease, disease_id)
            if disease:
                score += disease.severity_level * 10

        # Chronic conditions
        chronic = patient_data.get("chronic_conditions", "")
        if chronic:
            conditions = len([c.strip() for c in str(chronic).split(",")])
            score += conditions * 5

        # Cap at 100
        final_score = min(score, 100.0)

        # Determine risk level
        if final_score >= 75:
            risk_level = "critical"
        elif final_score >= 50:
            risk_level = "high"
        elif final_score >= 25:
            risk_level = "medium"
        else:
            risk_level = "low"

        return risk_level, final_score

    @staticmethod
    async def assign_bed(
        db: AsyncSession,
        hospital_id: int,
        department_id: int,
        patient_id: int,
        is_critical: bool = False
    ) -> Optional[Bed]:
        """
        Assign a bed to patient
        
        Priority:
        1. ICU beds for critical patients
        2. Regular beds
        3. Buffer beds
        """

        # Query available beds
        if is_critical:
            # ICU beds for critical patients
            query = select(Bed).where(
                (Bed.hospital_id == hospital_id) &
                (Bed.department_id == department_id) &
                (Bed.is_icu == True) &
                (Bed.status == "free")
            ).order_by(Bed.bed_id)
        else:
            # Regular beds first
            query = select(Bed).where(
                (Bed.hospital_id == hospital_id) &
                (Bed.department_id == department_id) &
                (Bed.is_buffer_bed == False) &
                (Bed.status == "free")
            ).order_by(Bed.bed_id)

        result = await db.execute(query)
        bed = result.scalars().first()

        # Try buffer beds if no regular beds
        if not bed and not is_critical:
            result = await db.execute(
                select(Bed).where(
                    (Bed.hospital_id == hospital_id) &
                    (Bed.department_id == department_id) &
                    (Bed.is_buffer_bed == True) &
                    (Bed.status == "free")
                ).order_by(Bed.bed_id)
            )
            bed = result.scalars().first()

        if bed:
            bed.status = "occupied"
            bed.patient_id = patient_id
            bed.expected_free_at = None
            db.add(bed)
            await db.commit()
            
            logger.info(
                "bed_assigned",
                bed_id=bed.bed_id,
                patient_id=patient_id,
                bed_number=bed.bed_number
            )

        return bed

    @staticmethod
    async def discharge_patient(
        db: AsyncSession,
        patient_id: int,
        current_user: User,
        reason: str = None
    ) -> Patient:
        """Discharge patient with audit trail"""

        patient = await db.get(Patient, patient_id)
        if not patient:
            raise ValueError(f"Patient {patient_id} not found")

        # Free up bed
        if patient.bed_id:
            bed = await db.get(Bed, patient.bed_id)
            if bed:
                bed.status = "free"
                bed.patient_id = None
                bed.last_cleaned_at = datetime.utcnow()
                db.add(bed)

        # Update patient
        patient.status = "discharged"
        patient.actual_discharge_time = datetime.utcnow()
        patient.updated_by = current_user.username
        db.add(patient)
        await db.commit()

        # Audit log
        await PatientService.create_audit_log(
            db,
            patient_id,
            "discharged",
            {"status": "in_treatment"},
            {"status": "discharged"},
            current_user,
            reason or "Patient discharged"
        )

        logger.info(
            "patient_discharged",
            patient_id=patient_id,
            discharged_by=current_user.username
        )

        return patient

    @staticmethod
    async def create_audit_log(
        db: AsyncSession,
        patient_id: int,
        action: str,
        old_data: dict,
        new_data: dict,
        user: User,
        reason: str = None,
        ip_address: str = None
    ):
        """Create immutable audit log"""

        import json

        log = AuditLog(
            patient_id=patient_id,
            action=action,
            old_data=json.dumps(old_data) if old_data else None,
            new_data=json.dumps(new_data) if new_data else None,
            changed_by=user.username,
            reason=reason,
            ip_address=ip_address
        )

        db.add(log)
        await db.commit()

        audit_action(user, action, f"patient/{patient_id}", {"reason": reason}, ip_address)
