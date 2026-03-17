"""Analytics service for hospital operational insights."""
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from backend.db.models import (
    Patient, PatientVitals, AuditLog, Hospital, 
    Department, Bed, Disease, SyncQueue
)

logger = logging.getLogger(__name__)


class AnalyticsService:
    """Service for generating analytics and insights."""

    def __init__(self, db_session: AsyncSession):
        """Initialize analytics service."""
        self.db = db_session

    async def get_hospital_overview(self, hospital_id: str) -> Dict[str, Any]:
        """Get hospital operational overview.
        
        Returns:
            Dictionary with key metrics (patients, beds, stats)
        """
        try:
            # Patient statistics
            total_patients = await self.db.execute(
                select(func.count(Patient.patient_id)).where(
                    Patient.hospital_id == hospital_id,
                    Patient.is_deleted == False
                )
            )
            total_count = total_patients.scalar() or 0

            # Admitted patients
            admitted = await self.db.execute(
                select(func.count(Patient.patient_id)).where(
                    Patient.hospital_id == hospital_id,
                    Patient.status == "admitted",
                    Patient.is_deleted == False
                )
            )
            admitted_count = admitted.scalar() or 0

            # Discharged today
            today = datetime.utcnow().date()
            discharged_today = await self.db.execute(
                select(func.count(Patient.patient_id)).where(
                    Patient.hospital_id == hospital_id,
                    Patient.status == "discharged",
                    func.date(Patient.discharge_date) == today
                )
            )
            discharged_count = discharged_today.scalar() or 0

            # Bed statistics
            available_beds = await self.db.execute(
                select(func.count(Bed.bed_id)).where(
                    Bed.hospital_id == hospital_id,
                    Bed.status == "available"
                )
            )
            available = available_beds.scalar() or 0

            total_beds = await self.db.execute(
                select(func.count(Bed.bed_id)).where(
                    Bed.hospital_id == hospital_id
                )
            )
            bed_total = total_beds.scalar() or 0

            # Risk distribution
            high_risk = await self.db.execute(
                select(func.count(Patient.patient_id)).where(
                    Patient.hospital_id == hospital_id,
                    Patient.risk_score >= 70,
                    Patient.is_deleted == False
                )
            )
            high_risk_count = high_risk.scalar() or 0

            return {
                "total_patients": total_count,
                "admitted_patients": admitted_count,
                "discharged_today": discharged_count,
                "available_beds": available,
                "total_beds": bed_total,
                "bed_occupancy_rate": (
                    ((bed_total - available) / bed_total * 100) if bed_total > 0 else 0
                ),
                "high_risk_patients": high_risk_count,
                "high_risk_percentage": (
                    (high_risk_count / total_count * 100) if total_count > 0 else 0
                )
            }
        except Exception as e:
            logger.error(f"Error getting hospital overview: {e}")
            return {}

    async def get_patient_analytics(
        self, 
        hospital_id: str,
        days: int = 30
    ) -> Dict[str, Any]:
        """Get patient admission and discharge trends.
        
        Args:
            hospital_id: Hospital ID
            days: Number of days to analyze
            
        Returns:
            Daily admission/discharge counts
        """
        try:
            start_date = datetime.utcnow().date() - timedelta(days=days)
            
            # Daily admissions
            daily_admissions = await self.db.execute(
                select(
                    func.date(Patient.admission_date).label("date"),
                    func.count(Patient.patient_id).label("count")
                ).where(
                    Patient.hospital_id == hospital_id,
                    Patient.admission_date >= start_date
                ).group_by(func.date(Patient.admission_date))
            )
            
            admissions = [
                {"date": str(row[0]), "count": row[1]}
                for row in daily_admissions.all()
            ]

            # Daily discharges
            daily_discharges = await self.db.execute(
                select(
                    func.date(Patient.discharge_date).label("date"),
                    func.count(Patient.patient_id).label("count")
                ).where(
                    Patient.hospital_id == hospital_id,
                    Patient.status == "discharged",
                    Patient.discharge_date >= start_date
                ).group_by(func.date(Patient.discharge_date))
            )
            
            discharges = [
                {"date": str(row[0]), "count": row[1]}
                for row in daily_discharges.all()
            ]

            return {
                "admissions": admissions,
                "discharges": discharges,
                "period_days": days,
                "start_date": str(start_date)
            }
        except Exception as e:
            logger.error(f"Error getting patient analytics: {e}")
            return {}

    async def get_disease_distribution(self, hospital_id: str) -> Dict[str, Any]:
        """Get disease distribution among admitted patients.
        
        Returns:
            Dictionary mapping diseases to patient counts
        """
        try:
            result = await self.db.execute(
                select(
                    Disease.disease_name,
                    func.count(Patient.patient_id).label("count")
                ).join(
                    Patient, Patient.primary_disease_id == Disease.disease_id
                ).where(
                    Patient.hospital_id == hospital_id,
                    Patient.status == "admitted",
                    Patient.is_deleted == False
                ).group_by(Disease.disease_name)
            )

            distribution = [
                {"disease": row[0], "patient_count": row[1]}
                for row in result.all()
            ]

            return {
                "diseases": distribution,
                "total_patients": sum(d["patient_count"] for d in distribution)
            }
        except Exception as e:
            logger.error(f"Error getting disease distribution: {e}")
            return {}

    async def get_risk_distribution(self, hospital_id: str) -> Dict[str, Any]:
        """Get patient distribution by risk level.
        
        Returns:
            Risk levels: low (<50), medium (50-70), high (>70)
        """
        try:
            low_risk = await self.db.execute(
                select(func.count(Patient.patient_id)).where(
                    Patient.hospital_id == hospital_id,
                    Patient.risk_score < 50,
                    Patient.is_deleted == False
                )
            )

            medium_risk = await self.db.execute(
                select(func.count(Patient.patient_id)).where(
                    Patient.hospital_id == hospital_id,
                    Patient.risk_score.between(50, 70),
                    Patient.is_deleted == False
                )
            )

            high_risk = await self.db.execute(
                select(func.count(Patient.patient_id)).where(
                    Patient.hospital_id == hospital_id,
                    Patient.risk_score > 70,
                    Patient.is_deleted == False
                )
            )

            return {
                "low_risk": low_risk.scalar() or 0,
                "medium_risk": medium_risk.scalar() or 0,
                "high_risk": high_risk.scalar() or 0
            }
        except Exception as e:
            logger.error(f"Error getting risk distribution: {e}")
            return {}

    async def get_vital_trends(
        self,
        hospital_id: str,
        days: int = 7
    ) -> Dict[str, Any]:
        """Get average vital signs trends.
        
        Returns:
            Daily average vitals
        """
        try:
            start_date = datetime.utcnow().date() - timedelta(days=days)
            
            vitals = await self.db.execute(
                select(
                    func.date(PatientVitals.recorded_at).label("date"),
                    func.avg(PatientVitals.temperature).label("avg_temp"),
                    func.avg(PatientVitals.heart_rate).label("avg_hr"),
                    func.avg(PatientVitals.systolic_bp).label("avg_sbp"),
                    func.avg(PatientVitals.oxygen_saturation).label("avg_o2")
                ).join(
                    Patient, Patient.patient_id == PatientVitals.patient_id
                ).where(
                    Patient.hospital_id == hospital_id,
                    PatientVitals.recorded_at >= start_date
                ).group_by(func.date(PatientVitals.recorded_at))
            )

            trends = [
                {
                    "date": str(row[0]),
                    "avg_temperature": round(float(row[1]), 2) if row[1] else None,
                    "avg_heart_rate": round(float(row[2]), 2) if row[2] else None,
                    "avg_systolic_bp": round(float(row[3]), 2) if row[3] else None,
                    "avg_oxygen_saturation": round(float(row[4]), 2) if row[4] else None
                }
                for row in vitals.all()
            ]

            return {"trends": trends, "period_days": days}
        except Exception as e:
            logger.error(f"Error getting vital trends: {e}")
            return {}

    async def get_sync_statistics(self, hospital_id: str) -> Dict[str, Any]:
        """Get offline sync statistics.
        
        Returns:
            Pending, synced, and failed operations
        """
        try:
            pending = await self.db.execute(
                select(func.count(SyncQueue.operation_id)).where(
                    SyncQueue.hospital_id == hospital_id,
                    SyncQueue.status == "pending"
                )
            )

            synced = await self.db.execute(
                select(func.count(SyncQueue.operation_id)).where(
                    SyncQueue.hospital_id == hospital_id,
                    SyncQueue.status == "synced"
                )
            )

            failed = await self.db.execute(
                select(func.count(SyncQueue.operation_id)).where(
                    SyncQueue.hospital_id == hospital_id,
                    SyncQueue.status == "failed"
                )
            )

            return {
                "pending_operations": pending.scalar() or 0,
                "synced_operations": synced.scalar() or 0,
                "failed_operations": failed.scalar() or 0,
                "total_operations": (
                    (pending.scalar() or 0) + 
                    (synced.scalar() or 0) + 
                    (failed.scalar() or 0)
                )
            }
        except Exception as e:
            logger.error(f"Error getting sync statistics: {e}")
            return {}

    async def get_audit_summary(
        self,
        hospital_id: str,
        days: int = 7,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get recent audit log entries.
        
        Returns:
            Recent audit events
        """
        try:
            start_date = datetime.utcnow() - timedelta(days=days)

            logs = await self.db.execute(
                select(AuditLog).where(
                    AuditLog.hospital_id == hospital_id,
                    AuditLog.timestamp >= start_date
                ).order_by(AuditLog.timestamp.desc()).limit(limit)
            )

            entries = []
            for log in logs.scalars().all():
                entries.append({
                    "timestamp": log.timestamp.isoformat(),
                    "user_id": log.user_id,
                    "action": log.action,
                    "entity": log.entity,
                    "entity_id": log.entity_id,
                    "changes": {
                        "old": log.old_data,
                        "new": log.new_data
                    }
                })

            return entries
        except Exception as e:
            logger.error(f"Error getting audit summary: {e}")
            return []

    async def generate_report(
        self,
        hospital_id: str,
        report_type: str = "daily"
    ) -> Dict[str, Any]:
        """Generate comprehensive report.
        
        Args:
            hospital_id: Hospital ID
            report_type: "daily", "weekly", "monthly"
            
        Returns:
            Complete report with all metrics
        """
        try:
            days = {
                "daily": 1,
                "weekly": 7,
                "monthly": 30
            }.get(report_type, 7)

            overview = await self.get_hospital_overview(hospital_id)
            patient_analytics = await self.get_patient_analytics(hospital_id, days)
            diseases = await self.get_disease_distribution(hospital_id)
            risks = await self.get_risk_distribution(hospital_id)
            vitals = await self.get_vital_trends(hospital_id, days)
            sync_stats = await self.get_sync_statistics(hospital_id)
            audit = await self.get_audit_summary(hospital_id, days)

            return {
                "report_type": report_type,
                "generated_at": datetime.utcnow().isoformat(),
                "hospital_id": hospital_id,
                "overview": overview,
                "patient_analytics": patient_analytics,
                "disease_distribution": diseases,
                "risk_distribution": risks,
                "vital_trends": vitals,
                "sync_statistics": sync_stats,
                "recent_audit": audit[:10]  # Latest 10 entries
            }
        except Exception as e:
            logger.error(f"Error generating report: {e}")
            return {}
