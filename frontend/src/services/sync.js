/**
 * IndexedDB Sync Service
 * Manages offline-first data storage and synchronization
 * All data is stored locally and synced to backend when available
 */

import Dexie from 'dexie';

// Initialize IndexedDB database
const db = new Dexie('AfribokDB');
db.version(1).stores({
  patients: '++id, externalId, nationalId, hospitalId, status',
  vitals: '++id, patientId, timestamp',
  audit_logs: '++id, patientId, createdAt',
  sync_queue: '++id, entity, status, timestamp',
  beds: '++id, hospitalId, status',
  cache: 'key'
});

export const syncService = {
  /**
   * Store patient locally
   */
  async storePatient(patient) {
    try {
      const stored = await db.patients.add({
        ...patient,
        localCreatedAt: new Date().toISOString(),
        synced: false
      });
      
      // Queue for sync
      await this.queueForSync('patient', 'INSERT', patient);
      
      return stored;
    } catch (error) {
      console.error('Error storing patient:', error);
      throw error;
    }
  },

  /**
   * Get patient from local storage
   */
  async getPatient(patientId) {
    try {
      return await db.patients.get(patientId);
    } catch (error) {
      console.error('Error getting patient:', error);
      throw error;
    }
  },

  /**
   * Get all patients locally
   */
  async getAllPatients(hospitalId) {
    try {
      return await db.patients
        .where('hospitalId')
        .equals(hospitalId)
        .toArray();
    } catch (error) {
      console.error('Error getting patients:', error);
      throw error;
    }
  },

  /**
   * Record vital signs
   */
  async storeVitals(patientId, vitals) {
    try {
      const vital = {
        patientId,
        ...vitals,
        timestamp: new Date().toISOString(),
        synced: false
      };
      
      const stored = await db.vitals.add(vital);
      await this.queueForSync('vitals', 'INSERT', vital);
      
      return stored;
    } catch (error) {
      console.error('Error storing vitals:', error);
      throw error;
    }
  },

  /**
   * Get patient vitals
   */
  async getPatientVitals(patientId, days = 7) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      return await db.vitals
        .where('patientId')
        .equals(patientId)
        .filter(v => new Date(v.timestamp) >= cutoffDate)
        .toArray();
    } catch (error) {
      console.error('Error getting vitals:', error);
      throw error;
    }
  },

  /**
   * Queue operation for sync
   */
  async queueForSync(entity, operation, data) {
    try {
      await db.sync_queue.add({
        entity,
        operation,
        data: JSON.parse(JSON.stringify(data)), // Deep clone
        status: 'pending',
        timestamp: new Date().toISOString(),
        retryCount: 0
      });
    } catch (error) {
      console.error('Error queueing sync:', error);
    }
  },

  /**
   * Get pending sync operations
   */
  async getPendingOperations() {
    try {
      return await db.sync_queue
        .where('status')
        .equals('pending')
        .toArray();
    } catch (error) {
      console.error('Error getting pending operations:', error);
      throw error;
    }
  },

  /**
   * Mark operation as synced
   */
  async markAsSynced(operationId) {
    try {
      await db.sync_queue.update(operationId, { status: 'synced' });
    } catch (error) {
      console.error('Error marking as synced:', error);
    }
  },

  /**
   * Mark operation as failed
   */
  async markAsFailed(operationId, errorMessage) {
    try {
      const op = await db.sync_queue.get(operationId);
      await db.sync_queue.update(operationId, {
        status: 'failed',
        retryCount: (op.retryCount || 0) + 1,
        lastError: errorMessage,
        lastRetryAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error marking as failed:', error);
    }
  },

  /**
   * Clear sync queue (after successful sync)
   */
  async clearSyncedOperations() {
    try {
      await db.sync_queue
        .where('status')
        .equals('synced')
        .delete();
    } catch (error) {
      console.error('Error clearing synced operations:', error);
    }
  },

  /**
   * Cache data with TTL
   */
  async cacheData(key, data, ttlMinutes = 60) {
    try {
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + ttlMinutes);
      
      await db.cache.put({
        key,
        data: JSON.parse(JSON.stringify(data)),
        expiresAt: expiresAt.toISOString()
      });
    } catch (error) {
      console.error('Error caching data:', error);
    }
  },

  /**
   * Get cached data
   */
  async getCachedData(key) {
    try {
      const cached = await db.cache.get(key);
      
      if (!cached) return null;
      
      // Check if expired
      if (new Date(cached.expiresAt) < new Date()) {
        await db.cache.delete(key);
        return null;
      }
      
      return cached.data;
    } catch (error) {
      console.error('Error getting cached data:', error);
      return null;
    }
  },

  /**
   * Store bed status
   */
  async storeBeds(beds) {
    try {
      await db.beds.clear();
      await db.beds.bulkAdd(beds);
    } catch (error) {
      console.error('Error storing beds:', error);
    }
  },

  /**
   * Get available beds
   */
  async getAvailableBeds(hospitalId) {
    try {
      return await db.beds
        .where('hospitalId')
        .equals(hospitalId)
        .filter(b => b.status === 'available')
        .toArray();
    } catch (error) {
      console.error('Error getting available beds:', error);
      throw error;
    }
  },

  /**
   * Get database stats
   */
  async getStats() {
    try {
      const [patientCount, vitalsCount, queueCount, bedCount] = await Promise.all([
        db.patients.count(),
        db.vitals.count(),
        db.sync_queue.where('status').equals('pending').count(),
        db.beds.count()
      ]);
      
      return {
        patients: patientCount,
        vitals: vitalsCount,
        pendingSyncs: queueCount,
        beds: bedCount
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return null;
    }
  },

  /**
   * Clear all data (for logout)
   */
  async clearAll() {
    try {
      await db.patients.clear();
      await db.vitals.clear();
      await db.audit_logs.clear();
      await db.sync_queue.clear();
      await db.beds.clear();
      // Keep cache for some shared data
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  }
};

export default syncService;
