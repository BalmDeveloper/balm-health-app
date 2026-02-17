import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCurrentUser, testFirebaseConnection } from '../services/authService';
import { trackMood, getUserActivities } from '../services/activityService';

export default function DebugPanel({ visible, onClose }) {
  const [logs, setLogs] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    addLog('User Status', currentUser ? `Logged in as ${currentUser.email}` : 'Not logged in');
  }, []);

  const addLog = (type, message) => {
    setLogs(prev => [...prev, {
      id: Date.now(),
      type,
      message,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const testConnection = async () => {
    addLog('Test', 'Testing Firebase connection...');
    try {
      const result = await testFirebaseConnection();
      addLog('Connection Test', result.success ? '✅ Success' : `❌ Failed: ${result.error}`);
    } catch (error) {
      addLog('Connection Test', `❌ Error: ${error.message}`);
    }
  };

  const testMoodTracking = async () => {
    addLog('Test', 'Testing mood tracking...');
    try {
      const result = await trackMood(5, 'Test Happy', 'Debug test mood');
      addLog('Mood Test', result.success ? '✅ Mood tracked successfully' : `❌ Failed: ${result.error}`);
    } catch (error) {
      addLog('Mood Test', `❌ Error: ${error.message}`);
    }
  };

  const testUserActivities = async () => {
    addLog('Test', 'Testing get user activities...');
    try {
      const result = await getUserActivities(5);
      addLog('Activities Test', result.success ? `✅ Found ${result.activities.length} activities` : `❌ Failed: ${result.error}`);
    } catch (error) {
      addLog('Activities Test', `❌ Error: ${error.message}`);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.panel}>
        <View style={styles.header}>
          <Text style={styles.title}>Debug Panel</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userTitle}>Current User:</Text>
          <Text style={styles.userEmail}>
            {user ? user.email : 'Not authenticated'}
          </Text>
          <Text style={styles.userId}>
            UID: {user ? user.uid : 'N/A'}
          </Text>
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity style={styles.button} onPress={testConnection}>
            <Text style={styles.buttonText}>Test Connection</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={testMoodTracking}>
            <Text style={styles.buttonText}>Test Mood</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={testUserActivities}>
            <Text style={styles.buttonText}>Test Activities</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.clearButton} onPress={clearLogs}>
            <Text style={styles.clearButtonText}>Clear Logs</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.logs}>
          <Text style={styles.logsTitle}>Debug Logs:</Text>
          {logs.map(log => (
            <View key={log.id} style={styles.logItem}>
              <Text style={styles.logTime}>{log.timestamp}</Text>
              <Text style={styles.logType}>{log.type}:</Text>
              <Text style={styles.logMessage}>{log.message}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  panel: {
    width: '90%',
    height: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  closeButton: {
    padding: 4,
  },
  userInfo: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  userTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  userId: {
    fontSize: 11,
    color: '#999',
  },
  buttons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#00008b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  logs: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  logsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  logItem: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  logTime: {
    fontSize: 10,
    color: '#999',
    marginBottom: 2,
  },
  logType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00008b',
    marginBottom: 2,
  },
  logMessage: {
    fontSize: 11,
    color: '#666',
  },
});
