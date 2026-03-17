/**
 * Tests for useAuth hook
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from '../hooks/useAuth';

describe('useAuth Hook', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('should initialize with unauthenticated state', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.error).toBeNull();
  });

  test('should login user successfully', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login('demo@hospital.com', 'Demo@12345');
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).not.toBeNull();
      expect(result.current.user.username).toBe('demo@hospital.com');
    });
  });

  test('should handle login error', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      try {
        await result.current.login('invalid@hospital.com', 'WrongPassword');
      } catch (error) {
        // Error expected
      }
    });

    expect(result.current.isAuthenticated).toBe(false);
  });

  test('should logout user', async () => {
    const { result } = renderHook(() => useAuth());

    // First login
    await act(async () => {
      await result.current.login('demo@hospital.com', 'Demo@12345');
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    // Then logout
    act(() => {
      result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  test('should check permission', () => {
    const { result } = renderHook(() => useAuth());

    const hasPermission = result.current.checkPermission('read:patients');

    expect(typeof hasPermission).toBe('boolean');
  });

  test('should persist authentication state', async () => {
    const { result: result1 } = renderHook(() => useAuth());

    await act(async () => {
      await result1.current.login('demo@hospital.com', 'Demo@12345');
    });

    await waitFor(() => {
      expect(result1.current.isAuthenticated).toBe(true);
    });

    // Simulate new component mount
    const { result: result2 } = renderHook(() => useAuth());

    // Should restore authentication from storage
    await waitFor(() => {
      expect(result2.current.isAuthenticated).toBe(true);
    });
  });
});
