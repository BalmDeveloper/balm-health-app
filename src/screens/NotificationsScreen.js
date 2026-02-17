import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  SafeAreaView,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AppHeader from '../components/AppHeader';
import { useTheme } from '../context/ThemeContext';
import NotificationService from '../services/notificationService';

export default function NotificationsScreen({ navigation }) {
  const { colors } = useTheme();
  
  // Load notification settings from service
  const [notifications, setNotifications] = useState({});
  const [loading, setLoading] = useState(true);
  
  // DND state
  const [dndStartTime, setDndStartTime] = useState('22:00'); // 10:00 PM
  const [dndEndTime, setDndEndTime] = useState('07:00'); // 7:00 AM
  const [showDndModal, setShowDndModal] = useState(false);
  const [selectedTimeType, setSelectedTimeType] = useState('start'); // 'start' or 'end'

  const frequencyOptions = [
    { value: '30_min', label: 'Every 30 min' },
    { value: '1_hour', label: 'Every hour' },
    { value: '2_hours', label: 'Every 2 hours' },
    { value: '3_hours', label: 'Every 3 hours' },
    { value: '4_hours', label: 'Every 4 hours' },
    { value: '5_hours', label: 'Every 5 hours' },
    { value: '6_hours', label: 'Every 6 hours' },
    { value: '7_hours', label: 'Every 7 hours' },
    { value: '8_hours', label: 'Every 8 hours' },
    { value: '9_hours', label: 'Every 9 hours' },
    { value: '10_hours', label: 'Every 10 hours' },
    { value: '11_hours', label: 'Every 11 hours' },
    { value: '12_hours', label: 'Every 12 hours' },
  ];

  const getDefaultFrequencyForKey = (key) => {
    if (key === 'waterReminder') return '2_hours';
    if (key === 'movementReminder') return '1_hour';
    return '1_hour';
  };

  const formatFrequency = (frequency) => {
    const map = {
      '30_min': 'Every 30 min',
      '1_hour': 'Every hour',
      '2_hours': 'Every 2 hours',
      '3_hours': 'Every 3 hours',
      '4_hours': 'Every 4 hours',
      '5_hours': 'Every 5 hours',
      '6_hours': 'Every 6 hours',
      '7_hours': 'Every 7 hours',
      '8_hours': 'Every 8 hours',
      '9_hours': 'Every 9 hours',
      '10_hours': 'Every 10 hours',
      '11_hours': 'Every 11 hours',
      '12_hours': 'Every 12 hours',
    };
    return map[frequency] || frequency;
  };

  const formatTime = (time24) => {
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDndTimeRange = () => {
    return `${formatTime(dndStartTime)} - ${formatTime(dndEndTime)}`;
  };

  const openDndTimePicker = (type) => {
    setSelectedTimeType(type);
    setShowDndModal(true);
  };

  const handleTimeSelect = (hour, minute) => {
    const time24 = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    if (selectedTimeType === 'start') {
      setDndStartTime(time24);
    } else {
      setDndEndTime(time24);
    }
    
    setShowDndModal(false);
  };

  // Initialize notification service and load settings
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        setLoading(true);
        
        // Initialize notification service
        const initialized = await NotificationService.initialize();
        if (!initialized) {
          console.log('Notification service initialization failed');
        }

        // Load settings from service with fallback
        let settings = {};
        try {
          settings = NotificationService.getSettings() || {};
        } catch (error) {
          console.error('Error getting notification settings:', error);
          settings = {};
        }
        
        setNotifications(settings);
        setLoading(false);
      } catch (error) {
        console.error('Error initializing notifications:', error);
        setNotifications({});
        setLoading(false);
      }
    };

    initializeNotifications();
  }, []);

  // Toggle notification and update service
  const toggleNotification = async (key) => {
    try {
      const updatedSettings = {
        ...notifications[key],
        enabled: !notifications[key].enabled
      };
      
      // Update local state
      setNotifications(prev => ({
        ...prev,
        [key]: updatedSettings
      }));
      
      // Update notification service
      await NotificationService.updateSettings(key, updatedSettings);
      
      // Show feedback
      const status = updatedSettings.enabled ? 'enabled' : 'disabled';
      console.log(`✅ ${notificationMeta[key]?.title || key} ${status}`);
    } catch (error) {
      console.error('Error toggling notification:', error);
      // Revert state on error
      setNotifications(prev => ({
        ...prev,
        [key]: {
          ...prev[key],
          enabled: !prev[key].enabled
        }
      }));
    }
  };

  // Handle time change
  const handleTimeChange = async (notificationKey, time) => {
    try {
      const updatedSettings = {
        ...notifications[notificationKey],
        time
      };
      
      // Update local state
      setNotifications(prev => ({
        ...prev,
        [notificationKey]: updatedSettings
      }));
      
      // Update notification service
      await NotificationService.updateSettings(notificationKey, updatedSettings);
      
      console.log(`✅ Updated time for ${notificationMeta[notificationKey]?.title || notificationKey}: ${time}`);
    } catch (error) {
      console.error('Error updating time:', error);
    }
  };

  const handleFrequencyChange = async (notificationKey, frequency) => {
    try {
      const updatedSettings = {
        ...notifications[notificationKey],
        frequency,
      };

      setNotifications((prev) => ({
        ...prev,
        [notificationKey]: updatedSettings,
      }));

      await NotificationService.updateSettings(notificationKey, updatedSettings);

      console.log(
        `✅ Updated frequency for ${notificationMeta[notificationKey]?.title || notificationKey}: ${frequency}`
      );
    } catch (error) {
      console.error('Error updating frequency:', error);
    }
  };

  // Time picker state
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [selectedHour, setSelectedHour] = useState('09');
  const [selectedMinute, setSelectedMinute] = useState('00');

  const [showFrequencyPicker, setShowFrequencyPicker] = useState(false);
  const [selectedFrequencyNotification, setSelectedFrequencyNotification] = useState(null);
  const [selectedFrequency, setSelectedFrequency] = useState('1_hour');

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = ['00', '15', '30', '45'];

  const openTimePicker = (notificationKey) => {
    setSelectedNotification(notificationKey);
    const currentTime = notifications[notificationKey].time || '09:00';
    const [hour, minute] = currentTime.split(':');
    setSelectedHour(hour);
    setSelectedMinute(minute);
    setShowTimePicker(true);
  };

  const openFrequencyPicker = (notificationKey) => {
    setSelectedFrequencyNotification(notificationKey);
    const currentFrequency =
      notifications[notificationKey]?.frequency || getDefaultFrequencyForKey(notificationKey);
    setSelectedFrequency(currentFrequency);
    setShowFrequencyPicker(true);
  };

  const closeTimePicker = () => {
    setShowTimePicker(false);
    setSelectedNotification(null);
  };

  const closeFrequencyPicker = () => {
    setShowFrequencyPicker(false);
    setSelectedFrequencyNotification(null);
  };

  const confirmTimePicker = async () => {
    if (!selectedNotification) return;
    const time = `${selectedHour}:${selectedMinute}`;
    await handleTimeChange(selectedNotification, time);
    closeTimePicker();
  };

  const confirmFrequencyPicker = async () => {
    if (!selectedFrequencyNotification) return;
    await handleFrequencyChange(selectedFrequencyNotification, selectedFrequency);
    closeFrequencyPicker();
  };

  // Test notification function
