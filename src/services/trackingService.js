import { collection, addDoc, getDocs, query, where, orderBy, limit, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { getCurrentUser } from './authService';

const COLLECTION_NAME = 'healthEntries';

export const addHealthEntry = async (entry) => {
  try {
    console.log('🔥 Starting addHealthEntry with data:', entry);
    
    const user = getCurrentUser();
    console.log('🔥 Current user:', user);
    if (!user) throw new Error('User not authenticated');

    const newEntry = {
      userId: user.uid,
      timestamp: Timestamp.now(),
      date: new Date().toLocaleDateString(),
      ...entry
    };
    
    console.log('🔥 Prepared entry for Firestore:', newEntry);

    const docRef = await addDoc(collection(db, COLLECTION_NAME), newEntry);
    console.log('🔥 Document saved successfully with ID:', docRef.id);
    
    return { ...newEntry, id: docRef.id };
  } catch (error) {
    console.error('❌ Error adding health entry:', error);
    console.error('❌ Error details:', error.code, error.message);
    throw error;
  }
};

export const getHealthHistory = async (days = 30) => {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // Simple query by userId only, then filter in JavaScript
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(200) // Increased limit to get more data for filtering
    );

    const querySnapshot = await getDocs(q);
    const allEntries = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate().toISOString(),
      date: doc.data().timestamp.toDate().toLocaleDateString()
    }));
    
    // Filter by date in JavaScript to avoid index requirement
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const filteredEntries = allEntries.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      return entryDate >= cutoffDate;
    });
    
    return filteredEntries;
  } catch (error) {
    console.error('Error fetching health history:', error);
    throw error;
  }
};

export const getHealthStats = async (days = 30) => {
  try {
    const entries = await getHealthHistory(days);

    if (entries.length === 0) return null;

    const movements = entries.filter(e => e.movement).map(e => e.movement);
    const bmis = entries.filter(e => e.bmi).map(e => parseFloat(e.bmi));
    const sleepHours = entries.filter(e => e.sleep).map(e => parseFloat(e.sleep));
    const moods = entries.filter(e => e.mood);

    const avgMovement = movements.length > 0 
      ? (movements.reduce((a, b) => a + parseInt(b), 0) / movements.length).toFixed(0)
      : 0;

    const avgBmi = bmis.length > 0 
      ? (bmis.reduce((a, b) => a + b, 0) / bmis.length).toFixed(1)
      : 0;

    const avgSleep = sleepHours.length > 0 
      ? (sleepHours.reduce((a, b) => a + b, 0) / sleepHours.length).toFixed(1)
      : 0;

    const moodCounts = moods.reduce((acc, curr) => {
      acc[curr] = (acc[curr] || 0) + 1;
      return acc;
    }, {});

    const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    return {
      avgMovement,
      avgBmi,
      avgSleep,
      topMood,
      totalEntries: entries.length
    };
  } catch (error) {
    console.error('Error calculating stats:', error);
    throw error;
  }
};

export const deleteHealthEntry = async (entryId) => {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    await deleteDoc(doc(db, COLLECTION_NAME, entryId));
  } catch (error) {
    console.error('Error deleting entry:', error);
    throw error;
  }
};
