// Activity tracking service for Balm.ai Mobile App
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit,
  where,
  serverTimestamp,
  deleteDoc,
  updateDoc,
  Timestamp
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { getCurrentUser } from './authService';

// Activity types
export const ACTIVITY_TYPES = {
  MOOD_CHECK: 'mood_check',
  CHAT_MESSAGE: 'chat_message',
  VIDEO_CALL: 'video_call',
  WELLNESS_EXERCISE: 'wellness_exercise',
  MEDITATION: 'meditation',
  JOURNAL_ENTRY: 'journal_entry',
  APP_OPEN: 'app_open',
  PROFILE_UPDATE: 'profile_update',
  ACHIEVEMENT: 'achievement'
};

// Track user activity
export const trackActivity = async (activityType, data = {}) => {
  try {
    const user = getCurrentUser();
    if (!user) {
      console.log('❌ No user logged in, skipping activity tracking');
      return { success: false, error: 'User not authenticated' };
    }

    const activityData = {
      userId: user.uid,
      type: activityType,
      timestamp: Timestamp.now(), // Use Timestamp.now() instead of serverTimestamp()
      data: {
        ...data,
        userAgent: 'Balm.ai Mobile App',
        platform: 'mobile'
      }
    };

    console.log('🔥 Tracking activity:', activityData);

    // Create activity document
    const activityRef = doc(collection(db, 'users', user.uid, 'activities'));
    await setDoc(activityRef, activityData);
    
    console.log(`✅ Activity tracked: ${activityType}`);
    return { success: true, activityId: activityRef.id };
  } catch (error) {
    console.error('❌ Error tracking activity:', error);
    console.error('❌ Full error details:', JSON.stringify(error, null, 2));
    return { success: false, error: error.message };
  }
};

