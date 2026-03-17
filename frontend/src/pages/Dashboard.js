/**
 * Dashboard Component
 * Main application dashboard
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  LocalHospital as HospitalIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

import useAuth from '../hooks/useAuth';
import usePatient from '../hooks/usePatient';
import useOffline from '../hooks/useOffline';
import Navbar from '../components/Navbar';
import StatsCard from '../components/StatsCard';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isOnline } = useOffline();
  const { patients, loading, error, loadPatients, admitPatient } = usePatient(user?.hospital_id || 1);
  
  const [dialogs, setDialogs] = useState({
    admitPatient: false,
    recordVitals: false
  });
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    nationalId: '',
    age: '',
    phone: '',
    disease: '',
    allergies: [],
    emergencyContact: ''
  });
  
  const [stats, setStats] = useState({
    totalPatients: 0,
    admittedToday: 0,
    criticalCases: 0,
    availableBeds: 0
  });

  // Load initial data
  useEffect(() => {
    loadPatients();
  }, []);

  // Mock stats calculation
  useEffect(() => {
    if (patients && Array.isArray(patients)) {
      const today = new Date().toDateString();
      setStats({
        totalPatients: patients.length,
        admittedToday: patients.filter(p => 
          new Date(p.created_at).toDateString() === today
        ).length,
        criticalCases: patients.filter(p => p.risk_score > 70).length,
        availableBeds: 15 // Mock value
      });
    }
  }, [patients]);

  const handleOpenDialog = (dialog) => {
    setDialogs(prev => ({ ...prev, [dialog]: true }));
  };

  const handleCloseDialog = (dialog) => {
    setDialogs(prev => ({ ...prev, [dialog]: false }));
    setFormData({
      firstName: '',
      lastName: '',
      nationalId: '',
      age: '',
      phone: '',
      disease: '',
      allergies: [],
      emergencyContact: ''
    });
  };

  const handleAdmitPatient = async () => {
    try {
      await admitPatient({
        first_name: formData.firstName,
        last_name: formData.lastName,
        national_id: formData.nationalId,
        age: parseInt(formData.age),
        phone: formData.phone,
        disease_ids: [1], // Mock disease ID
        allergies: formData.allergies,
        emergency_contact: formData.emergencyContact
      });
      handleCloseDialog('admitPatient');
      await loadPatients();
    } catch (err) {
      console.error('Failed to admit patient:', err);
    }
  };

  const getRiskColor = (riskScore) => {
    if (riskScore > 70) return 'error';
    if (riskScore > 50) return 'warning';
    return 'success';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'admitted':
        return 'info';
      case 'discharged':
        return 'success';
      case 'critical':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* Navbar */}
      <Navbar user={user} onLogout={logout} isOnline={isOnline} />

      {/* Main Content */}
      <Box sx={{ flex: 1, ml: 0 }}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          {/* Header */}
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                Dashboard
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Welcome, {user?.username}! Hospital ID: {user?.hospital_id}
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog('admitPatient')}
              size="large"
            >
              Admit Patient
            </Button>
          </Box>

          {/* Status Alert */}
          {!isOnline && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              📱 You are currently offline. Changes will be synced automatically when connection is restored.
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error.message || 'An error occurred'}
            </Alert>
          )}

          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard
                title="Total Patients"
                value={stats.totalPatients}
                icon={<PersonIcon />}
                color="primary"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard
                title="Admitted Today"
                value={stats.admittedToday}
                icon={<HospitalIcon />}
                color="info"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard
                title="Critical Cases"
                value={stats.criticalCases}
                icon={<WarningIcon />}
                color="error"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard
                title="Available Beds"
                value={stats.availableBeds}
                icon={<TrendingUpIcon />}
                color="success"
              />
            </Grid>
          </Grid>

          {/* Patients Table */}
          <Card>
            <CardHeader
              title="Patient List"
              action={
                <Button
                  size="small"
                  startIcon={<RefreshIcon />}
                  onClick={() => loadPatients()}
                  disabled={loading}
                >
                  Refresh
                </Button>
              }
            />
            <CardContent>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress />
                </Box>
              ) : patients && patients.length > 0 ? (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>National ID</TableCell>
                        <TableCell align="center">Risk Score</TableCell>
                        <TableCell align="center">Status</TableCell>
                        <TableCell align="center">Bed</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {patients.map((patient) => (
                        <TableRow
                          key={patient.id}
                          hover
                          sx={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/patients/${patient.id}`)}
                        >
                          <TableCell>
                            {patient.first_name} {patient.last_name}
                          </TableCell>
                          <TableCell>{patient.national_id}</TableCell>
                          <TableCell align="center">
                            <Chip
                              label={`${patient.risk_score?.toFixed(1) || 'N/A'}%`}
                              size="small"
                              color={getRiskColor(patient.risk_score || 0)}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={patient.status}
                              size="small"
                              color={getStatusColor(patient.status)}
                            />
                          </TableCell>
                          <TableCell align="center">
                            {patient.assigned_bed || 'Unassigned'}
                          </TableCell>
                          <TableCell align="center">
                            <Button
                              size="small"
                              startIcon={<EditIcon />}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/patients/${patient.id}`);
                              }}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="textSecondary" align="center" sx={{ py: 3 }}>
                  No patients found. {isOnline ? '' : '(Offline mode)'}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Container>
      </Box>

      {/* Admit Patient Dialog */}
      <Dialog
        open={dialogs.admitPatient}
        onClose={() => handleCloseDialog('admitPatient')}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Admit New Patient</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="First Name"
            margin="normal"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
          />
          <TextField
            fullWidth
            label="Last Name"
            margin="normal"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
          />
          <TextField
            fullWidth
            label="National ID"
            margin="normal"
            value={formData.nationalId}
            onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
          />
          <TextField
            fullWidth
            label="Age"
            type="number"
            margin="normal"
            value={formData.age}
            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
          />
          <TextField
            fullWidth
            label="Phone"
            margin="normal"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <TextField
            fullWidth
            label="Emergency Contact"
            margin="normal"
            value={formData.emergencyContact}
            onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleCloseDialog('admitPatient')}>Cancel</Button>
          <Button onClick={handleAdmitPatient} variant="contained">
            Admit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;
