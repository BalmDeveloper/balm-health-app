// Authentication service for Balm.ai Mobile App
import { 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile as updateProfileInAuth
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { Platform } from 'react-native';

// Email/Password Sign Up
export const signUpWithEmail = async (email, password, displayName) => {
  try {
    if (!auth) {
      return { success: false, error: 'Authentication is not configured. Please try again later.' };
    }

    // Validate inputs
    if (!email || !password) {
      return { success: false, error: 'Email and password are required.' };
    }

    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    console.log('🔥 Starting sign up with:', { email, displayName });
    
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;
    
    console.log('🔥 User created successfully:', user.uid);
    
    // Update the user's profile with display name
    if (displayName) {
      console.log('🔥 Setting display name to:', displayName);
      await updateProfileInAuth(user, {
        displayName: displayName
      });
      console.log('✅ Display name set successfully in Firebase Auth');
      
      // Force refresh the user to get the updated displayName
      await user.reload();
      console.log('🔥 User reloaded, displayName:', user.displayName);
    }
    
    // Save user data to Firestore with display name
    await saveUserToFirestore(user, displayName);
    
    return { success: true, user };
  } catch (error) {
    console.error('❌ Email sign-up error:', error);
    
    // Provide specific error messages
    let errorMessage = error.message;
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'An account with this email already exists. Try signing in instead.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Please enter a valid email address.';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password should be at least 6 characters long.';
    } else if (error.code === 'auth/network-request-failed') {
      errorMessage = 'Network error. Please check your internet connection.';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Too many attempts. Please try again later.';
    }
    
    return { success: false, error: errorMessage };
  }
};

// Email/Password Sign In
export const signInWithEmail = async (email, password) => {
  try {
    if (!auth) {
      return { success: false, error: 'Authentication is not configured. Please try again later.' };
    }

    // Validate inputs
    if (!email || !password) {
      return { success: false, error: 'Email and password are required.' };
    }

    const result = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: result.user };
  } catch (error) {
    console.error('Email sign-in error:', error);
    
    // Provide specific error messages
    let errorMessage = error.message;
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No account found with this email. Try signing up first.';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'Incorrect password. Please try again.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Please enter a valid email address.';
    } else if (error.code === 'auth/user-disabled') {
      errorMessage = 'This account has been disabled.';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Too many failed attempts. Please try again later.';
    } else if (error.code === 'auth/network-request-failed') {
      errorMessage = 'Network error. Please check your internet connection.';
    }
    
    return { success: false, error: errorMessage };
  }
};

// Password Reset
export const resetPassword = async (email) => {
  try {
    if (!auth) {
      return { success: false, error: 'Authentication is not configured. Please try again later.' };
    }

    // Validate email
    if (!email) {
      return { success: false, error: 'Email address is required.' };
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    console.log('🔐 Firebase sendPasswordResetEmail for:', email);
    console.log('🔐 Auth instance:', auth ? '✅ Available' : '❌ Missing');
    console.log('🔐 Current user:', auth.currentUser ? auth.currentUser.email : 'None');
    
    await sendPasswordResetEmail(auth, email);
    console.log('🔐 Firebase sendPasswordResetEmail succeeded');
    
    return { 
      success: true, 
      message: 'Password reset email sent! Check your inbox (including spam folder).' 
    };
  } catch (error) {
    console.error('🔐 Firebase sendPasswordResetEmail error:', error);
    console.error('🔐 Error code:', error.code);
    console.error('🔐 Error message:', error.message);
    console.error('🔐 Full error object:', JSON.stringify(error, null, 2));
    
    // Provide more specific error messages
    let errorMessage = error.message;
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No account found with this email address.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'The email address is not valid.';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Too many requests. Try again later.';
    } else if (error.code === 'auth/network-request-failed') {
      errorMessage = 'Network error. Please check your internet connection.';
    }
    
    return { success: false, error: errorMessage };
  }
};

// Sign Out
export const signOutUser = async () => {
  try {
    if (!auth) {
      return { success: true };
    }

    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Sign-out error:', error);
    return { success: false, error: error.message };
  }
};

// Save user data to Firestore
const saveUserToFirestore = async (user, displayName = null) => {
  try {
    const userRef = doc(db, 'users', user.uid);
    
    // Try to get document with offline tolerance
    let userExists = false;
    try {
      const userSnap = await getDoc(userRef);
      userExists = userSnap.exists();
    } catch (getError) {
      console.log('Could not check if user exists (offline), creating new user document');
      userExists = false;
    }
    
    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: displayName || user.displayName || 'Anonymous',
      photoURL: user.photoURL || null,
      lastLoginAt: new Date().toISOString(),
      appVersion: '1.0.0',
      platform: 'mobile'
    };
    
    if (!userExists) {
      userData.createdAt = new Date().toISOString();
    }
    
    // Use merge: true to handle both create and update cases
    await setDoc(userRef, userData, { merge: true });
    console.log('User data saved successfully');
    
  } catch (error) {
    console.error('Error saving user to Firestore:', error);
    // Don't throw the error - allow authentication to continue even if Firestore fails
    console.log('Authentication will continue despite Firestore error');
  }
};

// Get current authenticated user
export const getCurrentUser = () => {
  return auth?.currentUser ?? null;
};

// Test Firebase connection
export const testFirebaseConnection = async () => {
  try {
    console.log('Testing Firebase connection...');
    const testDoc = doc(db, 'test', 'connection');
    await setDoc(testDoc, { 
      timestamp: new Date().toISOString(),
      test: true 
    });
    console.log('✅ Firebase connection successful');
    return { success: true };
  } catch (error) {
    console.error('❌ Firebase connection failed:', error);
    return { success: false, error: error.message };
  }
};

// Update user profile
export const updateProfile = async (profileData) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error('❌ No user authenticated for profile update');
      return { success: false, error: 'No user authenticated' };
    }

    console.log('🔥 Updating profile for user:', user.uid);
    console.log('🔥 Profile data:', profileData);

    // Update display name in Firebase Auth
    if (profileData.displayName) {
      console.log('🔥 Updating display name to:', profileData.displayName);
      await updateProfileInAuth(user, {
        displayName: profileData.displayName,
      });
      console.log('✅ Display name updated in Firebase Auth');
    }

    // Update profile image in Firebase Auth if provided
    if (profileData.profileImage) {
      console.log('🔥 Updating profile image to:', profileData.profileImage);
      await updateProfileInAuth(user, {
        photoURL: profileData.profileImage,
      });
      console.log('✅ Profile image updated in Firebase Auth');
    }

    // Update profile in Firestore
    const userRef = doc(db, 'users', user.uid, 'profile', 'info');
    console.log('🔥 Writing to Firestore path:', userRef.path);
    
    await setDoc(userRef, {
      ...profileData,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    console.log('✅ Profile updated successfully in Firestore');
    return { success: true };
  } catch (error) {
    console.error('❌ Error updating profile:', error);
    console.error('❌ Error details:', JSON.stringify(error, null, 2));
    return { success: false, error: error.message };
  }
};
