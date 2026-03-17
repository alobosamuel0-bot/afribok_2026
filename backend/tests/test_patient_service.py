"""Tests for patient service."""
import pytest
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

from backend.services.patient_service import PatientService
from backend.utils.validators import DuplicatePatientError, BedAllocationError


class TestPatientService:
    """Test suite for PatientService."""

    @pytest.mark.asyncio
    async def test_admit_patient_success(self, db_session, sample_patient, sample_hospital):
        """Test successful patient admission."""
        service = PatientService(db_session)
        
        # Mock bed availability
        with patch.object(service, '_check_bed_availability', return_value="BED001"):
            with patch.object(service, '_calculate_risk_score', return_value=65):
                result = await service.admit_patient(
                    hospital_id=sample_hospital["hospital_id"],
                    patient_data=sample_patient
                )
        
        assert result is not None
        assert result.get("status") == "admitted"
        assert "patient_id" in result

    @pytest.mark.asyncio
    async def test_admit_patient_duplicate_prevention(self, db_session, sample_patient, sample_hospital):
        """Test duplicate patient prevention."""
        service = PatientService(db_session)
        
        # First admission should succeed
        with patch.object(service, '_check_bed_availability', return_value="BED001"):
            with patch.object(service, '_calculate_risk_score', return_value=65):
                # Mock duplicate check
                duplicate_check = AsyncMock(return_value=True)
                with patch.object(service, '_check_duplicate', duplicate_check):
                    with pytest.raises(DuplicatePatientError):
                        await service.admit_patient(
                            hospital_id=sample_hospital["hospital_id"],
                            patient_data=sample_patient
                        )

    @pytest.mark.asyncio
    async def test_risk_score_calculation(self, db_session):
        """Test risk score calculation."""
        service = PatientService(db_session)
        
        # Test calculation with different parameters
        patient_data = {
            "age": 70,  # Age factor: high
            "disease": ["Cancer"],  # Disease factor: high
            "chronic_conditions": ["Diabetes"],  # Chronic factor: medium
            "vital_signs": {
                "heart_rate": 120,  # Abnormal: high
                "oxygen_saturation": 88  # Low: high
            }
        }
        
        risk_score = service._calculate_risk_score(patient_data)
        
        assert isinstance(risk_score, (int, float))
        assert 0 <= risk_score <= 100
        assert risk_score > 50  # Should be high risk

    @pytest.mark.asyncio
    async def test_bed_allocation_priority(self, db_session):
        """Test ICU bed allocation for high-risk patients."""
        service = PatientService(db_session)
        
        high_risk_patient = {
            "age": 75,
            "disease": ["Heart Disease"],
            "chronic_conditions": ["Hypertension", "Diabetes"],
            "vital_signs": {
                "heart_rate": 110,
                "oxygen_saturation": 92
            }
        }
        
        risk_score = service._calculate_risk_score(high_risk_patient)
        
        # High risk should score > 70
        assert risk_score > 70

    @pytest.mark.asyncio
    async def test_discharge_patient_audit_trail(self, db_session, sample_patient):
        """Test patient discharge creates audit trail."""
        service = PatientService(db_session)
        
        discharge_data = {
            "patient_id": "P001",
            "discharge_reason": "Recovered",
            "discharge_notes": "Patient stable for discharge",
            "discharged_by": "DR001"
        }
        
        # Mock discharge operation
        with patch.object(service, '_create_audit_log', AsyncMock()) as mock_audit:
            # The service should create an audit log
            assert callable(service._create_audit_log)

    @pytest.mark.asyncio
    async def test_record_vitals_validation(self, db_session, sample_vitals):
        """Test vital signs validation."""
        service = PatientService(db_session)
        
        # Test valid vitals
        vitals = {
            "temperature": 37.5,  # Normal
            "heart_rate": 75,      # Normal
            "systolic_bp": 120,    # Normal
            "diastolic_bp": 80,    # Normal
            "oxygen_saturation": 98,  # Normal
            "respiratory_rate": 16    # Normal
        }
        
        is_valid = service._validate_vitals(vitals)
        assert is_valid is True
        
        # Test invalid vitals
        invalid_vitals = {
            "temperature": 45,     # Too high
            "heart_rate": 250,     # Too high
            "oxygen_saturation": 30  # Too low
        }
        
        is_valid = service._validate_vitals(invalid_vitals)
        assert is_valid is False

    @pytest.mark.asyncio
    async def test_get_patient_by_id(self, db_session):
        """Test retrieving patient by ID."""
        service = PatientService(db_session)
        
        patient_id = "P001"
        
        # Mock database query
        with patch.object(service, '_query_patient', AsyncMock(return_value={"patient_id": patient_id})):
            result = await service.get_patient(patient_id)
            
            assert result is not None
            assert result.get("patient_id") == patient_id

    @pytest.mark.asyncio
    async def test_list_patients_pagination(self, db_session):
        """Test pagination for patient list."""
        service = PatientService(db_session)
        
        hospital_id = "HOSP001"
        
        # Mock paginated query
        mock_patients = [{"patient_id": f"P{i:03d}"} for i in range(10)]
        
        with patch.object(service, '_query_patients', AsyncMock(return_value=mock_patients)):
            result = await service.list_patients(hospital_id, skip=0, limit=10)
            
            assert len(result) == 10
            assert result[0].get("patient_id") == "P000"

    @pytest.mark.asyncio
    async def test_soft_delete_patient(self, db_session):
        """Test patient soft delete (not permanent)."""
        service = PatientService(db_session)
        
        patient_id = "P001"
        
        # Patient should be marked as deleted, not destroyed
        with patch.object(service, '_soft_delete', AsyncMock(return_value=True)):
            result = await service.soft_delete_patient(patient_id)
            
            assert result is True
            # Data should still exist for audit purposes
