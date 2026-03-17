/**
 * LoginPage Component
 * User authentication page
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Card,
  TextField,
  Button,
  Alert,
  Typography,
  CircularProgress,
  Paper
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import useAuth from '../hooks/useAuth';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loading, error } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!username || !password) {
      setFormError('Please enter username and password');
      return;
    }

    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      setFormError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}
    >
      <Container maxWidth="sm">
        <Card sx={{ boxShadow: 3, p: 4 }}>
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mb: 3
            }}
          >
            <Box
              sx={{
                bgcolor: 'primary.main',
                borderRadius: '50%',
                p: 1.5,
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <LockIcon sx={{ color: 'white', fontSize: 32 }} />
            </Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Afribok 2026
            </Typography>
            <Typography variant="subtitle1" color="textSecondary">
              Healthcare Management System
            </Typography>
          </Box>

          {/* Error Messages */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {typeof error === 'string' ? error : error.message}
            </Alert>
          )}
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Username"
              type="text"
              margin="normal"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              autoComplete="username"
            />

            <TextField
              fullWidth
              label="Password"
              type="password"
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
            />

            <Button
              fullWidth
              variant="contained"
              size="large"
              sx={{ mt: 3, mb: 2 }}
              type="submit"
              disabled={loading}
              startIcon={loading && <CircularProgress size={20} />}
            >
              {loading ? 'Logging in...' : 'Sign In'}
            </Button>
          </form>

          {/* Demo Info */}
          <Paper sx={{ p: 2, bgcolor: 'info.light', mt: 3 }}>
            <Typography variant="caption" component="div" sx={{ mb: 1 }}>
              <strong>Demo Credentials:</strong>
            </Typography>
            <Typography variant="caption" component="div">
              Username: demo@hospital.com
            </Typography>
            <Typography variant="caption" component="div">
              Password: Demo@12345
            </Typography>
          </Paper>

          {/* Features Info */}
          <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid #eee' }}>
            <Typography variant="subtitle2" gutterBottom>
              ✓ Features:
            </Typography>
            <Typography variant="caption" component="div" sx={{ mb: 0.5 }}>
              • Works offline with automatic sync
            </Typography>
            <Typography variant="caption" component="div" sx={{ mb: 0.5 }}>
              • Patient management & vital signs
            </Typography>
            <Typography variant="caption" component="div" sx={{ mb: 0.5 }}>
              • Bed allocation & capacity planning
            </Typography>
            <Typography variant="caption" component="div">
              • Real-time predictions & alerts
            </Typography>
          </Box>
        </Card>
      </Container>
    </Box>
  );
};

export default LoginPage;
