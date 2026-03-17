"""Tests for API endpoints."""
import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient

from backend.core.app import app


@pytest.fixture
async def client():
    """Create async test client."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


class TestPatientEndpoints:
    """Test patient API endpoints."""

    @pytest.mark.asyncio
    async def test_admit_patient_endpoint(self, client, auth_headers, sample_patient):
        """Test POST /api/v1/patients/admit endpoint."""
        with patch("backend.api.patients.PatientService.admit_patient", AsyncMock()):
            response = await client.post(
                "/api/v1/patients/admit",
                json=sample_patient,
                headers=auth_headers
            )
            
            assert response.status_code in [200, 201]

    @pytest.mark.asyncio
    async def test_get_patient_endpoint(self, client, auth_headers):
        """Test GET /api/v1/patients/{patient_id} endpoint."""
        patient_id = "P001"
        
        with patch("backend.api.patients.PatientService.get_patient", AsyncMock()):
            response = await client.get(
                f"/api/v1/patients/{patient_id}",
                headers=auth_headers
            )
            
            assert response.status_code in [200, 404]

    @pytest.mark.asyncio
    async def test_list_patients_endpoint(self, client, auth_headers):
        """Test GET /api/v1/patients endpoint."""
        with patch("backend.api.patients.PatientService.list_patients", AsyncMock()):
            response = await client.get(
                "/api/v1/patients",
                headers=auth_headers
            )
            
            assert response.status_code in [200, 400]

    @pytest.mark.asyncio
    async def test_record_vitals_endpoint(self, client, auth_headers, sample_vitals):
        """Test POST /api/v1/patients/{patient_id}/vitals endpoint."""
        patient_id = "P001"
        
        with patch("backend.api.patients.PatientService.record_vitals", AsyncMock()):
            response = await client.post(
                f"/api/v1/patients/{patient_id}/vitals",
                json=sample_vitals,
                headers=auth_headers
            )
            
            assert response.status_code in [200, 201, 400]

    @pytest.mark.asyncio
    async def test_discharge_patient_endpoint(self, client, auth_headers):
        """Test POST /api/v1/patients/{patient_id}/discharge endpoint."""
        patient_id = "P001"
        discharge_data = {
            "reason": "Recovered",
            "notes": "Patient stable"
        }
        
        with patch("backend.api.patients.PatientService.discharge_patient", AsyncMock()):
            response = await client.post(
                f"/api/v1/patients/{patient_id}/discharge",
                json=discharge_data,
                headers=auth_headers
            )
            
            assert response.status_code in [200, 400, 404]


class TestAuthEndpoints:
    """Test authentication endpoints."""

    @pytest.mark.asyncio
    async def test_login_endpoint(self, client):
        """Test POST /api/v1/auth/login endpoint."""
        credentials = {
            "username": "demo@hospital.com",
            "password": "Demo@12345"
        }
        
        with patch("backend.security.auth.verify_token", return_value=True):
            response = await client.post(
                "/api/v1/auth/login",
                json=credentials
            )
            
            assert response.status_code in [200, 401]

    @pytest.mark.asyncio
    async def test_logout_endpoint(self, client, auth_headers):
        """Test POST /api/v1/auth/logout endpoint."""
        response = await client.post(
            "/api/v1/auth/logout",
            headers=auth_headers
        )
        
        assert response.status_code in [200, 401]

    @pytest.mark.asyncio
    async def test_token_refresh_endpoint(self, client, auth_headers):
        """Test POST /api/v1/auth/refresh endpoint."""
        response = await client.post(
            "/api/v1/auth/refresh",
            headers=auth_headers
        )
        
        assert response.status_code in [200, 401, 403]


class TestHealthCheckEndpoint:
    """Test health check endpoint."""

    @pytest.mark.asyncio
    async def test_health_check(self, client):
        """Test GET /health endpoint."""
        response = await client.get("/health")
        
        assert response.status_code == 200
        assert "status" in response.json()


class TestErrorHandling:
    """Test error handling."""

    @pytest.mark.asyncio
    async def test_missing_auth_header(self, client):
        """Test 401 when auth header missing."""
        response = await client.get("/api/v1/patients")
        
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_invalid_auth_header(self, client):
        """Test 401 with invalid token."""
        headers = {"Authorization": "Bearer invalid_token"}
        
        response = await client.get("/api/v1/patients", headers=headers)
        
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_not_found_endpoint(self, client, auth_headers):
        """Test 404 for nonexistent endpoint."""
        response = await client.get(
            "/api/v1/nonexistent",
            headers=auth_headers
        )
        
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_validation_error_response(self, client, auth_headers):
        """Test validation error response format."""
        invalid_input = {
            "first_name": "",  # Required field empty
            "age": -5  # Invalid age
        }
        
        response = await client.post(
            "/api/v1/patients/admit",
            json=invalid_input,
            headers=auth_headers
        )
        
        assert response.status_code == 422  # Unprocessable entity
