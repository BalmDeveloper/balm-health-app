import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../components/AppHeader';
import { signOutUser, getCurrentUser } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function SettingsScreen({ navigation }) {
  const { setUser } = useAuth();
  const { isDarkMode, toggleDarkMode, colors } = useTheme();
  
  // Check if user is authenticated
  const currentUser = getCurrentUser();
  const isAuthenticated = !!currentUser;

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            try {
              Alert.alert('Account Deleted', 'Your account has been successfully deleted.');
              // TODO: Implement actual account deletion logic
              setUser(null);
            } catch (error) {
              console.error('Delete account error:', error);
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOutUser();
              setUser(null);
            } catch (error) {
              console.error('Sign out error:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleToggleSetting = (settingName, currentValue, setter) => {
    const newValue = !currentValue;
    setter(newValue);
  };

  const navigateToScreen = (screenName) => {
    switch(screenName) {
      case 'Help & Support':
        Linking.openURL('mailto:hello@balm.ai');
        break;
      case 'About':
        Alert.alert('About', 'Balm.ai Version 1.0.0\n\nYour wellness companion for tracking and improving your health.\n\nTrack your daily steps and wellness journey with our comprehensive health app.');
        break;
      default:
        Alert.alert('Coming Soon', 'This feature is coming soon!');
    }
  };

  const settingsOptions = [
    {
      id: 1,
      title: 'Help & Support',
      description: 'Get help and contact support',
      icon: 'help-circle-outline',
      onPress: () => navigateToScreen('Help & Support'),
    },
    {
      id: 2,
      title: 'About',
      description: 'App version and legal information',
      icon: 'information-circle-outline',
      onPress: () => navigateToScreen('About'),
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader navigation={navigation} title="Settings" />
      
      <ScrollView style={[styles.scrollView, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
          <View style={[styles.sectionContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {settingsOptions.slice(0, 1).map((option, index) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.settingItem,
                  { borderBottomColor: colors.border }
                ]}
                onPress={option.onPress}
                activeOpacity={0.7}
              >
                <View style={[styles.settingIcon, { backgroundColor: colors.background }]}>
                  <Ionicons name={option.icon} size={24} color={colors.primary} />
                </View>
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>{option.title}</Text>
                  <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>{option.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
            
            {/* About */}
            <TouchableOpacity
              style={[styles.settingItem, { borderBottomColor: colors.border }]}
              onPress={() => navigateToScreen('About')}
              activeOpacity={0.7}
            >
              <View style={[styles.settingIcon, { backgroundColor: colors.background }]}>
                <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>About</Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>App version and legal information</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* Notification Preferences */}
            <TouchableOpacity
              style={[styles.settingItem, { borderBottomColor: colors.border }]}
              onPress={() => navigation.navigate('Notifications')}
              activeOpacity={0.7}
            >
              <View style={[styles.settingIcon, { backgroundColor: colors.background }]}>
                <Ionicons name="notifications-outline" size={24} color={colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>Notification Preferences</Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>Manage your notification settings</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Out Button - Only show for authenticated users */}
        {isAuthenticated && (
          <View style={styles.signOutSection}>
            <TouchableOpacity style={[styles.signOutButton, { backgroundColor: isDarkMode ? '#1e3a8a' : '#dbeafe', borderColor: isDarkMode ? '#3b82f6' : '#93c5fd' }]} onPress={handleSignOut}>
              <Ionicons name="log-out-outline" size={24} color="#1e40af" />
              <Text style={[styles.signOutText, { color: '#1e40af' }]}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Delete Account Button - Only show for authenticated users */}
        {isAuthenticated && (
          <View style={styles.signOutSection}>
            <TouchableOpacity style={[styles.signOutButton, { backgroundColor: isDarkMode ? '#2d1b1b' : '#fff5f5', borderColor: isDarkMode ? '#4a2c2c' : '#ffe0e0' }]} onPress={handleDeleteAccount}>
              <Ionicons name="trash-outline" size={24} color="#dc2626" />
              <Text style={[styles.signOutText, { color: '#dc2626' }]}>Delete Account</Text>
            </TouchableOpacity>
          </View>
        )}

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
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionContent: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  settingItemLast: {
    borderBottomWidth: 0,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  switch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  signOutSection: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 10,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
