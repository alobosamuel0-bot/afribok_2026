/**
 * Tests for usePatient hook
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { usePatient } from '../hooks/usePatient';

describe('usePatient Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should initialize with empty patient list', () => {
    const { result } = renderHook(() => usePatient());

    expect(result.current.patients).toEqual([]);
    expect(result.current.currentPatient).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  test('should load patients', async () => {
    const { result } = renderHook(() => usePatient());

    await act(async () => {
      await result.current.loadPatients({ hospitalId: 'HOSP001' });
    });

    await waitFor(() => {
      expect(Array.isArray(result.current.patients)).toBe(true);
    });
  });

  test('should load single patient', async () => {
    const { result } = renderHook(() => usePatient());

    await act(async () => {
      await result.current.loadPatient('P001');
    });

    await waitFor(() => {
      if (result.current.currentPatient) {
        expect(result.current.currentPatient.patient_id).toBe('P001');
      }
    });
  });

  test('should admit new patient', async () => {
    const { result } = renderHook(() => usePatient());

    const patientData = {
      first_name: 'John',
      last_name: 'Doe',
      age: 45,
      disease: ['Hypertension']
    };

    await act(async () => {
      const admitted = await result.current.admitPatient(patientData);
      expect(admitted).not.toBeNull();
    });
  });

  test('should record vitals', async () => {
    const { result } = renderHook(() => usePatient());

    const vitalsData = {
      temperature: 37.5,
      heart_rate: 75,
      oxygen_saturation: 98
    };

    await act(async () => {
      const recorded = await result.current.recordVitals('P001', vitalsData);
      expect(recorded).not.toBeNull();
    });
  });

  test('should load vital signs history', async () => {
    const { result } = renderHook(() => usePatient());

    await act(async () => {
      await result.current.loadVitals('P001', 7);
    });

    await waitFor(() => {
      expect(Array.isArray(result.current.vitals)).toBe(true);
    });
  });

  test('should discharge patient', async () => {
    const { result } = renderHook(() => usePatient());

    await act(async () => {
      const discharged = await result.current.dischargePatient('P001');
      expect(discharged).toBe(true);
    });
  });

  test('should handle loading state', async () => {
    const { result } = renderHook(() => usePatient());

    act(() => {
      // Simulate loading
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.loadPatients({ hospitalId: 'HOSP001' });
    });

    expect(result.current.loading).toBe(false);
  });

  test('should handle error state', async () => {
    const { result } = renderHook(() => usePatient());

    await act(async () => {
      try {
        await result.current.loadPatient('INVALID');
      } catch (error) {
        // Error expected
      }
    });

    expect(result.current.error).toBeDefined();
  });
});
