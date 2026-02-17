import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Image,
  SafeAreaView,
  Dimensions,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../config/firebase';
import AppHeader from '../components/AppHeader';
import { initializeAnalytics, trackButton, trackPage, trackSession } from '../services/analyticsService';
import { trackActivity, ACTIVITY_TYPES } from '../services/activityService';

const getScreenDimensions = () => {
  try {
    return Dimensions.get('window');
  } catch (error) {
    return { width: 375, height: 812 }; // Default iPhone dimensions
  }
};

const { width, height } = getScreenDimensions();

export default function AuthScreen({ navigation }) {
  const [loading, setLoading] = useState(false);



  useEffect(() => {
    // Initialize analytics when screen loads
    initializeAnalytics();
    trackPage('AuthScreen');
  }, []);

  const handleSignUp = () => {
    trackButton('Sign Up', 'AuthScreen');
    navigation.navigate('SignUpForm');
  };

  const handleLogin = () => {
    trackButton('Login', 'AuthScreen');
    navigation.navigate('LoginForm');
  };

  const handleOpenTerms = () => {
    trackButton('Terms of Use', 'AuthScreen');
    Linking.openURL('https://balm.ai/terms');
  };

  const handleOpenPrivacy = () => {
    trackButton('Privacy Policy', 'AuthScreen');
    Linking.openURL('https://balm.ai/privacy');
  };


  return (
    <SafeAreaView style={styles.container}>
      <AppHeader navigation={navigation} title="" />
      <ImageBackground
        source={require('../../public/Images/people.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Overlay to soften AI-generated appearance */}
        <View style={styles.overlay} />
        {/* Logo at the top */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../public/Images/balm logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Bottom section with auth options */}
        <View style={styles.authContainer}>
          {/* Welcome Text */}
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeTitle}>Welcome to Balm.ai</Text>
            <Text style={styles.welcomeSubtitle}>Your AI-powered wellness companion</Text>
          </View>

          {/* Sign Up Button */}
          <TouchableOpacity style={styles.signUpContainer} onPress={handleSignUp}>
            <LinearGradient
              colors={['#00008b', '#f5bd00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.signUpButton}
            >
              <Text style={styles.signUpText}>Sign Up</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Login Option */}
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginText}>Login</Text>
          </TouchableOpacity>


          {/* Terms and Privacy */}
          <View style={styles.termsContainer}>
            <Text style={styles.termsText}>
              By continuing, you agree to Balm.ai's{' '}
              <Text style={styles.linkText} onPress={handleOpenTerms}>Terms of Use</Text> and{' '}
              <Text style={styles.linkText} onPress={handleOpenPrivacy}>Privacy Policy</Text>.
            </Text>
          </View>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    justifyContent: 'space-between',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  logo: {
    width: 60,
    height: 60,
    tintColor: '#ffffff',
  },
  authContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 32,
    paddingTop: 40,
    paddingBottom: 50,
    minHeight: height * 0.4,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
  signUpContainer: {
    marginBottom: 20,
    borderRadius: 25,
    shadowColor: '#00008b',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  signUpButton: {
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
  },
  signUpText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  loginButton: {
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 25,
    marginBottom: 30,
  },
  loginText: {
    color: '#333333',
    fontSize: 16,
    fontWeight: '500',
  },
  termsContainer: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  termsText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 18,
  },
  linkText: {
    color: '#00008b',
    fontWeight: '500',
  },
});
