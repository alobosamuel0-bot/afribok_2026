/**
 * Main App Component
 * Routes and global state management
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';

// Pages
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import PatientDetailsPage from './pages/PatientDetailsPage';
import AdminPage from './pages/AdminPage';
import OnboardingPage from './pages/OnboardingPage';

// Hooks
import useAuth from './hooks/useAuth';
import useOffline from './hooks/useOffline';

// Components
import OfflineIndicator from './components/OfflineIndicator';
import SyncStatus from './components/SyncStatus';

// Material UI Theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0'
    },
    secondary: {
      main: '#dc004e',
      light: '#f05545',
      dark: '#9a0036'
    },
    success: {
      main: '#4caf50'
    },
    warning: {
      main: '#ff9800'
    },
    error: {
      main: '#f44336'
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff'
    }
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif'
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }
      }
    }
  }
});

// Protected Route Component
const ProtectedRoute = ({ element, isAuthenticated }) => {
  return isAuthenticated ? element : <Navigate to="/login" replace />;
};

function App() {
  const { isAuthenticated, user } = useAuth();
  const { isOnline, syncStats } = useOffline();
  const [showSyncStatus, setShowSyncStatus] = useState(false);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', height: '100vh' }}>
          {/* Offline Indicator - Always visible */}
          {!isOnline && <OfflineIndicator />}
          
          {/* Sync Status - Show when syncing or has pending */}
          {(syncStats.pending > 0 || showSyncStatus) && (
            <SyncStatus
              stats={syncStats}
              onClose={() => setShowSyncStatus(false)}
            />
          )}

          {/* Main Content */}
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <Routes>
              {/* Public Routes */}
              <Route
                path="/login"
                element={
                  isAuthenticated ? (
                    <Navigate to="/dashboard" replace />
                  ) : (
                    <LoginPage />
                  )
                }
              />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute
                    element={<Dashboard />}
                    isAuthenticated={isAuthenticated}
                  />
                }
              />

              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute
                    element={<OnboardingPage />}
                    isAuthenticated={isAuthenticated}
                  />
                }
              />

              <Route
                path="/patients/:patientId"
                element={
                  <ProtectedRoute
                    element={<PatientDetailsPage />}
                    isAuthenticated={isAuthenticated}
                  />
                }
              />

              <Route
                path="/admin"
                element={
                  <ProtectedRoute
                    element={<AdminPage />}
                    isAuthenticated={isAuthenticated && user?.role === 'admin'}
                  />
                }
              />

              {/* Redirect root to appropriate page */}
              <Route
                path="/"
                element={
                  isAuthenticated ? (
                    <Navigate to="/dashboard" replace />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />

              {/* 404 */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
