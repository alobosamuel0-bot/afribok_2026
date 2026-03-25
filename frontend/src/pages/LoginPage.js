import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Box, Card, TextField, Button, Alert, Typography, 
  CircularProgress, Paper, Tabs, Tab, InputAdornment
} from '@mui/material';
import { Lock, Phone, Email, Security } from '@mui/icons-material';
import useAuth from '../hooks/useAuth';
import api from '../services/api';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loading: authLoading, error: authError } = useAuth();
  
  const [tab, setTab] = useState(0);
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRequestOtp = async () => {
    if (!identifier) {
      setError('Please enter your email or phone number');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/onboarding/request-otp', { identifier });
      setOtpSent(true);
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      setError('Please enter the OTP');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/onboarding/verify-otp', { identifier, otp });
      localStorage.setItem('accessToken', response.data.access_token);
      // Redirect to onboarding for new users
      navigate('/onboarding');
    } catch (err) {
      setError('Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter username and password');
      return;
    }
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)' 
    }}>
      <Container maxWidth="sm">
        <Card sx={{ boxShadow: 10, p: 4, borderRadius: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Security color="primary" sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Afribok 2026</Typography>
            <Typography variant="subtitle1" color="textSecondary">Healthcare Management System</Typography>
          </Box>

          <Tabs value={tab} onChange={(e, v) => setTab(v)} centered sx={{ mb: 3 }}>
            <Tab label="OTP Login" />
            <Tab label="Password" />
          </Tabs>

          {(error || authError) && (
            <Alert severity="error" sx={{ mb: 2 }}>{error || authError}</Alert>
          )}

          {tab === 0 ? (
            <Box>
              {!otpSent ? (
                <>
                  <TextField
                    fullWidth label="Email or Phone Number"
                    margin="normal" value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          {identifier.includes('@') ? <Email /> : <Phone />}
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Button
                    fullWidth variant="contained" size="large" sx={{ mt: 2 }}
                    onClick={handleRequestOtp} disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Send OTP'}
                  </Button>
                </>
              ) : (
                <>
                  <Typography variant="body2" sx={{ mb: 2, textAlign: 'center' }}>
                    OTP sent to <strong>{identifier}</strong>
                  </Typography>
                  <TextField
                    fullWidth label="Enter 6-digit OTP"
                    margin="normal" value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    inputProps={{ maxLength: 6, style: { textAlign: 'center', letterSpacing: 8, fontSize: 24 } }}
                  />
                  <Button
                    fullWidth variant="contained" size="large" sx={{ mt: 2 }}
                    onClick={handleVerifyOtp} disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Verify & Login'}
                  </Button>
                  <Button fullWidth sx={{ mt: 1 }} onClick={() => setOtpSent(false)}>
                    Change Email/Phone
                  </Button>
                </>
              )}
            </Box>
          ) : (
            <form onSubmit={handlePasswordLogin}>
              <TextField
                fullWidth label="Username" margin="normal"
                value={username} onChange={(e) => setUsername(e.target.value)}
              />
              <TextField
                fullWidth label="Password" type="password" margin="normal"
                value={password} onChange={(e) => setPassword(e.target.value)}
              />
              <Button
                fullWidth variant="contained" size="large" sx={{ mt: 2 }}
                type="submit" disabled={authLoading}
              >
                {authLoading ? <CircularProgress size={24} /> : 'Sign In'}
              </Button>
            </form>
          )}

          <Paper sx={{ p: 2, bgcolor: '#f5f5f5', mt: 4, borderRadius: 2 }}>
            <Typography variant="caption" display="block">
              <strong>New to Afribok?</strong> Use OTP login to start your AI-guided onboarding and 2-hour certification course.
            </Typography>
          </Paper>
        </Card>
      </Container>
    </Box>
  );
};

export default LoginPage;
