import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import AppHeader from '../components/AppHeader';
import { addHealthEntry } from '../services/trackingService';
import { trackPage, trackButton, trackHealth } from '../services/analyticsService';

export default function TrackerScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('log');
  const [movement, setMovement] = useState('');
  const [sleep, setSleep] = useState('');
  const [mood, setMood] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const moods = ['😊 Happy', '😐 Neutral', '😔 Sad', '😤 Stressed', '😴 Tired', '🤗 Excited'];
  const moodValues = ['happy', 'neutral', 'sad', 'stressed', 'tired', 'excited'];

  useFocusEffect(
    React.useCallback(() => {
      trackPage('TrackerScreen');
    }, [])
  );

  const handleSaveEntry = async () => {
    if (!movement && !sleep && !mood) {
      Alert.alert('Error', 'Please fill in at least one field');
      return;
    }

    const entryData = {
      movement: movement ? parseInt(movement) : null,
      sleep: sleep ? parseFloat(sleep) : null,
      mood: mood,
      timestamp: new Date().toISOString(),
    };

    setIsLoading(true);
    try {
      const result = await addHealthEntry(entryData);
      Alert.alert('Success', 'Health data saved successfully!');
      setMovement('');
      setSleep('');
      setMood(null);
    } catch (error) {
      console.error('❌ Save error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader navigation={navigation} title="Health Tracker" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.logSection}>
          {/* Movement Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>🏃 Steps Today</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter steps (e.g., 8000)"
              keyboardType="numeric"
              value={movement}
              onChangeText={setMovement}
            />
          </View>

          {/* Sleep Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>😴 Hours of Sleep</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter hours (e.g., 7.5)"
              keyboardType="numeric"
              value={sleep}
              onChangeText={setSleep}
            />
          </View>

          {/* Mood Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>😊 Current Mood</Text>
            <View style={styles.moodGrid}>
              {moods.map((moodLabel, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.moodButton,
                    mood === moodValues[index] && styles.moodButtonSelected
                  ]}
                  onPress={() => setMood(moodValues[index])}
                >
                  <Text style={styles.moodText}>{moodLabel}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveEntry}
            disabled={isLoading}
          >
            <LinearGradient
              colors={['#00008b', '#f5bd00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveButtonGradient}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="white" />
                  <Text style={styles.saveButtonText}>Save Entry</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
  },
  logSection: {
    padding: 20,
  },
  // Form Input Styles
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  moodButton: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
  },
  moodButtonSelected: {
    backgroundColor: '#00008b',
    borderColor: '#00008b',
  },
  moodText: {
    fontSize: 12,
    fontWeight: '500',
  },
  saveButton: {
    marginTop: 20,
    borderRadius: 15,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

