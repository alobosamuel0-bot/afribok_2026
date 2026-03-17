/**
 * AdminPage Component
 * Admin dashboard and system management
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Typography,
  TabContext,
  TabList,
  TabPanel,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip
} from '@mui/material';
import { Security as SecurityIcon, Settings as SettingsIcon } from '@mui/icons-material';

import useAuth from '../hooks/useAuth';
import Navbar from '../components/Navbar';

const AdminPage = () => {
  const { user, logout } = useAuth();
  const [tabValue, setTabValue] = useState('0');
  const [auditLogs, setAuditLogs] = useState([]);
  const [syncStatus, setSyncStatus] = useState([]);

  useEffect(() => {
    // Load audit logs (mock data)
    setAuditLogs([
      {
        id: 1,
        action: 'PATIENT_ADMITTED',
        user: 'doctor@hospital.com',
        timestamp: new Date(),
        details: 'Admitted patient with risk score 72',
        status: 'success'
      },
      {
        id: 2,
        action: 'VITALS_RECORDED',
        user: 'nurse@hospital.com',
        timestamp: new Date(),
        details: 'Recorded vitals for patient PAT-001',
        status: 'success'
      }
    ]);

    // Load sync status
    setSyncStatus([
      { id: 1, entity: 'patients', synced: 1500, failed: 0, lastSync: new Date() },
      { id: 2, entity: 'vitals', synced: 5200, failed: 2, lastSync: new Date() }
    ]);
  }, []);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <Navbar user={user} onLogout={logout} />

      <Box sx={{ flex: 1 }}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          {/* Header */}
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 4 }}>
            Admin Dashboard
          </Typography>

          {/* Tabs */}
          <TabContext value={tabValue}>
            <TabList onChange={(e, val) => setTabValue(val)}>
              <Tab label="Audit Logs" value="0" icon={<SecurityIcon />} />
              <Tab label="Sync Status" value="1" icon={<SettingsIcon />} />
            </TabList>

            {/* Audit Logs Tab */}
            <TabPanel value="0" sx={{ p: 0, pt: 2 }}>
              <Card>
                <CardHeader title="System Audit Logs" />
                <CardContent>
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                        <TableRow>
                          <TableCell>Action</TableCell>
                          <TableCell>User</TableCell>
                          <TableCell>Timestamp</TableCell>
                          <TableCell>Details</TableCell>
                          <TableCell align="center">Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {auditLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell>{log.action}</TableCell>
                            <TableCell>{log.user}</TableCell>
                            <TableCell>
                              {log.timestamp.toLocaleString()}
                            </TableCell>
                            <TableCell>{log.details}</TableCell>
                            <TableCell align="center">
                              <Chip
                                label={log.status}
                                color={log.status === 'success' ? 'success' : 'error'}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </TabPanel>

            {/* Sync Status Tab */}
            <TabPanel value="1" sx={{ p: 0, pt: 2 }}>
              <Grid container spacing={3}>
                {syncStatus.map((sync) => (
                  <Grid item xs={12} md={6} key={sync.id}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ textTransform: 'capitalize' }}>
                          {sync.entity}
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="textSecondary">
                              Successfully Synced:
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {sync.synced.toLocaleString()}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="textSecondary">
                              Failed:
                            </Typography>
                            <Chip
                              label={sync.failed}
                              color={sync.failed > 0 ? 'error' : 'success'}
                              size="small"
                            />
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="textSecondary">
                              Last Sync:
                            </Typography>
                            <Typography variant="body2">
                              {sync.lastSync.toLocaleString()}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </TabPanel>
          </TabContext>
        </Container>
      </Box>
    </Box>
  );
};

export default AdminPage;
