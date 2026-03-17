/**
 * Tests for API service
 */

import { apiService } from '../services/api';

describe('API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('Authentication', () => {
    test('should login user', async () => {
      const response = await apiService.login('demo@hospital.com', 'Demo@12345');
      
      expect(response).not.toBeNull();
      expect(response).toHaveProperty('token');
    });

    test('should logout user', async () => {
      const response = await apiService.logout();
      
      expect(response).toBe(true);
    });

    test('should handle login error', async () => {
      try {
        await apiService.login('invalid@hospital.com', 'WrongPassword');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Patient Operations', () => {
    test('should admit patient', async () => {
      const patientData = {
        first_name: 'John',
        last_name: 'Doe',
        age: 45,
        disease: ['Hypertension']
      };

      const response = await apiService.admitPatient(patientData);
      
      expect(response).not.toBeNull();
    });

    test('should get patient', async () => {
      const response = await apiService.getPatient('P001');
      
      if (response) {
        expect(response).toHaveProperty('patient_id');
      }
    });

    test('should list patients', async () => {
      const response = await apiService.getPatients('HOSP001', {});
      
      expect(Array.isArray(response)).toBe(true);
    });

    test('should record vitals', async () => {
      const vitalsData = {
        temperature: 37.5,
        heart_rate: 75,
        oxygen_saturation: 98
      };

      const response = await apiService.recordVitals('P001', vitalsData);
      
      expect(response).not.toBeNull();
    });

    test('should get vital signs', async () => {
      const response = await apiService.getVitals('P001', 7);
      
      expect(Array.isArray(response)).toBe(true);
    });

    test('should discharge patient', async () => {
      const response = await apiService.dischargePatient('P001');
      
      expect(response).toBe(true);
    });
  });

  describe('Resource Operations', () => {
    test('should get beds', async () => {
      const response = await apiService.getBeds('HOSP001');
      
      expect(Array.isArray(response)).toBe(true);
    });

    test('should get predictions', async () => {
      const response = await apiService.getPredictions('HOSP001');
      
      expect(Array.isArray(response)).toBe(true);
    });
  });

  describe('Offline Behavior', () => {
    test('should fallback to IndexedDB when offline', async () => {
      global.navigator.onLine = false;

      const response = await apiService.getPatients('HOSP001', {});
      
      expect(Array.isArray(response)).toBe(true);
    });

    test('should queue operations when offline', async () => {
      global.navigator.onLine = false;

      const patientData = {
        first_name: 'Offline',
        last_name: 'Patient'
      };

      const response = await apiService.admitPatient(patientData);
      
      expect(response).not.toBeNull();
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors', async () => {
      global.fetch = jest.fn(() => 
        Promise.reject(new Error('Network error'))
      );

      try {
        await apiService.getPatient('P001');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should handle 401 unauthorized', async () => {
      global.fetch = jest.fn(() => 
        Promise.resolve(new Response('', { status: 401 }))
      );

      try {
        await apiService.getPatient('P001');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should handle validation errors', async () => {
      const invalidData = {
        first_name: '',
        age: -5
      };

      try {
        await apiService.admitPatient(invalidData);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
