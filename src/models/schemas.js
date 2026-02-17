// Data models and schemas for Balm.ai app

export const USER_SCHEMA = {
  // Basic user information
  basic: {
    uid: 'string (required)',
    email: 'string (required)',
    displayName: 'string',
    photoURL: 'string',
    provider: 'string (google/email)',
    createdAt: 'timestamp',
    updatedAt: 'timestamp',
    lastLoginAt: 'timestamp'
  },
  
  // User preferences
  preferences: {
    notifications: 'boolean',
    darkMode: 'boolean',
    language: 'string',
    timezone: 'string',
    reminderFrequency: 'string (daily/weekly/monthly)'
  },
  
  // App usage stats
  stats: {
    totalSessions: 'number',
    totalMoodEntries: 'number',
    totalChatMessages: 'number',
    totalWellnessActivities: 'number',
    streakDays: 'number',
    lastActiveDate: 'timestamp'
  }
};

export const HEALTH_PROFILE_SCHEMA = {
  // Sociodemographics
  sociodemographics: {
    age: 'string/date',
    calculatedAge: 'number',
    gender: 'string (Female/Male)',
    race: 'array',
    country: 'string',
    state: 'string',
    religion: 'string',
    language: 'string',
    employment: 'string (Employed/Unemployed/Self-employed)',
    financial: 'string (Poor/Fair/Good/V-good/Excellent)',
    insurance: 'boolean'
  },
  
  // Core health history
  coreHealth: {
    bmi: 'string',
    bp_checked: 'boolean',
    cholesterol_checked: 'boolean',
    diagnoses: 'boolean',
    family_history: 'string (Yes/No/Not sure)',
    hypertension: 'boolean',
    sleep_apnea_screened: 'boolean',
    sleep_study: 'string (Yes/No/Awaiting results)',
    prescriptions: 'string',
    supplements: 'string',
    allergies: 'string',
    height_weight: 'string',
    weight_gain: 'string',
    weight_loss_difficulty: 'string',
    sleep_duration: 'number',
    sleep_quality: 'number (1-5)',
    unrefreshed: 'boolean',
    sleep_apnea_symptoms: 'array',
    track_sleep: 'boolean',
    wearables: 'boolean',
    annual_checkups: 'boolean',
    track_blood_tests: 'boolean',
    water_intake: 'string',
    daily_steps: 'string',
    exercise_types: 'array',
    exercise_frequency: 'number',
    preferred_activity: 'string',
    sedentary_hours: 'number',
    substances: 'array',
    diet_type: 'string',
    whole_foods: 'string',
    processed_foods: 'string',
    sugar_cravings: 'number (1-5)',
    eat_out: 'number',
    trigger_foods: 'string'
  },
  
  // Menstrual & fertility
  menstrualFertility: {
    pcos_diagnosed: 'string',
    pcos_criteria: 'string',
    cycle_length: 'number',
    periods_count: 'number',
    flow_description: 'string (Light/Normal/Heavy)',
    last_period: 'date',
    ovulation_tracking: 'boolean',
    trying_conceive: 'boolean',
    partner_semen: 'string (Yes/No/NA)',
    past_pregnancies: 'string (0/1/2/3+)',
    pregnancy_complications: 'string',
    fertility_treatment: 'string',
    hsg: 'string (Yes/No/NA)'
  },
  
  // PCOS phenotype analysis
  pcosPhenotype: {
    phenotype: 'string',
    phenotypeDescription: 'string',
    rotterdamCriteria: 'number',
    totalSymptoms: 'number',
    categoryScores: 'object',
    dominantFeatures: 'array',
    secondaryFeatures: 'array',
    riskLevel: 'string (Low/Moderate/High)',
    meetsRotterdamCriteria: 'boolean',
    criteriaMet: 'object',
    symptoms: 'object' // All individual symptoms
  },
  
  // Mental & social wellbeing
  mentalSocial: {
    mental_health_rating: 'string',
    depressed_frequency: 'string',
    anxious_frequency: 'string',
    depressed_anxious: 'string',
    pcos_stress: 'number (1-5)',
    significant_stress: 'string',
    appearance_satisfaction: 'number (1-10)',
    social_avoidance: 'string',
    confidence_challenge: 'string',
    social_relationships: 'string',
    supported: 'string',
    living_environment: 'string',
    safe_environment: 'string',
    daily_activities: 'string',
    manage_tasks: 'string',
    engagement: 'string',
    motivated: 'string'
  },
  
  // Goals & preferences
  goalsPreferences: {
    health_goal: 'string',
    magic_wand: 'string',
    support_systems: 'string'
  },
  
  // Metadata
  metadata: {
    userId: 'string (required)',
    completedAt: 'timestamp',
    lastUpdated: 'timestamp',
    completionPercentage: 'number',
    sectionProgress: 'object'
  }
};

export const MOOD_ENTRY_SCHEMA = {
  userId: 'string (required)',
  mood: 'string (required)', // happy, sad, anxious, etc.
  intensity: 'number (1-10)', // Mood intensity
  triggers: 'array', // What triggered this mood
  notes: 'string', // User's own notes
  activities: 'array', // Activities done during this mood
  symptoms: 'array', // PCOS-related symptoms
  timestamp: 'timestamp (required)',
  location: 'string', // Where they are
  weather: 'string', // Weather conditions
  social_context: 'string', // Alone/with friends/family/work
  stress_level: 'number (1-10)',
  energy_level: 'number (1-10)',
  sleep_quality: 'number (1-10)', // Previous night's sleep
  medication_taken: 'boolean',
  tags: 'array' // Custom tags
};

