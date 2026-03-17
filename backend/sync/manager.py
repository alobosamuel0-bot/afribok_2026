"""
Offline-First Sync Engine
Manages data synchronization between local and central databases
"""

from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
import json
import structlog
import asyncio

from db.models import SyncQueue, Patient, PatientVitals
from db.connection import DatabaseManager
from core.config import settings


logger = structlog.get_logger(__name__)


class SyncManager:
    """Manage offline-first data synchronization"""

    @staticmethod
    async def queue_operation(
        db: AsyncSession,
        entity_type: str,
        entity_id: int,
        operation: str,
        payload: dict,
        hospital_id: Optional[int] = None
    ):
        """Queue an operation for sync"""
        
        sync_entry = SyncQueue(
            entity_type=entity_type,
            entity_id=entity_id,
            operation=operation,
            payload=json.dumps(payload),
        )
        
        db.add(sync_entry)
        await db.commit()
        
        logger.info(
            "sync_operation_queued",
            entity_type=entity_type,
            entity_id=entity_id,
            operation=operation,
            hospital_id=hospital_id
        )

    @staticmethod
    async def sync_pending_operations(
        batch_size: int = 1000,
        retry_limit: int = 3
    ) -> Dict[str, int]:
        """Sync pending operations to central database"""
        
        if settings.OFFLINE_MODE or not settings.CENTRAL_DB_URL:
            logger.info("sync_skipped", reason="offline_mode_or_no_central_db")
            return {"synced": 0, "failed": 0, "pending": 0}

        try:
            # Get local session
            local_session = await DatabaseManager.get_local_session().__aenter__()
            central_session = await DatabaseManager.get_central_session().__aenter__()

            # Get pending operations
            pending = await local_session.query(SyncQueue).filter(
                SyncQueue.synced == False,
                SyncQueue.is_deleted == False,
                SyncQueue.sync_attempt_count < retry_limit
            ).limit(batch_size).all()

            synced_count = 0
            failed_count = 0

            for sync_op in pending:
                try:
                    # Apply operation to central database
                    await SyncManager._apply_operation(
                        central_session,
                        sync_op.entity_type,
                        sync_op.operation,
                        json.loads(sync_op.payload)
                    )

                    # Mark as synced
                    sync_op.synced = True
                    sync_op.last_sync_attempt = datetime.utcnow()
                    local_session.add(sync_op)

                    synced_count += 1

                    logger.info(
                        "sync_operation_success",
                        entity_type=sync_op.entity_type,
                        entity_id=sync_op.entity_id,
                        operation=sync_op.operation
                    )

                except Exception as e:
                    sync_op.sync_attempt_count += 1
                    sync_op.last_sync_attempt = datetime.utcnow()
                    local_session.add(sync_op)
                    failed_count += 1

                    logger.error(
                        "sync_operation_failed",
                        entity_type=sync_op.entity_type,
                        error=str(e),
                        attempt=sync_op.sync_attempt_count
                    )

            # Commit changes
            await local_session.commit()
            await central_session.commit()

            # Get remaining pending count
            pending_count = await local_session.query(SyncQueue).filter(
                SyncQueue.synced == False,
                SyncQueue.is_deleted == False
            ).count()

            await local_session.close()
            await central_session.close()

            result = {
                "synced": synced_count,
                "failed": failed_count,
                "pending": pending_count
            }

            logger.info("sync_batch_complete", **result)
            return result

        except Exception as e:
            logger.error("sync_batch_failed", error=str(e), exc_info=True)
            raise

    @staticmethod
    async def _apply_operation(
        db: AsyncSession,
        entity_type: str,
        operation: str,
        payload: dict
    ):
        """Apply sync operation to database"""

        if entity_type == "patient":
            await SyncManager._apply_patient_operation(db, operation, payload)
        elif entity_type == "patient_vitals":
            await SyncManager._apply_vitals_operation(db, operation, payload)
        # Add more entity types as needed

    @staticmethod
    async def _apply_patient_operation(db: AsyncSession, operation: str, payload: dict):
        """Apply patient record operation"""

        if operation == "create":
            patient = Patient(**payload)
            db.add(patient)

        elif operation == "update":
            patient_id = payload.pop("patient_id")
            patient = await db.query(Patient).filter(
                Patient.patient_id == patient_id
            ).first()
            if patient:
                for key, value in payload.items():
                    setattr(patient, key, value)
                patient.updated_at = datetime.utcnow()
                db.add(patient)

        elif operation == "delete":
            patient_id = payload.get("patient_id")
            patient = await db.query(Patient).filter(
                Patient.patient_id == patient_id
            ).first()
            if patient:
                patient.is_deleted = True  # Soft delete
                patient.updated_at = datetime.utcnow()
                db.add(patient)

    @staticmethod
    async def _apply_vitals_operation(db: AsyncSession, operation: str, payload: dict):
        """Apply patient vitals operation"""

        if operation == "create":
            vitals = PatientVitals(**payload)
            db.add(vitals)

        elif operation == "update":
            vital_id = payload.pop("vital_id")
            vital = await db.query(PatientVitals).filter(
                PatientVitals.vital_id == vital_id
            ).first()
            if vital:
                for key, value in payload.items():
                    setattr(vital, key, value)
                db.add(vital)

    @staticmethod
    async def handle_conflicts(
        local_data: dict,
        central_data: dict,
        strategy: str = "last_write_wins"
    ) -> dict:
        """
        Handle sync conflicts

        Strategies:
        - last_write_wins: Latest modification timestamp wins
        - local_priority: Local data takes precedence
        - central_priority: Central data takes precedence
        - manual_review: Flag for manual resolution
        """

        if strategy == "last_write_wins":
            local_updated = local_data.get("updated_at", datetime.min)
            central_updated = central_data.get("updated_at", datetime.min)
            
            if local_updated >= central_updated:
                return local_data
            else:
                return central_data

        elif strategy == "local_priority":
            return local_data

        elif strategy == "central_priority":
            return central_data

        else:
            # Flag for manual review
            logger.warning(
                "sync_conflict_detected",
                strategy=strategy,
                local_id=local_data.get("id"),
                central_id=central_data.get("id")
            )
            return local_data  # Default to local for safety


# Background sync task
async def periodic_sync():
    """Run sync periodically"""
    
    while True:
        try:
            await asyncio.sleep(settings.SYNC_INTERVAL_SECONDS)
            
            if not settings.OFFLINE_MODE:
                result = await SyncManager.sync_pending_operations()
                logger.debug("periodic_sync_complete", **result)
                
        except Exception as e:
            logger.error("periodic_sync_error", error=str(e), exc_info=True)
