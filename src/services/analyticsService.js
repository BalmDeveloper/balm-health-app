import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { getCurrentUser } from './authService';

// Comprehensive user tracking service
class AnalyticsService {
  constructor() {
    this.userId = null;
    this.sessionStart = new Date();
    this.currentPage = null;
    this.pageStartTime = null;
  }

  // Initialize tracking for current user
  initialize() {
    const user = getCurrentUser();
    if (user) {
      this.userId = user.uid;
      this.trackSession();
    }
  }

  // Track user session start
  async trackSession() {
    if (!this.userId) return;
    
    try {
      await addDoc(collection(db, 'userActivity'), {
        userId: this.userId,
        timestamp: serverTimestamp(),
        action: 'session_start',
        sessionId: this.generateSessionId(),
        platform: this.getPlatform(),
        appVersion: '1.0.0'
      });
    } catch (error) {
      // Silently handle Firebase permission errors to avoid app crashes
      if (error.code === 'permission-denied' || error.code === 'unavailable') {
        console.log('📝 Analytics permission denied - skipping tracking');
      } else {
        console.error('Error tracking session:', error);
      }
    }
  }

  // Track page visits
  async trackPage(pageName) {
    if (!this.userId) return;

    // Track page exit if coming from another page
    if (this.currentPage && this.pageStartTime) {
      await this.trackPageExit(this.currentPage);
    }

    this.currentPage = pageName;
    this.pageStartTime = new Date();

    try {
      await addDoc(collection(db, 'userActivity'), {
        userId: this.userId,
        timestamp: serverTimestamp(),
        action: 'page_visit',
        page: pageName,
        sessionId: this.generateSessionId()
      });
    } catch (error) {
      // Silently handle Firebase permission errors to avoid app crashes
      if (error.code === 'permission-denied' || error.code === 'unavailable') {
        console.log('📝 Analytics permission denied - skipping tracking');
      } else {
        console.error('Error tracking page:', error);
      }
    }
  }

  // Track page exit with duration
  async trackPageExit(pageName) {
    if (!this.userId) return;

    const duration = this.pageStartTime ? Date.now() - this.pageStartTime.getTime() : 0;

    try {
      await addDoc(collection(db, 'userActivity'), {
        userId: this.userId,
        timestamp: serverTimestamp(),
        action: 'page_exit',
        page: pageName,
        duration: duration,
        sessionId: this.generateSessionId()
      });
    } catch (error) {
      // Silently handle Firebase permission errors to avoid app crashes
      if (error.code === 'permission-denied' || error.code === 'unavailable') {
        console.log('📝 Analytics permission denied - skipping tracking');
      } else {
        console.error('Error tracking page exit:', error);
      }
    }
  }

  // Track button clicks
  async trackButton(buttonName, page, additionalData = {}) {
    if (!this.userId) return;

    try {
      await addDoc(collection(db, 'userActivity'), {
        userId: this.userId,
        timestamp: serverTimestamp(),
        action: 'button_click',
        button: buttonName,
        page: page,
        sessionId: this.generateSessionId(),
        ...additionalData
      });
    } catch (error) {
      // Silently handle Firebase permission errors to avoid app crashes
      if (error.code === 'permission-denied' || error.code === 'unavailable') {
        console.log('📝 Analytics permission denied - skipping tracking');
      } else {
        console.error('Error tracking button:', error);
      }
    }
  }

  // Track video interactions
  async trackVideoInteraction(videoId, title, action, additionalData = {}) {
    if (!this.userId) return;

    try {
      await addDoc(collection(db, 'resourceHistory'), {
        userId: this.userId,
        timestamp: serverTimestamp(),
        resourceType: 'video',
        resourceId: videoId,
        title: title,
        action: action, // 'start', 'complete', 'pause', 'resume'
        sessionId: this.generateSessionId(),
        ...additionalData
      });
    } catch (error) {
      console.error('Error tracking video:', error);
    }
  }

