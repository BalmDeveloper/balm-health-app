import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../components/AppHeader';
import HealthKitService from '../services/HealthKitService';
import { useTheme } from '../context/ThemeContext';

export default function IntegrationsScreen({ navigation }) {
  const { colors } = useTheme();
  const [integrations, setIntegrations] = useState([
    {
      id: 'apple_health',
      name: 'Apple Health',
      description: 'Sync health data from HealthKit',
      icon: 'fitness',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_Health_logo.png',
      color: '#000000',
      buttonColor: '#000000',
      connected: false,
      available: true,
      loading: false,
      dataTypes: []
    },
    {
      id: 'strava',
      name: 'Strava',
      description: 'Connect your fitness activities',
      icon: 'bicycle',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Strava_logo.png',
      color: '#FC4C02',
      buttonColor: '#FC4C02',
      connected: false,
      available: false
    },
    {
      id: 'pacer',
      name: 'Pacer',
      description: 'Track your daily steps and activity',
      icon: 'walk',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/9/94/Pacer_app_logo.png',
      color: '#00D4AA',
      buttonColor: '#00D4AA',
      connected: false,
      available: false
    },
    {
      id: 'oura',
      name: 'Oura',
      description: 'Sync sleep and recovery data',
      icon: 'diamond',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/8/87/Oura_Ring_logo.png',
      color: '#1A1A1A',
      buttonColor: '#1A1A1A',
      connected: false,
      available: false
    },
    {
      id: 'dexcom',
      name: 'Dexcom',
      description: 'Connect glucose monitoring data',
      icon: 'water',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/6/63/Dexcom_logo.png',
      color: '#00A4E0',
      buttonColor: '#00A4E0',
      connected: false,
      available: false
    },
    {
      id: 'fitbit',
      name: 'Fitbit',
      description: 'Connect your fitness tracker and health data',
      icon: 'watch',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/2/27/Fitbit_logo.png',
      color: '#00B0B9',
      buttonColor: '#00B0B9',
      connected: false,
      available: false
    }
  ]);

  // Check Apple Health connection status on mount
  useEffect(() => {
    checkAppleHealthStatus();
  }, []);

  const checkAppleHealthStatus = async () => {
    if (Platform.OS !== 'ios') return;

    try {
      const isAvailable = HealthKitService.isAvailable();
      
      // Try to get authorization status, but handle gracefully if it fails
      let authStatus = null;
      try {
        authStatus = await HealthKitService.getAuthorizationStatus('sleep');
      } catch (authError) {
        console.log('Auth status check failed, this is normal for first-time use:', authError.message);
        // Don't show error to user, just continue with default state
      }
      
      setIntegrations(prev => 
        prev.map(i => 
          i.id === 'apple_health' 
            ? { 
                ...i, 
                available: isAvailable,
                connected: authStatus && authStatus.sharingAuthorized,
              }
            : i
        )
      );
    } catch (error) {
      console.log('Apple Health status check failed:', error);
    }
  };

  const handleConnectIntegration = async (integrationId) => {
    const integration = integrations.find(i => i.id === integrationId);
    
    if (integrationId === 'apple_health') {
      // Handle Apple Health connection
      if (Platform.OS !== 'ios') {
        Alert.alert(
          'Not Available',
          'Apple Health is only available on iOS devices.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Set loading state
      setIntegrations(prev => 
        prev.map(i => 
          i.id === integrationId 
            ? { ...i, loading: true }
            : i
        )
      );

      try {
        await HealthKitService.initialize();
        
        // Get available data types
        const dataTypes = await HealthKitService.getAvailableDataTypes();
        
        setIntegrations(prev => 
          prev.map(i => 
            i.id === integrationId 
              ? { ...i, connected: true, loading: false, dataTypes }
              : i
          )
        );
        
        Alert.alert(
          'Connected!',
          'HealthKit has been successfully connected. Your health data will sync automatically.',
          [
            {
              text: 'View Data',
              onPress: () => showHealthDataSummary(dataTypes),
            },
            { text: 'OK' }
          ]
        );
      } catch (error) {
        setIntegrations(prev => 
          prev.map(i => 
            i.id === integrationId 
              ? { ...i, loading: false }
              : i
          )
        );

        let errorMessage = 'Failed to connect to HealthKit.';
        
        if (error.message.includes('denied')) {
          errorMessage = 'You denied access to HealthKit. Please enable it in Settings.';
        } else if (error.message.includes('not available')) {
          errorMessage = 'HealthKit is not available on this device.';
        }
        
        Alert.alert('Connection Failed', errorMessage);
      }
    } else {
      // Handle other integrations (mock for now)
      Alert.alert(
        `Connect ${integration.name}`,
        `Do you want to connect your ${integration.name} account to sync your health data?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Connect',
            onPress: () => {
              setIntegrations(prev => 
                prev.map(i => 
                  i.id === integrationId 
                    ? { ...i, connected: true }
                    : i
                )
              );
              
              Alert.alert(
                'Connected!',
                `${integration.name} has been successfully connected. Your data will sync automatically.`
              );
            },
          },
        ]
      );
    }
  };

  const showHealthDataSummary = (dataTypes) => {
    const availableTypes = Object.keys(dataTypes)
      .filter(key => dataTypes[key])
      .map(key => {
        const formattedKey = key.replace(/([A-Z])/g, ' $1').trim();
        return formattedKey.charAt(0).toUpperCase() + formattedKey.slice(1);
      });

    if (availableTypes.length === 0) {
      Alert.alert('Health Data', 'No health data is currently available in Apple Health.');
      return;
    }

    const message = `Available data types:\n\n${availableTypes.join('\n')}`;
    Alert.alert('Apple Health Data', message);
  };

  const handleDisconnectIntegration = (integrationId) => {
    const integration = integrations.find(i => i.id === integrationId);
    
    if (integrationId === 'apple_health') {
      // Handle Apple Health disconnection
      Alert.alert(
        `Disconnect ${integration.name}`,
        `Are you sure you want to disconnect ${integration.name}? This will stop syncing your data.`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Disconnect',
            style: 'destructive',
            onPress: () => {
              HealthKitService.disconnect();
              
              setIntegrations(prev => 
                prev.map(i => 
                  i.id === integrationId 
                    ? { ...i, connected: false, dataTypes: [] }
                    : i
                )
              );
              
              Alert.alert(
                'Disconnected',
                `${integration.name} has been disconnected.`
              );
            },
          },
        ]
      );
    } else {
      // Handle other integrations
      Alert.alert(
        `Disconnect ${integration.name}`,
        `Are you sure you want to disconnect ${integration.name}? This will stop syncing your data.`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Disconnect',
            style: 'destructive',
            onPress: () => {
              setIntegrations(prev => 
                prev.map(i => 
                  i.id === integrationId 
                    ? { ...i, connected: false }
                    : i
                )
              );
              
              Alert.alert(
                'Disconnected',
                `${integration.name} has been disconnected.`
              );
            },
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader navigation={navigation} title="Integrations" />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Connect Your Health Apps</Text>
          <Text style={[styles.headerDescription, { color: colors.textSecondary }]}>
            Sync data from your favorite health and fitness apps to get personalized insights and recommendations.
          </Text>
        </View>

        {/* Integrations Grid */}
        <View style={styles.integrationsSection}>
          <View style={styles.integrationsGrid}>
            {integrations.map((integration) => (
              <View key={integration.id} style={[
                styles.integrationCard,
                { backgroundColor: colors.card, borderColor: colors.border },
                !integration.available && styles.disabledCard
              ]}>
                <View style={styles.integrationIconContainer}>
                  {integration.logo ? (
                    <Image 
                      source={{ uri: integration.logo }} 
                      style={styles.brandLogo}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={[styles.fallbackIcon, { backgroundColor: integration.color }]}>
                      <Ionicons name={integration.icon} size={24} color="white" />
                    </View>
                  )}
                </View>
                <Text style={[styles.integrationName, { color: colors.text }]}>{integration.name}</Text>
                <Text style={[styles.integrationDescription, { color: colors.textSecondary }]} numberOfLines={2}>{integration.description}</Text>
                
                {integration.loading ? (
                  <View style={[styles.connectButton, styles.loadingButton]}>
                    <ActivityIndicator size="small" color="#ffffff" />
                    <Text style={styles.connectButtonTextStyle}>Connecting...</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.connectButton,
                      integration.connected ? styles.disconnectButton : { backgroundColor: integration.buttonColor, borderColor: integration.buttonColor },
                      !integration.available && styles.disabledButton
                    ]}
                    onPress={() => {
                      if (integration.connected) {
                        handleDisconnectIntegration(integration.id);
                      } else {
                        handleConnectIntegration(integration.id);
                      }
                    }}
                    disabled={!integration.available}
                  >
                    <Text style={[
                      styles.connectButtonText,
                      integration.connected ? styles.disconnectButtonText : styles.connectButtonTextStyle,
                      !integration.available && styles.disabledButtonText
                    ]}>
                      {integration.connected ? 'Disconnect' : 
                       !integration.available ? 'Coming Soon' : 'Connect'}
                    </Text>
                  </TouchableOpacity>
                )}
                
                {/* Show data types for Apple Health when connected */}
                {integration.id === 'apple_health' && integration.connected && integration.dataTypes && (
                  <View style={styles.dataTypesContainer}>
                    <Text style={[styles.dataTypesTitle, { color: colors.textSecondary }]}>Available Data:</Text>
                    <View style={styles.dataTypesList}>
                      {Object.keys(integration.dataTypes)
                        .filter(key => integration.dataTypes[key])
                        .slice(0, 3)
                        .map(key => (
                          <Text key={key} style={[styles.dataTypeItem, { color: colors.text }]}>
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </Text>
                        ))}
                      {Object.keys(integration.dataTypes).filter(key => integration.dataTypes[key]).length > 3 && (
                        <Text style={[styles.moreDataText, { color: colors.textSecondary }]}>+{Object.keys(integration.dataTypes).filter(key => integration.dataTypes[key]).length - 3} more</Text>
                      )}
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
            <Ionicons name="shield-checkmark" size={24} color="#4caf50" />
            <View style={styles.infoContent}>
              <Text style={[styles.infoTitle, { color: colors.text }]}>Your Data is Secure</Text>
              <Text style={[styles.infoDescription, { color: colors.textSecondary }]}>
                We use bank-level encryption to protect your health data and never share it without your permission.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  integrationsSection: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  integrationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  integrationCard: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledCard: {
    opacity: 0.6,
  },
  integrationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  integrationIconContainer: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  brandLogo: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  fallbackIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  integrationName: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  integrationDescription: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 14,
    color: '#666',
  },
  connectButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingButton: {
    backgroundColor: '#999',
    borderColor: '#999',
  },
  disabledButton: {
    backgroundColor: '#ccc',
    borderColor: '#ccc',
  },
  connectButtonTextStyle: {
    color: '#ffffff',
  },
  disconnectButton: {
    backgroundColor: 'transparent',
  },
  connectButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  disconnectButtonText: {
    color: '#666',
  },
  disabledButtonText: {
    color: '#999',
  },
  dataTypesContainer: {
    marginTop: 8,
    width: '100%',
  },
  dataTypesTitle: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  dataTypesList: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  dataTypeItem: {
    fontSize: 9,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 2,
    textAlign: 'center',
  },
  moreDataText: {
    fontSize: 8,
    fontStyle: 'italic',
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingBottom: 50,
  },
  infoCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 12,
    lineHeight: 18,
  },
});
