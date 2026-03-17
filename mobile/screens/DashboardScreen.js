import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

export default function DashboardScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [stats, setStats] = useState({
    totalPatients: 0,
    admittedToday: 0,
    highRiskCount: 0,
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      
      const [patientsRes, statsRes] = await Promise.all([
        api.get('/api/v1/patients?limit=10', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get('/api/v1/analytics/overview/hospital1', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setPatients(patientsRes.data.data || []);
      setStats({
        totalPatients: statsRes.data.data.total_patients,
        admittedToday: statsRes.data.data.admitted_today,
        highRiskCount: statsRes.data.data.high_risk_count,
      });
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, styles.blueCard]}>
          <Text style={styles.statValue}>{stats.totalPatients}</Text>
          <Text style={styles.statLabel}>Total Patients</Text>
        </View>
        <View style={[styles.statCard, styles.greenCard]}>
          <Text style={styles.statValue}>{stats.admittedToday}</Text>
          <Text style={styles.statLabel}>Admitted Today</Text>
        </View>
        <View style={[styles.statCard, styles.redCard]}>
          <Text style={styles.statValue}>{stats.highRiskCount}</Text>
          <Text style={styles.statLabel}>High Risk</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={() => navigation.navigate('AdmitPatient')}
        >
          <Text style={styles.buttonText}>Admit Patient</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => navigation.navigate('VitalsEntry')}
        >
          <Text style={styles.buttonText}>Record Vitals</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Patients */}
      <View style={styles.patientsSection}>
        <Text style={styles.sectionTitle}>Recent Patients</Text>
        {patients.map((patient) => (
          <TouchableOpacity
            key={patient.id}
            style={styles.patientCard}
            onPress={() =>
              navigation.navigate('PatientDetails', { patientId: patient.id })
            }
          >
            <View style={styles.patientInfo}>
              <Text style={styles.patientName}>{patient.name}</Text>
              <Text style={styles.patientMeta}>
                {patient.age} years • {patient.condition}
              </Text>
            </View>
            <View
              style={[
                styles.riskBadge,
                patient.risk_level === 'high' && styles.riskHigh,
                patient.risk_level === 'medium' && styles.riskMedium,
                patient.risk_level === 'low' && styles.riskLow,
              ]}
            >
              <Text style={styles.riskText}>{patient.risk_level}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    padding: 16,
  },
  errorBox: {
    backgroundColor: '#FF3B30',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#FFF',
    fontSize: 14,
  },
  statsContainer: {
    marginBottom: 20,
  },
  statCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    justifyContent: 'center',
  },
  blueCard: {
    backgroundColor: '#007AFF',
  },
  greenCard: {
    backgroundColor: '#34C759',
  },
  redCard: {
    backgroundColor: '#FF3B30',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  actionsContainer: {
    marginBottom: 20,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#5AC8FA',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  patientsSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#000',
  },
  patientCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  patientMeta: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  riskHigh: {
    backgroundColor: '#FF3B30',
  },
  riskMedium: {
    backgroundColor: '#FF9500',
  },
  riskLow: {
    backgroundColor: '#34C759',
  },
  riskText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
