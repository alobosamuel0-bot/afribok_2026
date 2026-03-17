"""Analytics API endpoints."""
import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db.connection import get_db
from backend.security.auth import get_current_user
from backend.services.analytics_service import AnalyticsService
from backend.utils.validators import UserModel

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/analytics", tags=["analytics"])


@router.get("/overview/{hospital_id}")
async def get_hospital_overview(
    hospital_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get hospital operational overview.
    
    Returns:
        Patient counts, bed statistics, risk distribution
    """
    try:
        service = AnalyticsService(db)
        overview = await service.get_hospital_overview(hospital_id)
        return {
            "status": "success",
            "data": overview
        }
    except Exception as e:
        logger.error(f"Error fetching overview: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch overview")


@router.get("/patient-trends/{hospital_id}")
async def get_patient_trends(
    hospital_id: str,
    days: int = Query(30, ge=1, le=365),
    current_user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get patient admission/discharge trends.
    
    Args:
        hospital_id: Hospital ID
        days: Number of days to analyze (1-365)
        
    Returns:
        Daily admission and discharge counts
    """
    try:
        service = AnalyticsService(db)
        trends = await service.get_patient_analytics(hospital_id, days)
        return {
            "status": "success",
            "data": trends
        }
    except Exception as e:
        logger.error(f"Error fetching trends: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch trends")


@router.get("/disease-distribution/{hospital_id}")
async def get_disease_distribution(
    hospital_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get disease distribution among patients.
    
    Returns:
        Disease names with patient counts
    """
    try:
        service = AnalyticsService(db)
        distribution = await service.get_disease_distribution(hospital_id)
        return {
            "status": "success",
            "data": distribution
        }
    except Exception as e:
        logger.error(f"Error fetching disease distribution: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch distribution")


@router.get("/risk-distribution/{hospital_id}")
async def get_risk_distribution(
    hospital_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get patient distribution by risk level.
    
    Returns:
        Low/medium/high risk patient counts
    """
    try:
        service = AnalyticsService(db)
        distribution = await service.get_risk_distribution(hospital_id)
        return {
            "status": "success",
            "data": distribution
        }
    except Exception as e:
        logger.error(f"Error fetching risk distribution: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch distribution")


@router.get("/vital-trends/{hospital_id}")
async def get_vital_trends(
    hospital_id: str,
    days: int = Query(7, ge=1, le=90),
    current_user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get average vital signs trends.
    
    Args:
        hospital_id: Hospital ID
        days: Number of days to analyze (1-90)
        
    Returns:
        Daily average vitals
    """
    try:
        service = AnalyticsService(db)
        trends = await service.get_vital_trends(hospital_id, days)
        return {
            "status": "success",
            "data": trends
        }
    except Exception as e:
        logger.error(f"Error fetching vital trends: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch trends")


@router.get("/sync-stats/{hospital_id}")
async def get_sync_statistics(
    hospital_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get offline sync statistics.
    
    Returns:
        Pending, synced, and failed operations count
    """
    try:
        service = AnalyticsService(db)
        stats = await service.get_sync_statistics(hospital_id)
        return {
            "status": "success",
            "data": stats
        }
    except Exception as e:
        logger.error(f"Error fetching sync stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch sync stats")


@router.get("/audit-log/{hospital_id}")
async def get_audit_log(
    hospital_id: str,
    days: int = Query(7, ge=1, le=365),
    limit: int = Query(100, ge=1, le=1000),
    current_user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get audit log entries.
    
    Args:
        hospital_id: Hospital ID
        days: Number of days to retrieve (1-365)
        limit: Max entries to return (1-1000)
        
    Returns:
        Recent audit events with timestamps and changes
    """
    try:
        service = AnalyticsService(db)
        audit_logs = await service.get_audit_summary(hospital_id, days, limit)
        return {
            "status": "success",
            "count": len(audit_logs),
            "data": audit_logs
        }
    except Exception as e:
        logger.error(f"Error fetching audit log: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch audit log")


@router.get("/report/{hospital_id}")
async def generate_report(
    hospital_id: str,
    report_type: str = Query("daily", regex="^(daily|weekly|monthly)$"),
    current_user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate comprehensive analytics report.
    
    Args:
        hospital_id: Hospital ID
        report_type: Report type (daily, weekly, monthly)
        
    Returns:
        Complete report with all metrics
    """
    try:
        service = AnalyticsService(db)
        report = await service.generate_report(hospital_id, report_type)
        return {
            "status": "success",
            "data": report
        }
    except Exception as e:
        logger.error(f"Error generating report: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate report")