// Get user activities
export const getUserActivities = async (limitCount = 50) => {
  try {
    const user = getCurrentUser();
    if (!user) {
      console.log('❌ No user authenticated for getUserActivities');
      return { success: false, error: 'User not authenticated' };
    }

    console.log('🔥 Getting activities for user:', user.uid);

    const activitiesQuery = query(
      collection(db, 'users', user.uid, 'activities'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    console.log('🔥 Executing query:', activitiesQuery);

    const querySnapshot = await getDocs(activitiesQuery);
    const activities = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log('✅ Retrieved activities:', activities.length);
    return { success: true, activities };
  } catch (error) {
    console.error('❌ Error getting user activities:', error);
    console.error('❌ Full error details:', JSON.stringify(error, null, 2));
    return { success: false, error: error.message };
  }
};

// Track mood entry
export const trackMood = async (moodScore, moodLabel, notes = '') => {
  try {
    const user = getCurrentUser();
    if (!user) {
      console.log('❌ No user authenticated for mood tracking');
      return { success: false, error: 'User not authenticated' };
    }

    console.log('🔥 Tracking mood:', { moodScore, moodLabel, notes });

    const moodData = {
      userId: user.uid,
      moodScore,
      moodLabel,
      notes,
      timestamp: Timestamp.now() // Use Timestamp.now() instead of serverTimestamp()
    };

    console.log('🔥 Saving mood data:', moodData);

    // Save to moods collection
    const moodRef = doc(collection(db, 'users', user.uid, 'moods'));
    await setDoc(moodRef, moodData);

    console.log('✅ Mood saved successfully to Firestore');

    // Also track as activity
    await trackActivity(ACTIVITY_TYPES.MOOD_CHECK, {
      moodScore,
      moodLabel,
      moodId: moodRef.id
    });

    console.log('✅ Mood activity tracked successfully');
    return { success: true, moodId: moodRef.id };
  } catch (error) {
    console.error('❌ Error tracking mood:', error);
    console.error('❌ Full error details:', JSON.stringify(error, null, 2));
    return { success: false, error: error.message };
  }
};

// Get mood history
export const getMoodHistory = async (limitCount = 30) => {
  try {
    const user = getCurrentUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const moodsQuery = query(
      collection(db, 'users', user.uid, 'moods'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(moodsQuery);
    const moods = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return { success: true, moods };
  } catch (error) {
    console.error('❌ Error getting mood history:', error);
    return { success: false, error: error.message };
  }
};

// Track chat message
export const trackChatMessage = async (message, isUser = true, sessionId = null) => {
  try {
    const user = getCurrentUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const chatData = {
      userId: user.uid,
      message,
      isUser,
      sessionId: sessionId || 'default',
      timestamp: Timestamp.now() // Use Timestamp.now() instead of serverTimestamp()
    };

    // Save to chats collection
    const chatRef = doc(collection(db, 'users', user.uid, 'chats'));
    await setDoc(chatRef, chatData);

    // Track as activity
    await trackActivity(ACTIVITY_TYPES.CHAT_MESSAGE, {
      messageLength: message.length,
      isUser,
      sessionId,
      chatId: chatRef.id
    });

    return { success: true, chatId: chatRef.id };
  } catch (error) {
    console.error('❌ Error tracking chat message:', error);
    return { success: false, error: error.message };
  }
};

// Get chat history
export const getChatHistory = async (sessionId = null, limitCount = 100) => {
  try {
    const user = getCurrentUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    let chatQuery = query(
      collection(db, 'users', user.uid, 'chats'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    // If sessionId is provided, filter by session
    if (sessionId) {
      chatQuery = query(
        collection(db, 'users', user.uid, 'chats'),
        where('sessionId', '==', sessionId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
    }

    const querySnapshot = await getDocs(chatQuery);
    const chats = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return { success: true, chats: chats.reverse() }; // Reverse to show chronological order
  } catch (error) {
    console.error('❌ Error getting chat history:', error);
    return { success: false, error: error.message };
  }
};

// Track wellness session
export const trackWellnessSession = async (sessionType, duration, data = {}) => {
  try {
    const user = getCurrentUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const sessionData = {
      userId: user.uid,
      sessionType,
      duration,
      data,
      timestamp: Timestamp.now() // Use Timestamp.now() instead of serverTimestamp()
    };

    // Save to wellness collection
    const sessionRef = doc(collection(db, 'users', user.uid, 'wellness'));
    await setDoc(sessionRef, sessionData);

    // Track as activity
    await trackActivity(ACTIVITY_TYPES.WELLNESS_EXERCISE, {
      sessionType,
      duration,
      sessionId: sessionRef.id
    });

    console.log('✅ Wellness session tracked successfully');
    return { success: true, sessionId: sessionRef.id };
  } catch (error) {
    console.error('❌ Error tracking wellness session:', error);
    return { success: false, error: error.message };
  }
};

// Get wellness history
export const getWellnessHistory = async (limitCount = 30) => {
  try {
    const user = getCurrentUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const wellnessQuery = query(
      collection(db, 'users', user.uid, 'wellness'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(wellnessQuery);
    const sessions = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return { success: true, sessions };
  } catch (error) {
    console.error('❌ Error getting wellness history:', error);
    return { success: false, error: error.message };
  }
};

// Get user statistics
export const getUserStats = async () => {
  try {
    const user = getCurrentUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Get recent activities
    const activitiesResult = await getUserActivities(100);
    if (!activitiesResult.success) {
      return activitiesResult;
    }

    const activities = activitiesResult.activities;
    
    // Calculate stats
    const stats = {
      totalActivities: activities.length,
      moodChecks: activities.filter(a => a.type === ACTIVITY_TYPES.MOOD_CHECK).length,
      chatMessages: activities.filter(a => a.type === ACTIVITY_TYPES.CHAT_MESSAGE).length,
      videoCalls: activities.filter(a => a.type === ACTIVITY_TYPES.VIDEO_CALL).length,
      wellnessSessions: activities.filter(a => a.type === ACTIVITY_TYPES.WELLNESS_EXERCISE).length,
      lastActive: activities.length > 0 ? activities[0].timestamp : null
    };

    return { success: true, stats };
  } catch (error) {
    console.error('❌ Error getting user stats:', error);
    return { success: false, error: error.message };
  }
};
