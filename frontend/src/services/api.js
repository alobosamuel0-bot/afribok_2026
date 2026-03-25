/**
 * API Client Service
 * Handles all backend communication with offline fallback
 */

import axios from 'axios';
import syncService from './sync';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle responses and errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, try refresh
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken
        });
        
        localStorage.setItem('accessToken', response.data.access_token);
        
        // Retry original request
        error.config.headers.Authorization = `Bearer ${response.data.access_token}`;
        return api(error.config);
      } catch (err) {
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export const apiService = {
  /**
   * Check if backend is available
   */
  async isOnline() {
    try {
      const response = await api.get('/health', { timeout: 2000 });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  },

  /**
   * Authenticate user
   */
  async login(username, password) {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        username,
        password
      });
      
      const { access_token, refresh_token, expires_in } = response.data;
      
      localStorage.setItem('accessToken', access_token);
      localStorage.setItem('refreshToken', refresh_token);
      localStorage.setItem('expiresIn', expires_in);
      localStorage.setItem('loginTime', new Date().toISOString());
      
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Login failed';
    }
  },

  /**
   * Logout user
   */
  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('expiresIn');
      localStorage.removeItem('loginTime');
      await syncService.clearAll();
    }
  },

  /**
   * Admit patient
   */
  async admitPatient(patientData) {
    try {
      const response = await api.post('/patients/admit', patientData);
      return response.data;
    } catch (error) {
      if (navigator.onLine === false) {
        // Store locally if offline
        const patient = {
          ...patientData,
          externalId: `LOCAL-${Date.now()}`,
          status: 'pending-admission'
        };
        await syncService.storePatient(patient);
        return { success: true, offline: true, data: patient };
      }
      throw error.response?.data?.message || 'Failed to admit patient';
    }
  },

  /**
   * Get patient details
   */
  async getPatient(patientId) {
    try {
      const response = await api.get(`/patients/${patientId}`);
      
      // Cache the result
      await syncService.cacheData(`patient-${patientId}`, response.data);
      
      return response.data;
    } catch (error) {
      if (navigator.onLine === false) {
        // Try local cache
        return await syncService.getPatient(patientId);
      }
      throw error.response?.data?.message || 'Failed to fetch patient';
    }
  },

  /**
   * Get list of patients
   */
  async getPatients(hospitalId, filters = {}) {
    try {
      const params = new URLSearchParams({
        hospital_id: hospitalId,
        ...filters
      });
      
      const response = await api.get(`/patients?${params}`);
      
      // Cache results
      await syncService.cacheData(
        `patients-${hospitalId}`,
        response.data,
        30 // 30 minute cache
      );
      
      return response.data;
    } catch (error) {
      if (navigator.onLine === false) {
        // Return local patients
        return await syncService.getAllPatients(hospitalId);
      }
      throw error.response?.data?.message || 'Failed to fetch patients';
    }
  },

  /**
   * Record patient vitals
   */
  async recordVitals(patientId, vitalsData) {
    try {
      const response = await api.post(`/patients/${patientId}/vitals`, vitalsData);
      return response.data;
    } catch (error) {
      if (navigator.onLine === false) {
        // Store vitals locally
        await syncService.storeVitals(patientId, vitalsData);
        return { success: true, offline: true };
      }
      throw error.response?.data?.message || 'Failed to record vitals';
    }
  },

  /**
   * Get patient vitals
   */
  async getVitals(patientId, days = 7) {
    try {
      const response = await api.get(`/patients/${patientId}/vitals?days=${days}`);
      
      // Cache vitals
      await syncService.cacheData(`vitals-${patientId}`, response.data);
      
      return response.data;
    } catch (error) {
      if (navigator.onLine === false) {
        // Return local vitals
        return await syncService.getPatientVitals(patientId, days);
      }
      throw error.response?.data?.message || 'Failed to fetch vitals';
    }
  },

  /**
   * Discharge patient
   */
  async dischargePatient(patientId) {
    try {
      const response = await api.post(`/patients/${patientId}/discharge`);
      
      // Update local cache
      await syncService.queueForSync('patient', 'UPDATE', {
        id: patientId,
        status: 'discharged'
      });
      
      return response.data;
    } catch (error) {
      if (navigator.onLine === false) {
        await syncService.queueForSync('patient', 'UPDATE', {
          id: patientId,
          status: 'discharged'
        });
        return { success: true, offline: true };
      }
      throw error.response?.data?.message || 'Failed to discharge patient';
    }
  },

  /**
   * Get bed availability
   */
  async getBeds(hospitalId) {
    try {
      const response = await api.get(`/beds?hospital_id=${hospitalId}`);
      
      // Cache bed data
      await syncService.storeBeds(response.data);
      
      return response.data;
    } catch (error) {
      if (navigator.onLine === false) {
        return await syncService.getAvailableBeds(hospitalId);
      }
      throw error.response?.data?.message || 'Failed to fetch beds';
    }
  },

  /**
   * Get predictions
   */
  async getPredictions(hospitalId) {
    try {
      const response = await api.get(`/predictions/capacity?hospital_id=${hospitalId}`);
      
      // Cache predictions
      await syncService.cacheData(`predictions-${hospitalId}`, response.data);
      
      return response.data;
    } catch (error) {
      // Return cached if available
      if (navigator.onLine === false) {
        return await syncService.getCachedData(`predictions-${hospitalId}`);
      }
      
      // Return empty if no cache
      return {
        daily_forecast: [],
        capacity_status: 'unknown',
        alerts: []
      };
    }
  },

  /**
   * Onboarding: Get welcome guidelines
   */
  async getWelcome() {
    const response = await api.get('/onboarding/welcome');
    return response;
  },

  /**
   * Onboarding: Integrate data
   */
  async integrateData(data) {
    const response = await api.post('/onboarding/integrate-data', data);
    return response;
  },

  /**
   * Onboarding: Get training course
   */
  async getTrainingCourse() {
    const response = await api.get('/onboarding/training-course');
    return response;
  },

  /**
   * Onboarding: Setup demo environment
   */
  async getDemoEnvironment() {
    const response = await api.get('/onboarding/demo-environment');
    return response;
  },

  /**
   * Sync pending operations to backend
   */
  async syncPendingOperations() {
    const pending = await syncService.getPendingOperations();
    
    if (pending.length === 0) return { synced: 0 };
    
    let synced = 0;
    let failed = 0;

    for (const operation of pending) {
      try {
        let response;
        
        switch (operation.entity) {
          case 'patient':
            if (operation.operation === 'INSERT') {
              response = await api.post('/patients/admit', operation.data);
            } else if (operation.operation === 'UPDATE') {
              response = await api.put(`/patients/${operation.data.id}`, operation.data);
            }
            break;
            
          case 'vitals':
            response = await api.post(
              `/patients/${operation.data.patientId}/vitals`,
              operation.data
            );
            break;
            
          default:
            console.warn('Unknown entity type:', operation.entity);
        }
        
        if (response) {
          await syncService.markAsSynced(operation.id);
          synced++;
        }
      } catch (error) {
        console.error(`Failed to sync ${operation.entity}:`, error);
        await syncService.markAsFailed(operation.id, error.message);
        failed++;
      }
    }
    
    // Clear synced operations
    await syncService.clearSyncedOperations();
    
    return { synced, failed, total: pending.length };
  }
};

export default apiService;
