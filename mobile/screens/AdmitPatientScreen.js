import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

export default function AdmitPatientScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'male',
    condition: '',
    phone: '',
    emergencyContact: '',
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAdmit = async () => {
    if (!formData.name || !formData.age || !formData.condition) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');

      const response = await api.post(
        '/api/v1/patients',
        {
          name: formData.name,
          age: parseInt(formData.age),
          gender: formData.gender,
          condition: formData.condition,
          phone: formData.phone,
          emergency_contact: formData.emergencyContact,
          status: 'admitted',
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      Alert.alert('Success', `Patient ${formData.name} admitted successfully`, [
        {
          text: 'OK',
          onPress: () => {
            setFormData({
              name: '',
              age: '',
              gender: 'male',
              condition: '',
              phone: '',
              emergencyContact: '',
            });
            navigation.goBack();
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to admit patient');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Admit New Patient</Text>

      {/* Name */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Full Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter patient name"
          value={formData.name}
          onChangeText={(value) => handleInputChange('name', value)}
          placeholderTextColor="#999"
        />
      </View>

      {/* Age */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Age (years) *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter age"
          value={formData.age}
          onChangeText={(value) => handleInputChange('age', value)}
          keyboardType="numeric"
          placeholderTextColor="#999"
        />
      </View>

      {/* Gender */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Gender</Text>
        <View style={styles.genderContainer}>
          {['male', 'female', 'other'].map((gender) => (
            <TouchableOpacity
              key={gender}
              style={[
                styles.genderOption,
                formData.gender === gender && styles.genderSelected,
              ]}
              onPress={() => handleInputChange('gender', gender)}
            >
              <Text
                style={[
                  styles.genderText,
                  formData.gender === gender && styles.genderTextSelected,
                ]}
              >
                {gender.charAt(0).toUpperCase() + gender.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Condition */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Medical Condition *</Text>
        <TextInput
          style={[styles.input, { height: 100 }]}
          placeholder="Describe patient condition"
          value={formData.condition}
          onChangeText={(value) => handleInputChange('condition', value)}
          multiline
          placeholderTextColor="#999"
        />
      </View>

      {/* Phone */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter phone number"
          value={formData.phone}
          onChangeText={(value) => handleInputChange('phone', value)}
          keyboardType="phone-pad"
          placeholderTextColor="#999"
        />
      </View>

      {/* Emergency Contact */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Emergency Contact</Text>
        <TextInput
          style={styles.input}
          placeholder="Emergency contact (name & phone)"
          value={formData.emergencyContact}
          onChangeText={(value) => handleInputChange('emergencyContact', value)}
          placeholderTextColor="#999"
        />
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleAdmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <Text style={styles.buttonText}>Admit Patient</Text>
        )}
      </TouchableOpacity>

      {/* Cancel Button */}
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#000',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000',
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    color: '#000',
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#FFF',
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    alignItems: 'center',
  },
  genderSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  genderText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  genderTextSelected: {
    color: '#007AFF',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#E5E5EA',
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  cancelButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});
