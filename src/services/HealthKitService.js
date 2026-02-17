import { Platform } from 'react-native';

// Check if HealthKit is available (not available in Expo Go)
let HealthKit = null;
let isHealthKitAvailable = false;

try {
  HealthKit = require('react-native-health').default;
  isHealthKitAvailable = true;
} catch (error) {
  console.log('HealthKit library not available (running in Expo Go)');
}

class HealthKitService {
  constructor() {
    this.isInitialized = false;
    this.isConnected = false;
    this.availableDataTypes = [];
  }

  // Check if HealthKit library is available
  isLibraryAvailable() {
    return isHealthKitAvailable && HealthKit;
  }

  // Initialize HealthKit with proper permissions
  async initialize() {
    if (Platform.OS !== 'ios') {
      throw new Error('HealthKit is only available on iOS');
    }

    if (!this.isLibraryAvailable()) {
      throw new Error('HealthKit library not available. Use a development build instead of Expo Go.');
    }

    try {
      // Define permissions for health data we want to access
      const permissions = {
        permissions: {
          read: [
            HealthKit.Constants.Permissions.Steps,
            HealthKit.Constants.Permissions.HeartRate,
            HealthKit.Constants.Permissions.ActiveEnergyBurned,
          ],
          write: [],
        },
      };

      // Initialize HealthKit
      await HealthKit.initHealthKit(permissions);
      
      this.isInitialized = true;
      this.isConnected = true;
      
      // Set available data types
      this.availableDataTypes = {
        steps: true,
        heartRate: true,
        activeEnergyBurned: true,
      };
      
      console.log('HealthKit initialized successfully');
      return true;
    } catch (error) {
      console.error('HealthKit initialization error:', error);
      throw error;
    }
  }

  // Check if HealthKit is available
  isAvailable() {
    return Platform.OS === 'ios';
  }

  // Get authorization status for specific data types
  async getAuthorizationStatus(dataType = null) {
    if (!this.isAvailable()) return false;
    
    if (!this.isLibraryAvailable()) {
      return { sharingAuthorized: false };
    }

    try {
      let permissionType;
      
      switch (dataType) {
        case 'steps':
          permissionType = HealthKit.Constants.Permissions.Steps;
          break;
        case 'heartRate':
          permissionType = HealthKit.Constants.Permissions.HeartRate;
          break;
        default:
          // Check general authorization
          return { sharingAuthorized: this.isConnected };
      }

      const authStatus = await HealthKit.getAuthStatus(permissionType);
      return authStatus;
    } catch (error) {
      console.error('Error checking authorization status:', error);
      return { sharingAuthorized: false };
    }
  }

