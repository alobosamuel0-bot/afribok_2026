/**
 * PatientDetailsPage Component
 * Patient details and vitals tracking
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Add as AddIcon
} from '@mui/icons-material';

import usePatient from '../hooks/usePatient';
import useAuth from '../hooks/useAuth';
import Navbar from '../components/Navbar';

const PatientDetailsPage = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const {
    currentPatient,
    loading,
    error,
    loadPatient,
    recordVitals,
    loadVitals,
    dischargePatient
  } = usePatient(user?.hospital_id || 1);

  const [vitals, setVitals] = useState([]);
    const [showVitalsDialog, setShowVitalsDialog] = useState(false);
  const [vitalsForm, setVitalsForm] = useState({
    temperature: '',
    heart_rate: '',
    blood_pressure_sys: '',
    blood_pressure_dia: '',
    respiratory_rate: '',
    oxygen_saturation: '',
    notes: ''
  });

  useEffect(() => {
    loadPatient(patientId);
    loadVitalsData();
  }, [patientId]);

  const loadVitalsData = async () => {
    try {
      const data = await loadVitals(patientId, 7);
      setVitals(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      console.error('Failed to load vitals:', err);
    }
  };

  const handleRecordVitals = async () => {
    try {
      await recordVitals(patientId, vitalsForm);
      setShowVitalsDialog(false);
      setVitalsForm({
        temperature: '',
        heart_rate: '',
        blood_pressure_sys: '',
        blood_pressure_dia: '',
        respiratory_rate: '',
        oxygen_saturation: '',
        notes: ''
      });
      await loadVitalsData();
    } catch (err) {
      console.error('Failed to record vitals:', err);
    }
  };

  const handleDischarge = async () => {
    if (window.confirm('Are you sure you want to discharge this patient?')) {
      try {
        await dischargePatient(patientId);
        navigate('/dashboard');
      } catch (err) {
        console.error('Failed to discharge patient:', err);
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <Navbar user={user} onLogout={logout} />

      <Box sx={{ flex: 1 }}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          {/* Header */}
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/dashboard')}
            >
              Back
            </Button>
            <Typography variant="h4" sx={{ fontWeight: 'bold', flex: 1 }}>
              {currentPatient?.first_name} {currentPatient?.last_name}
            </Typography>
            <Button
              variant="contained"
              color="error"
              onClick={handleDischarge}
            >
              Discharge
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error.message}
            </Alert>
          )}

          {/* Patient Info */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Patient Information" />
                <CardContent>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box>
                      <Typography variant="caption" color="textSecondary">
                        National ID
                      </Typography>
                      <Typography variant="body1">
                        {currentPatient?.national_id}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="textSecondary">
                        Age
                      </Typography>
                      <Typography variant="body1">
                        {currentPatient?.age} years
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="textSecondary">
                        Phone
                      </Typography>
                      <Typography variant="body1">
                        {currentPatient?.phone}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="textSecondary">
                        Risk Score
                      </Typography>
                      <Chip
                        label={`${currentPatient?.risk_score?.toFixed(1) || 'N/A'}%`}
                        color={currentPatient?.risk_score > 70 ? 'error' : 'success'}
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Admission Details" />
                <CardContent>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box>
                      <Typography variant="caption" color="textSecondary">
                        Status
                      </Typography>
                      <Chip
                        label={currentPatient?.status}
                        color={currentPatient?.status === 'admitted' ? 'info' : 'success'}
                      />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="textSecondary">
                        Assigned Bed
                      </Typography>
                      <Typography variant="body1">
                        {currentPatient?.assigned_bed || 'Unassigned'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="textSecondary">
                        Admission Date
                      </Typography>
                      <Typography variant="body1">
                        {currentPatient?.created_at ? new Date(currentPatient.created_at).toLocaleDateString() : 'N/A'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="textSecondary">
                        Emergency Contact
                      </Typography>
                      <Typography variant="body1">
                        {currentPatient?.emergency_contact}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Vitals Recording */}
          <Card sx={{ mb: 3 }}>
            <CardHeader
              title="Vital Signs"
              action={
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setShowVitalsDialog(true)}
                  size="small"
                >
                  Record Vitals
                </Button>
              }
            />
            <CardContent>
              {vitals && vitals.length > 0 ? (
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                      <TableRow>
                        <TableCell>Date/Time</TableCell>
                        <TableCell align="center">Temp (°C)</TableCell>
                        <TableCell align="center">HR (bpm)</TableCell>
                        <TableCell align="center">BP</TableCell>
                        <TableCell align="center">O₂ Sat (%)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {vitals.map((vital, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            {new Date(vital.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell align="center">
                            {vital.temperature}
                          </TableCell>
                          <TableCell align="center">
                            {vital.heart_rate}
                          </TableCell>
                          <TableCell align="center">
                            {vital.blood_pressure_sys}/{vital.blood_pressure_dia}
                          </TableCell>
                          <TableCell align="center">
                            {vital.oxygen_saturation}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="textSecondary" align="center" sx={{ py: 3 }}>
                  No vitals recorded yet
                </Typography>
              )}
            </CardContent>
          </Card>
        </Container>
      </Box>

      {/* Record Vitals Dialog */}
      <Dialog
        open={showVitalsDialog}
        onClose={() => setShowVitalsDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Record Vital Signs</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Temperature (°C)"
            type="number"
            inputProps={{ step: '0.1', min: '35', max: '42' }}
            margin="normal"
            value={vitalsForm.temperature}
            onChange={(e) => setVitalsForm({ ...vitalsForm, temperature: e.target.value })}
          />
          <TextField
            fullWidth
            label="Heart Rate (bpm)"
            type="number"
            margin="normal"
            value={vitalsForm.heart_rate}
            onChange={(e) => setVitalsForm({ ...vitalsForm, heart_rate: e.target.value })}
          />
          <TextField
            fullWidth
            label="Blood Pressure - Systolic"
            type="number"
            margin="normal"
            value={vitalsForm.blood_pressure_sys}
            onChange={(e) => setVitalsForm({ ...vitalsForm, blood_pressure_sys: e.target.value })}
          />
          <TextField
            fullWidth
            label="Blood Pressure - Diastolic"
            type="number"
            margin="normal"
            value={vitalsForm.blood_pressure_dia}
            onChange={(e) => setVitalsForm({ ...vitalsForm, blood_pressure_dia: e.target.value })}
          />
          <TextField
            fullWidth
            label="Respiratory Rate"
            type="number"
            margin="normal"
            value={vitalsForm.respiratory_rate}
            onChange={(e) => setVitalsForm({ ...vitalsForm, respiratory_rate: e.target.value })}
          />
          <TextField
            fullWidth
            label="Oxygen Saturation (%)"
            type="number"
            inputProps={{ step: '0.1', min: '0', max: '100' }}
            margin="normal"
            value={vitalsForm.oxygen_saturation}
            onChange={(e) => setVitalsForm({ ...vitalsForm, oxygen_saturation: e.target.value })}
          />
          <TextField
            fullWidth
            label="Notes"
            multiline
            rows={3}
            margin="normal"
            value={vitalsForm.notes}
            onChange={(e) => setVitalsForm({ ...vitalsForm, notes: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowVitalsDialog(false)}>Cancel</Button>
          <Button onClick={handleRecordVitals} variant="contained">
            Record
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PatientDetailsPage;
