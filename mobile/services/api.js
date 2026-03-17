import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:8000'; // Update with actual API endpoint

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Add token to requests
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userId');
      // Redirect to login
    }
    return Promise.reject(error);
  }
);

export default api;