// Send test notification removed per redesign requirement
  /* const sendTestNotification = async () => {
    try {
      await NotificationService.sendImmediateNotification(
        'Test Notification',
        'This is a test notification from Balm.ai!',
        { type: 'test' }
      );
      Alert.alert('Test Sent', 'Check your notifications for the test message.');
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert('Error', 'Could not send test notification.');
    }
  }; */

  // Metadata for titles and descriptions
  const notificationMeta = {
    dailyCheckIn: {
      title: 'Daily Wellness Check-in',
      description: 'Start your day with a mindful assessment',
    },
    sunlightExposure: {
      title: 'Sunlight Exposure',
      description: 'Get 10-15 minutes of natural sunlight',
    },
    waterReminder: {
      title: 'Hydration Reminder',
      description: 'Stay hydrated – drink some water',
    },
    movementReminder: {
      title: 'Movement Break',
      description: 'Time to move and stretch',
    },
    communityUpdates: {
      title: 'Community Updates',
      description: 'New discussions and replies for you',
    },
  };

  const notificationCategories = [
    {
      title: 'Daily Wellness',
      icon: 'sunny-outline',
      color: '#00008b',
      items: ['dailyCheckIn', 'sunlightExposure', 'waterReminder', 'movementReminder']
    },
    {
      title: 'Community',
      icon: 'chatbubble-ellipses-outline',
      color: '#FFD700',
      items: ['communityUpdates']
    }
  ];

  const renderNotificationItem = (key, item) => (
    <View key={key} style={[styles.notificationItem, { backgroundColor: colors.card }]}>
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={[styles.notificationTitle, { color: colors.text }]}>
            {item.title}
          </Text>
          <Switch
            value={item.enabled}
            onValueChange={() => toggleNotification(key)}
            trackColor={{ false: '#e0e0e0', true: '#00008b' }}
            thumbColor={item.enabled ? '#ffffff' : '#f4f3f4'}
          />
        </View>
        
        <Text style={[styles.notificationDescription, { color: colors.textSecondary }]}>
          {item.description}
        </Text>
        
        {item.enabled && (
          <View style={styles.notificationSettings}>
            {item.time && (
              <TouchableOpacity
                style={[styles.timeButton, { backgroundColor: colors.background }]}
                onPress={() => openTimePicker(key)}
              >
                <Ionicons name="time-outline" size={16} color={colors.primary} />
                <Text style={[styles.timeText, { color: colors.primary }]}>
                  {item.time}
                </Text>
              </TouchableOpacity>
            )}
            
            {item.frequency && (
              <View style={[styles.frequencyBadge, { backgroundColor: colors.background }]}>
                <Ionicons name="repeat-outline" size={16} color={colors.primary} />
                <Text style={[styles.frequencyText, { color: colors.primary }]}>
                  {formatFrequency(item.frequency)}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader navigation={navigation} title="Notifications" />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Setting up notifications...
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header Card */}
          <View style={styles.headerSection}>
            <View style={[styles.headerCard, { backgroundColor: colors.card }]}>
              <LinearGradient
                colors={['#00008b', '#000066']}
                style={styles.headerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.headerContent}>
                  <View style={styles.headerIcon}>
                    <Ionicons name="notifications" size={32} color="white" />
                  </View>
                  <View style={styles.headerText}>
                    <Text style={[styles.headerDescription, { color: 'white' }]}>
                      Personalized reminders to support your health journey
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          </View>

        {/* Notification Categories */}
        {notificationCategories.map((category, index) => (
          <View key={category.title} style={styles.categorySection}>
            <View style={styles.categoryHeader}>
              <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                <Ionicons name={category.icon} size={20} color="white" />
              </View>
              <Text style={[styles.categoryTitle, { color: colors.text }]}>
                {category.title}
              </Text>
            </View>
            
            <View style={styles.notificationList}>
              {category.items.map(key => {
                const itemSettings = notifications[key];
                const meta = notificationMeta[key] || {};
                const item = { ...meta, ...itemSettings };
                if (!item) return null;
                
                return (
                  <View key={key} style={[styles.notificationItem, { backgroundColor: colors.card }]}> 
                    <View style={styles.notificationContent}>
                      <View style={styles.notificationHeader}>
                        <Text style={[styles.notificationTitle, { color: colors.text }]}>
                          {item.title}
                        </Text>
                        <Switch
                          value={item.enabled}
                          onValueChange={() => toggleNotification(key)}
                          trackColor={{ false: '#e0e0e0', true: '#00008b' }}
                          thumbColor={item.enabled ? '#ffffff' : '#f4f3f4'}
                        />
                      </View>
                      
                      <Text style={[styles.notificationDescription, { color: colors.textSecondary }]}>
                        {item.description}
                      </Text>

                      {(item.enabled || key === 'waterReminder' || key === 'movementReminder') && (
                        <View style={styles.notificationSettings}>
                          {item.time && (
                            <TouchableOpacity
                              style={[styles.timeButton, { backgroundColor: colors.background }]}
                              onPress={() => openTimePicker(key)}
                            >
                              <Ionicons name="time-outline" size={16} color={colors.primary} />
                              <Text style={[styles.timeText, { color: colors.primary }]}>
                                {item.time}
                              </Text>
                            </TouchableOpacity>
                          )}

                          {(item.frequency || key === 'waterReminder' || key === 'movementReminder') && (
                            <TouchableOpacity
                              style={[
                                styles.frequencyBadge,
                                { backgroundColor: colors.background, opacity: item.enabled ? 1 : 0.7 },
                              ]}
                              onPress={() => openFrequencyPicker(key)}
                            >
                              <Ionicons name="repeat-outline" size={16} color={colors.primary} />
                              <Text style={[styles.frequencyText, { color: colors.primary }]}>
                                {formatFrequency(item.frequency || getDefaultFrequencyForKey(key))}
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ))}
        
        {/* Do Not Disturb Section */}
        <View style={styles.dndSection}>
          <View style={[styles.dndCard, { backgroundColor: colors.card }]}>
            <View style={styles.dndHeader}>
              <View style={[styles.dndIcon, { backgroundColor: colors.background }]}>
                <Ionicons name="moon-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.dndContent}>
                <Text style={[styles.dndTitle, { color: colors.text }]}>Do Not Disturb</Text>
                <Text style={[styles.dndDescription, { color: colors.textSecondary }]}>
                  Quiet hours for uninterrupted rest
                </Text>
              </View>
            </View>
            
            <View style={styles.dndSettings}>
              <View style={styles.dndTimeButtons}>
                <TouchableOpacity 
                  style={[styles.dndTimeButton, { backgroundColor: colors.background }]}
                  onPress={() => openDndTimePicker('start')}
                >
                  <Text style={[styles.dndTimeLabel, { color: colors.textSecondary }]}>Start</Text>
                  <Text style={[styles.dndTimeText, { color: colors.primary }]}>
                    {formatTime(dndStartTime)}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.dndTimeButton, { backgroundColor: colors.background }]}
                  onPress={() => openDndTimePicker('end')}
                >
                  <Text style={[styles.dndTimeLabel, { color: colors.textSecondary }]}>End</Text>
                  <Text style={[styles.dndTimeText, { color: colors.primary }]}>
                    {formatTime(dndEndTime)}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
      )}

      <Modal
        visible={showTimePicker}
        transparent
        animationType="fade"
        onRequestClose={closeTimePicker}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Select time
              </Text>
              <TouchableOpacity onPress={closeTimePicker}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.timePickerContainer}>
              <View style={styles.pickerColumn}>
                <Text style={[styles.pickerLabel, { color: colors.text }]}>Hour</Text>
                <ScrollView style={[styles.pickerWrapper, { backgroundColor: colors.background }]}>
                  {hours.map((h) => (
                    <TouchableOpacity
                      key={h}
                      style={[
                        styles.pickerItem,
                        h === selectedHour && { backgroundColor: 'rgba(0, 0, 139, 0.15)' },
                      ]}
                      onPress={() => setSelectedHour(h)}
                    >
                      <Text style={[styles.pickerItemText, { color: colors.text }]}>{h}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.pickerColumn}>
                <Text style={[styles.pickerLabel, { color: colors.text }]}>Minute</Text>
                <ScrollView style={[styles.pickerWrapper, { backgroundColor: colors.background }]}>
                  {minutes.map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[
                        styles.pickerItem,
                        m === selectedMinute && { backgroundColor: 'rgba(0, 0, 139, 0.15)' },
                      ]}
                      onPress={() => setSelectedMinute(m)}
                    >
                      <Text style={[styles.pickerItemText, { color: colors.text }]}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.card }]}
                onPress={closeTimePicker}
              >
                <Text style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmTimePicker}
              >
                <Text style={[styles.confirmButtonText]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* DND Time Picker Modal */}
      <Modal
        visible={showDndModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDndModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Select {selectedTimeType === 'start' ? 'Start' : 'End'} Time
              </Text>
              <TouchableOpacity onPress={() => setShowDndModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.timePickerContainer}>
              <View style={styles.pickerColumn}>
                <Text style={[styles.pickerLabel, { color: colors.text }]}>Hour</Text>
                <ScrollView style={[styles.pickerWrapper, { backgroundColor: colors.background }]}>
                  {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')).map((h) => (
                    <TouchableOpacity
                      key={h}
                      style={[
                        styles.pickerItem,
                        h === (selectedTimeType === 'start' ? dndStartTime.split(':')[0] : dndEndTime.split(':')[0]) && { backgroundColor: 'rgba(0, 0, 139, 0.15)' },
                      ]}
                      onPress={() => {
                        const currentTime = selectedTimeType === 'start' ? dndStartTime : dndEndTime;
                        const [_, minute] = currentTime.split(':');
                        handleTimeSelect(parseInt(h), parseInt(minute));
                      }}
                    >
                      <Text style={[styles.pickerItemText, { color: colors.text }]}>{h}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.pickerColumn}>
                <Text style={[styles.pickerLabel, { color: colors.text }]}>Minute</Text>
                <ScrollView style={[styles.pickerWrapper, { backgroundColor: colors.background }]}>
                  {['00', '15', '30', '45'].map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[
                        styles.pickerItem,
                        m === (selectedTimeType === 'start' ? dndStartTime.split(':')[1] : dndEndTime.split(':')[1]) && { backgroundColor: 'rgba(0, 0, 139, 0.15)' },
                      ]}
                      onPress={() => {
                        const currentTime = selectedTimeType === 'start' ? dndStartTime : dndEndTime;
                        const [hour, _] = currentTime.split(':');
                        handleTimeSelect(parseInt(hour), parseInt(m));
                      }}
                    >
                      <Text style={[styles.pickerItemText, { color: colors.text }]}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.card }]}
                onPress={() => setShowDndModal(false)}
              >
                <Text style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={() => setShowDndModal(false)}
              >
                <Text style={[styles.confirmButtonText]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showFrequencyPicker}
        transparent
        animationType="fade"
        onRequestClose={closeFrequencyPicker}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select frequency</Text>
              <TouchableOpacity onPress={closeFrequencyPicker}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={[styles.frequencyPickerWrapper, { backgroundColor: colors.background }]}>
              {frequencyOptions.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.frequencyOption,
                    opt.value === selectedFrequency && styles.frequencyOptionSelected,
                  ]}
                  onPress={() => setSelectedFrequency(opt.value)}
                >
                  <Text style={[styles.frequencyOptionText, { color: colors.text }]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.card }]}
                onPress={closeFrequencyPicker}
              >
                <Text style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmFrequencyPicker}
              >
                <Text style={[styles.confirmButtonText]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 20,
  },
  headerCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerGradient: {
    padding: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#000',
  },
  headerDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 5,
    color: '#666',
  },
  quickActionsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  quickActionsCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#000',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
    color: '#000',
  },
  categorySection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  notificationItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    color: '#000',
  },
  notificationDescription: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 12,
    color: '#666',
  },
  notificationSettings: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000',
  },
  frequencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  frequencyText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000',
  },
  dndSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  dndCard: {
    borderRadius: 12,
    padding: 20,
  },
  dndHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dndIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f4ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dndContent: {
    flex: 1,
  },
  dndTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#000',
  },
  dndDescription: {
    fontSize: 14,
    lineHeight: 18,
    color: '#666',
  },
  dndSettings: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dndTimeButtons: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  dndTimeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
  },
  dndTimeLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  dndTimeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  timePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  pickerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000',
  },
  pickerWrapper: {
    borderRadius: 8,
    maxHeight: 200,
  },
  frequencyPickerWrapper: {
    borderRadius: 8,
    maxHeight: 240,
  },
  frequencyOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 6,
  },
  frequencyOptionSelected: {
    backgroundColor: 'rgba(0, 0, 139, 0.15)',
  },
  frequencyOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  pickerItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginVertical: 1,
    borderRadius: 4,
  },
  pickerItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  confirmButton: {
    backgroundColor: '#00008b',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
