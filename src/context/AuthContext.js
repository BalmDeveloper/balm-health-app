// Authentication context for Balm.ai Mobile App
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, isFirebaseReady, firebaseError } from '../config/firebase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔥 Setting up auth state listener in AuthContext');

    if (!isFirebaseReady || !auth) {
      console.error('❌ Firebase is not ready in AuthContext:', firebaseError?.message ?? 'Unknown error');
      setUser(null);
      setLoading(false);
      return;
    }

    // Add timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      setLoading(false);
      console.log('🔥 Loading timeout reached - forcing loading to false');
    }, 3000); // 3 second timeout

    // Use Firebase's onAuthStateChanged directly for better persistence
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      console.log('🔥 Auth state changed in AuthContext:', nextUser ? nextUser.uid : 'No user');
      setUser(nextUser);
      setLoading(false);
      clearTimeout(loadingTimeout); // Clear timeout when auth state changes
    });

    return () => {
      unsubscribe();
      clearTimeout(loadingTimeout);
    };
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    firebaseError,
    isFirebaseReady,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
