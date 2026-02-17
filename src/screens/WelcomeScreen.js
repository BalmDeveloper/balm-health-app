import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const getScreenDimensions = () => {
  try {
    return Dimensions.get('window');
  } catch (error) {
    return { width: 375, height: 812 }; // Default iPhone dimensions
  }
};

const { width, height } = getScreenDimensions();

export default function WelcomeScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const cursorAnim = useRef(new Animated.Value(1)).current;
  const [displayedText, setDisplayedText] = useState('');
  const [showCursor, setShowCursor] = useState(false);
  
  const fullText = 'Your Health, Intelligently Understood.';

  useEffect(() => {
    // Start logo animation immediately when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Start typewriter effect after logo animation (delay of 800ms)
    const typewriterTimeout = setTimeout(() => {
      setShowCursor(true);
      
      // Start cursor blinking animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(cursorAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(cursorAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      let index = 0;
      const typewriterInterval = setInterval(() => {
        if (index < fullText.length) {
          setDisplayedText(fullText.slice(0, index + 1));
          index++;
        } else {
          clearInterval(typewriterInterval);
          // Hide cursor after typing is complete
          setTimeout(() => setShowCursor(false), 1000);
        }
      }, 50); // 50ms delay between each character

      return () => clearInterval(typewriterInterval);
    }, 800);

    return () => clearTimeout(typewriterTimeout);
  }, [fadeAnim, scaleAnim]);

  const handleGetStarted = () => {
    // Navigate directly to main app (skip auth for Apple compliance)
    navigation.navigate('MainApp');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            }}
          >
            <Image
              source={require('../../public/Images/balm logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>
        </View>

        {/* Tagline */}
        <View style={styles.taglineContainer}>
          <Text style={styles.tagline}>
            {displayedText}
            {showCursor && (
              <Animated.Text style={[styles.cursor, { opacity: cursorAnim }]}>
                |
              </Animated.Text>
            )}
          </Text>
        </View>

        {/* Get Started Button */}
        <TouchableOpacity style={styles.buttonContainer} onPress={handleGetStarted}>
          <LinearGradient
            colors={['#00008b', '#f5bd00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 32,
    paddingTop: height * 0.08,
    paddingBottom: 60,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logo: {
    width: 100,
    height: 100,
  },
  taglineContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  tagline: {
    fontSize: 18,
    color: '#00008b',
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '500',
  },
  cursor: {
    fontSize: 18,
    color: '#00008b',
    fontWeight: '500',
  },
  buttonContainer: {
    width: width - 64,
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
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});
