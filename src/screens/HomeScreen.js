import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
  SafeAreaView,
  Modal,
  Linking,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { Pedometer } from 'expo-sensors';
import { getCurrentUser } from '../services/authService';
import { trackPage, trackButton, trackVideo } from '../services/analyticsService';
import { requireAuth } from '../utils/authHelpers';
import AppHeader from '../components/AppHeader';
import { featuredResources } from '../data/videosData';
import { auth, db } from '../config/firebase';
import { doc, getDoc, collection, query, orderBy, getDocs, limit, setDoc } from 'firebase/firestore';
import { getCommunityMemberCount, getTodayPostsCount } from '../services/usernameService';

const getScreenDimensions = () => {
  try {
    return Dimensions.get('window');
  } catch (error) {
    return { width: 375, height: 812 }; // Default iPhone dimensions
  }
};

const { width } = getScreenDimensions();

export default function HomeScreen({ navigation }) {
  const [user, setUser] = useState({
    firstName: 'User',
    streakCount: 12
  });
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoModalVisible, setVideoModalVisible] = useState(false);

  // BMI Tracking States
  const [bmi, setBmi] = useState(null);
  const [showBMIModal, setShowBMIModal] = useState(false);
  const [useMetric, setUseMetric] = useState(false);
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightLb, setWeightLb] = useState('');
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [currentWeight, setCurrentWeight] = useState(null);
  const [currentHeight, setCurrentHeight] = useState(null);
  const [activityHistory, setActivityHistory] = useState([]);
  const [communityStats, setCommunityStats] = useState({
    members: 0,
    todayPosts: 0
  });
  
  // Lifestyle Tracking States
  const [steps, setSteps] = useState(0);
  const [dailyGoal] = useState(10000);
  const [pedometerAvailable, setPedometerAvailable] = useState(null);
  const [pedometerPermissionDenied, setPedometerPermissionDenied] = useState(false);

  // Load BMI data
  useEffect(() => {
    loadBMIData();
    initializePedometer();
  }, []);

  // Load community stats on component mount and set up real-time updates
  useEffect(() => {
    loadCommunityStats();
    
    const interval = setInterval(() => {
      loadCommunityStats();
    }, 10000); // 10 seconds for better real-time updates
    
    // Refresh when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      loadCommunityStats();
    });
    
    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [navigation]);

  // Refresh BMI data when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadBMIData();
    });
    return unsubscribe;
  }, [navigation]);

  // Pedometer for automatic step tracking
  const initializePedometer = async () => {
    let subscription;

    try {
      const available = await Pedometer.isAvailableAsync();
      if (!available) {
        setPedometerAvailable(false);
        return;
      }

      if (Pedometer.requestPermissionsAsync) {
        const { status } = await Pedometer.requestPermissionsAsync();
        if (status !== 'granted') {
          setPedometerPermissionDenied(true);
          setPedometerAvailable(false);
          return;
        }
      }

      setPedometerAvailable(true);

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      try {
        const result = await Pedometer.getStepCountAsync(startOfDay, new Date());
        const initialSteps = Number.isFinite(result?.steps) ? result.steps : 0;
        setSteps(initialSteps);
      } catch (error) {
        setSteps(0);
      }

      subscription = Pedometer.watchStepCount(({ steps: newSteps }) => {
        const currentSteps = Number.isFinite(newSteps) ? newSteps : 0;
        setSteps(currentSteps);
      });
    } catch (error) {
      console.warn('Pedometer error', error);
      setPedometerAvailable(false);
    }

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  };

  const getStepProgress = () => Math.min((steps / dailyGoal) * 100, 100);

  // Refresh BMI data when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadBMIData();
    });
    return unsubscribe;
  }, [navigation]);

  const loadBMIData = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const bmiDocRef = doc(db, 'users', currentUser.uid, 'health', 'bmi');
      const bmiDoc = await getDoc(bmiDocRef);
      
      if (bmiDoc.exists()) {
        const data = bmiDoc.data();
        setBmi(data.currentBMI || null);
        setCurrentWeight(data.currentWeight || null);
        setCurrentHeight(data.currentHeight || null);
      }
    } catch (error) {
      console.error('Error loading BMI data:', error);
    }
  };

  const loadCommunityStats = async () => {
    try {
      const [membersCount, todayPostsCount] = await Promise.all([
        getCommunityMemberCount(),
        getTodayPostsCount()
      ]);
      
      setCommunityStats({
        members: membersCount,
        todayPosts: todayPostsCount
      });
      
      console.log('✅ Community stats loaded');
    } catch (error) {
      console.error('❌ Error loading community stats:', error);
      // Set fallback values to prevent app crash
      setCommunityMembers(0);
      setTodayPosts(0);
    }
  };

  const getBMICategory = (bmiValue) => {
    if (bmiValue < 18.5) return { category: 'Underweight', color: '#74b9ff' };
    if (bmiValue < 25) return { category: 'Normal', color: '#00b894' };
    if (bmiValue < 30) return { category: 'Overweight', color: '#fdcb6e' };
    return { category: 'Obese', color: '#e17055' };
  };

  const calculateWeightLossNeeded = () => {
    if (!bmi || !currentHeight || !currentWeight) return null;
    
    const currentBMIValue = parseFloat(bmi);
    const heightInMeters = currentHeight / 100; // Convert cm to meters
    
    // Target BMI range (upper limit of normal is 24.9, but we'll aim for 24.5 for optimal)
    const targetBMI = 24.5;
    
    if (currentBMIValue <= targetBMI) {
      return null; // Already at or below optimal weight
    }
    
    // Calculate target weight for optimal BMI
    const targetWeightKg = targetBMI * (heightInMeters * heightInMeters);
    const weightToLoseKg = currentWeight - targetWeightKg;
    
    if (weightToLoseKg <= 0) return null;
    
    return {
      kg: weightToLoseKg.toFixed(1),
      lb: (weightToLoseKg * 2.20462).toFixed(1),
      targetWeightKg: targetWeightKg.toFixed(1),
      targetWeightLb: (targetWeightKg * 2.20462).toFixed(1)
    };
  };

  const openBMIModal = () => {
    // Pre-populate fields with current values if they exist
    if (currentWeight && currentHeight) {
      if (useMetric) {
        setWeightKg(currentWeight.toFixed(1));
        setHeightCm(currentHeight.toFixed(1));
      } else {
        const weightLbValue = (currentWeight * 2.20462).toFixed(1);
        const heightCmValue = currentHeight; // currentHeight is in cm
        const totalInches = heightCmValue / 2.54; // Convert cm to inches
        const feetValue = Math.floor(totalInches / 12);
        const inchesValue = (totalInches % 12).toFixed(1);
        setWeightLb(weightLbValue);
        setHeightFt(feetValue.toString());
        setHeightIn(inchesValue);
      }
    }
    setShowBMIModal(true);
  };

  const closeBMIModal = () => {
    setShowBMIModal(false);
    setWeightKg('');
    setHeightCm('');
    setWeightLb('');
    setHeightFt('');
    setHeightIn('');
  };

  const toggleUnitSystem = () => {
    setUseMetric(!useMetric);
  };

  const calculateBMI = async () => {
    // Check if user is authenticated before saving
    if (!requireAuth('save your BMI data', navigation)) {
      return;
    }

    let bmiValue = null;

    if (useMetric) {
      const weightNum = parseFloat(weightKg);
      const heightNum = parseFloat(heightCm);

      if (isNaN(weightNum) || isNaN(heightNum) || heightNum === 0) {
        Alert.alert('Invalid Input', 'Please enter valid weight and height.');
        return;
      }

      const heightMeters = heightNum / 100;
      bmiValue = weightNum / (heightMeters * heightMeters);
    } else {
      const weightNum = parseFloat(weightLb);
      const heightFtNum = parseFloat(heightFt);
      const heightInNum = parseFloat(heightIn);

      if (isNaN(weightNum) || isNaN(heightFtNum) || isNaN(heightInNum)) {
        Alert.alert('Invalid Input', 'Please enter valid weight and height.');
        return;
      }

      const totalInches = (heightFtNum * 12) + heightInNum;
      if (totalInches === 0) {
        Alert.alert('Invalid Input', 'Height cannot be zero.');
        return;
      }

      bmiValue = (weightNum / (totalInches * totalInches)) * 703;
    }

    if (Number.isFinite(bmiValue)) {
      const formattedBmi = bmiValue.toFixed(1);
      setBmi(formattedBmi);
      setShowBMIModal(false);
      Alert.alert('BMI Updated', `Your BMI is ${formattedBmi}`);

      // Add to activity history
      const entry = {
        id: Date.now().toString(),
        type: 'BMI',
        icon: 'fitness',
        title: 'BMI updated',
        detail: `${formattedBmi} (${getBMICategory(parseFloat(formattedBmi)).category})`,
        timestamp: new Date().toISOString(),
      };

      setActivityHistory((history) => [entry, ...history].slice(0, 30));

      // Save to Firebase
      try {
        const user = auth.currentUser;
        if (!user) return;

        const bmiDocRef = doc(db, 'users', user.uid, 'health', 'bmi');
        const bmiDoc = await getDoc(bmiDocRef);
        
        let currentHistory = [];
        if (bmiDoc.exists()) {
          const data = bmiDoc.data();
          currentHistory = data.history || [];
        }

        const newEntry = {
          value: formattedBmi,
          weight: useMetric ? parseFloat(weightKg) : parseFloat(weightLb) / 2.20462,
          height: useMetric ? parseFloat(heightCm) : (parseFloat(heightFt) * 30.48) + (parseFloat(heightIn) * 2.54),
          timestamp: new Date().toISOString(),
        };

        currentHistory.push(newEntry);

        await setDoc(bmiDocRef, {
          currentBMI: formattedBmi,
          currentWeight: newEntry.weight,
          currentHeight: newEntry.height,
          history: currentHistory,
          lastUpdated: new Date().toISOString(),
        });

        setCurrentWeight(newEntry.weight);
        setCurrentHeight(newEntry.height);
      } catch (error) {
        console.error('Error saving BMI data:', error);
      }
    }
  };

  useEffect(() => {
    // Track page visit
    trackPage('HomeScreen');
    
    const currentUser = getCurrentUser();
    if (currentUser) {
      // Get first name from display name or email
      let firstName = 'User';
      
      console.log('Current user:', currentUser);
      console.log('Display name:', currentUser.displayName);
      console.log('Email:', currentUser.email);
      
      if (currentUser.displayName && currentUser.displayName.trim() !== '') {
        // Extract first name from display name (split by space and take first part)
        const nameParts = currentUser.displayName.trim().split(' ');
        firstName = nameParts[0];
        console.log('Using display name, first name:', firstName);
      } else if (currentUser.email) {
        // Fallback: Extract name from email (before @)
        firstName = currentUser.email.split('@')[0];
        // Capitalize first letter and remove numbers/special chars
        firstName = firstName.replace(/[^a-zA-Z]/g, '');
        if (firstName.length > 0) {
          firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
        } else {
          firstName = 'User';
        }
        console.log('Using email fallback, first name:', firstName);
      }
      
      setUser(prevUser => ({
        ...prevUser,
        firstName: firstName
      }));
    }
  }, []);

  const healthQuotes = [
    "Wellness is not a destination, it's a way of life.",
    "Take care of your body. It's the only place you have to live.",
    "Health is not about the weight you lose, but about the life you gain.",
    "Your body can stand almost anything. It's your mind you have to convince.",
    "A healthy outside starts from the inside."
  ];

  const todayQuote = healthQuotes[Math.floor(Math.random() * healthQuotes.length)];

  const openVideo = (resource) => {
    if (resource.videoId) {
      // Track video interaction
      trackVideo(resource.videoId, resource.title, 'start', {
        speaker: resource.speaker,
        type: resource.type
      });
      
      setSelectedVideo(resource);
      setVideoModalVisible(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader navigation={navigation} title="Home" />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Welcome Message */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome{user.firstName && user.firstName !== 'User' ? `, ${user.firstName}` : ''}</Text>
        </View>

        {/* Hero Section - Health Quote */}
        <View style={styles.heroSection}>
          <View style={styles.quoteContainer}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80'
              }}
              style={styles.skyBackground}
            />
            <View style={styles.quoteOverlay}>
              <Text style={styles.quoteText}>"{todayQuote}"</Text>
            </View>
          </View>
        </View>

        {/* Lifestyle Tracking Card */}
        <View style={styles.lifestyleTrackingCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="walk" size={24} color="#FFD700" />
            <Text style={styles.cardTitle}>Track Movement</Text>
          </View>
          <View style={styles.stepCounter}>
            <Text style={styles.stepCount}>{steps.toLocaleString()}</Text>
            <Text style={styles.stepGoal}>/ {dailyGoal.toLocaleString()} steps</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${getStepProgress()}%` }]} />
          </View>

          {pedometerAvailable === false && (
            <Text style={styles.pedometerStatusText}>
              {pedometerPermissionDenied
                ? 'Enable motion & fitness permissions in Settings to track steps automatically.'
                : 'Step counting is not supported on this device.'}
            </Text>
          )}
          <Text style={styles.movementInfoText}>
            Total steps today, tracked by your device
          </Text>
        </View>

        {/* Community Section */}
        <View style={styles.communitySection}>
          <TouchableOpacity 
            style={styles.communityCard}
            onPress={() => navigation.navigate('Community')}
          >
            <View style={styles.communityHeader}>
              <View style={styles.communityIcon}>
                <Ionicons name="people-outline" size={24} color="#00008b" />
              </View>
              <View style={styles.communityContent}>
                <Text style={styles.communityTitle}>Community</Text>
                <Text style={styles.communitySubtitle}>Ask any question & learn from others</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </View>
            <View style={styles.communityPreview}>
              <View style={styles.communityStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{communityStats.members}</Text>
                  <Text style={styles.statLabel}>Members</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{communityStats.todayPosts}</Text>
                  <Text style={styles.statLabel}>Daily Posts</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>24/7</Text>
                  <Text style={styles.statLabel}>Support</Text>
                </View>
              </View>
              <View style={styles.communityCategories}>
                <View style={[styles.communityCategory, { backgroundColor: '#e8f5e8' }]}>
                  <Text style={styles.categoryText}>PCOS</Text>
                </View>
                <View style={[styles.communityCategory, { backgroundColor: '#fff8e7' }]}>
                  <Text style={styles.categoryText}>TTC</Text>
                </View>
                <View style={[styles.communityCategory, { backgroundColor: '#f0f8ff' }]}>
                  <Text style={styles.categoryText}>Women's Health</Text>
                </View>
                <View style={[styles.communityCategory, { backgroundColor: '#f5f5f5' }]}>
                  <Text style={styles.categoryText}>+2</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* BMI Tracking */}
        <View style={styles.bmiTrackingCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="body" size={24} color="#FFD700" />
            <Text style={styles.cardTitle}>BMI Tracking</Text>
          </View>
          {bmi ? (
            <View style={styles.bmiResult}>
              <Text style={styles.bmiValue}>{bmi}</Text>
              <Text
                style={[
                  styles.bmiCategory,
                  { color: getBMICategory(parseFloat(bmi)).color }
                ]}
              >
                {getBMICategory(parseFloat(bmi)).category}
              </Text>
              {/* Weight Loss Text */}
              {(() => {
                const weightLossNeeded = calculateWeightLossNeeded();
                return weightLossNeeded ? (
                  <Text style={styles.weightLossText}>
                    Lose {weightLossNeeded.kg} kg ({weightLossNeeded.lb} lbs) for ideal BMI
                  </Text>
                ) : null;
              })()}
            </View>
          ) : (
            <Text style={styles.noDataText}>No BMI data yet</Text>
          )}
          <TouchableOpacity
            style={[styles.inputButton, { backgroundColor: '#00008b' }]}
            onPress={openBMIModal}
          >
            <Text style={styles.inputButtonText}>Update Weight & Height</Text>
          </TouchableOpacity>
          
          {/* BMI Medical Source */}
          <View style={styles.sourceContainer}>
            <Text style={styles.sourceText}>
              BMI calculations based on
            </Text>
            <TouchableOpacity onPress={() => Linking.openURL('https://www.cdc.gov/bmi/adult-calculator/index.html')}>
              <Text style={styles.sourceLink}> CDC guidelines </Text>
            </TouchableOpacity>
            <Text style={styles.sourceText}>
              for adults
            </Text>
          </View>
        </View>

        {/* Resources Section */}
        <View style={styles.resourcesCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="library-outline" size={24} color="#FFD700" />
            <Text style={styles.cardTitle}>Resources</Text>
          </View>
          
          {featuredResources.map((resource) => (
            <View key={resource.id} style={styles.videoCard}>
              <TouchableOpacity 
                style={styles.videoCardContent}
                onPress={() => openVideo(resource)}
              >
                <View style={styles.videoContent}>
                  <Text style={styles.resourceType}>{resource.type}</Text>
                  <Text style={styles.resourceTitle}>{resource.title}</Text>
                  <Text style={styles.resourceSpeaker}>{resource.speaker}</Text>
                </View>
                <View style={styles.videoThumbnail}>
                  <Image
                    source={typeof resource.thumbnail === 'string' 
                      ? { uri: resource.thumbnail } 
                      : resource.thumbnail
                    }
                    style={styles.resourceThumbnail}
                  />
                </View>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* BMI Modal */}
      <Modal
        visible={showBMIModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBMIModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update BMI Data</Text>
            </View>

            {/* Unit Toggle */}
            <View style={styles.unitToggleContainer}>
              <Text style={styles.unitToggleLabel}>Units</Text>
              <TouchableOpacity 
                style={styles.unitToggleSwitch}
                onPress={toggleUnitSystem}
              >
                <View style={styles.unitToggleTrack}>
                  <View style={[
                    styles.unitToggleThumb,
                    { 
                      backgroundColor: useMetric ? '#00008b' : '#666',
                      transform: [{ translateX: useMetric ? 0 : 24 }]
                    }
                  ]}>
                  </View>
                </View>
                <Text style={styles.unitToggleOption}>
                  {useMetric ? 'Metric' : 'US Customary'}
                </Text>
              </TouchableOpacity>
            </View>

            {useMetric ? (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Weight (kg)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={weightKg}
                    onChangeText={setWeightKg}
                    placeholder="Enter weight in kg"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Height (cm)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={heightCm}
                    onChangeText={setHeightCm}
                    placeholder="Enter height in cm"
                    keyboardType="numeric"
                  />
                </View>
              </>
            ) : (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Weight (lbs)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={weightLb}
                    onChangeText={setWeightLb}
                    placeholder="Enter weight in pounds"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.heightInputGroup}>
                  <View style={styles.heightInputSubGroup}>
                    <Text style={styles.inputLabel}>Height (ft)</Text>
                    <TextInput
                      style={styles.textInput}
                      value={heightFt}
                      onChangeText={setHeightFt}
                      placeholder="Feet"
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.heightInputSubGroup}>
                    <Text style={styles.inputLabel}>Height (in)</Text>
                    <TextInput
                      style={styles.textInput}
                      value={heightIn}
                      onChangeText={setHeightIn}
                      placeholder="Inches"
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowBMIModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.primaryButton]}
                onPress={calculateBMI}
              >
                <Text style={[styles.modalButtonText, styles.primaryButtonText]}>Calculate BMI</Text>
              </TouchableOpacity>
            </View>

            {bmi && (
              <View style={styles.bmiResultContainer}>
                <Text style={styles.bmiResultText}>Your BMI: {bmi}</Text>
                <Text style={styles.bmiCategoryText}>
                  {getBMICategory(parseFloat(bmi)).category}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Video Modal */}
      <Modal
        visible={videoModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setVideoModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setVideoModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {selectedVideo?.title}
            </Text>
            <View style={styles.modalSpacer} />
          </View>
          
          {selectedVideo && (
            <WebView
              source={{
                uri: `https://www.youtube.com/watch?v=${selectedVideo.videoId}`
              }}
              style={styles.webView}
              allowsFullscreenVideo={true}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              mediaPlaybackRequiresUserAction={false}
              allowsInlineMediaPlayback={true}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#6c5ce7" />
                  <Text style={styles.loadingText}>Loading video...</Text>
                </View>
              )}
              onError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.warn('WebView error: ', nativeEvent);
                // Fallback to opening in external browser
                Linking.openURL(selectedVideo.url);
              }}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  welcomeSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  heroSection: {
    margin: 20,
    borderRadius: 15,
    overflow: 'hidden',
  },
  quoteContainer: {
    position: 'relative',
    height: 150,
    borderRadius: 15,
    overflow: 'hidden',
  },
  skyBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  quoteOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 139, 0.4)',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quoteText: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 24,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  // Resources Card Styles
  resourcesCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginVertical: 16,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  videoCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  videoCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  videoContent: {
    flex: 1,
    paddingRight: 15,
  },
  videoThumbnail: {
    width: 100,
    height: 80,
  },
  resourceType: {
    fontSize: 12,
    color: '#00008b',
    marginBottom: 6,
  },
  resourceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
    lineHeight: 22,
  },
  resourceSpeaker: {
    fontSize: 14,
    color: '#666',
  },
  resourceRight: {
    width: 100,
    height: 80,
  },
  resourceThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    resizeMode: 'contain',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  modalSpacer: {
    width: 40,
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  loadingText: {
    color: '#666',
    marginTop: 12,
    fontSize: 14,
  },
  // BMI Tracking Card Styles
  bmiTrackingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginVertical: 16,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 12,
  },
  bmiResult: {
    alignItems: 'center',
    marginBottom: 16,
  },
  bmiValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2c3e50',
  },
  bmiCategory: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 4,
  },
  weightLossText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  noDataText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 16,
  },
  inputButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  inputButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  // Activity Card Styles
  activityCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginVertical: 16,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f4ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  activityDetail: {
    fontSize: 12,
    color: '#666',
  },
  activityTime: {
    fontSize: 11,
    color: '#999',
    marginLeft: 8,
  },
  // BMI Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
  },
  unitToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  unitToggleLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#666',
    marginRight: 10,
  },
  unitToggleSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unitToggleTrack: {
    width: 50,
    height: 26,
    backgroundColor: '#ddd',
    borderRadius: 13,
    paddingHorizontal: 3,
    marginRight: 8,
    position: 'relative',
  },
  unitToggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 3,
    left: 3,
  },
  unitToggleOption: {
    fontSize: 11,
    fontWeight: '600',
    color: '#00008b',
  },
  inputGroup: {
    marginBottom: 20,
  },
  heightInputGroup: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 16,
  },
  heightInputSubGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  primaryButton: {
    backgroundColor: '#00008b',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  primaryButtonText: {
    color: 'white',
  },
  bmiResultContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    alignItems: 'center',
  },
  bmiResultText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  bmiCategoryText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  // Lifestyle Tracking Card Styles
  lifestyleTrackingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginVertical: 16,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stepCounter: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'flex-start',
    marginVertical: 16,
  },
  stepCount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#00008b',
  },
  stepGoal: {
    fontSize: 16,
    color: '#666',
    marginLeft: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00008b',
    borderRadius: 4,
  },
  pedometerStatusText: {
    fontSize: 12,
    color: '#e74c3c',
    textAlign: 'left',
    marginVertical: 8,
    lineHeight: 16,
  },
  movementInfoText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'left',
    marginTop: 8,
  },
  // Community Card Styles
  communitySection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  communityCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
  },
  communityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  communityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f4ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  communityContent: {
    flex: 1,
  },
  communityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  communitySubtitle: {
    fontSize: 14,
    color: '#666',
  },
  communityPreview: {
    gap: 16,
  },
  communityStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00008b',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  communityCategories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  communityCategory: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  sourceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    flexWrap: 'wrap',
  },
  sourceText: {
    fontSize: 11,
    color: '#666',
    lineHeight: 16,
  },
  sourceLink: {
    fontSize: 11,
    color: '#00008b',
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
});
