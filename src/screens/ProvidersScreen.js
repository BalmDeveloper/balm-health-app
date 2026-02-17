import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../components/AppHeader';

const providers = [
  {
    id: 'basma-faris',
    name: 'Dr. Basma Faris',
    title: 'Obstetrician-Gynecologist',
    location: 'United States',
    image: require('../../public/Images/providers/basma.png'),
    contact: 'mailto:balmtechnologies@gmail.com,drbasmafaris@gmail.com?subject=Provider%20Request%20from%20Balm.ai%20-%20Dr.%20Basma%20Faris',
    profileUrl: 'https://balm.ai/basma',
  },
  {
    id: 'hannah-kaye',
    name: 'Hannah Kaye',
    title: 'Nutritionist',
    location: 'Cape Town, South Africa',
    image: require('../../public/Images/providers/hannah.png'),
    contact: 'mailto:balmtechnologies@gmail.com,hannah@hannahkaye.co.za?subject=Provider%20Request%20from%20Balm.ai',
    profileUrl: 'https://balm.ai/hannah',
  },
  {
    id: 'kelly-gonda',
    name: 'Kelly Gonda',
    title: 'Endocrinologist',
    location: 'United States',
    image: require('../../public/Images/providers/Kelly.png'),
    contact: 'mailto:balmtechnologies@gmail.com,kelly@fertilityclinicinnovators.com?subject=Provider%20Request%20from%20Balm.ai',
    profileUrl: 'https://balm.ai/kelly',
  },
  {
    id: 'patricia-bitar',
    name: 'Patricia Bitar',
    title: 'Therapist',
    location: 'United States',
    image: require('../../public/Images/providers/Patricia.png'),
    contact: 'mailto:balmtechnologies@gmail.com,bitar.patricia1@gmail.com?subject=Provider%20Request%20from%20Balm.ai',
    profileUrl: 'https://balm.ai/patricia',
  },
];

export default function ProvidersScreen({ navigation }) {
  const openLink = async (url) => {
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.warn('Unable to open provider link', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader navigation={navigation} title="Providers" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.heroBlock}>
          <Text style={styles.heroTitle}>Meet the Balm Care Collective</Text>
          <Text style={styles.heroSubtitle}>
            Explore multidisciplinary experts who collaborate with Balm to deliver root-cause, whole-body care. Tap any provider to learn more or book a session.
          </Text>
        </View>

        <View style={styles.cardGrid}>
          {providers.map((provider) => (
            <View key={provider.id} style={styles.card}>
              <View style={styles.cardTopRow}>
                <Image source={provider.image} style={styles.avatarImage} />
                <View style={styles.headerContent}>
                  <Text style={styles.providerName}>{provider.name}</Text>
                  <Text style={styles.providerTitle}>{provider.title}</Text>
                  <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={14} color="#64748b" />
                    <Text style={styles.locationText}>{provider.location}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <TouchableOpacity
                  style={[styles.footerButton, styles.contactButton]}
                  onPress={() => openLink(provider.contact)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="mail-outline" size={16} color="#0f172a" />
                  <Text style={styles.footerButtonText}>Contact</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.footerButton, styles.profileButton]}
                  onPress={() => openLink(provider.profileUrl)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.footerButtonText, styles.profileButtonText]}>View profile</Text>
                  <Ionicons name="arrow-forward" size={16} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.ctaCard}>
          <View style={styles.ctaIcon}>
            <Ionicons name="chatbubbles-outline" size={22} color="#00008b" />
          </View>
          <View style={styles.ctaTextBlock}>
            <Text style={styles.ctaTitle}>Need help choosing?</Text>
            <Text style={styles.ctaSubtitle}>
              Chat with the Balm concierge team to match with the right practitioner for your goals.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => openLink('https://wa.me/14086408034')}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaButtonText}>Get matched</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  heroBlock: {
    backgroundColor: '#f1f5ff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  cardGrid: {
    marginTop: 32,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 20,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  providerName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  providerTitle: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 6,
  },
  bioText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1f2937',
    marginBottom: 14,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#f1f5ff',
    borderWidth: 1,
    borderColor: '#dbeafe',
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1d4ed8',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  contactButton: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5f5',
    marginRight: 12,
  },
  profileButton: {
    backgroundColor: '#00008b',
  },
  footerButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    marginLeft: 6,
  },
  profileButtonText: {
    color: '#ffffff',
    marginLeft: 6,
  },
  ctaCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  ctaIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  ctaTextBlock: {
    marginBottom: 16,
  },
  ctaTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  ctaSubtitle: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  ctaButton: {
    backgroundColor: '#00008b',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignSelf: 'center',
  },
  ctaButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
});
