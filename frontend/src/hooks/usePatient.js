/**
 * usePatient Hook
 * Manages patient data operations
 */

import { useState, useCallback, useEffect } from 'react';
import apiService from '../services/api';
import syncService from '../services/sync';

export const usePatient = (hospitalId) => {
  const [patients, setPatients] = useState([]);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load patients
  const loadPatients = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await apiService.getPatients(hospitalId, filters);
      setPatients(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      setError(err);
      console.error('Failed to load patients:', err);
    } finally {
      setLoading(false);
    }
  }, [hospitalId]);

  // Load patient details
  const loadPatient = useCallback(async (patientId) => {
    setLoading(true);
    setError(null);
    
    try {
      const patient = await apiService.getPatient(patientId);
      setCurrentPatient(patient?.data || patient);
      return patient;
    } catch (err) {
      setError(err);
      console.error('Failed to load patient:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Admit patient
  const admitPatient = useCallback(async (patientData) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiService.admitPatient({
        ...patientData,
        hospital_id: hospitalId
      });
      
      // Reload patients list
      await loadPatients();
      
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [hospitalId, loadPatients]);

  // Record vitals
  const recordVitals = useCallback(async (patientId, vitalsData) => {
    try {
      const result = await apiService.recordVitals(patientId, vitalsData);
      
      // Update current patient if needed
      if (currentPatient?.id === patientId) {
        setCurrentPatient(prev => ({
          ...prev,
          last_vitals: vitalsData,
          last_vitals_time: new Date().toISOString()
        }));
      }
      
      return result;
    } catch (err) {
      setError(err);
      throw err;
    }
  }, [currentPatient?.id]);

  // Discharge patient
  const dischargePatient = useCallback(async (patientId) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiService.dischargePatient(patientId);
      
      // Remove from list or mark as discharged
      setPatients(prev => prev.filter(p => p.id !== patientId));
      
      if (currentPatient?.id === patientId) {
        setCurrentPatient(null);
      }
      
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentPatient?.id]);

  // Get patient vitals
  const loadVitals = useCallback(async (patientId, days = 7) => {
    try {
      return await apiService.getVitals(patientId, days);
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  // Get beds
  const loadBeds = useCallback(async () => {
    try {
      return await apiService.getBeds(hospitalId);
    } catch (err) {
      setError(err);
      throw err;
    }
  }, [hospitalId]);

  // Get predictions
  const loadPredictions = useCallback(async () => {
    try {
      return await apiService.getPredictions(hospitalId);
    } catch (err) {
      setError(err);
      throw err;
    }
  }, [hospitalId]);

  return {
    patients,
    currentPatient,
    loading,
    error,
    loadPatients,
    loadPatient,
    admitPatient,
    recordVitals,
    dischargePatient,
    loadVitals,
    loadBeds,
    loadPredictions,
    setCurrentPatient
  };
};

export default usePatient;
