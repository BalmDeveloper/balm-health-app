import { db } from '../config/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  addDoc,
  Timestamp,
  serverTimestamp 
} from 'firebase/firestore';

// Helper to remove undefined/null values from objects
const cleanObject = (obj) => {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(cleanObject).filter(v => v !== null && v !== undefined);
  
  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null) continue;
    cleaned[key] = cleanObject(value);
  }
  return cleaned;
};

// Collection names
const COLLECTIONS = {
  USERS: 'users',
  HEALTH_PROFILES: 'healthProfiles',
  MOOD_ENTRIES: 'moodEntries',
  CHAT_MESSAGES: 'chatMessages',
  WELLNESS_ACTIVITIES: 'wellnessActivities',
  APP_ACTIVITIES: 'appActivities'
};

// User Profile Service
export const userService = {
  // Create or update user profile
  async saveUserProfile(userId, userData) {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      const userDoc = {
        ...userData,
        updatedAt: serverTimestamp(),
        createdAt: userData.createdAt || serverTimestamp()
      };
      
      await setDoc(userRef, userDoc, { merge: true });
      console.log('✅ User profile saved successfully');
      return userDoc;
    } catch (error) {
      console.error('❌ Error saving user profile:', error);
      throw error;
    }
  },

  // Get user profile
  async getUserProfile(userId) {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return { id: userSnap.id, ...userSnap.data() };
      } else {
        console.log('📄 No user profile found');
        return null;
      }
    } catch (error) {
      console.error('❌ Error getting user profile:', error);
      throw error;
    }
  }
};

// Health Profile Service
export const healthProfileService = {
  // Save health profile biodata
  async saveHealthProfile(userId, healthData) {
    try {
      const profileRef = doc(db, COLLECTIONS.HEALTH_PROFILES, userId);
      const profileDoc = {
        userId,
        ...cleanObject(healthData),
        updatedAt: serverTimestamp(),
        createdAt: healthData.createdAt || serverTimestamp()
      };
      
      await setDoc(profileRef, profileDoc, { merge: true });
      console.log('✅ Health profile saved successfully');
      return profileDoc;
    } catch (error) {
      console.error('❌ Error saving health profile:', error);
      throw error;
    }
  },

  // Get health profile
  async getHealthProfile(userId) {
    try {
      const profileRef = doc(db, COLLECTIONS.HEALTH_PROFILES, userId);
      const profileSnap = await getDoc(profileRef);
      
      if (profileSnap.exists()) {
        return { id: profileSnap.id, ...profileSnap.data() };
      } else {
        console.log('📄 No health profile found');
        return null;
      }
    } catch (error) {
      console.error('❌ Error getting health profile:', error);
      throw error;
    }
  }
};

// Mood Tracking Service
export const moodService = {
  // Save mood entry
  async saveMoodEntry(userId, moodData) {
    try {
      const moodEntry = {
        userId,
        ...moodData,
        timestamp: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, COLLECTIONS.MOOD_ENTRIES), moodEntry);
      console.log('✅ Mood entry saved successfully');
      return { id: docRef.id, ...moodEntry };
    } catch (error) {
      console.error('❌ Error saving mood entry:', error);
      throw error;
    }
  },

  // Get mood entries
  async getMoodEntries(userId, limitCount = 30) {
    try {
      const q = query(
        collection(db, COLLECTIONS.MOOD_ENTRIES),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('❌ Error getting mood entries:', error);
      throw error;
    }
  }
};

// Chat Service
export const chatService = {
  // Save chat message
  async saveChatMessage(userId, messageData) {
    try {
      const message = {
        userId,
        ...messageData,
        timestamp: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, COLLECTIONS.CHAT_MESSAGES), message);
      console.log('✅ Chat message saved successfully');
      return { id: docRef.id, ...message };
    } catch (error) {
      console.error('❌ Error saving chat message:', error);
      throw error;
    }
  },

  // Get chat history
  async getChatHistory(userId, limitCount = 50) {
    try {
      const q = query(
        collection(db, COLLECTIONS.CHAT_MESSAGES),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('❌ Error getting chat history:', error);
      throw error;
    }
  }
};

// Wellness Activities Service
export const wellnessService = {
  // Save wellness activity
  async saveWellnessActivity(userId, activityData) {
    try {
      const activity = {
        userId,
        ...activityData,
        timestamp: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, COLLECTIONS.WELLNESS_ACTIVITIES), activity);
      console.log('✅ Wellness activity saved successfully');
      return { id: docRef.id, ...activity };
    } catch (error) {
      console.error('❌ Error saving wellness activity:', error);
      throw error;
    }
  },

  // Get wellness activities
  async getWellnessActivities(userId, limitCount = 30) {
    try {
      const q = query(
        collection(db, COLLECTIONS.WELLNESS_ACTIVITIES),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('❌ Error getting wellness activities:', error);
      throw error;
    }
  },

  // Get total steps since signup
  async getTotalStepsSinceSignup(userId) {
    try {
      const q = query(
        collection(db, COLLECTIONS.WELLNESS_ACTIVITIES),
        where('userId', '==', userId),
        where('type', '==', 'steps')
      );
      
      const querySnapshot = await getDocs(q);
      let totalSteps = 0;
      
      querySnapshot.forEach((doc) => {
        const activity = doc.data();
        const data = activity.data || {};
        if (Number.isFinite(data.steps)) {
          totalSteps += data.steps;
        }
      });
      
      return totalSteps;
    } catch (error) {
      console.error('❌ Error getting total steps since signup:', error);
      return 0;
    }
  }
};

// General App Activities Service
export const activityService = {
  // Log any app activity
  async logActivity(userId, activityType, activityData) {
    try {
      const activity = {
        userId,
        activityType,
        ...activityData,
        timestamp: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, COLLECTIONS.APP_ACTIVITIES), activity);
      console.log(`✅ ${activityType} activity logged successfully`);
      return { id: docRef.id, userId: activity.userId, activityType: activity.activityType, ...activityData, timestamp: activity.timestamp };
    } catch (error) {
      console.error(`❌ Error logging ${activityType} activity:`, error);
      throw error;
    }
  },

  // Get user activities
  async getUserActivities(userId, activityType = null, limitCount = 50) {
    try {
      let q = query(
        collection(db, COLLECTIONS.APP_ACTIVITIES),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      if (activityType) {
        q = query(
          collection(db, COLLECTIONS.APP_ACTIVITIES),
          where('userId', '==', userId),
          where('activityType', '==', activityType),
          orderBy('timestamp', 'desc'),
          limit(limitCount)
        );
      }
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('❌ Error getting user activities:', error);
      throw error;
    }
  }
};

// Analytics Service
export const analyticsService = {
  // Get user statistics
  async getUserStats(userId) {
    try {
      const [
        moodEntries,
        chatMessages,
        wellnessActivities,
        allActivities
      ] = await Promise.all([
        moodService.getMoodEntries(userId, 100),
        chatService.getChatHistory(userId, 100),
        wellnessService.getWellnessActivities(userId, 100),
        activityService.getUserActivities(userId, null, 100)
      ]);

      return {
        totalMoodEntries: moodEntries.length,
        totalChatMessages: chatMessages.length,
        totalWellnessActivities: wellnessActivities.length,
        totalActivities: allActivities.length,
        lastActivity: allActivities[0]?.timestamp || null
      };
    } catch (error) {
      console.error('❌ Error getting user stats:', error);
      throw error;
    }
  }
};

export default {
  userService,
  healthProfileService,
  moodService,
  chatService,
  wellnessService,
  activityService,
  analyticsService
};
