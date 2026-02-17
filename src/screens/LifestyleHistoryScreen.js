import React, { useMemo, useState } from 'react';
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

const HISTORY_FILTERS = ['All', 'Movement', 'BMI', 'Sleep', 'Mood', 'Period'];

const TYPE_COLORS = {
  Movement: '#00b894',
  BMI: '#6c5ce7',
  Sleep: '#74b9ff',
  Mood: '#fd79a8',
  Period: '#ff6b6b',
};

const hexToRgba = (hex, alpha = 1) => {
  if (typeof hex !== 'string') {
    return 'rgba(15, 23, 42, 0.08)';
  }

  const sanitized = hex.replace('#', '');
  if (sanitized.length !== 6) {
    return 'rgba(15, 23, 42, 0.08)';
  }

  const bigint = parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleString();
};

export default function LifestyleHistoryScreen({ navigation, route }) {
  const { colors } = useTheme();
  const history = route?.params?.history ?? [];
  const [historyFilter, setHistoryFilter] = useState('All');

  const filteredHistory = useMemo(() => {
    if (historyFilter === 'All') {
      return history;
    }
    return history.filter((entry) => entry.type === historyFilter);
  }, [history, historyFilter]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader navigation={navigation} title="History" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={[styles.pageTitle, { color: colors.text }]}>Lifestyle History</Text>
        <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>
          Review your recent wellness activity by switching between categories.
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChips}
        >
          {HISTORY_FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterChip,
                { backgroundColor: colors.card, borderColor: colors.border },
                historyFilter === filter && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
              onPress={() => setHistoryFilter(filter)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: colors.text },
                  historyFilter === filter && { color: '#ffffff' },
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Period Tracking Quick Access */}
        {historyFilter === 'Period' && (
          <TouchableOpacity
            style={[styles.periodQuickAccess, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => navigation.navigate('PeriodTracking')}
          >
            <View style={[styles.periodIcon, { backgroundColor: '#ff6b6b20' }]}>
              <Ionicons name="calendar" size={24} color="#ff6b6b" />
            </View>
            <View style={styles.periodContent}>
              <Text style={[styles.periodTitle, { color: colors.text }]}>Period Calendar</Text>
              <Text style={[styles.periodDescription, { color: colors.textSecondary }]}>
                View your menstrual calendar, track cycles, and see predictions
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}

        <View style={styles.historyList}>
          {filteredHistory.length > 0 ? (
            filteredHistory.map((entry) => {
              const color = TYPE_COLORS[entry.type] || '#6366f1';
              return (
                <View
                  key={entry.id}
                  style={[styles.historyCard, { backgroundColor: colors.card, borderColor: hexToRgba(color, 0.2) }]}
                >
                  <View
                    style={[styles.historyIcon, { backgroundColor: hexToRgba(color, 0.12) }]}
                  >
                    <Ionicons name={entry.icon || 'ellipse'} size={20} color={color} />
                  </View>
                  <View style={styles.historyContent}>
                    <View style={styles.historyContentHeader}>
                      <Text style={[styles.historyTitle, { color: colors.text }]}>{entry.title}</Text>
                      <Text style={[styles.historyType, { color }]}>{entry.type}</Text>
                    </View>
                    {entry.detail ? (
                      <Text style={[styles.historyDetail, { color: colors.textSecondary }]}>{entry.detail}</Text>
                    ) : null}
                    <Text style={[styles.historyTimestamp, { color: colors.textTertiary }]}>{formatTimestamp(entry.timestamp)}</Text>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={36} color={colors.textTertiary} />
              <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No activity yet</Text>
              <Text style={[styles.emptyStateSubtitle, { color: colors.textSecondary }]}>
                {historyFilter === 'Period' 
                  ? 'Start tracking your menstrual cycle to see predictions and history here.'
                  : 'Track your movement, BMI, sleep, or moods to see them here.'
                }
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.footerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.footerTitle, { color: colors.text }]}>Need to add more data?</Text>
          <Text style={[styles.footerSubtitle, { color: colors.textSecondary }]}>
            {historyFilter === 'Period' 
              ? 'Navigate to the Period Calendar to log your menstrual cycle and view predictions.'
              : 'Head back to tracking to log new movement, BMI, sleep, or mood entries. Your updates will appear here instantly.'
            }
          </Text>
          <View style={styles.footerActions}>
            <TouchableOpacity
              style={[styles.footerButton, { backgroundColor: colors.background, borderColor: colors.primary }]}
              onPress={() => historyFilter === 'Period' ? navigation.navigate('PeriodTracking') : navigation.goBack()}
            >
              <Ionicons name={historyFilter === 'Period' ? 'calendar' : 'arrow-back'} size={18} color={colors.primary} />
              <Text style={[styles.footerButtonText, { color: colors.primary }]}>
                {historyFilter === 'Period' ? 'Period Calendar' : 'Back to Track'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.footerLink}
              onPress={() => Linking.openURL('mailto:hello@balm.ai?subject=Lifestyle%20History%20Feedback')}
            >
              <Ionicons name="help-circle-outline" size={18} color={colors.textSecondary} />
              <Text style={[styles.footerLinkText, { color: colors.textSecondary }]}>Send feedback</Text>
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
  contentContainer: {
    padding: 20,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 6,
  },
  pageSubtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  filterChips: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    gap: 8,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  periodQuickAccess: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  periodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  periodContent: {
    flex: 1,
  },
  periodTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  periodDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  historyList: {
    marginTop: 20,
    gap: 12,
  },
  footerCard: {
    marginTop: 32,
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
    textDecorationLine: 'underline',
  },
  historyCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  historyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  historyContent: {
    flex: 1,
  },
  historyContentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  historyType: {
    fontSize: 12,
    fontWeight: '600',
  },
  historyDetail: {
    fontSize: 13,
    marginBottom: 6,
  },
  historyTimestamp: {
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyStateSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
