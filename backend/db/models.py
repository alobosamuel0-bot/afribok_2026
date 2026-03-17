"""
Afribok Core Database Models

Design principles:
- Immutable audit trail (created_at, updated_at never change)
- Soft deletes with is_deleted flag
- Patient safety first (no data loss)
- Scalable to 1M+ records
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, Index, Table
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid


Base = declarative_base()


class Hospital(Base):
    """Hospital/Clinic entity"""
    __tablename__ = "hospitals"

    hospital_id = Column(Integer, primary_key=True, index=True)
    external_id = Column(String(36), unique=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    location = Column(String(500))
    total_beds = Column(Integer, default=100)
    icu_beds = Column(Integer, default=10)
    overflow_beds = Column(Integer, default=5)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    departments = relationship("Department", back_populates="hospital")
    beds = relationship("Bed", back_populates="hospital")
    patients = relationship("Patient", back_populates="hospital")

    __table_args__ = (
        Index("idx_hospital_external_id", "external_id"),
        Index("idx_hospital_active", "is_active"),
    )


class Department(Base):
    """Hospital Department"""
    __tablename__ = "departments"

    department_id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.hospital_id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    typical_patients_per_day = Column(Integer, default=50)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    hospital = relationship("Hospital", back_populates="departments")
    doctors = relationship("Doctor", back_populates="department")
    beds = relationship("Bed", back_populates="department")
    patients = relationship("Patient", back_populates="department")

    __table_args__ = (
        Index("idx_department_hospital_active", "hospital_id", "is_active"),
    )


class Doctor(Base):
    """Doctor/Healthcare Provider"""
    __tablename__ = "doctors"

    doctor_id = Column(Integer, primary_key=True, index=True)
    external_id = Column(String(36), unique=True, default=lambda: str(uuid.uuid4()))
    department_id = Column(Integer, ForeignKey("departments.department_id"), nullable=False)
    name = Column(String(255), nullable=False)
    license_number = Column(String(100), unique=True)
    specialization = Column(String(255))
    max_daily_patients = Column(Integer, default=20)
    current_patient_count = Column(Integer, default=0)
    is_available = Column(Boolean, default=True)
    is_on_call = Column(Boolean, default=False)
    last_assigned_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    department = relationship("Department", back_populates="doctors")
    patients = relationship("Patient", back_populates="assigned_doctor")

    __table_args__ = (
        Index("idx_doctor_department_available", "department_id", "is_available"),
    )


class Disease(Base):
    """Disease/Condition Registry"""
    __tablename__ = "diseases"

    disease_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    icd10_code = Column(String(10))
    severity_level = Column(Integer, default=1)  # 1-5
    avg_bed_hours = Column(Float, default=24)
    avg_doctor_hours = Column(Float, default=2)
    is_contagious = Column(Boolean, default=False)
    is_seasonal = Column(Boolean, default=False)
    peak_season_months = Column(String(100))  # CSV: 1,2,3 for Jan,Feb,Mar
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    patients = relationship("Patient", back_populates="disease")

    __table_args__ = (
        Index("idx_disease_name", "name"),
        Index("idx_disease_icd10", "icd10_code"),
    )


class Bed(Base):
    """Hospital Bed Management"""
    __tablename__ = "beds"

    bed_id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.hospital_id"), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.department_id"), nullable=False)
    bed_number = Column(String(50), nullable=False)
    is_buffer_bed = Column(Boolean, default=False)
    is_icu = Column(Boolean, default=False)
    status = Column(String(20), default="free")  # free, occupied, cleaning, maintenance
    patient_id = Column(Integer, ForeignKey("patients.patient_id"), nullable=True)
    expected_free_at = Column(DateTime(timezone=True))
    cleaning_time_minutes = Column(Integer, default=30)
    last_cleaned_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    hospital = relationship("Hospital", back_populates="beds")
    department = relationship("Department", back_populates="beds")
    patient = relationship("Patient", back_populates="bed", uselist=False)

    __table_args__ = (
        Index("idx_bed_hospital_department_status", "hospital_id", "department_id", "status"),
    )


class Patient(Base):
    """Patient Record - CRITICAL FOR PATIENT SAFETY"""
    __tablename__ = "patients"

    patient_id = Column(Integer, primary_key=True, index=True)
    external_id = Column(String(36), unique=True, default=lambda: str(uuid.uuid4()), nullable=False)
    hospital_id = Column(Integer, ForeignKey("hospitals.hospital_id"), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.department_id"), nullable=False)
    
    # Demographics
    name = Column(String(255), nullable=False)
    age = Column(Integer)
    gender = Column(String(20))
    phone = Column(String(20))
    national_id = Column(String(50), unique=True)
    
    # Clinical
    disease_id = Column(Integer, ForeignKey("diseases.disease_id"))
    assigned_doctor_id = Column(Integer, ForeignKey("doctors.doctor_id"))
    risk_level = Column(String(20), default="medium")  # low, medium, high, critical
    risk_score = Column(Float, default=0.0)
    
    # Allergies & Medical History
    allergies = Column(Text)  # JSON or CSV
    chronic_conditions = Column(Text)  # JSON or CSV
    medications = Column(Text)  # JSON array
    
    # Admission
    admission_time = Column(DateTime(timezone=True), nullable=False, default=func.now())
    expected_stay_hours = Column(Float)
    expected_discharge_time = Column(DateTime(timezone=True))
    actual_discharge_time = Column(DateTime(timezone=True))
    admission_source = Column(String(50))  # emergency, referral, walk-in
    
    # Bed Assignment
    bed_id = Column(Integer, ForeignKey("beds.bed_id"))
    
    # Status Management
    status = Column(String(20), default="waiting")  # waiting, admitted, in_treatment, discharged
    is_deleted = Column(Boolean, default=False)  # Soft delete
    is_readmission = Column(Boolean, default=False)
    
    # Audit Trail
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(String(255))  # Username
    updated_by = Column(String(255))

    hospital = relationship("Hospital", back_populates="patients")
    department = relationship("Department", back_populates="patients")
    disease = relationship("Disease", back_populates="patients")
    assigned_doctor = relationship("Doctor", back_populates="patients")
    bed = relationship("Bed", back_populates="patient", uselist=False)
    vitals_history = relationship("PatientVitals", back_populates="patient", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="patient", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_patient_hospital_department", "hospital_id", "department_id"),
        Index("idx_patient_external_id", "external_id"),
        Index("idx_patient_risk_level", "risk_level"),
        Index("idx_patient_status", "status"),
        Index("idx_patient_admission_time", "admission_time"),
        Index("idx_patient_not_deleted", "is_deleted"),
    )


class PatientVitals(Base):
    """Patient Vital Signs - Time Series"""
    __tablename__ = "patient_vitals"

    vital_id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.patient_id"), nullable=False)
    
    # Vital Signs
    temperature_celsius = Column(Float)
    heart_rate = Column(Integer)  # BPM
    blood_pressure_systolic = Column(Integer)
    blood_pressure_diastolic = Column(Integer)
    respiratory_rate = Column(Integer)  # breaths/min
    oxygen_saturation = Column(Float)  # %
    weight_kg = Column(Float)
    
    # Metadata
    recorded_at = Column(DateTime(timezone=True), nullable=False, default=func.now())
    recorded_by = Column(String(255))
    source = Column(String(50))  # manual, sensor, device
    is_critical = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    patient = relationship("Patient", back_populates="vitals_history")

    __table_args__ = (
        Index("idx_vitals_patient_time", "patient_id", "recorded_at"),
        Index("idx_vitals_critical", "is_critical"),
    )


class AuditLog(Base):
    """Immutable Audit Trail for Compliance"""
    __tablename__ = "audit_logs"

    log_id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.patient_id"), nullable=False)
    action = Column(String(100), nullable=False)  # admitted, updated, discharged, risk_changed
    old_data = Column(Text)  # JSON
    new_data = Column(Text)  # JSON
    changed_by = Column(String(255), nullable=False)
    reason = Column(String(500))
    ip_address = Column(String(45))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    is_verified = Column(Boolean, default=False)  # For compliance audits

    patient = relationship("Patient", back_populates="audit_logs")

    __table_args__ = (
        Index("idx_audit_patient", "patient_id"),
        Index("idx_audit_action_time", "action", "created_at"),
    )


class SyncQueue(Base):
    """Offline-First Sync Queue"""
    __tablename__ = "sync_queue"

    queue_id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String(50), nullable=False)  # patient, bed, doctor, vitals
    entity_id = Column(Integer, nullable=False)
    operation = Column(String(20), nullable=False)  # create, update, delete
    payload = Column(Text, nullable=False)  # JSON
    synced = Column(Boolean, default=False)
    sync_attempt_count = Column(Integer, default=0)
    last_sync_attempt = Column(DateTime(timezone=True))
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        Index("idx_sync_queue_not_synced", "synced", "is_deleted"),
        Index("idx_sync_queue_entity", "entity_type", "entity_id"),
    )
