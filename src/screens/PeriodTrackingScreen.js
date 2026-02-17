import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Alert, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../components/AppHeader';
import { useTheme } from '../context/ThemeContext';
import { auth, db } from '../config/firebase';
import { collection, doc, getDoc, setDoc, getFirestore } from 'firebase/firestore';

// Debug imports
console.log('🔥 Auth imported:', auth);
console.log('🔥 DB imported:', db);

export default function PeriodTrackingScreen({ navigation }) {
  const { colors } = useTheme();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [periodData, setPeriodData] = useState({
    periods: [],
    symptoms: [],
    notes: []
  });
  const [isLoggingPeriod, setIsLoggingPeriod] = useState(false);
  const [selectedDates, setSelectedDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [periodStart, setPeriodStart] = useState(null);
  const [periodEnd, setPeriodEnd] = useState(null);
  const [lastSavedPeriod, setLastSavedPeriod] = useState(null);

  // Load period data from Firestore
  useEffect(() => {
    loadPeriodData();
  }, []);

  const loadPeriodData = async () => {
    try {
      console.log('🔥 Loading period data...');
      const user = auth.currentUser;
      if (!user) {
        console.log('🔥 No user authenticated');
        setLoading(false);
        return;
      }

      console.log('🔥 User authenticated:', user.uid);
      const periodDocRef = doc(db, 'users', user.uid, 'health', 'periods');
      const periodDoc = await getDoc(periodDocRef);
      
      if (periodDoc.exists()) {
        const data = periodDoc.data();
        console.log('🔥 Period data found:', data);
        setPeriodData({
          periods: data.periods || [],
          symptoms: data.symptoms || [],
          notes: data.notes || []
        });
      } else {
        console.log('🔥 No period data found');
      }
    } catch (error) {
      console.error('🔥 Error loading period data:', error);
      Alert.alert('Error', 'Failed to load period data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const savePeriodDataToFirestore = async (updatedPeriodData) => {
    try {
      console.log('🔥 Saving period data to Firestore...');
      const user = auth.currentUser;
      if (!user) {
        console.log('🔥 No user authenticated for save');
        return;
      }

      console.log('🔥 User authenticated for save:', user.uid);
      console.log('🔥 Data to save:', updatedPeriodData);
      
      const periodDocRef = doc(db, 'users', user.uid, 'health', 'periods');
      await setDoc(periodDocRef, updatedPeriodData);
      console.log('🔥 Period data saved to Firestore successfully');
    } catch (error) {
      console.error('🔥 Error saving period data:', error);
      Alert.alert('Error', 'Failed to save period data: ' + error.message);
    }
  };

  const handleDateClick = (date) => {
    const dateStr = formatDate(date);
    
    // Check if this date is already a logged period
    const existingPeriod = periodData.periods.find(p => {
      const start = new Date(p.startDate);
      const end = new Date(p.endDate);
      return date >= start && date <= end;
    });
    
    if (existingPeriod) {
      // Remove the period date
      removePeriodDate(date, existingPeriod);
    } else if (!isLoggingPeriod) {
      // Normal date selection (not logging mode)
      setSelectedDate(date);
    } else {
      // Period logging mode - select start and end dates
      if (!periodStart) {
        // Set start date
        setPeriodStart(date);
        setPeriodEnd(null);
        console.log('🔥 Period start date set:', dateStr);
      } else if (!periodEnd) {
        // Set end date
        if (date >= periodStart) {
          setPeriodEnd(date);
          console.log('🔥 Period end date set:', dateStr);
          console.log('🔥 Period range:', formatDate(periodStart), 'to', dateStr);
        } else {
          // End date is before start date, swap them
          const tempStart = date;
          const tempEnd = periodStart;
          setPeriodStart(tempStart);
          setPeriodEnd(tempEnd);
          console.log('🔥 Period dates swapped:', formatDate(tempStart), 'to', formatDate(tempEnd));
        }
      } else {
        // Reset selection and start new period
        setPeriodStart(date);
        setPeriodEnd(null);
        console.log('🔥 New period start:', dateStr);
      }
    }
  };

  const savePeriodRange = async () => {
    if (!periodStart || !periodEnd) return;
    
    console.log('🔥 Saving period range:', formatDate(periodStart), 'to', formatDate(periodEnd));
    
    // Create a single period entry for the range
    const newPeriod = {
      id: Date.now() + Math.random(),
      startDate: formatDate(periodStart),
      endDate: formatDate(periodEnd),
      flow: 'medium'
    };
    
    console.log('🔥 New period to add:', newPeriod);
    
    // Save period to Firestore
    const updatedPeriodData = {
      ...periodData,
      periods: [newPeriod, ...periodData.periods]
    };
    
    console.log('🔥 Updated period data:', updatedPeriodData);
    
    await savePeriodDataToFirestore(updatedPeriodData);
    
    // Update local state immediately to trigger re-render
    setPeriodData(updatedPeriodData);
    
    // Force calendar re-render by updating current month
    setCurrentMonth(new Date(currentMonth));
    
    console.log('🔥 Updated periods count:', updatedPeriodData.periods.length);
    
    // Reset logging state
    setIsLoggingPeriod(false);
    setPeriodStart(null);
    setPeriodEnd(null);
    setSelectedDates([]);
    
    // Set last saved period for summary card
    setLastSavedPeriod(newPeriod);
    
    console.log('🔥 Period range save completed');
  };

  const togglePeriodLogging = () => {
    if (isLoggingPeriod) {
      // Cancel logging
      setIsLoggingPeriod(false);
      setSelectedDates([]);
      setPeriodStart(null);
      setPeriodEnd(null);
    } else {
      // Start logging
      setIsLoggingPeriod(true);
      setSelectedDates([]);
      setPeriodStart(null);
      setPeriodEnd(null);
    }
  };

  const removePeriodDate = async (date, period) => {
    const start = new Date(period.startDate);
    const end = new Date(period.endDate);
    
    let updatedPeriods;
    
    if (formatDate(start) === formatDate(end)) {
      // Single day period - remove it entirely
      updatedPeriods = periodData.periods.filter(p => p.id !== period.id);
    } else if (formatDate(date) === formatDate(start)) {
      // Remove first day - update start date
      const newStart = new Date(start);
      newStart.setDate(newStart.getDate() + 1);
      updatedPeriods = periodData.periods.map(p => 
        p.id === period.id 
          ? { ...p, startDate: formatDate(newStart) }
          : p
      );
    } else if (formatDate(date) === formatDate(end)) {
      // Remove last day - update end date
      const newEnd = new Date(end);
      newEnd.setDate(newEnd.getDate() - 1);
      updatedPeriods = periodData.periods.map(p => 
        p.id === period.id 
          ? { ...p, endDate: formatDate(newEnd) }
          : p
      );
    } else {
      // Remove middle day - split period into two
      const newEnd = new Date(date);
      newEnd.setDate(newEnd.getDate() - 1);
      const newStart = new Date(date);
      newStart.setDate(newStart.getDate() + 1);
      
      updatedPeriods = periodData.periods.map(p => {
        if (p.id === period.id) {
          return null;
        }
        return p;
      }).filter(p => p !== null);
      
      // Add the two split periods
      updatedPeriods.push({
        id: Date.now(),
        startDate: period.startDate,
        endDate: formatDate(newEnd),
        flow: period.flow
      });
      
      updatedPeriods.push({
        id: Date.now() + 1,
        startDate: formatDate(newStart),
        endDate: period.endDate,
        flow: period.flow
      });
    }
    
    const updatedPeriodData = {
      ...periodData,
      periods: updatedPeriods
    };
    
    await savePeriodDataToFirestore(updatedPeriodData);
    setPeriodData(updatedPeriodData);
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (date) => {
    return date.getFullYear() + '-' + 
           String(date.getMonth() + 1).padStart(2, '0') + '-' + 
           String(date.getDate()).padStart(2, '0');
  };

  const getPeriodStatus = (date) => {
    const dateStr = formatDate(date);
    const period = periodData.periods.find(p => {
      const start = new Date(p.startDate);
      const end = new Date(p.endDate);
      return date >= start && date <= end;
    });
    
    if (period) {
      return { status: 'period', period };
    }
    
    return { status: 'normal' };
  };


  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];
    const totalCells = daysInMonth + firstDay;
    const rowsNeeded = Math.ceil(totalCells / 7);

    // Day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const headerRow = (
      <View style={styles.calendarHeader}>
        {dayHeaders.map((day) => (
          <View key={day} style={styles.dayHeader}>
            <Text style={[styles.dayHeaderText, { color: colors.textSecondary }]}>
              {day}
            </Text>
          </View>
        ))}
      </View>
    );

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const status = getPeriodStatus(date);
      const isToday = formatDate(date) === formatDate(new Date());
      
      // Check if this date is selected as start or end, or in the range
      const isStart = isLoggingPeriod && periodStart && formatDate(date) === formatDate(periodStart);
      const isEnd = isLoggingPeriod && periodEnd && formatDate(date) === formatDate(periodEnd);
      const isInRange = isLoggingPeriod && periodStart && periodEnd && date >= periodStart && date <= periodEnd;
      const isSelected = isStart || isEnd || isInRange;

      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.dayCell,
            status.status === 'period' && { borderWidth: 2, borderColor: '#DC143C' },
            isStart && { borderWidth: 3, borderColor: '#00b894', backgroundColor: '#00b89430' },
            isEnd && { borderWidth: 3, borderColor: '#e74c3c', backgroundColor: '#e74c3c30' },
            isInRange && { backgroundColor: '#DC143C20' },
          ]}
          onPress={() => handleDateClick(date)}
        >
          <Text style={[
            styles.dayText,
            status.status === 'period' && { color: '#DC143C', fontWeight: 'bold' },
            (isStart || isEnd) && { color: '#2c3e50', fontWeight: 'bold' },
            isInRange && { color: '#DC143C', fontWeight: '600' },
          ]}>
            {day}
          </Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={[styles.calendar, { backgroundColor: colors.card }]}>
        {headerRow}
        <View style={[styles.calendarDays, { minHeight: rowsNeeded * 28 }]}>
          {days}
        </View>
      </View>
    );
  };

  const renderMonthNavigation = () => (
    <View style={styles.monthNavigation}>
      <TouchableOpacity onPress={() => {
        const newMonth = new Date(currentMonth);
        newMonth.setMonth(newMonth.getMonth() - 1);
        setCurrentMonth(newMonth);
      }}>
        <Ionicons name="chevron-back" size={24} color={colors.primary} />
      </TouchableOpacity>
      
      <Text style={[styles.currentMonth, { color: colors.text }]}>
        {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      </Text>
      
      <TouchableOpacity onPress={() => {
        const newMonth = new Date(currentMonth);
        newMonth.setMonth(newMonth.getMonth() + 1);
        setCurrentMonth(newMonth);
      }}>
        <Ionicons name="chevron-forward" size={24} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );

  const renderLegend = () => {
  const getDisplayText = () => {
    if (!isLoggingPeriod) return "Log Period";
    
    if (!periodStart) {
      return "Tap start date";
    }
    
    if (!periodEnd) {
      const startFormatted = periodStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `Start: ${startFormatted} (tap end)`;
    }
    
    const startFormatted = periodStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endFormatted = periodEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${startFormatted} - ${endFormatted}`;
  };

  return (
    <View style={[styles.legend, { backgroundColor: colors.card }]}>
      <View style={styles.legendItems}>
        <View style={styles.periodIndicator}>
          <View style={styles.indicatorDot} />
          <Text style={[styles.indicatorText, { color: colors.text }]}>
            {isLoggingPeriod ? 
              (periodStart && !periodEnd ? "Select end date" : 
               periodStart && periodEnd ? "Period selected" : 
               "Select start date") : 
              "Tap to log period"
            }
          </Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.loggingButton, isLoggingPeriod && styles.loggingButtonActive]}
          onPress={togglePeriodLogging}
        >
          <Ionicons name={isLoggingPeriod ? "close-circle" : "add-circle"} size={20} color={isLoggingPeriod ? "#ffffff" : "#DC143C"} />
          <Text style={[styles.loggingButtonText, { color: isLoggingPeriod ? "#ffffff" : "#DC143C" }]}>
            {getDisplayText()}
          </Text>
        </TouchableOpacity>
        
        {isLoggingPeriod && periodStart && periodEnd && (
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={savePeriodRange}
          >
            <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

  const getMonthPeriods = () => {
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    
    return periodData.periods.filter(period => {
      const periodStart = new Date(period.startDate);
      const periodEnd = new Date(period.endDate);
      
      // Check if period overlaps with current month
      return (periodStart <= monthEnd && periodEnd >= monthStart);
    });
  };

  const getMonthPredictions = () => {
    const monthPeriods = getMonthPeriods();
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    
    console.log('🔥 Checking predictions for month:', currentMonth.toLocaleDateString());
    console.log('🔥 Month range:', monthStart.toDateString(), 'to', monthEnd.toDateString());
    console.log('🔥 Periods in this month:', monthPeriods.length);
    console.log('🔥 Total periods in history:', periodData.periods.length);
    
    // Only show predictions if we have at least 2 periods to calculate cycle length
    if (periodData.periods.length < 2) {
      console.log('🔥 Not enough periods for predictions (need at least 2)');
      return null;
    }
    
    // Calculate actual average cycle length from all historical periods
    const cycleLengths = [];
    for (let i = 0; i < periodData.periods.length - 1; i++) {
      const currentPeriod = periodData.periods[i];
      const nextPeriod = periodData.periods[i + 1];
      const currentStart = new Date(currentPeriod.startDate);
      const nextStart = new Date(nextPeriod.startDate);
      const cycleDays = Math.ceil((nextStart - currentStart) / (1000 * 60 * 60 * 24));
      
      // Only include reasonable cycle lengths (21-45 days)
      if (cycleDays >= 21 && cycleDays <= 45) {
        cycleLengths.push(cycleDays);
      }
    }
    
    if (cycleLengths.length === 0) {
      console.log('🔥 No valid cycle lengths found');
      return null;
    }
    
    // ---------- Improved stats for predictions ----------
    // Use the most recent 6 cycles (or fewer if not available)
    const recentCycleLengths = cycleLengths.slice(0, 6);

    // Helper to compute median
    const median = (arr) => {
      const sorted = [...arr].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 === 0 ? Math.round((sorted[mid - 1] + sorted[mid]) / 2) : sorted[mid];
    };

    const medianCycleLength = median(recentCycleLengths);
    console.log(
      `🔥 Median cycle length (last ${recentCycleLengths.length} cycles): ${medianCycleLength} days`,
    );

    // Calculate individual period lengths (duration of bleeding)
    const periodLengths = periodData.periods.map((period) => {
      const start = new Date(period.startDate);
      const end = new Date(period.endDate);
      return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    });

    const medianPeriodLength = median(periodLengths);

    // Use medians for predictions downstream
    const averageCycleLength = medianCycleLength;
    const averagePeriodLength = medianPeriodLength;
    console.log(`🔥 Median period length: ${medianPeriodLength} days`);

    // --------------------------------------------------
    
    // Find the most recent period before or within the current month
    let mostRecentPeriod = null;
    let mostRecentDate = new Date(0); // Earliest possible date
    
    for (const period of periodData.periods) {
      const periodStart = new Date(period.startDate);
      // Consider periods that are before or within the current month
      if (periodStart <= monthEnd && periodStart > mostRecentDate) {
        mostRecentDate = periodStart;
        mostRecentPeriod = period;
      }
    }
    
    if (!mostRecentPeriod) {
      console.log('🔥 No recent period found for current month context');
      return null;
    }
    
    const lastPeriodStart = new Date(mostRecentPeriod.startDate);
    const lastPeriodEnd = new Date(mostRecentPeriod.endDate);
    
    console.log(`🔥 Using period: ${lastPeriodStart.toDateString()} to ${lastPeriodEnd.toDateString()}`);
    
    // Calculate predictions based on the most recent period
    const nextPeriodStart = new Date(lastPeriodStart);
    nextPeriodStart.setDate(nextPeriodStart.getDate() + averageCycleLength);
    
    console.log(`🔥 Debug: averageCycleLength=${averageCycleLength}, averagePeriodLength=${averagePeriodLength}`);
    console.log(`🔥 Debug: nextPeriodStart initially=${nextPeriodStart.toDateString()}`);
    
    const nextPeriodEnd = new Date(nextPeriodStart);
    nextPeriodEnd.setDate(nextPeriodEnd.getDate() + averagePeriodLength - 1); // Match the period length calculation (which includes +1)
    
    console.log(`🔥 Debug: nextPeriodEnd after calculation=${nextPeriodEnd.toDateString()}`);
    console.log(`🔥 Debug: Predicted period: ${nextPeriodStart.toDateString()} to ${nextPeriodEnd.toDateString()}`);
    
    // Calculate ovulation: typically 14 days before next period, but adjust for shorter/longer cycles
    const ovulationDay = new Date(nextPeriodStart);
    let ovulationOffset = 14; // Default offset
    
    // Adjust ovulation offset based on cycle length (more accurate for different cycle lengths)
    if (averageCycleLength < 28) {
      ovulationOffset = Math.max(12, Math.round(averageCycleLength * 0.5)); // Earlier for shorter cycles
    } else if (averageCycleLength > 32) {
      ovulationOffset = Math.min(16, Math.round(averageCycleLength * 0.45)); // Later for longer cycles
    }
    
    ovulationDay.setDate(ovulationDay.getDate() - ovulationOffset);
    
    // Calculate fertile window: 5 days before ovulation to 1 day after
    const fertileStart = new Date(ovulationDay);
    fertileStart.setDate(fertileStart.getDate() - 5);
    
    const fertileEnd = new Date(ovulationDay);
    fertileEnd.setDate(fertileEnd.getDate() + 1);
    
    console.log(`🔥 Calculated predictions:`);
    console.log(`  Next period: ${nextPeriodStart.toDateString()} to ${nextPeriodEnd.toDateString()}`);
    console.log(`  Ovulation: ${ovulationDay.toDateString()}`);
    console.log(`  Fertile window: ${fertileStart.toDateString()} to ${fertileEnd.toDateString()}`);
    
    // Check if any predictions fall within the current month
    const hasCurrentMonthPredictions = 
      (nextPeriodStart <= monthEnd && nextPeriodEnd >= monthStart) ||
      (ovulationDay >= monthStart && ovulationDay <= monthEnd) ||
      (fertileStart <= monthEnd && fertileEnd >= monthStart);
    
    if (!hasCurrentMonthPredictions) {
      console.log('🔥 No predictions fall within current month');
      return null;
    }
    
    return {
      fertileWindow: { start: fertileStart, end: fertileEnd },
      ovulationDay: ovulationDay,
      nextPeriodStart: nextPeriodStart,
      nextPeriodEnd: nextPeriodEnd,
      averageCycleLength: averageCycleLength,
      averagePeriodLength: averagePeriodLength
    };
  };

  const renderPeriodSummary = () => {
    const monthPeriods = getMonthPeriods();
    if (monthPeriods.length === 0) return null;
    
    // Show the most recent period in this month
    const period = monthPeriods[0];
    const startDate = new Date(period.startDate);
    const endDate = new Date(period.endDate);
    const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    
    return (
      <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
        <View style={styles.summaryHeader}>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>Period Logged</Text>
        </View>
        
        <View style={styles.summaryContent}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Duration:</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{duration} days</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Start:</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>End:</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {endDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderPredictions = () => {
    const monthPredictions = getMonthPredictions();
    console.log('🔥 renderPredictions called, monthPredictions:', monthPredictions);
    if (!monthPredictions) return null;

    const formatDate = (date) => {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const formatDateWithWeekday = (date) => {
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const isTodayInRange = (start, end) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return start <= today && end >= today;
    };

    const isDateInFuture = (date) => {
      const today = new Date();
      return date > today;
    };

    return (
      <View style={[styles.predictionsCard, { backgroundColor: colors.card }]}>
        <View style={styles.predictionsHeader}>
          <Text style={[styles.predictionsTitle, { color: colors.text }]}>Predictions</Text>
        </View>

        <View style={styles.predictionsContent}>
          {/* Fertile Window */}
          {monthPredictions.fertileWindow && (
            <View style={[
              styles.predictionItem,
              isTodayInRange(monthPredictions.fertileWindow.start, monthPredictions.fertileWindow.end) && styles.activePrediction
            ]}>
              <View style={styles.predictionIcon}>
                <Ionicons name="water" size={16} color="#00b894" />
              </View>
              <View style={styles.predictionDetails}>
                <Text style={[styles.predictionLabel, { color: colors.textSecondary }]}>Fertile Window</Text>
                <Text style={[styles.predictionValue, { color: colors.text }]}>
                  {formatDate(monthPredictions.fertileWindow.start)} - {formatDate(monthPredictions.fertileWindow.end)}
                </Text>
                {isTodayInRange(monthPredictions.fertileWindow.start, monthPredictions.fertileWindow.end) && (
                  <Text style={[styles.predictionStatus, { color: '#00b894' }]}>Active now</Text>
                )}
              </View>
            </View>
          )}

          {/* Ovulation Day */}
          {monthPredictions.ovulationDay && (
            <View style={[
              styles.predictionItem,
              formatDate(monthPredictions.ovulationDay) === formatDate(new Date()) && styles.activePrediction
            ]}>
              <View style={styles.predictionIcon}>
                <Ionicons name="egg" size={16} color="#e74c3c" />
              </View>
              <View style={styles.predictionDetails}>
                <Text style={[styles.predictionLabel, { color: colors.textSecondary }]}>Ovulation Day</Text>
                <Text style={[styles.predictionValue, { color: colors.text }]}>
                  {formatDateWithWeekday(monthPredictions.ovulationDay)}
                </Text>
                {formatDate(monthPredictions.ovulationDay) === formatDate(new Date()) && (
                  <Text style={[styles.predictionStatus, { color: '#e74c3c' }]}>Today</Text>
                )}
              </View>
            </View>
          )}

          {/* Next Period */}
          {monthPredictions.nextPeriodStart && (
            <View style={[
              styles.predictionItem,
              formatDate(monthPredictions.nextPeriodStart) === formatDate(new Date()) && styles.activePrediction
            ]}>
              <View style={styles.predictionIcon}>
                <Ionicons name="calendar" size={16} color="#DC143C" />
              </View>
              <View style={styles.predictionDetails}>
                <Text style={[styles.predictionLabel, { color: colors.textSecondary }]}>Next Period</Text>
                <Text style={[styles.predictionValue, { color: colors.text }]}>
                  {formatDate(monthPredictions.nextPeriodStart)}
                </Text>
                {isDateInFuture(monthPredictions.nextPeriodStart) && (
                  <Text style={[styles.predictionStatus, { color: colors.textSecondary }]}>
                    In {Math.ceil((monthPredictions.nextPeriodStart - new Date()) / (1000 * 60 * 60 * 24))} days
                  </Text>
                )}
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderHistory = () => (
    <View style={[styles.history, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyTitle, { color: colors.text }]}>Period History</Text>
      
      {periodData.periods.slice(0, 3).map((period) => {
        const startDate = new Date(period.startDate);
        const endDate = new Date(period.endDate);
        
        return (
          <View key={period.id} style={[styles.historyItem, { borderBottomColor: colors.border }]}>
            <View style={styles.historyDates}>
              <Text style={[styles.historyDate, { color: colors.text }]}>
                {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
              <Text style={[styles.historyDuration, { color: colors.textSecondary }]}>
                {Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1} days
              </Text>
            </View>
            <View style={styles.historyFlow}>
              <Text style={[styles.flowLabel, { color: colors.textSecondary }]}>Flow:</Text>
              <Text style={[styles.flowValue, { color: colors.text }]}>{period.flow || 'medium'}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader navigation={navigation} title="Period Tracking" />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderMonthNavigation()}
        {renderCalendar()}
        
        {renderLegend()}
        {renderPeriodSummary()}
        {renderPredictions()}
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
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginTop: 10,
  },
  currentMonth: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  calendar: {
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 8,
    marginBottom: 10,
    minHeight: 'auto',
  },
  calendarHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 4,
    marginBottom: 4,
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: '600',
  },
  calendarDays: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 100,
    marginVertical: 2,
    marginHorizontal: 2,
    maxWidth: 40,
    maxHeight: 40,
  },
  todayCell: {
    borderWidth: 2,
    borderColor: '#00008b',
  },
  dayText: {
    fontSize: 14,
  },
  legend: {
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  legendItems: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  periodIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DC143C',
    marginRight: 6,
  },
  indicatorText: {
    fontSize: 12,
    fontWeight: '500',
  },
  loggingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#DC143C',
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loggingButtonActive: {
    backgroundColor: '#DC143C',
    shadowColor: '#DC143C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  loggingButtonText: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: '#00b894',
    marginLeft: 12,
    shadowColor: '#00b894',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
  summaryCard: {
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#00b89420',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  summaryContent: {
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  predictionsCard: {
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#9b59b620',
  },
  predictionsHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  predictionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cycleInfo: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cycleInfoText: {
    fontSize: 12,
    fontWeight: '500',
  },
  predictionsContent: {
    gap: 12,
  },
  predictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  activePrediction: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  predictionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  predictionDetails: {
    flex: 1,
  },
  predictionLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  predictionValue: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  predictionStatus: {
    fontSize: 11,
    fontWeight: '600',
  },
  cycleInsights: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  insightsTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  insightsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  insightItem: {
    alignItems: 'center',
  },
  insightLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  insightValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  predictions: {
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  predictionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  predictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  predictionContent: {
    marginLeft: 12,
    flex: 1,
  },
  predictionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  predictionDate: {
    fontSize: 12,
  },
  history: {
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  historyDates: {
    flex: 1,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  historyDuration: {
    fontSize: 12,
  },
  historyFlow: {
    alignItems: 'flex-end',
  },
  flowLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  flowValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
    borderRadius: 12,
    paddingVertical: 15,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  loggingStatus: {
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  loggingStatusText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  loggingDates: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalSave: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formSection: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  dateButtonText: {
    fontSize: 16,
  },
  flowOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  flowOption: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
  },
  flowOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
