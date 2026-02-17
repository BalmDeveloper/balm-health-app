import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, ActivityIndicator, Image } from 'react-native';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load theme preference from storage on app start
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('darkMode');
      if (savedTheme !== null) {
        setIsDarkMode(JSON.parse(savedTheme));
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDarkMode = async () => {
    try {
      const newThemeMode = !isDarkMode;
      setIsDarkMode(newThemeMode);
      await AsyncStorage.setItem('darkMode', JSON.stringify(newThemeMode));
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const colors = {
    light: {
      primary: '#00008b',
      secondary: '#6c5ce7',
      background: '#ffffff',
      card: '#f8f9fa',
      border: '#e0e0e0',
      text: '#000000',
      textSecondary: '#666666',
      textTertiary: '#999999',
      placeholder: '#cccccc',
      success: '#4caf50',
      warning: '#ff9800',
      error: '#e74c3c',
      info: '#2196f3',
      shadow: 'rgba(0, 0, 0, 0.1)',
      overlay: 'rgba(0, 0, 0, 0.5)',
    },
    dark: {
      primary: '#4a7fff',
      secondary: '#8b7cf6',
      background: '#121212',
      card: '#1e1e1e',
      border: '#333333',
      text: '#ffffff',
      textSecondary: '#b0b0b0',
      textTertiary: '#808080',
      placeholder: '#555555',
      success: '#66bb6a',
      warning: '#ffb74d',
      error: '#ef5350',
      info: '#42a5f5',
      shadow: 'rgba(0, 0, 0, 0.3)',
      overlay: 'rgba(0, 0, 0, 0.7)',
    },
  };

  const theme = {
    isDarkMode,
    toggleDarkMode,
    colors: isDarkMode ? colors.dark : colors.light,
    isLoading,
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center' }}>
        <Image
          source={require('../../public/Images/balm logo.png')}
          style={{ width: 96, height: 96, marginBottom: 18 }}
          resizeMode="contain"
        />
        <Text style={{ color: '#fff', fontSize: 18, marginBottom: 20 }}>Loading theme...</Text>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};
