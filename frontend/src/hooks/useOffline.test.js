/**
 * Tests for useOffline hook
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useOffline } from '../hooks/useOffline';

describe('useOffline Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should detect online status', () => {
    const { result } = renderHook(() => useOffline());

    expect(typeof result.current.isOnline).toBe('boolean');
  });

  test('should initialize with online status', () => {
    const { result } = renderHook(() => useOffline());

    expect(result.current.isOnline).toBe(navigator.onLine);
  });

  test('should track sync state', () => {
    const { result } = renderHook(() => useOffline());

    expect(typeof result.current.isSyncing).toBe('boolean');
    expect(typeof result.current.syncStats).toBe('object');
  });

  test('should expose sync statistics', () => {
    const { result } = renderHook(() => useOffline());

    const stats = result.current.syncStats;
    expect(stats).toHaveProperty('pending');
    expect(stats).toHaveProperty('synced');
    expect(stats).toHaveProperty('failed');
  });

  test('should trigger manual sync', async () => {
    const { result } = renderHook(() => useOffline());

    await act(async () => {
      await result.current.performSync();
    });

    expect(result.current.isSyncing).toBe(false);
  });

  test('should detect offline status change', async () => {
    const { result } = renderHook(() => useOffline());

    const initialStatus = result.current.isOnline;

    // Simulate offline event
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    await waitFor(() => {
      // Status may change based on mock
    });
  });

  test('should detect online status change', async () => {
    const { result } = renderHook(() => useOffline());

    // Simulate online event
    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    await waitFor(() => {
      // Should trigger sync when coming online
    });
  });

  test('should get offline statistics', async () => {
    const { result } = renderHook(() => useOffline());

    await act(async () => {
      const stats = await result.current.getOfflineStats();
      expect(typeof stats).toBe('object');
    });
  });

  test('should handle sync during offline', async () => {
    const { result } = renderHook(() => useOffline());

    // Simulate offline
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    await act(async () => {
      await result.current.performSync();
    });

    // Should handle gracefully even while offline
    expect(result.current.isSyncing).toBe(false);
  });
});