  // Get sleep data for a specific date range
  async getSleepData(startDate = null, endDate = null) {
    if (!this.isInitialized) {
      throw new Error('HealthKit not initialized');
    }

    if (!this.isLibraryAvailable()) {
      throw new Error('HealthKit library not available');
    }

    try {
      // Default to last 7 days if no dates provided
      const end = endDate || new Date();
      const start = startDate || new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);

      console.log('Fetching sleep data from', start, 'to', end);

      const options = {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        ascending: false,
        limit: 100,
      };

      const sleepData = await HealthKit.getSleepSamples(options);

      // Process and calculate sleep hours
      const processedData = this.processSleepData(sleepData);

      console.log('Processed sleep data:', processedData);
      return processedData;
    } catch (error) {
      console.error('Error fetching sleep data:', error);
      throw error;
    }
  }

  // Process raw sleep data from HealthKit
  processSleepData(sleepSamples) {
    if (!sleepSamples || sleepSamples.length === 0) {
      return {
        totalSleepHours: 0,
        sleepEntries: [],
        averageSleepHours: 0,
        lastNightSleep: 0,
      };
    }

    const sleepEntries = [];
    let totalSleepMinutes = 0;

    sleepSamples.forEach((sample, index) => {
      const startDate = new Date(sample.startDate);
      const endDate = new Date(sample.endDate);
      const durationMinutes = (endDate - startDate) / (1000 * 60);
      
      // Only count actual sleep (not in bed) time
      // Use fallback check when HealthKit constants are not available
      const isAsleep = this.isLibraryAvailable() 
        ? sample.value === HealthKit.Constants.SleepAnalysis.Asleep
        : sample.value === 2 || sample.value === 'asleep'; // Fallback values
      
      if (isAsleep) {
        totalSleepMinutes += durationMinutes;
        
        sleepEntries.push({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          durationMinutes: Math.round(durationMinutes),
          durationHours: parseFloat((durationMinutes / 60).toFixed(1)),
          value: sample.value,
          source: sample.sourceName || 'HealthKit',
        });
      }
    });

    // Calculate metrics
    const totalSleepHours = parseFloat((totalSleepMinutes / 60).toFixed(1));
    const averageSleepHours = sleepEntries.length > 0 
      ? parseFloat((totalSleepHours / sleepEntries.length).toFixed(1))
      : 0;

    // Get last night's sleep (most recent entry)
    const lastNightSleep = sleepEntries.length > 0 ? sleepEntries[0].durationHours : 0;

    return {
      totalSleepHours,
      sleepEntries,
      averageSleepHours,
      lastNightSleep,
      dataPoints: sleepEntries.length,
    };
  }

  // Get today's sleep data specifically
  async getTodaySleepData() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    try {
      const sleepData = await this.getSleepData(today, tomorrow);
      return sleepData;
    } catch (error) {
      console.error('Error fetching today\'s sleep data:', error);
      return {
        totalSleepHours: 0,
        sleepEntries: [],
        averageSleepHours: 0,
        lastNightSleep: 0,
      };
    }
  }

  // Get steps data for a specific date range
  async getStepsData(startDate = null, endDate = null) {
    if (!this.isInitialized) {
      throw new Error('HealthKit not initialized');
    }

    if (!this.isLibraryAvailable()) {
      return 0;
    }

    try {
      const end = endDate || new Date();
      const start = startDate || new Date(end.getTime() - 24 * 60 * 60 * 1000);

      const options = {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        ascending: false,
        limit: 1,
      };

      const stepsData = await HealthKit.getDailyStepCountSamples(options);
      
      if (stepsData && stepsData.length > 0) {
        return stepsData[0].value || 0;
      }
      
      return 0;
    } catch (error) {
      console.error('Error fetching steps data:', error);
      return 0;
    }
  }

  // Get heart rate data
  async getHeartRateData(startDate = null, endDate = null) {
    if (!this.isInitialized) {
      throw new Error('HealthKit not initialized');
    }

    if (!this.isLibraryAvailable()) {
      return 0;
    }

    try {
      const end = endDate || new Date();
      const start = startDate || new Date(end.getTime() - 24 * 60 * 60 * 1000);

      const options = {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        ascending: false,
        limit: 10,
      };

      const heartRateData = await HealthKit.getHeartRateSamples(options);
      
      if (heartRateData && heartRateData.length > 0) {
        // Return average heart rate
        const sum = heartRateData.reduce((acc, sample) => acc + sample.value, 0);
        return Math.round(sum / heartRateData.length);
      }
      
      return 0;
    } catch (error) {
      console.error('Error fetching heart rate data:', error);
      return 0;
    }
  }

  // Get recent health data summary
  async getRecentHealthData() {
    if (!this.isInitialized) {
      throw new Error('HealthKit not initialized');
    }

    try {
      const [steps, heartRate] = await Promise.all([
        this.getStepsData(),
        this.getHeartRateData(),
      ]);

      return {
        steps: steps,
        heartRate: heartRate,
      };
    } catch (error) {
      console.error('Error fetching recent health data:', error);
      throw error;
    }
  }

  // Get available data types summary
  async getAvailableDataTypes() {
    if (!this.isInitialized) {
      throw new Error('HealthKit not initialized');
    }

    return this.availableDataTypes;
  }

  // Disconnect from HealthKit
  disconnect() {
    this.isConnected = false;
    this.isInitialized = false;
    this.availableDataTypes = [];
    console.log('HealthKit disconnected');
  }
}

export default new HealthKitService();
