import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  constructor() {
    this.isInitialized = false;
    this.initializingPromise = null;
    this.scheduledNotifications = new Map();
    this.notificationSettings = {};
  }

  // Initialize notification service
  async initialize() {
    try {
      if (this.isInitialized) return true;
      if (this.initializingPromise) return await this.initializingPromise;

      this.initializingPromise = (async () => {
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.HIGH,
            sound: 'default',
            enableVibrate: true,
          });
        }

        // Request permissions
        const hasPermission = await this.requestPermissions();
        if (!hasPermission) {
          console.log('❌ Notification permissions denied');
          return false;
        }

        // Load saved notification settings
        await this.loadNotificationSettings();

        // Schedule notifications based on saved settings
        await this.scheduleAllNotifications();

        this.isInitialized = true;
        console.log('✅ Notification service initialized');
        return true;
      })();

      return await this.initializingPromise;
    } catch (error) {
      console.error('❌ Error initializing notification service:', error);
      return false;
    } finally {
      this.initializingPromise = null;
    }
  }

  // Request notification permissions
  async requestPermissions() {
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });
        finalStatus = status;
      }

      return finalStatus === 'granted';
    } else {
      console.log('⚠️ Must use physical device for notifications');
      return false;
    }
  }

  // Load notification settings from storage
  async loadNotificationSettings() {
    try {
      const savedSettings = await AsyncStorage.getItem('notificationSettings');
      if (savedSettings) {
        this.notificationSettings = JSON.parse(savedSettings);
        console.log('📱 Loaded notification settings:', this.notificationSettings);
      } else {
        // Default settings
        this.notificationSettings = {
          dailyCheckIn: { enabled: true, time: '09:00' },
          sunlightExposure: { enabled: true, time: '10:00' },
          waterReminder: { enabled: true, frequency: '2_hours' },
          movementReminder: { enabled: true, frequency: '1_hour' },
          communityUpdates: { enabled: true }
        };
        await this.saveNotificationSettings();
      }
    } catch (error) {
      console.error('❌ Error loading notification settings:', error);
      this.notificationSettings = {};
    }
  }

  // Save notification settings to storage
  async saveNotificationSettings() {
    try {
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(this.notificationSettings));
      console.log('💾 Saved notification settings');
    } catch (error) {
      console.error('❌ Error saving notification settings:', error);
    }
  }

  // Update notification settings
  async updateSettings(key, settings) {
    try {
      this.notificationSettings[key] = settings;
      await this.saveNotificationSettings();
      
      // Reschedule notifications for this key
      await this.cancelNotification(key);
      await this.scheduleNotification(key, settings);
      
      console.log(`✅ Updated notification settings for ${key}`);
    } catch (error) {
      console.error(`❌ Error updating settings for ${key}:`, error);
    }
  }

  // Schedule all notifications
  async scheduleAllNotifications() {
    try {
      // Cancel all existing notifications first
      await this.cancelAllNotifications();

      // Schedule each enabled notification
      for (const [key, settings] of Object.entries(this.notificationSettings)) {
        if (settings.enabled) {
          await this.scheduleNotification(key, settings);
        }
      }

      console.log('✅ All notifications scheduled');
    } catch (error) {
      console.error('❌ Error scheduling all notifications:', error);
    }
  }

  // Schedule individual notification
  async scheduleNotification(key, settings) {
    try {
      if (!settings.enabled) return;

      await this.cancelNotificationsByType(key);

      let trigger;
      let content;

      switch (key) {
        case 'dailyCheckIn':
          const [hour, minute] = settings.time.split(':');
          trigger = {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: parseInt(hour, 10),
            minute: parseInt(minute, 10),
          };
          content = {
            title: 'Daily Wellness Check-in',
            body: 'Start your day with mindful assessment',
            data: { type: 'dailyCheckIn' },
          };
          break;

        case 'sunlightExposure':
          const [sunHour, sunMinute] = settings.time.split(':');
          trigger = {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: parseInt(sunHour, 10),
            minute: parseInt(sunMinute, 10),
          };
          content = {
            title: 'Sunlight Exposure',
            body: 'Get 10-15 minutes of natural sunlight daily',
            data: { type: 'sunlightExposure' },
          };
          break;

        case 'waterReminder':
          const intervalMinutes = this.getFrequencyMinutes(settings.frequency);
          trigger = {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: intervalMinutes * 60,
            repeats: true,
          };
          content = {
            title: 'Hydration Reminder',
            body: 'Time to drink water and stay hydrated',
            data: { type: 'waterReminder' },
          };
          break;

        case 'movementReminder':
          const movementMinutes = this.getFrequencyMinutes(settings.frequency);
          trigger = {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: movementMinutes * 60,
            repeats: true,
          };
          content = {
            title: 'Movement Break',
            body: 'Time to move and stretch',
            data: { type: 'movementReminder' },
          };
          break;

        case 'communityUpdates':
          // Community updates would be triggered by backend events
          // For now, we'll skip scheduling this
          return;

        default:
          return;
      }

      // Schedule the notification
      const identifier = await Notifications.scheduleNotificationAsync({
        content,
        trigger,
      });

      this.scheduledNotifications.set(key, identifier);
      console.log(`✅ Scheduled notification for ${key}: ${identifier}`);
    } catch (error) {
      console.error(`❌ Error scheduling notification for ${key}:`, error);
    }
  }

  async cancelNotificationsByType(type) {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const matches = scheduled.filter((n) => n?.content?.data?.type === type);
      await Promise.all(
        matches.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
      );
    } catch (error) {
      console.error(`❌ Error cancelling scheduled notifications for ${type}:`, error);
    }
  }

  // Convert frequency string to minutes
  getFrequencyMinutes(frequency) {
    const frequencyMap = {
      '30_min': 30,
      '1_hour': 60,
      '2_hours': 120,
      '3_hours': 180,
      '4_hours': 240,
    };
    return frequencyMap[frequency] || 60;
  }

  // Cancel specific notification
  async cancelNotification(key) {
    try {
      const identifier = this.scheduledNotifications.get(key);
      if (identifier) {
        await Notifications.cancelScheduledNotificationAsync(identifier);
        this.scheduledNotifications.delete(key);
        console.log(`✅ Cancelled notification for ${key}`);
      } else {
        await this.cancelNotificationsByType(key);
      }
    } catch (error) {
      console.error(`❌ Error cancelling notification for ${key}:`, error);
    }
  }

  // Cancel all notifications
  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      this.scheduledNotifications.clear();
      console.log('✅ Cancelled all scheduled notifications');
    } catch (error) {
      console.error('❌ Error cancelling all notifications:', error);
    }
  }

  // Get current notification settings
  getSettings() {
    return this.notificationSettings || {};
  }

  // Send immediate notification (for testing or community updates)
  async sendImmediateNotification(title, body, data = {}) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
        },
        trigger: null, // Show immediately
      });
      console.log('✅ Sent immediate notification');
    } catch (error) {
      console.error('❌ Error sending immediate notification:', error);
    }
  }

  // Get notification listener for handling interactions
  getNotificationListener() {
    return Notifications.addNotificationResponseReceivedListener(response => {
      console.log('🔔 Notification tapped:', response.notification);
      // Handle notification tap here
      const data = response.notification.request.content.data;
      if (data.type) {
        console.log(`📱 User tapped ${data.type} notification`);
        // Navigate to appropriate screen based on notification type
      }
    });
  }
}

// Export singleton instance
export default new NotificationService();
