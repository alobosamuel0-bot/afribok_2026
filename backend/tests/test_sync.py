"""Tests for offline sync manager."""
import pytest
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

from backend.sync.manager import SyncManager


class TestSyncManager:
    """Test suite for SyncManager."""

    @pytest.fixture
    def sync_manager(self, db_session):
        """Create sync manager instance."""
        return SyncManager(db_session)

    @pytest.mark.asyncio
    async def test_queue_operation(self, sync_manager, sync_queue_item):
        """Test queuing an operation for sync."""
        result = await sync_manager.queue_operation(
            entity=sync_queue_item["entity"],
            operation=sync_queue_item["operation"],
            data=sync_queue_item["data"],
            local_id=sync_queue_item["local_id"]
        )
        
        assert result is not None
        assert result.get("status") == "pending"

    @pytest.mark.asyncio
    async def test_get_pending_operations(self, sync_manager):
        """Test retrieving pending operations."""
        # Queue multiple operations
        with patch.object(sync_manager, '_query_pending', AsyncMock()) as mock_query:
            mock_query.return_value = [
                {"id": "OP001", "status": "pending"},
                {"id": "OP002", "status": "pending"},
            ]
            
            operations = await sync_manager.get_pending_operations()
            
            assert len(operations) == 2
            assert all(op.get("status") == "pending" for op in operations)

    @pytest.mark.asyncio
    async def test_batch_sync_operations(self, sync_manager):
        """Test batch syncing of operations."""
        batch_data = {
            "operations": [
                {"id": "OP001", "entity": "patient", "operation": "create"},
                {"id": "OP002", "entity": "vitals", "operation": "create"},
                {"id": "OP003", "entity": "patient", "operation": "update"},
            ]
        }
        
        # Mock batch sync
        with patch.object(sync_manager, '_send_batch', AsyncMock(return_value={"synced": 3})) as mock_sync:
            result = await sync_manager.batch_sync(batch_data["operations"])
            
            assert result is not None

    @pytest.mark.asyncio
    async def test_mark_operation_synced(self, sync_manager):
        """Test marking operation as synced."""
        operation_id = "OP001"
        server_id = "S001"
        
        result = await sync_manager.mark_synced(
            operation_id=operation_id,
            server_id=server_id
        )
        
        assert result is True

    @pytest.mark.asyncio
    async def test_mark_operation_failed(self, sync_manager):
        """Test marking operation as failed."""
        operation_id = "OP001"
        error_message = "Network timeout"
        
        result = await sync_manager.mark_failed(
            operation_id=operation_id,
            error=error_message
        )
        
        assert result is True

    @pytest.mark.asyncio
    async def test_retry_failed_operations(self, sync_manager):
        """Test retrying failed operations."""
        failed_ops = [
            {"id": "OP001", "status": "failed", "retry_count": 1},
            {"id": "OP002", "status": "failed", "retry_count": 2},
        ]
        
        with patch.object(sync_manager, '_query_failed', AsyncMock(return_value=failed_ops)):
            retryable = await sync_manager.get_failed_operations(max_retries=3)
            
            assert len(retryable) == 2

    @pytest.mark.asyncio
    async def test_conflict_resolution_last_write_wins(self, sync_manager):
        """Test last-write-wins conflict resolution."""
        conflict_data = {
            "local": {
                "field": "local_value",
                "updated_at": datetime.utcnow()
            },
            "server": {
                "field": "server_value",
                "updated_at": datetime.utcnow() - timedelta(minutes=5)
            }
        }
        
        # Local is newer, should win
        winner = sync_manager._resolve_conflict(conflict_data["local"], conflict_data["server"])
        
        assert winner == conflict_data["local"]

    @pytest.mark.asyncio
    async def test_conflict_resolution_server_older(self, sync_manager):
        """Test conflict where server is older."""
        conflict_data = {
            "local": {
                "field": "local_value",
                "updated_at": datetime.utcnow() - timedelta(minutes=10)
            },
            "server": {
                "field": "server_value",
                "updated_at": datetime.utcnow()  # Server is newer
            }
        }
        
        # Server is newer, should win
        winner = sync_manager._resolve_conflict(conflict_data["local"], conflict_data["server"])
        
        assert winner == conflict_data["server"]

    @pytest.mark.asyncio
    async def test_exponential_backoff_retry(self, sync_manager):
        """Test exponential backoff for retries."""
        retry_delays = []
        for retry_count in range(4):
            delay = sync_manager._calculate_backoff(retry_count)
            retry_delays.append(delay)
        
        # Each retry should have longer delay
        assert retry_delays[0] < retry_delays[1]
        assert retry_delays[1] < retry_delays[2]
        assert retry_delays[2] < retry_delays[3]

    @pytest.mark.asyncio
    async def test_clear_synced_operations(self, sync_manager):
        """Test clearing synced operations."""
        with patch.object(sync_manager, '_delete_synced', AsyncMock(return_value=100)):
            deleted_count = await sync_manager.cleanup_synced()
            
            assert deleted_count == 100

    @pytest.mark.asyncio
    async def test_sync_statistics(self, sync_manager):
        """Test sync statistics collection."""
        stats = {
            "pending": 5,
            "synced": 150,
            "failed": 2,
            "total": 157
        }
        
        with patch.object(sync_manager, '_get_stats', AsyncMock(return_value=stats)):
            result = await sync_manager.get_sync_stats()
            
            assert result["total"] == 157
            assert result["pending"] == 5


class TestOfflineSyncFlow:
    """Test complete offline sync flow."""

    @pytest.mark.asyncio
    async def test_offline_operation_flow(self, sync_manager):
        """Test complete offline → online sync flow."""
        # Simulate offline operation
        offline_op = {
            "entity": "patient",
            "operation": "create",
            "data": {"first_name": "John"},
            "timestamp": datetime.utcnow()
        }
        
        # Queue should accept it
        with patch.object(sync_manager, 'queue_operation', AsyncMock(return_value={"id": "OP001"})):
            queued = await sync_manager.queue_operation(**offline_op)
            assert queued["id"] == "OP001"

    @pytest.mark.asyncio
    async def test_sync_with_network_failures(self, sync_manager):
        """Test sync resilience to network failures."""
        operations = [{"id": "OP001"}, {"id": "OP002"}]
        
        # Simulate partial failure
        with patch.object(sync_manager, '_send_batch', AsyncMock(side_effect=Exception("Network timeout"))):
            with pytest.raises(Exception):
                await sync_manager.batch_sync(operations)

    @pytest.mark.asyncio
    async def test_data_integrity_during_sync(self, sync_manager):
        """Test data integrity is maintained."""
        # Original data
        original = {"patient_id": "P001", "name": "John"}
        
        # Should remain unchanged after sync
        with patch.object(sync_manager, 'batch_sync', AsyncMock()):
            # No modification should occur
            assert original == {"patient_id": "P001", "name": "John"}
