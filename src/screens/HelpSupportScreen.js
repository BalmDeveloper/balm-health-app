import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../components/AppHeader';
import { useTheme } from '../context/ThemeContext';

export default function HelpSupportScreen({ navigation }) {
  const { colors } = useTheme();

  const contactOptions = [
    {
      id: 1,
      title: 'Contact Support',
      description: 'hello@balm.ai',
      icon: 'mail-outline',
      onPress: () => Linking.openURL('mailto:hello@balm.ai'),
    },
    {
      id: 2,
      title: 'Phone',
      description: '+16692471992',
      icon: 'call-outline',
      onPress: () => Linking.openURL('tel:+16692471992'),
    },
    {
      id: 3,
      title: 'WhatsApp',
      description: 'Chat with us',
      icon: 'logo-whatsapp',
      onPress: () => Linking.openURL('https://wa.me/14086408034'),
    },
  ];

  const socialMedia = [
    {
      id: 1,
      title: 'Substack',
      icon: 'newspaper-outline',
      url: 'https://thebalm.substack.com/',
    },
    {
      id: 2,
      title: 'LinkedIn',
      icon: 'logo-linkedin',
      url: 'https://www.linkedin.com/company/balmdotai',
    },
    {
      id: 3,
      title: 'Facebook',
      icon: 'logo-facebook',
      url: 'https://www.facebook.com/Balmdotai/',
    },
    {
      id: 4,
      title: 'YouTube',
      icon: 'logo-youtube',
      url: 'https://www.youtube.com/@Balmdotai',
    },
    {
      id: 5,
      title: 'Twitter',
      icon: 'logo-twitter',
      url: 'https://x.com/balmdotai',
    },
    {
      id: 6,
      title: 'Website',
      icon: 'globe-outline',
      url: 'https://www.balm.ai/',
    },
  ];

  const legalOptions = [
    {
      id: 1,
      title: 'Privacy Policy',
      icon: 'shield-outline',
      url: 'https://balm.ai/privacy',
    },
    {
      id: 2,
      title: 'Terms of Service',
      icon: 'document-text-outline',
      url: 'https://balm.ai/terms',
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader navigation={navigation} title="Help & Support" />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Contact Support Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact Support</Text>
          {contactOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[styles.optionCard, { backgroundColor: colors.card }]}
              onPress={option.onPress}
              activeOpacity={0.7}
            >
              <View style={[styles.optionIcon, { backgroundColor: colors.background }]}>
                <Ionicons name={option.icon} size={24} color={colors.primary} />
              </View>
              <View style={styles.optionContent}>
                <Text style={[styles.optionTitle, { color: colors.text }]}>{option.title}</Text>
                <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                  {option.description}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Social Media Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Follow Us</Text>
          <View style={[styles.socialGrid, { backgroundColor: colors.card }]}>
            {socialMedia.map((social) => (
              <TouchableOpacity
                key={social.id}
                style={[styles.socialItem, { backgroundColor: colors.background }]}
                onPress={() => Linking.openURL(social.url)}
                activeOpacity={0.7}
              >
                <Ionicons name={social.icon} size={24} color={colors.primary} />
                <Text style={[styles.socialTitle, { color: colors.text }]}>{social.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Legal Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Legal</Text>
          {legalOptions.map((legal) => (
            <TouchableOpacity
              key={legal.id}
              style={[styles.optionCard, { backgroundColor: colors.card }]}
              onPress={() => Linking.openURL(legal.url)}
              activeOpacity={0.7}
            >
              <View style={[styles.optionIcon, { backgroundColor: colors.background }]}>
                <Ionicons name={legal.icon} size={24} color={colors.primary} />
              </View>
              <View style={styles.optionContent}>
                <Text style={[styles.optionTitle, { color: colors.text }]}>{legal.title}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
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
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  socialGrid: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  socialItem: {
    width: '30%',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  socialTitle: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
});
