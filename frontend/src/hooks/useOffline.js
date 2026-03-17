/**
 * useOffline Hook
 * Manages offline status and background sync
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import apiService from '../services/api';
import syncService from '../services/sync';

export const useOffline = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStats, setSyncStats] = useState({
    pending: 0,
    synced: 0,
    failed: 0
  });
  const syncIntervalRef = useRef(null);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Trigger sync when coming back online
      performSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Periodic sync check (every 30 seconds when online)
  useEffect(() => {
    const updateStats = async () => {
      const stats = await syncService.getStats();
      if (stats) {
        setSyncStats(prev => ({
          ...prev,
          pending: stats.pendingSyncs
        }));
      }
    };

    updateStats();

    if (isOnline) {
      syncIntervalRef.current = setInterval(updateStats, 30000);
    }

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [isOnline]);

  const performSync = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    try {
      const result = await apiService.syncPendingOperations();
      setSyncStats({
        synced: result.synced,
        failed: result.failed,
        pending: Math.max(0, result.total - result.synced - result.failed)
      });

      if (result.synced > 0) {
        console.log(`✓ Synced ${result.synced} operations`);
      }
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing]);

  const getOfflineStats = useCallback(async () => {
    const stats = await syncService.getStats();
    return stats || { patients: 0, vitals: 0, pendingSyncs: 0, beds: 0 };
  }, []);

  return {
    isOnline,
    isSyncing,
    syncStats,
    performSync,
    getOfflineStats
  };
};

export default useOffline;
