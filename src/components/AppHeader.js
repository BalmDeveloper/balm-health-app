import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCurrentUser } from '../services/authService';
import { useTheme } from '../context/ThemeContext';

export default function AppHeader({ navigation, title }) {
  const { colors } = useTheme();
  const [user, setUser] = useState({
    firstName: 'User',
    streakCount: 0 // Now connected to 10k steps achievement
  });

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      let firstName = 'User';
      
      if (currentUser.displayName && currentUser.displayName.trim() !== '') {
        const nameParts = currentUser.displayName.trim().split(' ');
        firstName = nameParts[0];
      } else if (currentUser.email) {
        firstName = currentUser.email.split('@')[0];
        firstName = firstName.replace(/[^a-zA-Z]/g, '');
        if (firstName.length > 0) {
          firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
        } else {
          firstName = 'User';
        }
      }
      
      setUser(prevUser => ({
        ...prevUser,
        firstName: firstName
      }));
    }
  }, []);

  return (
    <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
      <View style={styles.headerLeft}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Image
            source={require('../../public/Images/balm logo.png')}
            style={[styles.headerLogo, { tintColor: colors.primary }]}
            resizeMode="contain"
          />
        </TouchableOpacity>
        {title && title !== 'Home' && <Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>}
      </View>
      
      <View style={styles.headerRight}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Ionicons name="notifications-outline" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.avatarContainer}
          onPress={() => {
            if (title !== 'Profile') {
              navigation.navigate('Profile');
            }
          }}
        >
          <View style={[styles.avatar, { borderColor: colors.primary, backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {user.firstName.charAt(0).toUpperCase()}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 5,
    paddingTop: 20,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogo: {
    width: 40,
    height: 40,
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    position: 'relative',
  },
  streakText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  avatarContainer: {
    marginLeft: 5,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
