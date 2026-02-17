import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AppHeader from '../components/AppHeader';
import { signOutUser } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getCurrentUser } from '../services/authService';

export default function MoreScreen({ navigation }) {
  const { setUser } = useAuth();
  const { colors } = useTheme();
  
  // Check if user is authenticated
  const currentUser = getCurrentUser();
  const isAuthenticated = !!currentUser;

  const handleSignOut = async () => {
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

  const menuItems = [
    {
      id: 1,
      title: 'Profile',
      description: 'Manage your account and preferences',
      icon: 'person-outline',
      onPress: () => {
        // Navigate to Profile using the parent navigator to avoid tab conflicts
        navigation.getParent()?.navigate('Profile') || navigation.navigate('Profile');
      },
    },
    {
      id: 2,
      title: 'Find a Provider',
      description: 'Connect with healthcare professionals',
      icon: 'medical-outline',
      onPress: () => {
        // Navigate to Providers using the parent navigator to avoid tab conflicts
        navigation.getParent()?.navigate('Providers') || navigation.navigate('Providers');
      },
    },
    {
      id: 3,
      title: 'Rewards',
      description: 'Track points and earn achievements',
      icon: 'trophy-outline',
      onPress: () => {
        // Navigate to Rewards using the parent navigator to avoid tab conflicts
        navigation.getParent()?.navigate('Rewards') || navigation.navigate('Rewards');
      },
    },
    {
      id: 6,
      title: 'Checklists',
      description: 'Health checklists and assessments',
      icon: 'flask-outline',
      onPress: () => {
        // Navigate to Labs using the parent navigator to avoid tab conflicts
        navigation.getParent()?.navigate('Labs') || navigation.navigate('Labs');
      },
      title: 'Settings',
      description: 'App settings and preferences',
      icon: 'settings-outline',
      onPress: () => {
        navigation.getParent()?.navigate('Settings') || navigation.navigate('Settings');
      },
    },
    {
      id: 4,
      title: 'Help & Support',
      description: 'Get help and contact support',
      icon: 'help-circle-outline',
      onPress: () => {
        navigation.navigate('HelpSupport');
      },
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader navigation={navigation} title="More" />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.menuSection}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, { backgroundColor: colors.card }]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: colors.background }]}>
                <Ionicons name={item.icon} size={24} color={colors.primary} />
              </View>
              <View style={styles.menuContent}>
                <Text style={[styles.menuTitle, { color: colors.text }]}>{item.title}</Text>
                <Text style={[styles.menuDescription, { color: colors.textSecondary }]}>{item.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign Out Button - Only show for authenticated users */}
        {isAuthenticated && (
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
  menuSection: {
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  menuDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  signOutSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
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
});
