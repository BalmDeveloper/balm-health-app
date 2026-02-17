// Firebase configuration for Balm.ai Mobile App
import { initializeApp, getApp } from 'firebase/app';
import {
  initializeAuth,
  getReactNativePersistence,
  browserLocalPersistence,
  getAuth,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Your Firebase config object - using environment variables
const extraFirebaseConfig =
  Constants.expoConfig?.extra?.firebase ??
  Constants.manifest?.extra?.firebase ??
  Constants.manifest2?.extra?.firebase ??
  null;

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? extraFirebaseConfig?.apiKey,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? extraFirebaseConfig?.authDomain,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? extraFirebaseConfig?.projectId,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? extraFirebaseConfig?.storageBucket,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? extraFirebaseConfig?.messagingSenderId,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? extraFirebaseConfig?.appId,
};

console.log('🔥 Firebase Config Debug:');
console.log('  API Key:', firebaseConfig.apiKey ? '✅ Set' : '❌ Missing');
console.log('  Auth Domain:', firebaseConfig.authDomain ? '✅ Set' : '❌ Missing');
console.log('  Project ID:', firebaseConfig.projectId ? '✅ Set' : '❌ Missing');
console.log('  Storage Bucket:', firebaseConfig.storageBucket ? '✅ Set' : '❌ Missing');
console.log('  Messaging Sender ID:', firebaseConfig.messagingSenderId ? '✅ Set' : '❌ Missing');
console.log('  App ID:', firebaseConfig.appId ? '✅ Set' : '❌ Missing');

// Initialize Firebase
let app;
let firebaseInitError = null;
try {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) {
    throw new Error('Missing required Firebase configuration. Please check your environment variables.');
  }
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase app initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  if (error.code === 'app/duplicate-app') {
    // Firebase app already initialized, get the existing app
    app = getApp();
    console.log('✅ Using existing Firebase app');
  } else {
    console.error('❌ Failed to initialize Firebase:', error.message);
    firebaseInitError = error;
  }
}

let authInstance;

try {
  if (!app) {
    throw new Error('Firebase app not initialized');
  }

  if (Platform.OS === 'web') {
    authInstance = getAuth(app);
    authInstance.setPersistence(browserLocalPersistence);
    console.log('✅ Web Firebase Auth initialized');
  } else {
    authInstance = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
    console.log('✅ Mobile Firebase Auth initialized');
  }
} catch (error) {
  console.error('❌ Firebase Auth initialization error:', error);
  if (error.code === 'auth/already-initialized') {
    // Auth already initialized, get existing auth instance
    authInstance = getAuth(app);
    console.log('✅ Using existing Firebase Auth');
  } else {
    console.error('❌ Failed to initialize Firebase Auth:', error.message);
    if (!firebaseInitError) {
      firebaseInitError = error;
    }
  }
}

export const auth = authInstance;

// Initialize Cloud Firestore and get a reference to the service
export const db = app ? getFirestore(app) : null;

// Initialize Firebase Storage and get a reference to the service
export const storage = app ? getStorage(app) : null;

export const isFirebaseReady = !!app && !!authInstance;
export const firebaseError = firebaseInitError;

export default app;
