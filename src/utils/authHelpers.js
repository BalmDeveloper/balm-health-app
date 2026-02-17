import { getCurrentUser } from '../services/authService';
import { Alert } from 'react-native';

export const requireAuth = (action = 'perform this action', navigation) => {
  const user = getCurrentUser();
  if (!user) {
    Alert.alert(
      'Sign In Required',
      `Please sign in to ${action}. You can browse the app freely, but signing in lets you save your data and join the community.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign In',
          onPress: () => {
            // Navigate to Profile tab where users can sign up/log in
            if (navigation) {
              navigation.navigate('Profile');
            } else {
              console.log('Navigation not provided to requireAuth');
            }
          },
        },
      ]
    );
    return false; // Not authenticated
  }
  return true; // Authenticated
};

export const isUserAuthenticated = () => {
  return !!getCurrentUser();
};
