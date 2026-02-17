import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function Footer({ navigation }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.footerContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
      <View style={styles.footerContent}>
        <TouchableOpacity 
          style={styles.footerItem}
          onPress={() => navigation.navigate('Home')}
        >
          <Ionicons name="home-outline" size={20} color={colors.textSecondary} />
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.footerItem}
          onPress={() => navigation.navigate('Quiz')}
        >
          <Ionicons name="book-outline" size={20} color={colors.textSecondary} />
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>Learn</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.footerItem}
          onPress={() => navigation.navigate('Track')}
        >
          <Ionicons name="analytics-outline" size={20} color={colors.textSecondary} />
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>Track</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.footerItem}
          onPress={() => navigation.navigate('Resources')}
        >
          <Ionicons name="library-outline" size={20} color={colors.textSecondary} />
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>Resources</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.footerItem}
          onPress={() => navigation.navigate('More')}
        >
          <Ionicons name="grid-outline" size={20} color={colors.textSecondary} />
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>More</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footerContainer: {
    borderTopWidth: 1,
    paddingTop: 8,
    paddingBottom: 4,
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  footerItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  footerText: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500',
  },
});
