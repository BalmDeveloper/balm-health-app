import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  getCurrentUser, 
  signInWithGoogle, 
  testFirebaseConnection
} from '../services/authService';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { 
  trackActivity, 
  getUserActivities, 
  trackMood, 
  getUserStats,
  ACTIVITY_TYPES 
} from '../services/activityService';

export default function FirebaseTestScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState([]);
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    // Check current user
    const currentUser = getCurrentUser();
    setUser(currentUser);

    // Listen for auth changes
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);
      if (authUser) {
        loadUserData();
      }
    });

    return unsubscribe;
  }, []);

  const loadUserData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load activities
      const activitiesResult = await getUserActivities(10);
      if (activitiesResult.success) {
        setActivities(activitiesResult.activities);
      }

      // Load stats
      const statsResult = await getUserStats();
      if (statsResult.success) {
        setStats(statsResult.stats);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTestResult = (test, success, message) => {
    setTestResults(prev => [...prev, {
      id: Date.now(),
      test,
      success,
      message,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const testConnection = async () => {
    addTestResult('Firebase Connection', null, 'Testing...');
    try {
      const result = await testFirebaseConnection();
      addTestResult('Firebase Connection', result.success, result.success ? '✅ Connected' : `❌ ${result.error}`);
    } catch (error) {
      addTestResult('Firebase Connection', false, `❌ ${error.message}`);
    }
  };

  const testGoogleSignIn = async () => {
    addTestResult('Google Sign-In', null, 'Testing...');
    try {
      const result = await signInWithGoogle();
      addTestResult('Google Sign-In', result.success, result.success ? '✅ Success' : `❌ ${result.error}`);
    } catch (error) {
      addTestResult('Google Sign-In', false, `❌ ${error.message}`);
    }
  };

  const testActivityTracking = async () => {
    addTestResult('Activity Tracking', null, 'Testing...');
    try {
      const result = await trackActivity(ACTIVITY_TYPES.APP_OPEN, { test: true });
      addTestResult('Activity Tracking', result.success, result.success ? '✅ Activity tracked' : `❌ ${result.error}`);
    } catch (error) {
      addTestResult('Activity Tracking', false, `❌ ${error.message}`);
    }
  };

  const testMoodTracking = async () => {
    addTestResult('Mood Tracking', null, 'Testing...');
    try {
      const result = await trackMood(5, 'Happy', 'Test mood entry');
      addTestResult('Mood Tracking', result.success, result.success ? '✅ Mood tracked' : `❌ ${result.error}`);
    } catch (error) {
      addTestResult('Mood Tracking', false, `❌ ${error.message}`);
    }
  };

  const runAllTests = async () => {
    setTestResults([]);
    await testConnection();
    if (!user) {
      await testGoogleSignIn();
    }
    await testActivityTracking();
    await testMoodTracking();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Firebase Test Suite</Text>
        <Text style={styles.subtitle}>Test authentication and Firestore functionality</Text>
      </View>

      {/* User Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>User Status</Text>
        {user ? (
          <View style={styles.userCard}>
            <Ionicons name="person-circle" size={40} color="#00008b" />
            <View style={styles.userInfo}>
              <Text style={styles.userEmail}>{user.email}</Text>
              <Text style={styles.userId}>UID: {user.uid}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.noUserCard}>
            <Ionicons name="person-off" size={40} color="#666" />
            <Text style={styles.noUserText}>No user signed in</Text>
          </View>
        )}
      </View>

      {/* Test Controls */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test Controls</Text>
        <TouchableOpacity style={styles.testButton} onPress={runAllTests}>
          <Text style={styles.testButtonText}>Run All Tests</Text>
        </TouchableOpacity>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.smallButton} onPress={testConnection}>
            <Text style={styles.smallButtonText}>Test Connection</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.smallButton} onPress={testGoogleSignIn}>
            <Text style={styles.smallButtonText}>Test Sign-In</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.smallButton} onPress={testActivityTracking}>
            <Text style={styles.smallButtonText}>Test Activity</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.smallButton} onPress={testMoodTracking}>
            <Text style={styles.smallButtonText}>Test Mood</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Test Results */}
      {testResults.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Results</Text>
          {testResults.map(result => (
            <View key={result.id} style={[
              styles.resultCard,
              result.success === true && styles.successCard,
              result.success === false && styles.errorCard,
            ]}>
              <Text style={styles.resultTest}>{result.test}</Text>
              <Text style={styles.resultMessage}>{result.message}</Text>
              <Text style={styles.resultTime}>{result.timestamp}</Text>
            </View>
          ))}
        </View>
      )}

      {/* User Data */}
      {user && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User Data</Text>
          
          {loading ? (
            <ActivityIndicator size="large" color="#00008b" />
          ) : (
            <>
              {/* Stats */}
              {stats && (
                <View style={styles.dataCard}>
                  <Text style={styles.dataTitle}>Statistics</Text>
                  <Text>Total Activities: {stats.totalActivities}</Text>
                  <Text>Mood Checks: {stats.moodChecks}</Text>
                  <Text>Chat Messages: {stats.chatMessages}</Text>
                  <Text>Video Calls: {stats.videoCalls}</Text>
                  <Text>Wellness Sessions: {stats.wellnessSessions}</Text>
                </View>
              )}

              {/* Recent Activities */}
              {activities.length > 0 && (
                <View style={styles.dataCard}>
                  <Text style={styles.dataTitle}>Recent Activities</Text>
                  {activities.slice(0, 5).map(activity => (
                    <View key={activity.id} style={styles.activityItem}>
                      <Text style={styles.activityType}>{activity.type}</Text>
                      <Text style={styles.activityTime}>
                        {new Date(activity.timestamp?.seconds * 1000).toLocaleString()}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f1f5ff',
    borderRadius: 8,
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  userEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  userId: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  noUserCard: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  noUserText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  testButton: {
    backgroundColor: '#00008b',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  smallButton: {
    flex: 1,
    backgroundColor: '#f1f5ff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00008b',
  },
  smallButtonText: {
    color: '#00008b',
    fontSize: 14,
    fontWeight: '600',
  },
  resultCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
  },
  successCard: {
    backgroundColor: '#d4edda',
    borderWidth: 1,
    borderColor: '#c3e6cb',
  },
  errorCard: {
    backgroundColor: '#f8d7da',
    borderWidth: 1,
    borderColor: '#f5c6cb',
  },
  resultTest: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  resultMessage: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  resultTime: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  dataCard: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 12,
  },
  dataTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  activityType: {
    fontSize: 14,
    color: '#1a1a1a',
  },
  activityTime: {
    fontSize: 12,
    color: '#666',
  },
});
