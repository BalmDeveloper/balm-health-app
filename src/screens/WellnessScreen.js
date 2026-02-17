import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Pedometer } from 'expo-sensors';
import AppHeader from '../components/AppHeader';

import { getCurrentUser } from '../services/authService';
import { useTheme } from '../context/ThemeContext';
import { doc, getDoc, collection, query, orderBy, getDocs, limit, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { moodService, wellnessService, activityService } from '../services/firestore';
import HealthKitService from '../services/HealthKitService';
import Svg, { G, Path, Circle, Line, Text as SvgText } from 'react-native-svg';

const getScreenDimensions = () => {
  try {
    return Dimensions.get('window');
  } catch (error) {
    return { width: 375, height: 812 }; // Default iPhone dimensions
  }
};

const { width } = getScreenDimensions();

export default function WellnessScreen({ navigation }) {
  const { colors } = useTheme();
  // Lifestyle Tracking States
  const [steps, setSteps] = useState(0);
  const [totalStepsSinceDay1, setTotalStepsSinceDay1] = useState(0);
  const [signupDate, setSignupDate] = useState('');
  const [dailyGoal] = useState(10000);
  const [pedometerAvailable, setPedometerAvailable] = useState(null);
  const [pedometerPermissionDenied, setPedometerPermissionDenied] = useState(false);
  const [showMovementDetails, setShowMovementDetails] = useState(false);
  const [movementData, setMovementData] = useState({
    steps: 0,
    distance: 0,
    calories: 0,
    pace: 0,
    isRunning: false,
    activityType: 'walking',
    runningSteps: 0,
    walkingSteps: 0,
    runningDistance: 0,
    walkingDistance: 0,
    runningTime: 0,
    walkingTime: 0,
    startTime: null,
    currentPace: 0
  });
  
  // Movement logging state
  const [lastSnapshotSteps, setLastSnapshotSteps] = useState(0);

  // BMI Tracking States
  const [bmi, setBmi] = useState(null);
  const [showBMIModal, setShowBMIModal] = useState(false);
  const [showBMIHistoryModal, setShowBMIHistoryModal] = useState(false);
  const [bmiHistory, setBmiHistory] = useState([]);
  const [useMetric, setUseMetric] = useState(false);
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightLb, setWeightLb] = useState('');
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [currentWeight, setCurrentWeight] = useState(null);
  const [currentHeight, setCurrentHeight] = useState(null);
  
  // Activity History
  const [activityHistory, setActivityHistory] = useState([]);

  // Rewards System States
  const [totalPoints, setTotalPoints] = useState(0);
  const [dailyStreak, setDailyStreak] = useState(0);
  const [lastAppOpenDate, setLastAppOpenDate] = useState(null);
  const [todayCommunityPost, setTodayCommunityPost] = useState(false);
  const [todayStepsGoal, setTodayStepsGoal] = useState(false);

  // Load total steps since signup from Firestore
  const loadTotalStepsSinceSignup = async () => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) return;

      console.log('🔥 Loading total steps since signup for:', currentUser.uid);

      // Get user's signup date from Firebase Auth metadata
      const signupDate = currentUser.metadata.creationTime;
      if (signupDate) {
        setSignupDate(signupDate);
      }

      // Load total steps from wellness activities
      const totalSteps = await wellnessService.getTotalStepsSinceSignup(currentUser.uid);
      setTotalStepsSinceDay1(totalSteps);

      console.log('✅ Total steps since signup:', totalSteps);
    } catch (error) {
      console.error('❌ Error loading total steps since signup:', error);
      setTotalStepsSinceDay1(0);
    }
  };

  // Load rewards data from Firestore
  const loadRewardsData = async () => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) return;

      const rewardsRef = doc(db, 'users', currentUser.uid, 'rewards', 'data');
      const rewardsDoc = await getDoc(rewardsRef);

      if (rewardsDoc.exists()) {
        const data = rewardsDoc.data();
        setTotalPoints(data.totalPoints || 0);
        setDailyStreak(data.dailyStreak || 0);
        setLastAppOpenDate(data.lastAppOpenDate || null);
      }

      // Load today's activities
      const today = new Date().toDateString();
      const todayRef = doc(db, 'users', currentUser.uid, 'dailyActivities', today);
      const todayDoc = await getDoc(todayRef);

      if (todayDoc.exists()) {
        const todayData = todayDoc.data();
        setTodayCommunityPost(todayData.communityPost || false);
        setTodayStepsGoal(todayData.stepsGoal || false);
      }

      console.log('✅ Rewards data loaded');
    } catch (error) {
      console.error('❌ Error loading rewards data:', error);
    }
  };

  // Check HealthKit connection and initialize if needed
  const checkHealthKitConnection = async () => {
    try {
      // Only try HealthKit on iOS devices in development builds
      if (Platform.OS !== 'ios') {
        console.log('HealthKit is only available on iOS');
        setHealthKitConnected(false);
        return;
      }

      if (!HealthKitService.isLibraryAvailable()) {
        console.log('HealthKit library not available - running in Expo Go or missing dependencies');
        setHealthKitConnected(false);
        return;
      }

      if (!HealthKitService.isAvailable()) {
        console.log('HealthKit not available on this device');
        setHealthKitConnected(false);
        return;
      }

      // Check if already connected
      const authStatus = await HealthKitService.getAuthorizationStatus('steps');
      if (authStatus.sharingAuthorized) {
        setHealthKitConnected(true);
        console.log('HealthKit already connected');
        return;
      }

      // Try to initialize HealthKit
      await HealthKitService.initialize();
      setHealthKitConnected(true);
      console.log('HealthKit connected successfully');
    } catch (error) {
      console.log('HealthKit connection not available (expected in Expo Go):', error.message);
      setHealthKitConnected(false);
    }
  };

  // Check for steps goal when steps change
  const updateDailyStreak = async () => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) return;

      const today = new Date().toDateString();
      const lastOpen = lastAppOpenDate;

      if (lastOpen !== today) {
        // Check if it's consecutive day
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayString = yesterday.toDateString();

        let newStreak = 1;
        if (lastOpen === yesterdayString) {
          newStreak = dailyStreak + 1;
        }

        // Award points for daily app opening (only if streak is 1 or more)
        if (newStreak >= 1) {
          const newPoints = totalPoints + 1;
          setTotalPoints(newPoints);
          setDailyStreak(newStreak);
          setLastAppOpenDate(today);

          // Save to Firestore
          const rewardsRef = doc(db, 'users', currentUser.uid, 'rewards', 'data');
          await setDoc(rewardsRef, {
            totalPoints: newPoints,
            dailyStreak: newStreak,
            lastAppOpenDate: today,
            updatedAt: new Date().toISOString()
          }, { merge: true });

          // Save today's activity
          const todayRef = doc(db, 'users', currentUser.uid, 'dailyActivities', today);
          await setDoc(todayRef, {
            appOpened: true,
            date: today
          }, { merge: true });

          console.log(`🏆 Daily streak updated: ${newStreak} days, Points: ${newPoints}`);
        }
      }
    } catch (error) {
      console.error('❌ Error updating daily streak:', error);
    }
  };

  // Award points for steps goal
  const awardStepsPoints = async () => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser || todayStepsGoal) return;

      if (steps >= dailyGoal) {
        const newPoints = totalPoints + 1;
        setTotalPoints(newPoints);
        setTodayStepsGoal(true);

        // Save to Firestore
        const rewardsRef = doc(db, 'users', currentUser.uid, 'rewards', 'data');
        await setDoc(rewardsRef, {
          totalPoints: newPoints,
          updatedAt: new Date().toISOString()
        }, { merge: true });

        // Save today's activity
        const today = new Date().toDateString();
        const todayRef = doc(db, 'users', currentUser.uid, 'dailyActivities', today);
        await setDoc(todayRef, {
          stepsGoal: true,
          date: today
        }, { merge: true });

        console.log('🏆 Steps goal achieved! +1 point');
      }
    } catch (error) {
      console.error('❌ Error awarding steps points:', error);
    }
  };

  // Award points for community post
  const awardCommunityPostPoints = async () => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser || todayCommunityPost) return;

      const newPoints = totalPoints + 1;
      setTotalPoints(newPoints);
      setTodayCommunityPost(true);

      // Save to Firestore
      const rewardsRef = doc(db, 'users', currentUser.uid, 'rewards', 'data');
      await setDoc(rewardsRef, {
        totalPoints: newPoints,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // Save today's activity
      const today = new Date().toDateString();
      const todayRef = doc(db, 'users', currentUser.uid, 'dailyActivities', today);
      await setDoc(todayRef, {
        communityPost: true,
        date: today
      }, { merge: true });

      console.log('🏆 Community post created! +1 point');
    } catch (error) {
      console.error('❌ Error awarding community post points:', error);
    }
  };

  // Award points for community post track activity
  const trackActivity = async (type, data) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) return;

      await activityService.logActivity(currentUser.uid, type, {
        title: data.title || `${type} logged`,
        detail: data.detail || '',
        value: data.value || '',
        ...data
      });
      
      console.log(`✅ ${type} activity saved to Firestore`);
    } catch (error) {
      console.error(`❌ Error saving ${type} activity:`, error);
    }
  };

  // Load today's steps to Firestore
  const saveTodaySteps = async (stepCount) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser || stepCount <= 0) return;

      // Calculate movement metrics
      const metrics = calculateMovementMetrics(stepCount);
      
      // Check if we already saved steps today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const activitiesQuery = query(
        collection(db, 'users', currentUser.uid, 'activities'),
        orderBy('timestamp', 'desc'),
        limit(1)
      );
      
      const querySnapshot = await getDocs(activitiesQuery);
      const lastActivity = querySnapshot.docs[0]?.data();
      
      // Check if last activity was today's steps
      if (lastActivity && 
          lastActivity.type === 'steps' && 
          new Date(lastActivity.timestamp?.toDate?.() || lastActivity.timestamp) >= today) {
        // Update today's steps
        console.log('🔥 Updating today\'s steps:', stepCount);
        // Note: In a real app, you'd update the existing document
        // For now, we'll just track in memory
      } else {
        // Save new step entry for today
        console.log('🔥 Saving new step entry:', stepCount);
        await trackActivity('steps', {
          steps: stepCount,
          source: 'pedometer',
          date: new Date().toISOString(),
          ...metrics
        });
      }
    } catch (error) {
      console.error('❌ Error saving today\'s steps:', error);
    }
  };

  // Calculate movement metrics (distance, calories, pace)
  const calculateMovementMetrics = (stepCount, stepFrequency = 0) => {
    // Average step length: walking ~2.5ft, running ~3.5ft
    const avgStepLengthWalk = 2.5; // feet
    const avgStepLengthRun = 3.5; // feet
    const feetToMiles = 5280;
    const feetToKm = 3280.84;
    
    // Detect running based on step frequency (steps per minute)
    // Walking: < 120 steps/min, Running: > 130 steps/min
    const isRunning = stepFrequency > 130;
    const avgStepLength = isRunning ? avgStepLengthRun : avgStepLengthWalk;
    
    const distanceFeet = stepCount * avgStepLength;
    const distanceMiles = distanceFeet / feetToMiles;
    const distanceKm = distanceFeet / feetToKm;
    
    // Calorie calculation (simplified formula)
    // ~0.04 calories per step walking, ~0.08 per step running
    const caloriesPerStep = isRunning ? 0.08 : 0.04;
    const calories = Math.round(stepCount * caloriesPerStep);
    
    // Pace calculation (minutes per mile/km)
    // Assuming average walking speed 3mph, running 6mph
    const avgSpeedMph = isRunning ? 6 : 3;
    const paceMinutesPerMile = avgSpeedMph > 0 ? 60 / avgSpeedMph : 20;
    const paceMinutesPerKm = paceMinutesPerMile * 0.621371;
    
    return {
      distance: useMetric ? distanceKm : distanceMiles,
      distanceUnit: useMetric ? 'km' : 'mi',
      calories: calories,
      paceMinutesPerMile: paceMinutesPerMile,
      paceMinutesPerKm: paceMinutesPerKm,
      paceUnit: useMetric ? 'min/km' : 'min/mi',
      isRunning: isRunning,
      activityType: isRunning ? 'running' : 'walking',
      stepFrequency: stepFrequency
    };
  };

  // Helper functions for Strava-like display
  const formatTime = (seconds) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const calculatePace = (distance, timeSeconds) => {
    if (distance <= 0 || timeSeconds <= 0) return '--:--';
    const paceMinutesPerUnit = (timeSeconds / 60) / distance;
    const minutes = Math.floor(paceMinutesPerUnit);
    const seconds = Math.round((paceMinutesPerUnit - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')} ${movementData.paceUnit}`;
  };

  // Enhanced movement tracking with running detection
  const updateMovementData = (stepCount, timestamp = Date.now()) => {
    const currentTime = timestamp;
    const prevTime = movementData.startTime || currentTime;
    const timeDiff = (currentTime - prevTime) / 1000; // seconds
    const stepDiff = stepCount - movementData.steps;
    
    // Calculate step frequency (steps per minute)
    const stepFrequency = timeDiff > 0 ? (stepDiff / timeDiff) * 60 : 0;
    
    const metrics = calculateMovementMetrics(stepCount, stepFrequency);
    
    // Update movement data with enhanced tracking
    setMovementData(prev => {
      const newData = {
        ...prev,
        steps: stepCount,
        ...metrics,
        startTime: currentTime,
        currentPace: metrics.isRunning ? metrics.paceMinutesPerMile : prev.pace
      };
      
      // Track running vs walking separately
      if (metrics.isRunning) {
        newData.runningSteps = stepCount - prev.walkingSteps;
        newData.runningDistance = metrics.distance;
        newData.runningTime = (newData.runningTime || 0) + timeDiff;
      } else {
        newData.walkingSteps = stepCount - prev.runningSteps;
        newData.walkingDistance = metrics.distance;
        newData.walkingTime = (newData.walkingTime || 0) + timeDiff;
      }
      
      return newData;
    });
  };

  // Refresh total steps when steps change significantly
  useEffect(() => {
    if (steps > 0 && (steps % 1000 === 0 || steps >= dailyGoal)) {
      // Refresh total steps after a short delay to ensure Firestore is updated
      const timer = setTimeout(() => {
        loadTotalStepsSinceSignup();
        // Check for steps goal achievement
        awardStepsPoints();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [steps, dailyGoal]);

  // Load rewards data on component mount
  useEffect(() => {
    loadRewardsData();
    updateDailyStreak();
    checkHealthKitConnection();
  }, []);

  // Check for steps goal when steps change
  useEffect(() => {
    if (steps >= dailyGoal && !todayStepsGoal) {
      awardStepsPoints();
    }
  }, [steps, dailyGoal, todayStepsGoal]);

  // Pedometer for automatic step tracking
  useEffect(() => {
    let subscription;
    let initialSteps = 0;

    const startPedometer = async () => {
      try {
        // Load historical steps first
        await loadTotalStepsSinceSignup();

        const available = await Pedometer.isAvailableAsync();
        if (!available) {
          console.log('Pedometer not available on this device');
          setPedometerAvailable(false);
          return;
        }

        if (Pedometer.requestPermissionsAsync) {
          const { status } = await Pedometer.requestPermissionsAsync();
          if (status !== 'granted') {
            console.log('Pedometer permission denied');
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
          initialSteps = Number.isFinite(result?.steps) ? result.steps : 0;
        } catch (error) {
          console.log('Error getting initial step count:', error);
          initialSteps = 0;
        }

        setSteps(initialSteps);
        setLastSnapshotSteps(initialSteps);

        subscription = Pedometer.watchStepCount(({ steps: newSteps, timestamp }) => {
          const currentSteps = initialSteps + newSteps;
          setSteps(currentSteps);
          updateMovementData(currentSteps, timestamp || Date.now());
        });
      } catch (error) {
        console.log('Pedometer initialization failed (expected in some environments):', error.message);
        setPedometerAvailable(false);
      }
    };

    startPedometer();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (!pedometerAvailable) {
      return;
    }

    const delta = steps - lastSnapshotSteps;
    if (delta <= 0) {
      return;
    }

    const didReachGoal = steps >= dailyGoal ? ' • Goal reached!' : '';

    const entry = {
      id: Date.now().toString(),
      type: 'Movement',
      icon: 'walk',
      title: 'Movement updated',
      detail: `${delta.toLocaleString()} step${delta === 1 ? '' : 's'} since last update (Total: ${steps.toLocaleString()})${didReachGoal}`,
      timestamp: new Date().toISOString(),
    };

    setActivityHistory((history) => [entry, ...history].slice(0, 30));
    setLastSnapshotSteps(steps);
  }, [steps, pedometerAvailable, lastSnapshotSteps]);

  // Load activities from Firestore
  const loadActivities = async () => {
    try {
      const user = getCurrentUser();
      if (!user) return;
      
      const activitiesQuery = query(
        collection(db, 'users', user.uid, 'activities'),
        orderBy('timestamp', 'desc'),
        limit(30)
      );
      
      const querySnapshot = await getDocs(activitiesQuery);
      const activities = querySnapshot.docs.map(doc => ({
        id: doc.id,
        type: doc.data().type || 'Activity',
        title: doc.data().data?.title || 'Activity logged',
        detail: doc.data().data?.detail || '',
        timestamp: doc.data().timestamp?.toDate?.() || new Date(),
        icon: getActivityIcon(doc.data().type)
      }));
      
      setActivityHistory(activities);
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  };

  // Get icon for activity type
  const getActivityIcon = (type) => {
    switch (type) {
      case 'mood_check': return 'happy';
      case 'steps': return 'walk';
      case 'bmi': return 'body';
      case 'nutrition': return 'restaurant';
      default: return 'ellipse';
    }
  };

  // Load activities from Firestore on component mount
  useEffect(() => {
    loadActivities();
    loadBMIData();
  }, []);

  // Refresh data when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadActivities();
      loadBMIData();
    });
    return unsubscribe;
  }, [navigation]);

  // Load BMI data from Firestore
  const loadBMIData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      console.log('🔥 Loading BMI data for user:', user.uid);
      const bmiDocRef = doc(db, 'users', user.uid, 'health', 'bmi');
      const bmiDoc = await getDoc(bmiDocRef);
      
      if (bmiDoc.exists()) {
        const data = bmiDoc.data();
        console.log('🔥 BMI data found:', data);
        if (data.currentBMI) {
          setBmi(data.currentBMI);
          console.log('🔥 BMI loaded:', data.currentBMI);
        }
        if (data.currentWeight) {
          setCurrentWeight(data.currentWeight);
          console.log('🔥 Current weight loaded:', data.currentWeight);
        }
        if (data.currentHeight) {
          setCurrentHeight(data.currentHeight);
          console.log('🔥 Current height loaded:', data.currentHeight);
        }
        if (data.history && Array.isArray(data.history)) {
          // Sort history by timestamp (newest first)
          const sortedHistory = [...data.history].sort((a, b) => 
            new Date(b.timestamp) - new Date(a.timestamp)
          );
          setBmiHistory(sortedHistory);
          console.log('🔥 BMI history loaded:', sortedHistory.length, 'entries');
        }
      }
    } catch (error) {
      console.error('🔥 Error loading BMI data:', error);
    }
  };

  // BMI Helper Functions
  const getBMICategory = (bmiValue) => {
    if (bmiValue < 18.5) return { category: 'Underweight', color: '#74b9ff' };
    if (bmiValue < 25) return { category: 'Normal', color: '#00b894' };
    if (bmiValue < 30) return { category: 'Overweight', color: '#fdcb6e' };
    return { category: 'Obese', color: '#e17055' };
  };

  const calculateWeightLossNeeded = () => {
    if (!bmi || !currentHeight || !currentWeight) return null;
    
    const currentBMIValue = parseFloat(bmi);
    const heightInMeters = currentHeight / 100;
    const targetBMI = 24.5;
    
    if (currentBMIValue <= targetBMI) return null;
    
    const targetWeightKg = targetBMI * (heightInMeters * heightInMeters);
    const weightToLoseKg = currentWeight - targetWeightKg;
    
    if (weightToLoseKg <= 0) return null;
    
    return {
      kg: weightToLoseKg.toFixed(1),
      lb: (weightToLoseKg * 2.20462).toFixed(1)
    };
  };

  const openBMIModal = () => {
    if (currentWeight && currentHeight) {
      if (useMetric) {
        setWeightKg(currentWeight.toFixed(1));
        setHeightCm(currentHeight.toFixed(1));
      } else {
        setWeightLb((currentWeight * 2.20462).toFixed(1));
        const totalInches = currentHeight / 2.54;
        const feet = Math.floor(totalInches / 12);
        const inches = Math.round(totalInches % 12);
        setHeightFt(feet.toString());
        setHeightIn(inches.toString());
      }
    }
    setShowBMIModal(true);
  };

  const toggleUnitSystem = () => {
    setUseMetric(!useMetric);
  };

  const calculateBMI = async () => {
    let weightInKg, heightInCm;
    
    if (useMetric) {
      weightInKg = parseFloat(weightKg);
      heightInCm = parseFloat(heightCm);
    } else {
      weightInKg = parseFloat(weightLb) / 2.20462;
      const feet = parseFloat(heightFt) || 0;
      const inches = parseFloat(heightIn) || 0;
      const totalInches = (feet * 12) + inches;
      heightInCm = totalInches * 2.54;
    }

    if (!weightInKg || !heightInCm || weightInKg <= 0 || heightInCm <= 0) {
      Alert.alert('Invalid Input', 'Please enter valid weight and height values');
      return;
    }

    const heightInMeters = heightInCm / 100;
    const bmiValue = weightInKg / (heightInMeters * heightInMeters);

    if (Number.isFinite(bmiValue)) {
      const formattedBmi = bmiValue.toFixed(1);
      setBmi(formattedBmi);
      setShowBMIModal(false);
      setCurrentWeight(weightInKg);
      setCurrentHeight(heightInCm);
      Alert.alert('BMI Updated', `Your BMI is ${formattedBmi}`);

      // Save to Firestore
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const bmiDocRef = doc(db, 'users', currentUser.uid, 'health', 'bmi');
          const bmiDoc = await getDoc(bmiDocRef);
          
          const newEntry = {
            value: formattedBmi,
            weight: weightInKg,
            height: heightInCm,
            timestamp: new Date().toISOString(),
          };

          let currentHistory = [];
          if (bmiDoc.exists()) {
            currentHistory = bmiDoc.data().history || [];
          }
          currentHistory.push(newEntry);

          await setDoc(bmiDocRef, {
            currentBMI: formattedBmi,
            currentWeight: weightInKg,
            currentHeight: heightInCm,
            history: currentHistory,
            lastUpdated: new Date().toISOString()
          });
          
          // Reload BMI data to update history
          loadBMIData();
        }
      } catch (error) {
        console.error('Error saving BMI data:', error);
      }

      // Reset inputs
      setWeightKg('');
      setHeightCm('');
      setWeightLb('');
      setHeightFt('');
      setHeightIn('');
    }
  };

  // Delete BMI history entry
  const deleteBMIHistoryEntry = async (timestamp) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      Alert.alert(
        'Delete Entry',
        'Are you sure you want to delete this BMI entry?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              const bmiDocRef = doc(db, 'users', user.uid, 'health', 'bmi');
              const bmiDoc = await getDoc(bmiDocRef);
              
              if (bmiDoc.exists()) {
                const data = bmiDoc.data();
                const updatedHistory = (data.history || []).filter(
                  entry => entry.timestamp !== timestamp
                );
                
                // Update with latest entry if available
                const latestEntry = updatedHistory.length > 0 
                  ? updatedHistory.reduce((latest, entry) => 
                      new Date(entry.timestamp) > new Date(latest.timestamp) ? entry : latest
                    )
                  : null;

                await setDoc(bmiDocRef, {
                  currentBMI: latestEntry?.value || null,
                  currentWeight: latestEntry?.weight || null,
                  currentHeight: latestEntry?.height || null,
                  history: updatedHistory,
                  lastUpdated: new Date().toISOString()
                });

                // Update local state
                setBmiHistory(updatedHistory.sort((a, b) => 
                  new Date(b.timestamp) - new Date(a.timestamp)
                ));
                setBmi(latestEntry?.value || null);
                setCurrentWeight(latestEntry?.weight || null);
                setCurrentHeight(latestEntry?.height || null);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error deleting BMI entry:', error);
      Alert.alert('Error', 'Failed to delete BMI entry');
    }
  };

  // Format date for display
  const formatBMIDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const estimateCalories = (text) => {
    const calorieMap = {
      'salad': 150,
      'chicken': 300,
      'rice': 200,
      'pasta': 350,
      'pizza': 400,
      'burger': 500,
      'fruit': 80,
      'vegetables': 50,
      'bread': 100,
      'egg': 70,
      'fish': 250,
    };

    let calories = 200; // Default
    const lowerText = text.toLowerCase();
    
    Object.keys(calorieMap).forEach(keyword => {
      if (lowerText.includes(keyword)) {
        calories = Math.max(calories, calorieMap[keyword]);
      }
    });

    return calories;
  };
  const getStepProgress = () => Math.min((steps / dailyGoal) * 100, 100);
  const stepsSinceLastLog = Math.max(steps - lastSnapshotSteps, 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader navigation={navigation} title="Track" />
      
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Lifestyle Tracking Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Lifestyle Tracking</Text>
          </View>

          <View style={[styles.trackingCard, { backgroundColor: colors.card }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="walk" size={24} color="#FFD700" />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Track Movement</Text>
            </View>
            <View style={styles.stepCounter}>
              <Text style={[styles.stepCount, { color: colors.primary }]}>{steps.toLocaleString()}</Text>
              <Text style={[styles.stepGoal, { color: colors.textSecondary }]}>/ {dailyGoal.toLocaleString()} steps</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${getStepProgress()}%`, backgroundColor: colors.primary }]} />
            </View>

            {pedometerAvailable === false && (
              <Text style={[styles.pedometerStatusText, { color: colors.textSecondary }]}>
                {pedometerPermissionDenied
                  ? 'Enable motion & fitness permissions in Settings to track steps automatically.'
                  : 'Step counting is not supported on this device.'}
              </Text>
            )}
            <Text style={[styles.movementInfoText, { color: colors.textTertiary }]}>
              Total steps today, tracked by your device
            </Text>
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
            
            {bmiHistory.length > 0 && (
              <TouchableOpacity
                style={[styles.inputButton, { backgroundColor: '#f8f9fa', marginTop: 10, borderWidth: 1, borderColor: '#00008b' }]}
                onPress={() => setShowBMIHistoryModal(true)}
              >
                <Text style={[styles.inputButtonText, { color: '#00008b' }]}>View BMI History</Text>
              </TouchableOpacity>
            )}
            
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

          {/* Period Tracking */}
          <View style={[styles.trackingCard, { backgroundColor: colors.card }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="calendar" size={24} color="#FFD700" />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Period Tracking</Text>
            </View>
            <Text style={[styles.noDataText, { color: colors.textSecondary }]}>Track your menstrual cycle and view predictions</Text>
            <TouchableOpacity 
              style={[styles.inputButton, { backgroundColor: colors.primary }]} 
              onPress={() => navigation.navigate('PeriodTracking')}
            >
              <Text style={styles.inputButtonText}>Period Calendar</Text>
            </TouchableOpacity>
          </View>

        </View>

      </ScrollView>

      {/* BMI Modal */}
      <Modal
        visible={showBMIModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBMIModal(false)}
      >
        <View style={styles.bmiModalOverlay}>
          <View style={styles.bmiModalContent}>
            <View style={styles.bmiModalHeader}>
              <Text style={styles.bmiModalTitle}>Update BMI Data</Text>
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

            <View style={styles.bmiModalButtons}>
              <TouchableOpacity 
                style={[styles.bmiModalButton, styles.cancelButton]}
                onPress={() => setShowBMIModal(false)}
              >
                <Text style={styles.bmiModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.bmiModalButton, styles.primaryButton]}
                onPress={calculateBMI}
              >
                <Text style={[styles.bmiModalButtonText, styles.primaryButtonText]}>Calculate BMI</Text>
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

      {/* BMI History Modal */}
      <Modal
        visible={showBMIHistoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBMIHistoryModal(false)}
      >
        <View style={styles.bmiHistoryModalOverlay}>
          <View style={styles.bmiHistoryModalContent}>
            <View style={styles.bmiHistoryModalHeader}>
              <Text style={styles.bmiHistoryModalTitle}>BMI History</Text>
              <TouchableOpacity onPress={() => setShowBMIHistoryModal(false)}>
                <Ionicons name="close" size={24} color="#2c3e50" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.bmiHistoryList} showsVerticalScrollIndicator={false}>
              {bmiHistory.length === 0 ? (
                <Text style={styles.noHistoryText}>No BMI history yet</Text>
              ) : (
                bmiHistory.map((entry, index) => (
                  <View key={entry.timestamp || index} style={styles.bmiHistoryItem}>
                    <View style={styles.bmiHistoryItemContent}>
                      <View style={styles.bmiHistoryRow}>
                        <Text style={styles.bmiHistoryValue}>{entry.value}</Text>
                        <Text style={[
                          styles.bmiHistoryCategory,
                          { color: getBMICategory(parseFloat(entry.value)).color }
                        ]}>
                          {getBMICategory(parseFloat(entry.value)).category}
                        </Text>
                      </View>
                      <Text style={styles.bmiHistoryDate}>{formatBMIDate(entry.timestamp)}</Text>
                      <Text style={styles.bmiHistoryWeight}>
                        Weight: {(entry.weight * 2.20462).toFixed(1)} lbs ({entry.weight.toFixed(1)} kg)
                      </Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.bmiHistoryDeleteBtn}
                      onPress={() => deleteBMIHistoryEntry(entry.timestamp)}
                    >
                      <Ionicons name="trash-outline" size={18} color="#e74c3c" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
            
            <TouchableOpacity
              style={styles.bmiHistoryCloseButton}
              onPress={() => setShowBMIHistoryModal(false)}
            >
              <Text style={styles.bmiHistoryCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Movement Details Modal */}
      <Modal
        visible={showMovementDetails}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMovementDetails(false)}
      >
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.modalOverlay, { backgroundColor: colors.background }]}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderContent}>
                  <Ionicons name="walk" size={20} color={colors.primary} />
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Run Details</Text>
                </View>
                <TouchableOpacity onPress={() => setShowMovementDetails(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScrollView}>
                {/* Running Stats Grid */}
                <View style={styles.runningStatsGrid}>
                  <View style={styles.runningStatBox}>
                    <Text style={[styles.runningStatValue, { color: colors.text }]}>
                      {movementData.runningDistance.toFixed(2)} {movementData.distanceUnit}
                    </Text>
                    <Text style={[styles.runningStatLabel, { color: colors.textSecondary }]}>Distance</Text>
                  </View>
                  <View style={styles.runningStatBox}>
                    <Text style={[styles.runningStatValue, { color: colors.text }]}>
                      {calculatePace(movementData.runningDistance, movementData.runningTime)}
                    </Text>
                    <Text style={[styles.runningStatLabel, { color: colors.textSecondary }]}>Pace</Text>
                  </View>
                  <View style={styles.runningStatBox}>
                    <Text style={[styles.runningStatValue, { color: colors.text }]}>
                      {movementData.calories}
                    </Text>
                    <Text style={[styles.runningStatLabel, { color: colors.textSecondary }]}>Calories Burned</Text>
                  </View>
                  <View style={styles.runningStatBox}>
                    <Text style={[styles.runningStatValue, { color: colors.text }]}>
                      {formatTime(movementData.runningTime)}
                    </Text>
                    <Text style={[styles.runningStatLabel, { color: colors.textSecondary }]}>Time</Text>
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  trackingCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  stepCounter: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  stepCount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#00008b',
  },
  stepGoal: {
    fontSize: 14,
    marginLeft: 6,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00008b',
    borderRadius: 3,
  },
  movementSnapshotText: {
    fontSize: 13,
    marginTop: 12,
  },
  pedometerStatusText: {
    fontSize: 13,
  },
  movementInfoText: {
    fontSize: 12,
    marginTop: 8,
  },
  trackingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#00008b',
    backgroundColor: '#fff',
  },
  trackingActive: {
    backgroundColor: '#00008b',
  },
  trackingButtonText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '600',
    color: '#00008b',
  },
  trackingActiveText: {
    color: '#fff',
  },
  bmiResult: {
    alignItems: 'center',
    marginBottom: 15,
  },
  bmiValue: {
    fontSize: 34,
    fontWeight: '700',
    color: '#0f172a',
  },
  bmiCategory: {
    fontSize: 14,
    fontWeight: '600',
  },
  noDataText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 18,
  },
  inputButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  inputButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  // BMI Tracking Card Styles
  bmiTrackingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
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
  sourceContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  sourceText: {
    fontSize: 11,
    color: '#7f8c8d',
  },
  sourceLink: {
    fontSize: 11,
    color: '#00008b',
    textDecorationLine: 'underline',
  },
  // BMI Modal Styles
  bmiModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bmiModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 20,
    width: '90%',
    maxWidth: 400,
  },
  bmiModalHeader: {
    marginBottom: 16,
  },
  bmiModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    textAlign: 'center',
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
  },
  unitToggleOption: {
    fontSize: 11,
    fontWeight: '600',
    color: '#00008b',
  },
  inputGroup: {
    marginBottom: 20,
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
  heightInputGroup: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 16,
  },
  heightInputSubGroup: {
    flex: 1,
  },
  bmiModalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  bmiModalButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  bmiModalButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  primaryButton: {
    backgroundColor: '#00008b',
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
  // BMI History Modal Styles
  bmiHistoryModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bmiHistoryModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  bmiHistoryModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  bmiHistoryModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
  },
  bmiHistoryList: {
    maxHeight: 400,
  },
  noHistoryText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    paddingVertical: 40,
  },
  bmiHistoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  bmiHistoryItemContent: {
    flex: 1,
  },
  bmiHistoryRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  bmiHistoryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    marginRight: 8,
  },
  bmiHistoryCategory: {
    fontSize: 14,
    fontWeight: '600',
  },
  bmiHistoryDate: {
    fontSize: 13,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  bmiHistoryWeight: {
    fontSize: 13,
    color: '#95a5a6',
  },
  bmiHistoryDeleteBtn: {
    padding: 10,
    marginLeft: 10,
  },
  bmiHistoryCloseButton: {
    backgroundColor: '#00008b',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  bmiHistoryCloseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  bmiModalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    width: width - 40,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  unitToggle: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#f1f5ff',
  },
  unitToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 20,
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
    backgroundColor: '#e2e8f0',
    borderRadius: 13,
    justifyContent: 'center',
    paddingHorizontal: 3,
    marginRight: 8,
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
  unitToggleBelowButton: {
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f1f5ff',
    borderWidth: 1,
    borderColor: '#00008b30',
  },
  unitToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00008b',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  heightInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dataSourceText: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#00008b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  // Nutrition styles
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  imageOptionsContainer: {
    marginVertical: 15,
  },
  imageOptionsLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 10,
  },
  imageButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  imageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff5f5',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ff6b6b',
    gap: 8,
  },
  imageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ff6b6b',
  },
  imagePreviewContainer: {
    position: 'relative',
    alignItems: 'center',
    marginVertical: 10,
  },
  imagePreview: {
    width: 150,
    height: 120,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ff6b6b',
  },
  removeImageButton: {
    position: 'absolute',
    top: -5,
    right: '30%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 2,
  },
  nutritionInfoContainer: {
    backgroundColor: '#fff5f5',
    padding: 12,
    borderRadius: 10,
    marginVertical: 10,
  },
  nutritionInfoText: {
    fontSize: 14,
    color: '#ff6b6b',
    textAlign: 'center',
    fontWeight: '500',
  },
  // Improved Nutrition Modal Styles
  nutritionModalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardContainer: {
    flex: 1,
  },
  nutritionModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#ffffff',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  nutritionModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    textAlign: 'center',
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  nutritionModalContent: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  nutritionSection: {
    marginBottom: 25,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  brandInput: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: '#2c3e50',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  nutritionInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  photoButtonsContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  photoButtonSimple: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00008b',
    padding: 15,
    borderRadius: 12,
    gap: 10,
    shadowColor: '#00008b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  photoButtonTextSimple: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  imagePreviewWrapper: {
    position: 'relative',
    alignItems: 'center',
  },
  imagePreview: {
    width: 200,
    height: 150,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#00008b',
  },
  removeImageButton: {
    position: 'absolute',
    top: -10,
    right: '25%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  nutritionInfoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  bottomSpacing: {
    height: 20,
  },
  nutritionSaveButtonInline: {
    backgroundColor: '#00008b',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#00008b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonDisabled: {
    backgroundColor: '#dfe6e9',
    shadowColor: 'transparent',
    elevation: 0,
  },
  nutritionSaveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  // Movement Details Modal Styles - Running Focused
  modalScrollView: {
    maxHeight: '80%',
  },
  detailSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
  },
  detailSubtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 2,
  },
  detailLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 20,
    fontWeight: '600',
  },
  progressContainer: {
    marginTop: 8,
  },
  // Running Stats Grid
  runningStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    marginVertical: 16,
  },
  runningStatBox: {
    alignItems: 'center',
    width: '45%',
    marginVertical: 8,
  },
  runningStatValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#e17055',
  },
  runningStatLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  // Pace Section
  paceSection: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginVertical: 16,
    borderWidth: 2,
    borderColor: '#e17055',
  },
  paceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7f8c8d',
    marginBottom: 8,
  },
  paceValue: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  paceSubtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  // Detection Info
  detectionInfo: {
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
  },
  detectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  detectionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // No Running Message
  noRunningMessage: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  noRunningText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  noRunningSubtext: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
  // BMI Graph Styles
  bmiGraphContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  bmiGraphTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
    textAlign: 'center',
  },
  bmiGraphContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    height: 120,
    marginBottom: 16,
  },
  bmiLineGraph: {
    flexDirection: 'row',
    flex: 1,
    height: 100,
  },
  bmiYAxis: {
    width: 40,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: 20,
  },
  bmiYAxisLabel: {
    fontSize: 9,
    color: '#666',
    textAlign: 'right',
  },
  bmiGraphArea: {
    flex: 1,
    position: 'relative',
    height: 100,
    paddingBottom: 20,
    marginLeft: 5,
  },
  bmiGridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  bmiLineSegment: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#00008b',
    transformOrigin: 'left center',
  },
  bmiDataPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    transform: [{ translateX: -4 }, { translateY: 4 }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  bmiDataPointValue: {
    fontSize: 8,
    color: '#666',
    position: 'absolute',
    top: -12,
    transform: [{ translateX: -10 }],
  },
  noGraphData: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 120,
  },
  noGraphText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  bmiGraphLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  bmiGraphLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    marginVertical: 4,
  },
  bmiLegendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: 6,
  },
  bmiLegendText: {
    fontSize: 11,
    color: '#666',
  },
  // BMI History Button Styles
  bmiHistoryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#00008b',
    marginTop: 10,
  },
  bmiHistoryButtonText: {
    color: '#00008b',
  },
  // Simple Weight Loss Text Style
  weightLossText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  // HealthKit Integration Styles
  healthKitToggle: {
    marginVertical: 12,
    paddingHorizontal: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButtonActive: {
    // Active state handled by dynamic backgroundColor
  },
  toggleButtonInactive: {
    // Inactive state handled by dynamic backgroundColor
  },
  toggleButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  toggleButtonTextActive: {
    color: '#ffffff',
  },
  toggleButtonTextInactive: {
    color: '#666',
  },
  toggleHint: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  dataSourceText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  healthKitNotice: {
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4169e1',
  },
  healthKitNoticeText: {
    fontSize: 12,
    lineHeight: 16,
  },
  bmiSourceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    flexWrap: 'wrap',
  },
  bmiSourceText: {
    fontSize: 11,
    color: '#666',
    lineHeight: 16,
  },
  bmiSourceLink: {
    fontSize: 11,
    color: '#00008b',
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
});
