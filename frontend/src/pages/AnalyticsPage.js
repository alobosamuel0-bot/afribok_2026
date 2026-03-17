/**
 * Analytics Dashboard Page
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  Tab,
  Tabs,
} from '@mui/material';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PeopleIcon from '@mui/icons-material/People';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import WarningIcon from '@mui/icons-material/Warning';

import { apiService } from '../services/api';
import { StatsCard } from '../components/StatsCard';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [overview, setOverview] = useState(null);
  const [patientTrends, setPatientTrends] = useState(null);
  const [diseaseDist, setDiseaseDist] = useState(null);
  const [riskDist, setRiskDist] = useState(null);
  const [vitalTrends, setVitalTrends] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  const hospitalId = localStorage.getItem('hospital_id') || 'HOSP001';

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [overview, trends, diseases, risks, vitals] = await Promise.all([
        apiService.get(`/analytics/overview/${hospitalId}`),
        apiService.get(`/analytics/patient-trends/${hospitalId}?days=30`),
        apiService.get(`/analytics/disease-distribution/${hospitalId}`),
        apiService.get(`/analytics/risk-distribution/${hospitalId}`),
        apiService.get(`/analytics/vital-trends/${hospitalId}?days=7`),
      ]);

      setOverview(overview.data);
      setPatientTrends(trends.data.admissions);
      setDiseaseDist(diseases.data.diseases);
      setRiskDist(risks.data);
      setVitalTrends(vitals.data.trends);
    } catch (err) {
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Typography variant="h4" sx={{ mb: 3 }}>
        Hospital Analytics Dashboard
      </Typography>

      {/* Key Metrics */}
      {overview && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Total Patients"
              value={overview.total_patients}
              icon={<PeopleIcon />}
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Admitted"
              value={overview.admitted_patients}
              icon={<LocalHospitalIcon />}
              color="info"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Bed Occupancy"
              value={`${Math.round(overview.bed_occupancy_rate)}%`}
              icon={<TrendingUpIcon />}
              color="success"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="High Risk"
              value={overview.high_risk_patients}
              icon={<WarningIcon />}
              color="error"
            />
          </Grid>
        </Grid>
      )}

      {/* Charts */}
      <Box sx={{ mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
        >
          <Tab label="Patient Trends" id="analytics-tab-0" />
          <Tab label="Disease Distribution" id="analytics-tab-1" />
          <Tab label="Risk Levels" id="analytics-tab-2" />
          <Tab label="Vital Signs" id="analytics-tab-3" />
        </Tabs>

        {/* Patient Trends */}
        <TabPanel value={tabValue} index={0}>
          <Paper sx={{ p: 2 }}>
            {patientTrends && patientTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={patientTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#8884d8"
                    name="Admissions"
                    dot={{ fill: '#8884d8', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Typography>No data available</Typography>
            )}
          </Paper>
        </TabPanel>

        {/* Disease Distribution */}
        <TabPanel value={tabValue} index={1}>
          <Paper sx={{ p: 2 }}>
            {diseaseDist && diseaseDist.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={diseaseDist}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="disease" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="patient_count" fill="#82ca9d" name="Patients" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Typography>No disease data available</Typography>
            )}
          </Paper>
        </TabPanel>

        {/* Risk Distribution */}
        <TabPanel value={tabValue} index={2}>
          <Paper sx={{ p: 2 }}>
            {riskDist && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Low Risk', value: riskDist.low_risk || 0, fill: '#82ca9d' },
                          { name: 'Medium Risk', value: riskDist.medium_risk || 0, fill: '#ffc658' },
                          { name: 'High Risk', value: riskDist.high_risk || 0, fill: '#ff7c7c' },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={100}
                      >
                        <Cell fill="#82ca9d" />
                        <Cell fill="#ffc658" />
                        <Cell fill="#ff7c7c" />
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Chip label={`Low: ${riskDist.low_risk}`} color="success" />
                    <Chip label={`Medium: ${riskDist.medium_risk}`} color="warning" />
                    <Chip label={`High: ${riskDist.high_risk}`} color="error" />
                  </Box>
                </Grid>
              </Grid>
            )}
          </Paper>
        </TabPanel>

        {/* Vital Signs Trends */}
        <TabPanel value={tabValue} index={3}>
          <Paper sx={{ p: 2 }}>
            {vitalTrends && vitalTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={vitalTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="avg_heart_rate"
                    stroke="#8884d8"
                    name="Avg Heart Rate"
                  />
                  <Line
                    type="monotone"
                    dataKey="avg_oxygen_saturation"
                    stroke="#82ca9d"
                    name="Avg O2 Saturation"
                  />
                  <Line
                    type="monotone"
                    dataKey="avg_temperature"
                    stroke="#ffc658"
                    name="Avg Temperature"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Typography>No vital data available</Typography>
            )}
          </Paper>
        </TabPanel>
      </Box>

      {/* Additional Info */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Quick Insights
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {overview && (
              <>
                <Typography>
                  • <strong>Discharged Today:</strong> {overview.discharged_today} patients
                </Typography>
                <Typography>
                  • <strong>Available Beds:</strong> {overview.available_beds} / {overview.total_beds}
                </Typography>
                <Typography>
                  • <strong>High Risk Percentage:</strong> {Math.round(overview.high_risk_percentage)}%
                </Typography>
              </>
            )}
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}
