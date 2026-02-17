import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AppHeader from '../components/AppHeader';
import { getCurrentUser } from '../services/authService';
import { useTheme } from '../context/ThemeContext';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export default function RewardsScreen({ navigation }) {
  const { colors } = useTheme();

  // Rewards System States
  const [totalPoints, setTotalPoints] = useState(0);
  const [dailyStreak, setDailyStreak] = useState(0);
  const [todayStepsGoal, setTodayStepsGoal] = useState(false);
  const [todayCommunityPost, setTodayCommunityPost] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load rewards data from Firestore
  const loadRewardsData = async () => {
    try {
      setLoading(true);
      const currentUser = getCurrentUser();
      if (!currentUser) return;

      const rewardsRef = doc(db, 'users', currentUser.uid, 'rewards', 'data');
      const rewardsDoc = await getDoc(rewardsRef);

      if (rewardsDoc.exists()) {
        const data = rewardsDoc.data();
        setTotalPoints(data.totalPoints || 0);
        setDailyStreak(data.dailyStreak || 0);
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
    } finally {
      setLoading(false);
    }
  };

  // Load rewards data on component mount
  useEffect(() => {
    loadRewardsData();
  }, []);

  // Calculate today's progress
  const getDailyProgress = () => {
    const activities = [
      todayStepsGoal,
      dailyStreak >= 1,
      todayCommunityPost
    ];
    const completed = activities.filter(Boolean).length;
    return { completed, total: activities.length };
  };

  const todayProgress = getDailyProgress();

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <AppHeader navigation={navigation} title="Rewards" />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading rewards...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader navigation={navigation} title="Rewards" />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Stats Overview */}
        <View style={styles.statsSection}>
          <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
            <View style={styles.statsHeader}>
              <Ionicons name="trophy" size={32} color="#FFD700" />
              <Text style={[styles.statsTitle, { color: colors.text }]}>Your Achievements</Text>
            </View>
            
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.primary }]}>{totalPoints}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Points</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <View style={styles.streakItem}>
                  <Ionicons name="flame" size={20} color="#FF6B35" />
                  <Text style={[styles.statValue, { color: colors.text }]}>{dailyStreak}</Text>
                </View>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Day Streak</Text>
              </View>
            </View>
          </View>

          {/* Today's Progress */}
          <View style={[styles.progressCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.progressTitle, { color: colors.text }]}>Today's Progress</Text>
            <Text style={[styles.progressSubtitle, { color: colors.textSecondary }]}>
              {todayProgress.completed} of {todayProgress.total} activities completed
            </Text>
            
            <View style={styles.progressBar}>
              <View style={[
                styles.progressFill, 
                { 
                  width: `${(todayProgress.completed / todayProgress.total) * 100}%`,
                  backgroundColor: colors.primary 
                }
              ]} />
            </View>
            
            <Text style={[styles.progressPoints, { color: colors.textSecondary }]}>
              +{todayProgress.completed} points earned today
            </Text>
          </View>
        </View>

        {/* Activities Section */}
        <View style={styles.activitiesSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Daily Activities</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Complete these activities to earn points
          </Text>
          
          <View style={styles.activitiesList}>
            <View style={[styles.activityCard, { backgroundColor: colors.card }]}>
              <View style={styles.activityHeader}>
                <View style={styles.activityLeft}>
                  <View style={[styles.activityIcon, { backgroundColor: '#E3F2FD' }]}>
                    <Ionicons name="walk" size={20} color="#1976D2" />
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={[styles.activityTitle, { color: colors.text }]}>10k Steps</Text>
                    <Text style={[styles.activityDescription, { color: colors.textSecondary }]}>
                      Walk 10,000 steps in a day
                    </Text>
                  </View>
                </View>
                <View style={styles.activityRight}>
                  <Ionicons 
                    name={todayStepsGoal ? "checkmark-circle" : "checkmark-circle-outline"} 
                    size={24} 
                    color={todayStepsGoal ? "#4CAF50" : "#ccc"} 
                  />
                  <Text style={[
                    styles.activityPoints, 
                    { color: todayStepsGoal ? "#4CAF50" : "#ccc" }
                  ]}>
                    +1
                  </Text>
                </View>
              </View>
            </View>

            <View style={[styles.activityCard, { backgroundColor: colors.card }]}>
              <View style={styles.activityHeader}>
                <View style={styles.activityLeft}>
                  <View style={[styles.activityIcon, { backgroundColor: '#FFF3E0' }]}>
                    <Ionicons name="calendar" size={20} color="#F57C00" />
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={[styles.activityTitle, { color: colors.text }]}>Daily Login</Text>
                    <Text style={[styles.activityDescription, { color: colors.textSecondary }]}>
                      Open the app daily
                    </Text>
                  </View>
                </View>
                <View style={styles.activityRight}>
                  <Ionicons 
                    name={dailyStreak >= 1 ? "checkmark-circle" : "checkmark-circle-outline"} 
                    size={24} 
                    color={dailyStreak >= 1 ? "#4CAF50" : "#ccc"} 
                  />
                  <Text style={[
                    styles.activityPoints, 
                    { color: dailyStreak >= 1 ? "#4CAF50" : "#ccc" }
                  ]}>
                    +1
                  </Text>
                </View>
              </View>
            </View>

            <View style={[styles.activityCard, { backgroundColor: colors.card }]}>
              <View style={styles.activityHeader}>
                <View style={styles.activityLeft}>
                  <View style={[styles.activityIcon, { backgroundColor: '#E8F5E8' }]}>
                    <Ionicons name="people" size={20} color="#4CAF50" />
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={[styles.activityTitle, { color: colors.text }]}>Community Post</Text>
                    <Text style={[styles.activityDescription, { color: colors.textSecondary }]}>
                      Share in the community
                    </Text>
                  </View>
                </View>
                <View style={styles.activityRight}>
                  <Ionicons 
                    name={todayCommunityPost ? "checkmark-circle" : "checkmark-circle-outline"} 
                    size={24} 
                    color={todayCommunityPost ? "#4CAF50" : "#ccc"} 
                  />
                  <Text style={[
                    styles.activityPoints, 
                    { color: todayCommunityPost ? "#4CAF50" : "#ccc" }
                  ]}>
                    +1
                  </Text>
                </View>
              </View>
            </View>

          </View>
        </View>

        {/* Rewards Info */}
        <View style={styles.infoSection}>
          <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
            <View style={styles.infoHeader}>
              <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
              <Text style={[styles.infoTitle, { color: colors.text }]}>How Rewards Work</Text>
            </View>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Earn points by completing daily activities. Each activity rewards 1 point per day. 
              Build streaks by opening the app daily and track your progress over time!
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={[styles.footerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.footerTitle, { color: colors.text }]}>Keep earning points!</Text>
          <Text style={[styles.footerSubtitle, { color: colors.textSecondary }]}>
            Complete daily activities to build your streak and earn more points. Check back each day to track your progress and unlock new achievements.
          </Text>
          <View style={styles.footerActions}>
            <TouchableOpacity
              style={[styles.footerButton, { backgroundColor: colors.background, borderColor: colors.primary }]}
              onPress={() => navigation.navigate('Track')}
            >
              <Ionicons name="walk" size={18} color={colors.primary} />
              <Text style={[styles.footerButtonText, { color: colors.primary }]}>
                Track Activities
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.footerLink}
              onPress={() => navigation.navigate('Community')}
            >
              <Ionicons name="people-outline" size={18} color={colors.textSecondary} />
              <Text style={[styles.footerLinkText, { color: colors.textSecondary }]}>Visit Community</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    marginBottom: 0, // Remove bottom padding since footer handles spacing
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  // Stats Section
  statsSection: {
    padding: 20,
    gap: 16,
  },
  statsCard: {
    padding: 20,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 20,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  streakItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  // Progress Card
  progressCard: {
    padding: 20,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  progressSubtitle: {
    fontSize: 14,
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPoints: {
    fontSize: 12,
    textAlign: 'center',
  },
  // Activities Section
  activitiesSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  activitiesList: {
    gap: 12,
  },
  activityCard: {
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: 13,
  },
  activityRight: {
    alignItems: 'center',
    gap: 4,
  },
  activityPoints: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Info Section
  infoSection: {
    padding: 20,
    paddingBottom: 20, // Reduced padding since footer will be below
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  // Footer Styles
  footerCard: {
    marginHorizontal: 20,
    marginTop: 32,
    marginBottom: 40,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
  },
  footerTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  footerSubtitle: {
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18,
  },
  footerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  footerButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  footerLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerLinkText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '500',
  },
});