export const CHAT_MESSAGE_SCHEMA = {
  userId: 'string (required)',
  message: 'string (required)',
  sender: 'string (user/ai)', // Who sent the message
  messageType: 'string (text/image/voice)',
  timestamp: 'timestamp (required)',
  sessionId: 'string', // Chat session identifier
  context: 'object', // Previous conversation context
  aiResponse: 'string', // AI's response if user message
  sentiment: 'string', // Message sentiment analysis
  topics: 'array', // Topics discussed
  resolved: 'boolean', // Whether the user's concern was addressed
  feedback: 'number (1-5)', // User feedback on AI response
  duration: 'number', // Time spent on this message
  attachments: 'array' // Any attachments
};

export const WELLNESS_ACTIVITY_SCHEMA = {
  userId: 'string (required)',
  activityType: 'string (required)', // meditation, exercise, nutrition, etc.
  activityName: 'string (required)',
  duration: 'number', // Minutes spent
  intensity: 'string (low/medium/high)',
  completed: 'boolean',
  difficulty: 'number (1-5)',
  enjoyment: 'number (1-5)',
  benefits: 'array', // Perceived benefits
  challenges: 'array', // Challenges faced
  notes: 'string',
  timestamp: 'timestamp (required)',
  scheduled_time: 'timestamp', // When it was planned
  reminder_sent: 'boolean',
  mood_before: 'number (1-10)',
  mood_after: 'number (1-10)',
  symptoms_before: 'array',
  symptoms_after: 'array',
  energy_before: 'number (1-10)',
  energy_after: 'number (1-10)',
  location: 'string',
  equipment: 'array',
  weather_conditions: 'string',
  companion: 'string', // Who they did it with
  calories_burned: 'number',
  heart_rate_zones: 'object',
  custom_fields: 'object' // Activity-specific fields
};

export const APP_ACTIVITY_SCHEMA = {
  userId: 'string (required)',
  activityType: 'string (required)', // login, logout, profile_update, etc.
  action: 'string (required)', // Specific action performed
  details: 'object', // Additional details about the action
  timestamp: 'timestamp (required)',
  sessionId: 'string', // App session identifier
  screen: 'string', // Which screen the action occurred on
  duration: 'number', // How long the action took
  success: 'boolean', // Whether the action was successful
  error_message: 'string', // If it failed
  device_info: 'object', // Device and app version info
  network_status: 'string', // Connection status
  location: 'string', // User's location if available
  user_agent: 'string', // For web version
  referrer: 'string', // How they got to the app
  campaign: 'string', // Marketing campaign info
  a_b_test: 'object', // A/B test information
  custom_metrics: 'object' // Any custom metrics
};

// Validation functions
export const validateUser = (userData) => {
  const errors = [];
  
  if (!userData.uid) errors.push('User ID is required');
  if (!userData.email) errors.push('Email is required');
  if (userData.email && !/\S+@\S+\.\S+/.test(userData.email)) {
    errors.push('Invalid email format');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateHealthProfile = (profileData) => {
  const errors = [];
  
  if (!profileData.userId) errors.push('User ID is required');
  
  // Validate age if provided
  if (profileData.sociodemographics?.calculatedAge) {
    const age = profileData.sociodemographics.calculatedAge;
    if (age < 13 || age > 120) {
      errors.push('Age must be between 13 and 120');
    }
  }
  
  // Validate scale values
  const validateScale = (value, min, max, fieldName) => {
    if (value !== undefined && (value < min || value > max)) {
      errors.push(`${fieldName} must be between ${min} and ${max}`);
    }
  };
  
  validateScale(profileData.mentalSocial?.pcos_stress, 1, 5, 'PCOS stress level');
  validateScale(profileData.mentalSocial?.appearance_satisfaction, 1, 10, 'Appearance satisfaction');
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateMoodEntry = (moodData) => {
  const errors = [];
  
  if (!moodData.userId) errors.push('User ID is required');
  if (!moodData.mood) errors.push('Mood is required');
  
  validateScale(moodData.intensity, 1, 10, 'Mood intensity');
  validateScale(moodData.stress_level, 1, 10, 'Stress level');
  validateScale(moodData.energy_level, 1, 10, 'Energy level');
  validateScale(moodData.sleep_quality, 1, 10, 'Sleep quality');
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Helper function to validate scale values
const validateScale = (value, min, max, fieldName) => {
  if (value !== undefined && (value < min || value > max)) {
    return `${fieldName} must be between ${min} and ${max}`;
  }
  return null;
};

export default {
  USER_SCHEMA,
  HEALTH_PROFILE_SCHEMA,
  MOOD_ENTRY_SCHEMA,
  CHAT_MESSAGE_SCHEMA,
  WELLNESS_ACTIVITY_SCHEMA,
  APP_ACTIVITY_SCHEMA,
  validateUser,
  validateHealthProfile,
  validateMoodEntry
};
