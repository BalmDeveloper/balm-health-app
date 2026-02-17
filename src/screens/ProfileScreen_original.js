import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Pedometer } from 'expo-sensors';
import { getCurrentUser, signOutUser } from '../services/authService';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { doc, getDoc, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import AppHeader from '../components/AppHeader';
import EditProfileModal from '../components/EditProfileModal';
import { 
  userService, 
  healthProfileService, 
  analyticsService,
  activityService 
} from '../services/firestore';

export default function ProfileScreen({ navigation }) {
  const [userProfile, setUserProfile] = useState({
    displayName: 'User',
    email: null,
    firstName: 'U',
    profileImage: null,
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [userStats, setUserStats] = useState({
    sessions: 0,
    streak: 0,
    minutes: 0,
    currentBMI: null,
    caloriesBurned: 0,
  });
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [healthProfile, setHealthProfile] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  
  // Pedometer states for real-time tracking
  const [steps, setSteps] = useState(0);
  const [pedometerAvailable, setPedometerAvailable] = useState(null);
  const [pedometerPermissionDenied, setPedometerPermissionDenied] = useState(false);

  const loadFirestoreData = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Load all Firestore data in parallel
      const [
        profile,
        healthData,
        stats,
        activities
      ] = await Promise.all([
        userService.getUserProfile(user.uid),
        healthProfileService.getHealthProfile(user.uid),
        analyticsService.getUserStats(user.uid),
        activityService.getUserActivities(user.uid, null, 10)
      ]);

      if (profile) {      if (profile) {
        setUserProfile(prev => ({
          ...prev,
          displayName: profile.displayName || prev.displayName,
          email: profile.email || prev.email,
          firstName: profile.displayName?.[0] || prev.firstName,
          profileImage: profile.photoURL || prev.profileImage,
        }));
      }

      setHealthProfile(healthData);

      // Log profile view
      await activityService.logActivity(user.uid, 'profile_view', {
        screen: 'ProfileScreen',
        hasHealthProfile: !!healthData
      });

      }    } catch (error) {
      console.error('Error loading Firestore data:', error);
    }
  }, []);

  const loadUserStats = useCallback(async () => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) return;

      console.log('🔥 Loading user stats for:', currentUser.uid);

      // Get user activities
      const activitiesQuery = query(
        collection(db, 'users', currentUser.uid, 'activities'),
        orderBy('timestamp', 'desc'),
        limit(100)
      );
      
      const querySnapshot = await getDocs(activitiesQuery);
      const activities = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log('🔥 Retrieved activities:', activities.length);

      // Calculate stats
      let totalSessions = 0;
      let totalMinutes = 0;
      let currentStreak = 0;
      let maxStreak = 0;
      let tempStreak = 0;
      let totalSteps = 0;
      let totalCalories = 0;

      // Group activities by date to calculate daily steps
      const dailySteps = {};
      
      activities.forEach(activity => {
        if (activity.type === 'wellness_session' || activity.type === 'meditation') {
          totalSessions++;
          if (activity.duration) {
            totalMinutes += Math.round(activity.duration / 60); // Convert seconds to minutes
          }
        }
        
        // Calculate calories from steps data
        if (activity.type === 'steps' && activity.steps) {
          totalSteps += activity.steps;
          // Rough calculation: 1 step ≈ 0.04 calories
          totalCalories += Math.round(activity.steps * 0.04);
          
          // Group steps by date
          const activityDate = new Date(activity.timestamp?.toDate?.() || activity.timestamp);
          const dateKey = activityDate.toDateString();
          
          if (!dailySteps[dateKey]) {
            dailySteps[dateKey] = 0;
          }
          dailySteps[dateKey] += activity.steps;
        }
        
        // Direct calories data if available
        if (activity.calories) {
          totalCalories += activity.calories;
        }
      });

      console.log('🔥 Daily steps data:', dailySteps);

      // Calculate streak based on 10k steps per day
      const today = new Date();
      const sortedDates = Object.keys(dailySteps).sort((a, b) => new Date(b) - new Date(a));

      currentStreak = 0;
      tempStreak = 0;
      let lastStreakDate = null;

      sortedDates.forEach(dateString => {
        const steps = dailySteps[dateString];
        const date = new Date(dateString);
        
        if (steps >= 10000) {
          if (!lastStreakDate) {
            // First day with 10k+ steps
            tempStreak = 1;
            lastStreakDate = date;
          } else {
            // Check if this is consecutive day
            const dayDiff = Math.floor((lastStreakDate - date) / (1000 * 60 * 60 * 24));
            if (dayDiff === 1) {
              tempStreak++;
              lastStreakDate = date;
            } else if (dayDiff > 1) {
              // Gap in streak, start new streak
              maxStreak = Math.max(maxStreak, tempStreak);
              tempStreak = 1;
              lastStreakDate = date;
            }
          }
        }
      });

      maxStreak = Math.max(maxStreak, tempStreak);

      // Check if today has 10k steps to continue streak
      const todayString = today.toDateString();
      const todaySteps = dailySteps[todayString] || 0;
      
      if (todaySteps >= 10000) {
        currentStreak = tempStreak;
      } else {
        // If today doesn't have 10k steps, check if yesterday did
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayString = yesterday.toDateString();
        const yesterdaySteps = dailySteps[yesterdayString] || 0;
        
        if (yesterdaySteps >= 10000) {
          currentStreak = tempStreak - 1; // Streak ended yesterday
        } else {
          currentStreak = 0; // No active streak
        }
      }

      console.log('🔥 Streak calculation:', {
        todaySteps,
        currentStreak,
        maxStreak,
        tempStreak
      });

      const stats = {
        sessions: totalSessions,
        streak: currentStreak,
        minutes: totalMinutes,
        caloriesBurned: userStats.caloriesBurned || totalCalories, // Preserve real-time data
        currentBMI: null, // Will be calculated separately
      };

      console.log('🔥 Calculated stats:', stats);
      setUserStats(stats);

    } catch (error) {
      console.error('❌ Error loading user stats:', error);
    }
  }, []);

  const loadInsights = useCallback(async () => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        console.log('❌ No current user for insights');
        return;
      }

      console.log('🔥 Loading insights for:', currentUser.uid);

      // First try to get BMI from the dedicated BMI document
      let bmi = null;
      try {
        const bmiDocRef = doc(db, 'users', currentUser.uid, 'health', 'bmi');
        const bmiDoc = await getDoc(bmiDocRef);
        
        if (bmiDoc.exists()) {
          const bmiData = bmiDoc.data();
          if (bmiData.currentBMI) {
            bmi = bmiData.currentBMI;
            console.log('🔥 BMI loaded from BMI document:', bmi);
          }
        }
      } catch (bmiError) {
        console.error('❌ Error loading BMI data:', bmiError);
      }

      // If no BMI found in dedicated document, fall back to calculating from height/weight
      if (!bmi) {
        try {
          const healthDataRef = doc(db, 'users', currentUser.uid, 'health', 'metrics');
          console.log('🔥 Health data path:', healthDataRef.path);
          
          const healthDoc = await getDoc(healthDataRef);
          console.log('🔥 Health doc exists:', healthDoc.exists());
          
          if (healthDoc.exists()) {
            const data = healthDoc.data();
            console.log('🔥 Health data:', data);
            
            if (data.height && data.weight) {
              // Calculate BMI: weight (kg) / height (m)^2
              const heightInMeters = data.height / 100; // Convert cm to meters
              bmi = (data.weight / (heightInMeters * heightInMeters)).toFixed(1);
              console.log('🔥 Calculated BMI from height/weight:', bmi);
            } else {
              console.log('🔥 Missing height or weight data');
            }
          } else {
            console.log('🔥 No health data found, using default');
          }
        } catch (healthError) {
          console.error('❌ Error loading health data:', healthError);
          console.log('🔥 Continuing without health data');
        }
      }

      // Update stats with BMI
      setUserStats(prev => ({
        ...prev,
        currentBMI: bmi
      }));

      // Create insights data with fallback values (excluding hydration and 10k steps)
      const insightsData = [
        {
          id: 'bmi',
          title: 'Current BMI',
          value: bmi || 'Not set',
          icon: 'body',
          color: '#00008b',
          description: bmi ? (bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese') : 'Set height and weight',
        },
        {
          id: 'calories',
          title: 'Calories Burned',
          value: `${userStats.caloriesBurned}`,
          icon: 'flame',
          color: '#FFD700',
          description: pedometerAvailable ? `From ${steps.toLocaleString()} steps today` : 'Based on your activity data',
        },
      ];

      console.log('🔥 Created insights:', insightsData);
      setInsights(insightsData);

    } catch (error) {
      console.error('❌ Error loading insights:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      
      // Set fallback insights even if there's an error (excluding hydration and 10k steps)
      const fallbackInsights = [
        {
          id: 'bmi',
          title: 'Current BMI',
          value: 'Not set',
          icon: 'body',
          color: '#00008b',
          description: 'Set height and weight',
        },
        {
          id: 'calories',
          title: 'Calories Burned',
          value: `${userStats.caloriesBurned}`,
          icon: 'flame',
          color: '#FFD700',
          description: pedometerAvailable ? `From ${steps.toLocaleString()} steps today` : 'Based on your activity data',
        },
      ];
      
      console.log('🔥 Using fallback insights');
      setInsights(fallbackInsights);
    }
  }, [userStats.caloriesBurned, steps, pedometerAvailable]);

  // Real-time pedometer tracking for calorie updates
  useEffect(() => {
    let subscription;
    let initialSteps = 0;

    const subscribe = async () => {
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
          initialSteps = Number.isFinite(result?.steps) ? result.steps : 0;
          console.log('🔥 Initial steps from pedometer:', initialSteps);
        } catch (error) {
          initialSteps = 0;
          console.log('🔥 Error getting initial steps:', error);
        }

        setSteps(initialSteps);
        console.log('🔥 Setting initial steps state:', initialSteps);

        subscription = Pedometer.watchStepCount(({ steps: newSteps }) => {
          const currentSteps = initialSteps + newSteps;
          console.log('🔥 Pedometer update - newSteps:', newSteps, 'currentSteps:', currentSteps);
          setSteps(currentSteps);
          
          // Update calories burned in real-time
          const caloriesFromSteps = Math.round(currentSteps * 0.04);
          console.log('🔥 Calories from steps:', caloriesFromSteps);
          setUserStats(prev => ({
            ...prev,
            caloriesBurned: caloriesFromSteps
          }));
        });
      } catch (error) {
        console.warn('Pedometer error in ProfileScreen:', error);
        setPedometerAvailable(false);
      }
    };

    subscribe();

    return () => {
      if (subscription && subscription.remove) {
        subscription.remove();
      }
    };
  }, []);

  const loadAllUserData = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      loadUserProfile(),
      loadUserStats(),
      loadInsights(),
      loadFirestoreData(),
    ]);
    setLoading(false);
  }, [loadUserProfile, loadUserStats, loadInsights, loadFirestoreData]);

  const loadUserProfile = useCallback(() => {
    const currentUser = getCurrentUser();
    console.log('🔥 Current user in ProfileScreen:', currentUser);
    console.log('🔥 User displayName:', currentUser?.displayName);
    console.log('🔥 User email:', currentUser?.email);
    
    if (currentUser) {
      let firstName = 'User';
      let displayName = currentUser.displayName || 'User';
      
      // If no displayName, try to get from email
      if (!currentUser.displayName || currentUser.displayName.trim() === '') {
        if (currentUser.email) {
          const emailName = currentUser.email.split('@')[0];
          firstName = emailName.replace(/[^a-zA-Z]/g, '');
          if (firstName.length > 0) {
            firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
            displayName = firstName;
          }
        }
        console.log('🔥 No displayName found, using email-derived name:', displayName);
      } else {
        firstName = currentUser.displayName.split(' ')[0];
        console.log('🔥 Using Firebase Auth displayName:', displayName);
      }
      
      console.log('🔥 Final profile data:', { displayName, email: currentUser.email, firstName });
      
      setUserProfile({
        displayName: displayName,
        email: currentUser.email || null, // Changed from 'user@example.com' to null
        firstName: firstName,
        profileImage: currentUser.photoURL || null,
      });
    } else {
      console.log('❌ No current user found');
      // Reset to default when no user
      setUserProfile({
        displayName: 'User',
        email: null, // Changed from 'user@example.com' to null
        firstName: 'U',
        profileImage: null,
      });
    }
  }, []);

  // Refresh profile when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('🔥 ProfileScreen focused - loading all user data');
      loadAllUserData();
    }, [loadAllUserData])
  );

  useEffect(() => {
    loadAllUserData();
    
    // Set up auth state listener to refresh profile when auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('🔥 Auth state changed in ProfileScreen:', user);
      if (user) {
        loadAllUserData();
      }
    });

    return unsubscribe;
  }, [loadAllUserData]);

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            const result = await signOutUser();
            if (result.success) {
              // AuthContext will automatically handle navigation
              console.log('🔥 User signed out successfully');
            } else {
              Alert.alert('Error', 'Failed to sign out');
            }
          }
        }
      ]
    );
  };

  const handleEditProfile = () => {
    console.log('🔥 Opening edit profile modal with user data:', userProfile);
    setShowEditModal(true);
  };

  const handleProfileSave = (updatedProfile) => {
    setUserProfile(updatedProfile);
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader navigation={navigation} title="Profile" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading your data...</Text>
          </View>
        ) : (
          <>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {userProfile.profileImage ? (
              <Image source={{ uri: userProfile.profileImage }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarGradient}>
                <Text style={styles.avatarInitial}>
                  {userProfile.firstName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.userName}>{userProfile.displayName}</Text>
          <Text style={styles.userEmail}>{userProfile.email}</Text>
          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Your Progress</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userStats.sessions}</Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userStats.streak}</Text>
              <Text style={styles.statLabel}>10K Steps</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userStats.minutes}</Text>
              <Text style={styles.statLabel}>Minutes</Text>
            </View>
          </View>
        </View>

        {/* Bio Data Card */}
        <View style={styles.bioDataSection}>
          <TouchableOpacity 
            style={styles.bioDataCard}
            onPress={() => navigation.navigate('HealthProfile')}
          >
            <LinearGradient
              colors={['#00008b', '#000066']}
              style={styles.bioDataGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.bioDataContent}>
                <View style={styles.bioDataIcon}>
                  <Ionicons name="folder" size={24} color="white" />
                </View>
                <View style={styles.bioDataText}>
                  <Text style={styles.bioDataTitle}>Bio Data</Text>
                  <Text style={styles.bioDataSubtitle}>Comprehensive Health Profile</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="white" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Health Profile Summary */}
        {healthProfile && (
          <View style={styles.healthProfileSection}>
            <Text style={styles.sectionTitle}>Health Profile Summary</Text>
            <View style={styles.healthSummaryCard}>
              <View style={styles.healthHeader}>
                <Ionicons name="checkmark-circle" size={24} color="#48bb78" />
                <Text style={styles.healthStatus}>Profile Completed</Text>
              </View>
              
              {healthProfile.metadata?.completionPercentage && (
                <View style={styles.progressContainer}>
                  <Text style={styles.progressText}>
                    Completion: {healthProfile.metadata.completionPercentage}%
                  </Text>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { width: `${healthProfile.metadata.completionPercentage}%` }
                      ]} 
                    />
                  </View>
                </View>
              )}

              {/* Quick Health Info */}
              <View style={styles.quickInfoGrid}>
                {healthProfile.sociodemographics?.calculatedAge && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Age</Text>
                    <Text style={styles.infoValue}>
                      {healthProfile.sociodemographics.calculatedAge} years
                    </Text>
                  </View>
                )}
                {healthProfile.sociodemographics?.gender && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Gender</Text>
                    <Text style={styles.infoValue}>
                      {healthProfile.sociodemographics.gender}
                    </Text>
                  </View>
                )}
                {healthProfile.coreHealth?.bmi && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>BMI</Text>
                    <Text style={styles.infoValue}>{healthProfile.coreHealth.bmi}</Text>
                  </View>
                )}
              </View>

              {/* PCOS Status */}
              {healthProfile.pcosPhenotype && (
                <View style={styles.pcosStatusCard}>
                  <Text style={styles.pcosTitle}>PCOS Analysis</Text>
                  <Text style={styles.pcosPhenotype}>
                    {healthProfile.pcosPhenotype.phenotype}
                  </Text>
                  <Text style={styles.pcosDescription}>
                    {healthProfile.pcosPhenotype.phenotypeDescription}
                  </Text>
                  <View style={styles.criteriaContainer}>
                    <Text style={styles.criteriaText}>
                      Rotterdam Criteria: {healthProfile.pcosPhenotype.rotterdamCriteria}/3
                    </Text>
                    <Text style={[
                      styles.statusText,
                      healthProfile.pcosPhenotype.meetsRotterdamCriteria ? 
                        styles.statusPositive : styles.statusNegative
                    ]}>
                      {healthProfile.pcosPhenotype.meetsRotterdamCriteria ? 
                        'Meets PCOS Criteria' : 'Does Not Meet PCOS Criteria'
                      }
                    </Text>
                  </View>
                </View>
              )}

              <Text style={styles.lastUpdated}>
                Last updated: {healthProfile.updatedAt?.toDate?.() ? 
                  new Date(healthProfile.updatedAt.toDate()).toLocaleDateString() : 
                  'Unknown'
                }
              </Text>
            </View>
          </View>
        )}


        {/* Insights */}
        <View style={styles.insightsSection}>
          <Text style={styles.sectionTitle}>Insights</Text>
          <View style={styles.insightsGrid}>
            {insights.map((insight) => (
              <View
                key={insight.id}
                style={[styles.insightCard, { borderColor: insight.color }]}
              >
                <View style={[styles.insightIcon, { backgroundColor: insight.color }]}>
                  <Ionicons
                    name={insight.icon}
                    size={20}
                    color="white"
                  />
                </View>
                <Text style={styles.insightTitle}>{insight.title}</Text>
                <Text style={styles.insightValue}>{insight.value}</Text>
                <Text style={styles.insightDescription}>{insight.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Sign Out Button */}
        <View style={styles.signOutSection}>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <LinearGradient
              colors={['#00008b', '#000066']}
              style={styles.signOutGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="log-out-outline" size={20} color="white" />
              <Text style={styles.signOutText}>Sign Out</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
          </>
          )}
        </ScrollView>

      {/* Edit Profile Modal */}
      <EditProfileModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        userProfile={userProfile}
        onSave={handleProfileSave}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  profileHeader: {
    alignItems: 'center',
    padding: 30,
    paddingTop: 20,
  },
  avatarContainer: {
    marginBottom: 15,
  },
  avatarGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00008b',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarInitial: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 15,
  },
  editButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  editButtonText: {
    color: '#00008b',
    fontWeight: 'bold',
  },
  statsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    padding: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00008b',
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
    marginTop: 5,
  },
  achievementsSection: {
    padding: 20,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  achievementCard: {
    width: '48%',
    backgroundColor: '#2d2d44',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  lockedAchievement: {
    opacity: 0.5,
  },
  achievementText: {
    fontSize: 12,
    color: '#ffffff',
    marginTop: 8,
    textAlign: 'center',
  },
  lockedText: {
    color: '#555',
  },
  insightsSection: {
    padding: 20,
  },
  insightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  insightCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  insightTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
  },
  insightValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: 10,
    color: '#888',
    textAlign: 'center',
  },
  menuSection: {
    padding: 20,
  },
  menuItem: {
    backgroundColor: '#2d2d44',
    borderRadius: 15,
    marginBottom: 10,
    padding: 15,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  menuItemText: {
    fontSize: 16,
    color: '#ffffff',
  },
  bioDataSection: {
    padding: 20,
    paddingTop: 0,
  },
  bioDataCard: {
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 10,
  },
  bioDataGradient: {
    padding: 20,
  },
  bioDataContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bioDataIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  bioDataText: {
    flex: 1,
  },
  bioDataTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  bioDataSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  signOutSection: {
    padding: 20,
  },
  signOutButton: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  signOutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 10,
  },
  versionSection: {
    alignItems: 'center',
    paddingBottom: 30,
  },
  versionText: {
    fontSize: 14,
    color: '#555',
  },
  // Health Profile Summary Styles
  healthProfileSection: {
    padding: 20,
    paddingTop: 0,
  },
  healthSummaryCard: {
    backgroundColor: '#2d2d44',
    borderRadius: 15,
    padding: 20,
    marginBottom: 10,
  },
  healthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  healthStatus: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#48bb78',
    marginLeft: 10,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressText: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#48bb78',
    borderRadius: 4,
  },
  quickInfoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  infoItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  pcosStatusCard: {
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  pcosTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  pcosPhenotype: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 4,
  },
  pcosDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
  },
  criteriaContainer: {
    marginTop: 8,
  },
  criteriaText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  statusPositive: {
    color: '#48bb78',
  },
  statusNegative: {
    color: '#f56565',
  },
  lastUpdated: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
