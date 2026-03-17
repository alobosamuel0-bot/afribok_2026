/**
 * Jest setup file
 */

import '@testing-library/jest-dom';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock Service Worker
global.navigator.serviceWorker = {
  register: jest.fn(),
  ready: Promise.resolve({})
};

// Mock fetch
global.fetch = jest.fn();

// Suppress console errors in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};