  // Track chat interactions
  async trackChatInteraction(messageType, messageLength, additionalData = {}) {
    if (!this.userId) return;

    try {
      await addDoc(collection(db, 'chatHistory'), {
        userId: this.userId,
        timestamp: serverTimestamp(),
        messageType: messageType, // 'user', 'ai'
        messageLength: messageLength,
        sessionId: this.generateSessionId(),
        ...additionalData
      });
    } catch (error) {
      console.error('Error tracking chat:', error);
    }
  }

  // Track wellness activities
  async trackWellnessActivity(activityType, mood, additionalData = {}) {
    if (!this.userId) return;

    try {
      await addDoc(collection(db, 'wellnessActivities'), {
        userId: this.userId,
        timestamp: serverTimestamp(),
        activityType: activityType, // 'mood_tracking', 'meditation', 'exercise'
        mood: mood,
        sessionId: this.generateSessionId(),
        ...additionalData
      });
    } catch (error) {
      console.error('Error tracking wellness activity:', error);
    }
  }

  // Track video calls
  async trackVideoCall(action, duration = 0, additionalData = {}) {
    if (!this.userId) return;

    try {
      await addDoc(collection(db, 'videoCalls'), {
        userId: this.userId,
        timestamp: serverTimestamp(),
        action: action, // 'start', 'end', 'mute', 'unmute'
        duration: duration,
        sessionId: this.generateSessionId(),
        ...additionalData
      });
    } catch (error) {
      console.error('Error tracking video call:', error);
    }
  }

  // Track health data entries
  async trackHealthEntry(dataType, value, additionalData = {}) {
    if (!this.userId) return;

    try {
      await addDoc(collection(db, 'healthEntries'), {
        userId: this.userId,
        timestamp: serverTimestamp(),
        dataType: dataType, // 'steps', 'bmi', 'sleep', 'mood'
        value: value,
        sessionId: this.generateSessionId(),
        ...additionalData
      });
    } catch (error) {
      console.error('Error tracking health entry:', error);
    }
  }

  // Track app errors
  async trackError(error, context = {}) {
    if (!this.userId) return;

    try {
      await addDoc(collection(db, 'userActivity'), {
        userId: this.userId,
        timestamp: serverTimestamp(),
        action: 'error',
        error: error.message,
        stack: error.stack,
        context: context,
        sessionId: this.generateSessionId()
      });
    } catch (error) {
      console.error('Error tracking error:', error);
    }
  }

  // Helper methods
  generateSessionId() {
    return `${this.userId}_${this.sessionStart.getTime()}`;
  }

  getPlatform() {
    // Detect platform (could be enhanced with Platform from react-native)
    return typeof window !== 'undefined' ? 'web' : 'mobile';
  }

  // End current session
  async endSession() {
    if (!this.userId) return;

    // Track final page exit
    if (this.currentPage) {
      await this.trackPageExit(this.currentPage);
    }

    // Track session end
    try {
      await addDoc(collection(db, 'userActivity'), {
        userId: this.userId,
        timestamp: serverTimestamp(),
        action: 'session_end',
        sessionId: this.generateSessionId(),
        sessionDuration: Date.now() - this.sessionStart.getTime()
      });
    } catch (error) {
      console.error('Error tracking session end:', error);
    }
  }
}

// Create singleton instance
const analytics = new AnalyticsService();

export default analytics;

// Convenience functions for easy importing
export const trackPage = (pageName) => analytics.trackPage(pageName);
export const trackButton = (buttonName, page, data) => analytics.trackButton(buttonName, page, data);
export const trackVideo = (videoId, title, action, data) => analytics.trackVideoInteraction(videoId, title, action, data);
export const trackChat = (messageType, messageLength, data) => analytics.trackChatInteraction(messageType, messageLength, data);
export const trackWellness = (activityType, mood, data) => analytics.trackWellnessActivity(activityType, mood, data);
export const trackVideoCall = (action, duration, data) => analytics.trackVideoCall(action, duration, data);
export const trackHealth = (dataType, value, data) => analytics.trackHealthEntry(dataType, value, data);
export const trackError = (error, context) => analytics.trackError(error, context);
export const initializeAnalytics = () => analytics.initialize();
export const trackSession = (sessionId) => analytics.trackSession(sessionId);
