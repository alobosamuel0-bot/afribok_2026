/**
 * React Native Mobile App Setup
 * This is the entry point for the Afribok mobile application
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Alert } from 'react-native';

// Screens
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import PatientDetailsScreen from './screens/PatientDetailsScreen';
import AdmitPatientScreen from './screens/AdmitPatientScreen';
import VitalsScreen from './screens/VitalsScreen';
import AnalyticsScreen from './screens/AnalyticsScreen';
import TelemedicineScreen from './screens/TelemedicineScreen';
import SettingsScreen from './screens/SettingsScreen';

// Icon components
import { FontAwesome5 } from '@expo/vector-icons';

// Hooks
import { useAuth } from './hooks/useAuth';
import { useOffline } from './hooks/useOffline';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function DashboardTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home';
          } else if (route.name === 'Analytics') {
            iconName = focused ? 'chart-bar' : 'chart-bar';
          } else if (route.name === 'Telemedicine') {
            iconName = focused ? 'video' : 'video';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'cog' : 'cog';
          }
          return <FontAwesome5 name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        headerShown: true,
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{ title: 'Analytics' }}
      />
      <Tab.Screen
        name="Telemedicine"
        component={TelemedicineScreen}
        options={{ title: 'Telemedicine' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const { isAuthenticated, loading } = useAuth();
  const { isOnline } = useOffline();

  if (loading) {
    return null; // Show splash screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animationEnabled: true,
        }}
      >
        {isAuthenticated ? (
          <>
            <Stack.Screen
              name="MainApp"
              component={DashboardTabNavigator}
              options={{ animationEnabled: false }}
            />
            <Stack.Screen
              name="PatientDetails"
              component={PatientDetailsScreen}
              options={{ title: 'Patient Details' }}
            />
            <Stack.Screen
              name="AdmitPatient"
              component={AdmitPatientScreen}
              options={{ title: 'Admit Patient' }}
            />
            <Stack.Screen
              name="VitalsEntry"
              component={VitalsScreen}
              options={{ title: 'Record Vitals' }}
            />
          </>
        ) : (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ animationEnabled: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
