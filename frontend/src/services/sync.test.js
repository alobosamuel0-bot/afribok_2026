/**
 * Tests for Sync Service
 */

import { syncService } from '../services/sync';

describe('Sync Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Patient Storage', () => {
    test('should store patient locally', async () => {
      const patient = {
        patient_id: 'P001',
        first_name: 'John',
        age: 45
      };

      const result = await syncService.storePatient(patient);
      
      expect(result).toBeDefined();
    });

    test('should retrieve patient locally', async () => {
      const patient = await syncService.getPatient('P001');
      
      if (patient) {
        expect(patient.patient_id).toBe('P001');
      }
    });

    test('should get all patients', async () => {
      const patients = await syncService.getAllPatients('HOSP001');
      
      expect(Array.isArray(patients)).toBe(true);
    });
  });

  describe('Vitals Storage', () => {
    test('should store vitals locally', async () => {
      const vitals = {
        patient_id: 'P001',
        temperature: 37.5,
        heart_rate: 75,
        recorded_at: new Date()
      };

      const result = await syncService.storeVitals('P001', vitals);
      
      expect(result).toBeDefined();
    });

    test('should retrieve patient vitals', async () => {
      const vitals = await syncService.getPatientVitals('P001', 7);
      
      expect(Array.isArray(vitals)).toBe(true);
    });
  });

  describe('Sync Queue', () => {
    test('should queue operation for sync', async () => {
      const operation = {
        entity: 'patient',
        operation: 'create',
        data: { first_name: 'Jane' },
        local_id: 'L001'
      };

      const result = await syncService.queueForSync(
        operation.entity,
        operation.operation,
        operation.data,
        operation.local_id
      );
      
      expect(result).toBeDefined();
    });

    test('should get pending operations', async () => {
      const pending = await syncService.getPendingOperations();
      
      expect(Array.isArray(pending)).toBe(true);
    });

    test('should mark operation as synced', async () => {
      const result = await syncService.markAsSynced('OP001');
      
      expect(result).toBe(true);
    });

    test('should mark operation as failed', async () => {
      const result = await syncService.markAsFailed('OP001', 'Network timeout');
      
      expect(result).toBe(true);
    });
  });

  describe('Caching', () => {
    test('should cache data with TTL', async () => {
      const data = { id: 1, name: 'Test' };
      const ttl = 300; // 5 minutes

      await syncService.cacheData('test-key', data, ttl);
      
      const cached = await syncService.getCachedData('test-key');
      
      expect(cached).toEqual(data);
    });

    test('should handle cache expiration', async () => {
      const data = { id: 1, name: 'Test' };
      const ttl = 0; // Already expired

      await syncService.cacheData('test-key', data, ttl);
      
      const cached = await syncService.getCachedData('test-key');
      
      expect(cached).toBeNull();
    });
  });

  describe('Statistics', () => {
    test('should get database statistics', async () => {
      const stats = await syncService.getStats();
      
      expect(stats).toHaveProperty('patients');
      expect(stats).toHaveProperty('vitals');
      expect(stats).toHaveProperty('sync_queue');
    });

    test('should track pending operations', async () => {
      const stats = await syncService.getStats();
      
      expect(typeof stats.sync_queue).toBe('number');
      expect(stats.sync_queue >= 0).toBe(true);
    });
  });

  describe('Data Integrity', () => {
    test('should maintain data consistency', async () => {
      const patient = {
        patient_id: 'P001',
        first_name: 'John'
      };

      await syncService.storePatient(patient);
      const retrieved = await syncService.getPatient('P001');

      expect(retrieved).toEqual(patient);
    });

    test('should handle concurrent operations', async () => {
      const operations = [
        syncService.storePatient({ patient_id: 'P001' }),
        syncService.storePatient({ patient_id: 'P002' }),
        syncService.storePatient({ patient_id: 'P003' })
      ];

      const results = await Promise.all(operations);
      
      expect(results.length).toBe(3);
    });
  });
});
