/**
 * useAuth Hook
 * Manages authentication state and operations
 */

import { useState, useCallback, useEffect } from 'react';
import apiService from '../services/api';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is already logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      // In real app, validate token and load user data
      setIsAuthenticated(true);
      // Load user from localStorage or validate from backend
      const userData = localStorage.getItem('userData');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    }
  }, []);

  const login = useCallback(async (username, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.login(username, password);
      
      const userData = {
        username,
        role: response.role || 'doctor',
        hospital_id: response.hospital_id || 1
      };
      
      setUser(userData);
      localStorage.setItem('userData', JSON.stringify(userData));
      setIsAuthenticated(true);
      
      return response;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await apiService.logout();
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('userData');
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkPermission = useCallback((permission) => {
    if (!user) return false;
    
    const rolePermissions = {
      admin: ['read:patients', 'write:patients', 'read:predictions', 'admin:users'],
      doctor: ['read:patients', 'write:patients', 'read:predictions'],
      nurse: ['read:patients', 'write:vitals'],
      patient: ['read:own-records']
    };
    
    const userPermissions = rolePermissions[user.role] || [];
    return userPermissions.includes(permission);
  }, [user]);

  return {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    checkPermission
  };
};

export default useAuth;
