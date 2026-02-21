import React from 'react';
import { View, Text, ActivityIndicator, Image } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';

// Import screens
import WelcomeScreen from '../screens/WelcomeScreen';
import AuthScreen from '../screens/AuthScreen';
import SignUpForm from '../screens/SignUpForm';
import LoginForm from '../screens/LoginForm';
import ForgotPasswordForm from '../screens/ForgotPasswordForm';
import ProfileScreen from '../screens/ProfileScreen';
import MainTabNavigator from './MainTabNavigator';
import ProfileScreen from '../screens/ProfileScreen';
import LifestyleHistoryScreen from '../screens/LifestyleHistoryScreen';
import ProvidersScreen from '../screens/ProvidersScreen';
import SettingsScreen from '../screens/SettingsScreen';
import LabsScreen from '../screens/LabsScreen';
import CommunityScreen from '../screens/CommunityScreen';
import PeriodTrackingScreen from '../screens/PeriodTrackingScreen';
import HealthProfileScreen from '../screens/HealthProfileScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import RewardsScreen from '../screens/RewardsScreen';
import HelpSupportScreen from '../screens/HelpSupportScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { isAuthenticated, loading, firebaseError, isFirebaseReady } = useAuth();

  if (!isFirebaseReady && firebaseError) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
        <Image
          source={require('../../public/Images/balm logo.png')}
          style={{ width: 96, height: 96, marginBottom: 16 }}
          resizeMode="contain"
        />
        <Text style={{ color: '#fff', fontSize: 18, marginBottom: 10, textAlign: 'center' }}>
          Balm.ai couldn’t start
        </Text>
        <Text style={{ color: '#b0b0b0', fontSize: 13, textAlign: 'center' }}>
          {firebaseError?.message ?? 'Configuration error'}
        </Text>
      </View>
    );
  }

  if (loading) {
    // Show minimal loading state
    return (
      <View style={{ flex: 1, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="small" color="#00008b" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {!isAuthenticated ? (
        // User is not signed in, show welcome screen
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="MainApp" component={MainTabNavigator} />
          <Stack.Screen name="Auth" component={AuthScreen} />
          <Stack.Screen name="SignUpForm" component={SignUpForm} />
          <Stack.Screen name="LoginForm" component={LoginForm} />
          <Stack.Screen name="ForgotPasswordForm" component={ForgotPasswordForm} />
        </>
      ) : (
        // User is signed in, show main app
        <>
          <Stack.Screen name="MainApp" component={MainTabNavigator} />
          <Stack.Screen name="ProfileDetail" component={ProfileScreen} />
          <Stack.Screen name="LifestyleHistory" component={LifestyleHistoryScreen} />
          <Stack.Screen name="Providers" component={ProvidersScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Labs" component={LabsScreen} />
          <Stack.Screen name="Community" component={CommunityScreen} />
          <Stack.Screen name="PeriodTracking" component={PeriodTrackingScreen} />
          <Stack.Screen name="HealthProfile" component={HealthProfileScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="Rewards" component={RewardsScreen} />
          <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
