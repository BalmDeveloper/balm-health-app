import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import WellnessScreen from '../screens/WellnessScreen';
import ResourcesScreen from '../screens/ResourcesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MoreScreen from '../screens/MoreScreen';
import RewardsScreen from '../screens/RewardsScreen';
// Additional screens (hidden in tab bar but keep footer visible)
import LabsScreen from '../screens/LabsScreen';
import LifestyleHistoryScreen from '../screens/LifestyleHistoryScreen';
import ProvidersScreen from '../screens/ProvidersScreen';
import SettingsScreen from '../screens/SettingsScreen';
import CommunityScreen from '../screens/CommunityScreen';
import PeriodTrackingScreen from '../screens/PeriodTrackingScreen';
import HealthProfileScreen from '../screens/HealthProfileScreen';
import HelpSupportScreen from '../screens/HelpSupportScreen';
import NotificationsScreen from '../screens/NotificationsScreen';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Community') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Track') {
            iconName = focused ? 'analytics' : 'analytics-outline';
          } else if (route.name === 'Resources') {
            iconName = focused ? 'library' : 'library-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'More') {
            iconName = focused ? 'menu' : 'menu-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        headerShown: false,
        tabBarActiveTintColor: '#000000',
        tabBarInactiveTintColor: '#666666',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e0e0e0',
          paddingTop: 10,
          height: 80,
        },
        headerStyle: {
          backgroundColor: '#ffffff',
        },
        headerTintColor: '#000000',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen 
        name="Community" 
        component={CommunityScreen}
        options={{ title: 'Community' }}
      />
      <Tab.Screen 
        name="Track" 
        component={WellnessScreen}
        options={{ title: 'Track' }}
      />
      <Tab.Screen 
        name="Resources" 
        component={ResourcesScreen}
        options={{ title: 'Resources' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ 
          title: 'Profile',
          tabBarButton: () => null, // Hide from tab bar
        }}
      />
      <Tab.Screen 
        name="More" 
        component={MoreScreen}
        options={{ title: 'More' }}
      />

      {/* Hidden tabs to retain footer */}
      <Tab.Screen name="Rewards" component={RewardsScreen} options={{ tabBarButton: () => null, headerShown: false }} />
      <Tab.Screen name="Labs" component={LabsScreen} options={{ tabBarButton: () => null, headerShown: false }} />
      <Tab.Screen name="ProfileDetail" component={ProfileScreen} options={{ tabBarButton: () => null, headerShown: false }} />
      <Tab.Screen name="LifestyleHistory" component={LifestyleHistoryScreen} options={{ tabBarButton: () => null, headerShown: false }} />
      <Tab.Screen name="Providers" component={ProvidersScreen} options={{ tabBarButton: () => null, headerShown: false }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarButton: () => null, headerShown: false }} />
      <Tab.Screen name="PeriodTracking" component={PeriodTrackingScreen} options={{ tabBarButton: () => null, headerShown: false }} />
      <Tab.Screen name="HealthProfile" component={HealthProfileScreen} options={{ tabBarButton: () => null, headerShown: false }} />
      <Tab.Screen name="HelpSupport" component={HelpSupportScreen} options={{ tabBarButton: () => null, headerShown: false }} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} options={{ tabBarButton: () => null, headerShown: false }} />
    </Tab.Navigator>
  );
}
