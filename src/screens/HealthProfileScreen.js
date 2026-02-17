import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert,
  Switch,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import AppHeader from '../components/AppHeader';
import { healthProfileService } from '../services/firestore';
import { trackActivity } from '../services/activityService';
import { validateHealthProfile } from '../models/schemas';
import { auth } from '../config/firebase';

export default function HealthProfileScreen({ navigation }) {
  const [expandedSections, setExpandedSections] = useState({});
  const [formData, setFormData] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [datePickerMode, setDatePickerMode] = useState('date');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showOtherRaceInput, setShowOtherRaceInput] = useState(false);
  const [pcosPhenotypeAnalysis, setPcosPhenotypeAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [existingProfile, setExistingProfile] = useState(null);

  // Country and City data
  const countries = [
    'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia',
    'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium',
    'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei',
    'Bulgaria', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada', 'Central African Republic',
    'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus',
    'Czech Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'East Timor', 'Ecuador', 'Egypt',
    'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France',
    'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau',
    'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland',
    'Israel', 'Italy', 'Ivory Coast', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait',
    'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg',
    'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico',
    'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru',
    'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman',
    'Pakistan', 'Palau', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar',
    'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa',
    'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore',
    'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka',
    'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Togo',
    'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates',
    'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam', 'Yemen',
    'Zambia', 'Zimbabwe'
  ].sort();

  const states = {
    'United States': ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'],
    'Canada': ['Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador', 'Northwest Territories', 'Nova Scotia', 'Nunavut', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan', 'Yukon'],
    'United Kingdom': ['England', 'Scotland', 'Wales', 'Northern Ireland'],
    'Australia': ['New South Wales', 'Victoria', 'Queensland', 'Western Australia', 'South Australia', 'Tasmania', 'Australian Capital Territory', 'Northern Territory'],
    'Germany': ['Baden-Württemberg', 'Bavaria', 'Berlin', 'Brandenburg', 'Bremen', 'Hamburg', 'Hesse', 'Lower Saxony', 'Mecklenburg-Vorpommern', 'North Rhine-Westphalia', 'Rhineland-Palatinate', 'Saarland', 'Saxony', 'Saxony-Anhalt', 'Schleswig-Holstein', 'Thuringia'],
    'France': ['Auvergne-Rhône-Alpes', 'Bourgogne-Franche-Comté', 'Brittany', 'Centre-Val de Loire', 'Corsica', 'Grand Est', 'Hauts-de-France', 'Île-de-France', 'Normandy', 'Nouvelle-Aquitaine', 'Occitanie', 'Pays de la Loire', 'Provence-Alpes-Côte d\'Azur'],
    'Italy': ['Abruzzo', 'Aosta Valley', 'Apulia', 'Basilicata', 'Calabria', 'Campania', 'Emilia-Romagna', 'Friuli-Venezia Giulia', 'Lazio', 'Liguria', 'Lombardy', 'Marche', 'Molise', 'Piedmont', 'Sardinia', 'Sicily', 'Trentino-Alto Adige', 'Tuscany', 'Umbria', 'Veneto'],
    'Spain': ['Andalusia', 'Aragon', 'Asturias', 'Balearic Islands', 'Basque Country', 'Canary Islands', 'Cantabria', 'Castile and León', 'Castilla-La Mancha', 'Catalonia', 'Extremadura', 'Galicia', 'La Rioja', 'Madrid', 'Navarre', 'Valencian Community'],
    'India': ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'],
    'China': ['Anhui', 'Beijing', 'Chongqing', 'Fujian', 'Gansu', 'Guangdong', 'Guangxi', 'Guizhou', 'Hainan', 'Hebei', 'Heilongjiang', 'Henan', 'Hubei', 'Hunan', 'Jiangsu', 'Jiangxi', 'Jilin', 'Liaoning', 'Nei Mongol', 'Ningxia', 'Qinghai', 'Shaanxi', 'Shandong', 'Shanghai', 'Shanxi', 'Sichuan', 'Tianjin', 'Xinjiang', 'Xizang (Tibet)', 'Yunnan', 'Zhejiang'],
    'Japan': ['Hokkaido', 'Tohoku', 'Kanto', 'Chubu', 'Kansai', 'Chugoku', 'Shikoku', 'Kyushu', 'Okinawa'],
    'Brazil': ['Acre', 'Alagoas', 'Amapá', 'Amazonas', 'Bahia', 'Ceará', 'Distrito Federal', 'Espírito Santo', 'Goiás', 'Maranhão', 'Mato Grosso', 'Mato Grosso do Sul', 'Minas Gerais', 'Pará', 'Paraíba', 'Paraná', 'Pernambuco', 'Piauí', 'Rio de Janeiro', 'Rio Grande do Norte', 'Rio Grande do Sul', 'Rondônia', 'Roraima', 'Santa Catarina', 'São Paulo', 'Sergipe', 'Tocantins'],
    'Mexico': ['Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas', 'Chihuahua', 'Coahuila', 'Colima', 'Durango', 'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'México City', 'México State', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'],
  };

  // Load existing health profile on component mount
  useEffect(() => {
    const loadUserAndProfile = async () => {
      try {
        setIsLoading(true);
        
        // Get current user
        const user = auth.currentUser;
        if (!user) {
          Alert.alert('Error', 'Please log in to access your health profile');
          navigation.goBack();
          return;
        }
        
        setCurrentUser(user);
        
        // Log navigation to health profile using per-user activities collection
        await trackActivity('navigation', {
          screen: 'HealthProfileScreen',
          action: 'open_health_profile'
        });
        
        // Load existing health profile
        const profile = await healthProfileService.getHealthProfile(user.uid);
        if (profile) {
          setExistingProfile(profile);
          
          // Populate form with existing data
          const formData = {
            ...profile.sociodemographics,
            ...profile.coreHealth,
            ...profile.menstrualFertility,
            ...profile.pcosPhenotype?.symptoms,
            ...profile.mentalSocial
          };
          setFormData(formData);
          
          // Restore PCOS phenotype analysis if available
          if (profile.pcosPhenotype) {
            setPcosPhenotypeAnalysis(profile.pcosPhenotype);
          }
        }
        
        // Log profile view
        await trackActivity('profile_view', {
          screen: 'HealthProfileScreen',
          existingProfile: !!profile
        });
        
      } catch (error) {
        console.error('Error loading health profile:', error);
        Alert.alert('Error', 'Failed to load your health profile');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserAndProfile();
  }, [navigation]);

  const calculateAge = (birthDate) => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const handleDateSelect = (event, date) => {
    if (event.type === 'set' && date) {
      setSelectedDate(date);
      const age = calculateAge(date);
      const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      updateFormData('age', formattedDate);
      updateFormData('calculatedAge', age.toString());
    }
    setShowDatePicker(false);
  };

  const showDatePickerModal = () => {
    setShowDatePicker(true);
  };

  const hideDatePicker = () => {
    setShowDatePicker(false);
  };

  const toggleCountryDropdown = () => {
    setShowCountryDropdown(!showCountryDropdown);
    setShowCityDropdown(false);
  };

  const toggleCityDropdown = () => {
    setShowCityDropdown(!showCityDropdown);
    setShowCountryDropdown(false);
  };

  const selectCountry = (country) => {
    updateFormData('country', country);
    // Clear state when country changes
    updateFormData('state', '');
    setShowCountryDropdown(false);
  };

  const selectState = (state) => {
    updateFormData('state', state);
    setShowCityDropdown(false);
  };

  const getAvailableStates = () => {
    const selectedCountry = formData.country;
    return states[selectedCountry] || [];
  };

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCheckboxSelection = (field, option) => {
    const currentValues = formData[field] || [];
    const newValues = currentValues.includes(option)
      ? currentValues.filter(v => v !== option)
      : [...currentValues, option];
    
    updateFormData(field, newValues);
    
    // Show/hide other race input
    if (field === 'race') {
      setShowOtherRaceInput(newValues.includes('Other'));
    }
    
    // Auto-analyze PCOS phenotype when symptoms change
    if (field.startsWith('pcos_') || Object.keys(formData).some(key => key.startsWith('pcos_'))) {
      analyzePcosPhenotype();
    }
  };

  const analyzePcosPhenotype = () => {
    // PCOS Phenotype Classification based on Rotterdam Criteria
    // Phenotype A: Classic PCOS (Hyperandrogenism + Ovulatory Dysfunction + Polycystic Ovaries)
    // Phenotype B: Ovulatory Dysfunction + Polycystic Ovaries (Non-hyperandrogenic)
    // Phenotype C: Hyperandrogenism + Polycystic Ovaries (Ovulatory)
    // Phenotype D: Hyperandrogenism + Ovulatory Dysfunction (Normo-ovarian)
    
    // Get all PCOS phenotype symptoms
    const pcosSymptoms = {
      // Rotterdam Criteria Components
      hyperandrogenism: ['hirsutism_face', 'hirsutism_body', 'acne_face', 'acne_body', 'oily_skin', 'scalp_thinning', 'hair_loss_crown', 'deepening_voice', 'increased_muscle'],
      
      ovulatoryDysfunction: ['irregular_periods', 'longer_periods', 'continuous_bleeding', 'heavy_bleeding', 'spotting', 'pelvic_pain', 'dysmenorrhea', 'infertility', 'recurrent_miscarriage', 'anovulation'],
      
      polycysticOvaries: ['ovarian_cysts', 'ovarian_enlargement', 'polycystic_ovarian_morphology', 'increased_ovarian_volume', 'decreased_follicles'],
      
      // Metabolic Features (Common in PCOS)
      metabolic: ['difficulty_losing_weight', 'central_obesity', 'insulin_resistance', 'prediabetes', 'type2_diabetes', 'high_bp', 'high_cholesterol', 'high_triglycerides', 'low_hdl', 'metabolic_syndrome'],
      
      // Dermatological Manifestations
      dermatological: ['acanthosis_nigricans_neck', 'acanthosis_nigricans_armpits', 'acanthosis_nigricans_groin', 'skin_tags_neck', 'skin_tags_armpits', 'skin_tags_groin', 'stretch_marks'],
      
      // Psychological Impact
      psychological: ['depression', 'anxiety', 'mood_swings', 'panic_attacks', 'brain_fog', 'memory_issues', 'low_self_esteem'],
      
      // Sleep & Fatigue
      sleep: ['fatigue', 'excessive_daytime_sleepiness', 'sleep_apnea', 'insomnia', 'poor_sleep_quality', 'waking_unrefreshed'],
      
      // Other Systemic Symptoms
      sexual: ['low_libido', 'sexual_dysfunction', 'vaginal_dryness', 'decreased_arousal'],
      gastrointestinal: ['abdominal_bloating', 'ibs_symptoms', 'constipation', 'diarrhea', 'abdominal_cramps'],
      musculoskeletal: ['joint_pain', 'muscle_aches', 'back_pain', 'headaches'],
      endocrine: ['thyroid_issues', 'adrenal_fatigue', 'cortisol_dysregulation', 'hormonal_fluctuations'],
      cardiovascular: ['heart_palpitations', 'chest_pain', 'shortness_breath'],
      immune: ['chronic_inflammation', 'autoimmune_symptoms', 'frequent_infections', 'allergies'],
      other: ['temperature_regulation', 'excessive_sweating', 'dizziness', 'food_cravings', 'thirst', 'frequent_urination']
    };

    // Count symptoms in each category
    const categoryScores = {};
    let totalSymptoms = 0;
    
    Object.entries(pcosSymptoms).forEach(([category, symptoms]) => {
      const presentSymptoms = symptoms.filter(symptom => formData[symptom]?.includes('Present'));
      categoryScores[category] = presentSymptoms.length;
      totalSymptoms += presentSymptoms.length;
    });

    // Rotterdam Criteria Assessment (2 out of 3 required)
    const hasHyperandrogenism = categoryScores.hyperandrogenism >= 2;
    const hasOvulatoryDysfunction = categoryScores.ovulatoryDysfunction >= 2;
    const hasPolycysticOvaries = categoryScores.polycysticOvaries >= 1;
    
    const rotterdamCriteria = [hasHyperandrogenism, hasOvulatoryDysfunction, hasPolycysticOvaries].filter(Boolean).length;

    // Determine PCOS Phenotype
    let phenotype = 'No PCOS';
    let phenotypeDescription = '';
    let dominantFeatures = [];
    let secondaryFeatures = [];
    
    if (rotterdamCriteria >= 2) {
      // Phenotype A: Classic PCOS (all 3 criteria)
      if (hasHyperandrogenism && hasOvulatoryDysfunction && hasPolycysticOvaries) {
        phenotype = 'Phenotype A - Classic PCOS';
        phenotypeDescription = 'Complete PCOS presentation with all Rotterdam criteria';
        dominantFeatures.push('Clinical Hyperandrogenism', 'Ovulatory Dysfunction', 'Polycystic Ovarian Morphology');
      }
      // Phenotype B: Non-hyperandrogenic PCOS (ovulatory + ovarian)
      else if (!hasHyperandrogenism && hasOvulatoryDysfunction && hasPolycysticOvaries) {
        phenotype = 'Phenotype B - Non-hyperandrogenic PCOS';
        phenotypeDescription = 'Ovulatory dysfunction with polycystic ovaries, minimal androgen excess';
        dominantFeatures.push('Ovulatory Dysfunction', 'Polycystic Ovarian Morphology');
        secondaryFeatures.push('Mild Hyperandrogenism');
      }
      // Phenotype C: Ovulatory PCOS (hyperandrogenism + ovarian)
      else if (hasHyperandrogenism && !hasOvulatoryDysfunction && hasPolycysticOvaries) {
        phenotype = 'Phenotype C - Ovulatory PCOS';
        phenotypeDescription = 'Hyperandrogenism with polycystic ovaries, regular ovulation';
        dominantFeatures.push('Clinical Hyperandrogenism', 'Polycystic Ovarian Morphology');
        secondaryFeatures.push('Preserved Ovulation');
      }
      // Phenotype D: Normo-ovarian PCOS (hyperandrogenism + ovulatory)
      else if (hasHyperandrogenism && hasOvulatoryDysfunction && !hasPolycysticOvaries) {
        phenotype = 'Phenotype D - Normo-ovarian PCOS';
        phenotypeDescription = 'Hyperandrogenism with ovulatory dysfunction, normal ovarian appearance';
        dominantFeatures.push('Clinical Hyperandrogenism', 'Ovulatory Dysfunction');
        secondaryFeatures.push('Normal Ovarian Morphology');
      }
    } else if (rotterdamCriteria === 1) {
      phenotype = 'PCOS Risk - Incomplete Criteria';
      phenotypeDescription = 'Some PCOS features present but insufficient for diagnosis';
      if (hasHyperandrogenism) dominantFeatures.push('Hyperandrogenism Present');
      if (hasOvulatoryDysfunction) dominantFeatures.push('Ovulatory Issues Present');
      if (hasPolycysticOvaries) dominantFeatures.push('Ovarian Changes Present');
    } else {
      phenotype = 'No PCOS Criteria Met';
      phenotypeDescription = 'PCOS features not present or minimal';
    }

    // Add metabolic and psychological features
    if (categoryScores.metabolic >= 3) {
      secondaryFeatures.push('Metabolic Dysfunction');
    }
    if (categoryScores.psychological >= 2) {
      secondaryFeatures.push('Psychological Impact');
    }
    if (categoryScores.dermatological >= 2) {
      secondaryFeatures.push('Dermatological Manifestations');
    }
    if (categoryScores.sleep >= 2) {
      secondaryFeatures.push('Sleep Disturbance');
    }

    // Risk assessment
    let riskLevel = 'Low';
    if (rotterdamCriteria >= 2) {
      if (categoryScores.metabolic >= 5 || categoryScores.psychological >= 3) {
        riskLevel = 'High';
      } else if (categoryScores.metabolic >= 3 || categoryScores.psychological >= 2) {
        riskLevel = 'Moderate';
      }
    }

    const analysis = {
      phenotype,
      phenotypeDescription,
      rotterdamCriteria,
      totalSymptoms,
      categoryScores,
      dominantFeatures,
      secondaryFeatures,
      riskLevel,
      meetsRotterdamCriteria: rotterdamCriteria >= 2,
      criteriaMet: {
        hyperandrogenism: hasHyperandrogenism,
        ovulatoryDysfunction: hasOvulatoryDysfunction,
        polycysticOvaries: hasPolycysticOvaries
      }
    };

    setPcosPhenotypeAnalysis(analysis);
  };

  const handleSave = async () => {
  if (!currentUser) {
    Alert.alert('Error', 'Please log in to save your health profile');
    return;
  }

  setIsSaving(true);
  
  try {
    // Validate form data
    const validation = validateHealthProfile({ userId: currentUser.uid, ...formData });
    if (!validation.isValid) {
      Alert.alert('Validation Error', validation.errors.join('\n'));
      return;
    }

    // Organize data by sections
    const healthData = {
      sociodemographics: {
        age: formData.age,
        gender: formData.gender,
        race: formData.race,
        otherRace: formData.otherRace,
        religion: formData.religion,
        health_goal: formData.health_goal,
        support_systems: formData.support_systems
      },
      coreHealth: {
        bmi: formData.bmi,
        family_history: formData.family_history,
        prescriptions: formData.prescriptions,
        allergies: formData.allergies,
      },
      menstrualFertility: {
        cycle_length: formData.cycle_length,
        periods_count: formData.periods_count,
        flow_description: formData.flow_description,
        last_period: formData.last_period,
        trying_conceive: formData.trying_conceive,
        partner_semen: formData.partner_semen,
      },
      pcosPhenotype: Object.keys(formData).some(key => key.startsWith('pcos_')) ? {
        ...pcosPhenotypeAnalysis,
        pcos_diagnosed: formData.pcos_diagnosed,
        symptoms: Object.keys(formData)
          .filter(key => key.startsWith('pcos_') || 
            ['irregular_periods', 'longer_periods', 'continuous_bleeding', 'heavy_bleeding', 
             'spotting', 'pelvic_pain', 'dysmenorrhea', 'infertility', 'recurrent_miscarriage', 
             'anovulation', 'hirsutism_face', 'hirsutism_body', 'acne_face', 'acne_body', 
             'oily_skin', 'scalp_thinning', 'hair_loss_crown', 'deepening_voice', 'increased_muscle',
             'difficulty_losing_weight', 'central_obesity', 'insulin_resistance',
             'prediabetes', 'type2_diabetes', 'high_bp', 'high_cholesterol', 'high_triglycerides',
             'low_hdl', 'metabolic_syndrome', 'acanthosis_nigricans_neck', 'acanthosis_nigricans_armpits',
             'acanthosis_nigricans_groin', 'skin_tags_neck', 'skin_tags_armpits', 'skin_tags_groin',
             'stretch_marks', 'ovarian_cysts', 'ovarian_enlargement', 'polycystic_ovarian_morphology',
             'increased_ovarian_volume', 'decreased_follicles', 'depression', 'anxiety', 'mood_swings',
             'panic_attacks', 'brain_fog', 'memory_issues', 'low_self_esteem', 'fatigue',
             'excessive_daytime_sleepiness', 'sleep_apnea', 'insomnia', 'poor_sleep_quality',
             'waking_unrefreshed', 'low_libido', 'sexual_dysfunction', 'vaginal_dryness', 'decreased_arousal',
             'abdominal_bloating', 'ibs_symptoms', 'constipation', 'diarrhea', 'abdominal_cramps',
             'joint_pain', 'muscle_aches', 'back_pain', 'headaches', 'thyroid_issues', 'adrenal_fatigue',
             'cortisol_dysregulation', 'hormonal_fluctuations', 'heart_palpitations', 'chest_pain',
             'shortness_of_breath', 'chronic_inflammation', 'autoimmune_symptoms', 'frequent_infections',
             'allergies', 'temperature_regulation', 'excessive_sweating', 'dizziness', 'food_cravings',
             'thirst', 'frequent_urination'].includes(key))
          .reduce((acc, key) => {
            if (formData[key]) acc[key] = formData[key];
            return acc;
          }, {})
      } : null,
      metadata: {
        completedAt: new Date(),
        completionPercentage: calculateCompletionPercentage()
      }
    };

    try {
    // Save to Firestore
    console.log('🔥 Saving health data:', healthData);
    await healthProfileService.saveHealthProfile(currentUser.uid, healthData);
    console.log('✅ Health profile saved successfully');
    
    // Log profile save activity
    await trackActivity('profile_save', {
      screen: 'HealthProfileScreen',
      completionPercentage: healthData.metadata.completionPercentage,
      hasPCOSAnalysis: !!healthData.pcosPhenotype
    });

    Alert.alert(
      'Success',
      'Your health profile has been saved successfully!',
      [
        {
          text: 'OK',
          onPress: () => navigation.goBack()
        }
      ]
    );
  } catch (error) {
    console.error('Error saving health profile:', error);
    Alert.alert('Error', 'Failed to save your health profile. Please try again.');
  } finally {
    setIsSaving(false);
  }
} catch (error) {
    console.error('Unexpected error in handleSave:', error);
    Alert.alert('Error', 'Failed to save your health profile. Please try again.');
} finally {
    setIsSaving(false);
}
};

// Helper function to calculate completion percentage
const calculateCompletionPercentage = () => {
  const totalQuestions = sections.reduce((acc, section) => acc + section.questions.length, 0);
  const answeredQuestions = Object.keys(formData).length;
  const percentage = Math.round((answeredQuestions / totalQuestions) * 100);
  console.log(`🔥 Completion: ${answeredQuestions}/${totalQuestions} = ${percentage}%`);
  return percentage;
};

  const sections = [
    {
      id: 'sociodemographics',
      title: 'Sociodemographics',
      questions: [
        { id: 'age', label: 'Age (Date of Birth)', type: 'date' },
        { id: 'gender', label: 'Gender identity', type: 'radio', options: ['Female', 'Male'] },
        { id: 'race', label: 'Racial / ethnic background', type: 'checkbox', options: ['White', 'Black', 'Asian', 'African American', 'Hispanic/Latino', 'Native American', 'Other'] },
        { id: 'religion', label: 'What is your religion?', type: 'text' },
        { id: 'health_goal', label: 'Single most important health goal next 1 month', type: 'text' },
        { id: 'support_systems', label: 'Current support systems (family, friends, groups)', type: 'text' },
      ]
    },
    {
      id: 'core_health',
      title: 'Core Health History',
      questions: [
        { id: 'bmi', label: 'BMI category', type: 'radio', options: ['<18.5', '18.5-24.9', '25-29.9', '30+'] },
        { id: 'family_history', label: 'Family h/o chronic illness (Diabetes/CVD)', type: 'radio', options: ['Yes', 'No', 'Not sure'] },
        { id: 'prescriptions', label: 'Current prescription medications', type: 'text' },
        { id: 'allergies', label: 'Known allergies', type: 'text' },
      ]
    },
    {
      id: 'menstrual_fertility',
      title: 'Menstrual & Fertility',
      questions: [
        { id: 'cycle_length', label: 'Cycle length (days)', type: 'number' },
        { id: 'periods_count', label: 'Periods last 12 m (count)', type: 'number' },
        { id: 'flow_description', label: 'Flow description', type: 'radio', options: ['Light', 'Normal', 'Heavy'] },
        { id: 'last_period', label: 'Last period date', type: 'date' },
        { id: 'trying_conceive', label: 'Trying to conceive now', type: 'radio', options: ['Yes', 'No'] },
        { id: 'partner_semen', label: 'Partner semen analysis last 12 m', type: 'radio', options: ['Yes', 'No', 'NA'] },
      ]
    },
    {
      id: 'pcos_phenotype',
      title: 'PCOS Phenotype',
      questions: [
        { id: 'pcos_diagnosed', label: 'When were you officially diagnosed with PCOS?', type: 'radio', options: ['I have not been diagnosed', 'Less than 6 months ago', '6-12 months ago', '1-2 years ago', '2-5 years ago', 'More than 5 years ago'] },
        // MENSTRUAL & REPRODUCTIVE SYMPTOMS
        { id: 'irregular_periods', label: 'Irregular, infrequent, or absent menstrual periods', type: 'checkbox', options: ['Present'] },
        { id: 'longer_periods', label: 'Longer than normal menstrual periods', type: 'checkbox', options: ['Present'] },
        { id: 'continuous_bleeding', label: 'Continuous or prolonged bleeding', type: 'checkbox', options: ['Present'] },
        { id: 'heavy_bleeding', label: 'Heavy menstrual bleeding (menorrhagia)', type: 'checkbox', options: ['Present'] },
        { id: 'spotting', label: 'Irregular spotting between periods', type: 'checkbox', options: ['Present'] },
        { id: 'pelvic_pain', label: 'Chronic pelvic pain', type: 'checkbox', options: ['Present'] },
        { id: 'dysmenorrhea', label: 'Painful menstrual cramps', type: 'checkbox', options: ['Present'] },
        { id: 'infertility', label: 'Difficulty getting pregnant (infertility or subfertility)', type: 'checkbox', options: ['Present'] },
        { id: 'recurrent_miscarriage', label: 'Recurrent miscarriages', type: 'checkbox', options: ['Present'] },
        { id: 'anovulation', label: 'Lack of ovulation (anovulation)', type: 'checkbox', options: ['Present'] },
        
        // HYPERANDROGENISM SYMPTOMS
        { id: 'hirsutism_face', label: 'Excess facial hair (chin, upper lip, sideburns)', type: 'checkbox', options: ['Present'] },
        { id: 'hirsutism_body', label: 'Excess body hair (chest, abdomen, back, arms, thighs)', type: 'checkbox', options: ['Present'] },
        { id: 'acne_face', label: 'Persistent adult acne on face', type: 'checkbox', options: ['Present'] },
        { id: 'acne_body', label: 'Acne on chest, back, or shoulders', type: 'checkbox', options: ['Present'] },
        { id: 'oily_skin', label: 'Excessively oily skin', type: 'checkbox', options: ['Present'] },
        { id: 'scalp_thinning', label: 'Scalp hair thinning or male-pattern baldness', type: 'checkbox', options: ['Present'] },
        { id: 'hair_loss_crown', label: 'Hair loss at crown of head', type: 'checkbox', options: ['Present'] },
        { id: 'deepening_voice', label: 'Deepening of voice', type: 'checkbox', options: ['Present'] },
        { id: 'increased_muscle', label: 'Increased muscle mass', type: 'checkbox', options: ['Present'] },
        
        // METABOLIC SYMPTOMS
        { id: 'weight_gain', label: 'Unexplained weight gain', type: 'checkbox', options: ['Present'] },
        { id: 'difficulty_losing_weight', label: 'Difficulty losing weight despite diet/exercise', type: 'checkbox', options: ['Present'] },
        { id: 'central_obesity', label: 'Central/abdominal obesity (apple-shaped body)', type: 'checkbox', options: ['Present'] },
        { id: 'insulin_resistance', label: 'Insulin resistance', type: 'checkbox', options: ['Present'] },
        { id: 'prediabetes', label: 'Prediabetes', type: 'checkbox', options: ['Present'] },
        { id: 'type2_diabetes', label: 'Type 2 diabetes', type: 'checkbox', options: ['Present'] },
        { id: 'high_bp', label: 'High blood pressure (hypertension)', type: 'checkbox', options: ['Present'] },
        { id: 'high_cholesterol', label: 'High cholesterol or abnormal lipid levels', type: 'checkbox', options: ['Present'] },
        { id: 'high_triglycerides', label: 'High triglycerides', type: 'checkbox', options: ['Present'] },
        { id: 'low_hdl', label: 'Low HDL ("good" cholesterol)', type: 'checkbox', options: ['Present'] },
        { id: 'metabolic_syndrome', label: 'Metabolic syndrome', type: 'checkbox', options: ['Present'] },
        
        // DERMATOLOGICAL SYMPTOMS
        { id: 'acanthosis_nigricans_neck', label: 'Darkened skin folds on neck', type: 'checkbox', options: ['Present'] },
        { id: 'acanthosis_nigricans_armpits', label: 'Darkened skin folds in armpits', type: 'checkbox', options: ['Present'] },
        { id: 'acanthosis_nigricans_groin', label: 'Darkened skin folds in groin area', type: 'checkbox', options: ['Present'] },
        { id: 'skin_tags_neck', label: 'Skin tags on neck', type: 'checkbox', options: ['Present'] },
        { id: 'skin_tags_armpits', label: 'Skin tags in armpits', type: 'checkbox', options: ['Present'] },
        { id: 'skin_tags_groin', label: 'Skin tags in groin area', type: 'checkbox', options: ['Present'] },
        { id: 'stretch_marks', label: 'Stretch marks (striae)', type: 'checkbox', options: ['Present'] },
        
        // OVARIAN & GYNECOLOGICAL SYMPTOMS
        { id: 'ovarian_cysts', label: 'Multiple small cysts on ovaries (ultrasound)', type: 'checkbox', options: ['Present'] },
        { id: 'ovarian_enlargement', label: 'Enlarged ovaries', type: 'checkbox', options: ['Present'] },
        { id: 'polycystic_ovarian_morphology', label: 'Polycystic ovarian morphology on ultrasound', type: 'checkbox', options: ['Present'] },
        { id: 'increased_ovarian_volume', label: 'Increased ovarian volume', type: 'checkbox', options: ['Present'] },
        { id: 'decreased_follicles', label: 'Decreased antral follicle count', type: 'checkbox', options: ['Present'] },
        
        // PSYCHOLOGICAL & COGNITIVE SYMPTOMS
        { id: 'depression', label: 'Depression or persistent low mood', type: 'checkbox', options: ['Present'] },
        { id: 'anxiety', label: 'Anxiety or excessive worry', type: 'checkbox', options: ['Present'] },
        { id: 'mood_swings', label: 'Mood swings or irritability', type: 'checkbox', options: ['Present'] },
        { id: 'panic_attacks', label: 'Panic attacks', type: 'checkbox', options: ['Present'] },
        { id: 'brain_fog', label: 'Brain fog or difficulty concentrating', type: 'checkbox', options: ['Present'] },
        { id: 'memory_issues', label: 'Memory problems', type: 'checkbox', options: ['Present'] },
        { id: 'low_self_esteem', label: 'Low self-esteem or body image issues', type: 'checkbox', options: ['Present'] },
        
        // SLEEP & FATIGUE SYMPTOMS
        { id: 'fatigue', label: 'Chronic fatigue or low energy', type: 'checkbox', options: ['Present'] },
        { id: 'excessive_daytime_sleepiness', label: 'Excessive daytime sleepiness', type: 'checkbox', options: ['Present'] },
        { id: 'sleep_apnea', label: 'Sleep apnea or sleep-disordered breathing', type: 'checkbox', options: ['Present'] },
        { id: 'insomnia', label: 'Insomnia or difficulty falling/staying asleep', type: 'checkbox', options: ['Present'] },
        { id: 'poor_sleep_quality', label: 'Poor sleep quality', type: 'checkbox', options: ['Present'] },
        { id: 'waking_unrefreshed', label: 'Waking up feeling unrefreshed', type: 'checkbox', options: ['Present'] },
        
        // SEXUAL & REPRODUCTIVE HEALTH
        { id: 'low_libido', label: 'Low libido (reduced sex drive)', type: 'checkbox', options: ['Present'] },
        { id: 'sexual_dysfunction', label: 'Sexual dysfunction or decreased satisfaction', type: 'checkbox', options: ['Present'] },
        { id: 'vaginal_dryness', label: 'Vaginal dryness', type: 'checkbox', options: ['Present'] },
        { id: 'decreased_arousal', label: 'Decreased sexual arousal', type: 'checkbox', options: ['Present'] },
        
        // GASTROINTESTINAL SYMPTOMS
        { id: 'abdominal_bloating', label: 'Abdominal bloating or distension', type: 'checkbox', options: ['Present'] },
        { id: 'ibs_symptoms', label: 'Irritable bowel syndrome (IBS) symptoms', type: 'checkbox', options: ['Present'] },
        { id: 'constipation', label: 'Constipation', type: 'checkbox', options: ['Present'] },
        { id: 'diarrhea', label: 'Diarrhea or alternating bowel habits', type: 'checkbox', options: ['Present'] },
        { id: 'abdominal_cramps', label: 'Abdominal cramps or discomfort', type: 'checkbox', options: ['Present'] },
        
        // MUSCULOSKELETAL & PAIN SYMPTOMS
        { id: 'joint_pain', label: 'Joint pain or arthritis-like symptoms', type: 'checkbox', options: ['Present'] },
        { id: 'muscle_aches', label: 'Muscle aches and pains', type: 'checkbox', options: ['Present'] },
        { id: 'back_pain', label: 'Lower back pain', type: 'checkbox', options: ['Present'] },
        { id: 'headaches', label: 'Frequent headaches or migraines', type: 'checkbox', options: ['Present'] },
        
        // ENDOCRINE & HORMONAL SYMPTOMS
        { id: 'thyroid_issues', label: 'Thyroid problems (hypo/hyperthyroidism)', type: 'checkbox', options: ['Present'] },
        { id: 'adrenal_fatigue', label: 'Adrenal fatigue symptoms', type: 'checkbox', options: ['Present'] },
        { id: 'cortisol_dysregulation', label: 'Cortisol dysregulation', type: 'checkbox', options: ['Present'] },
        { id: 'hormonal_fluctuations', label: 'Severe hormonal fluctuations', type: 'checkbox', options: ['Present'] },
        
        // CARDIOVASCULAR SYMPTOMS
        { id: 'heart_palpitations', label: 'Heart palpitations or irregular heartbeat', type: 'checkbox', options: ['Present'] },
        { id: 'chest_pain', label: 'Chest pain or discomfort', type: 'checkbox', options: ['Present'] },
        { id: 'shortness_breath', label: 'Shortness of breath', type: 'checkbox', options: ['Present'] },
        
        // IMMUNE & INFLAMMATORY SYMPTOMS
        { id: 'chronic_inflammation', label: 'Chronic inflammation (elevated CRP)', type: 'checkbox', options: ['Present'] },
        { id: 'autoimmune_symptoms', label: 'Autoimmune disease symptoms', type: 'checkbox', options: ['Present'] },
        { id: 'frequent_infections', label: 'Frequent infections or poor immunity', type: 'checkbox', options: ['Present'] },
        { id: 'allergies', label: 'Worsening allergies or sensitivities', type: 'checkbox', options: ['Present'] },
        
        // OTHER SYSTEMIC SYMPTOMS
        { id: 'temperature_regulation', label: 'Difficulty regulating body temperature', type: 'checkbox', options: ['Present'] },
        { id: 'excessive_sweating', label: 'Excessive sweating or night sweats', type: 'checkbox', options: ['Present'] },
        { id: 'dizziness', label: 'Dizziness or lightheadedness', type: 'checkbox', options: ['Present'] },
        { id: 'food_cravings', label: 'Intense food cravings (especially carbs/sugar)', type: 'checkbox', options: ['Present'] },
        { id: 'thirst', label: 'Excessive thirst', type: 'checkbox', options: ['Present'] },
        { id: 'frequent_urination', label: 'Frequent urination', type: 'checkbox', options: ['Present'] },
      ]
    },
    {
      id: 'lab_imaging',
      title: 'Lab & Imaging Values',
      questions: [
        { id: 'hba1c', label: 'Latest HbA1c (%) if known', type: 'number' },
        { id: 'fasting_insulin', label: 'Latest Fasting Insulin (μIU/mL) if known', type: 'number' },
        { id: 'testosterone', label: 'Latest Total Testosterone (ng/dL) if known', type: 'number' },
        { id: 'lipid_profile', label: 'Latest Lipid Profile (e.g., Triglycerides) if known', type: 'number' },
        { id: 'fasting_glucose', label: 'Latest Fasting Glucose if known', type: 'number' },
        { id: 'lh', label: 'Latest LH (Luteinizing Hormone) if known', type: 'number' },
        { id: 'fsh', label: 'Latest FSH (Follicle-Stimulating Hormone) if known', type: 'number' },
        { id: 'tsh', label: 'Latest TSH (Thyroid-Stimulating Hormone) if known', type: 'number' },
        { id: 'prolactin', label: 'Latest Prolactin if known', type: 'number' },
        { id: 'us_date', label: 'Date of most recent Transvaginal US (MM/YYYY)', type: 'text' },
      ]
    },
    {
      id: 'ruled_out',
      title: 'Ruled-Out Diagnoses',
      questions: [
        { id: 'ruled_out_diagnoses', label: 'What other diagnoses have been ruled out?', type: 'checkbox', options: ['Thyroid issues', 'High prolactin', 'Other', 'None'] },
      ]
    },
    {
      id: 'mental_social',
      title: 'Mental & Social Well-Being',
      questions: [
        { id: 'mental_health_rating', label: 'Overall mental/emotional health rating', type: 'radio', options: ['Poor', 'Fair', 'Good', 'V-good', 'Excellent'] },
        { id: 'depressed_frequency', label: 'In the past two weeks, how often have you felt down, depressed, or hopeless?', type: 'radio', options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'] },
        { id: 'anxious_frequency', label: 'In the past two weeks, how often have you felt overly worried or anxious?', type: 'radio', options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'] },
        { id: 'depressed_anxious', label: 'How often do you feel depressed or anxious?', type: 'radio', options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'] },
        { id: 'social_relationships', label: 'Overall social relationships rating', type: 'radio', options: ['Poor', 'Fair', 'Good', 'V-good', 'Excellent'] },
        { id: 'supported', label: 'Feel supported by friends and family', type: 'radio', options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'] },
        { id: 'living_environment', label: 'How would you rate your overall living environment?', type: 'radio', options: ['Poor', 'Fair', 'Good', 'V-good', 'Excellent'] },
        { id: 'safe_environment', label: 'How often do you feel safe and comfortable in your living environment?', type: 'radio', options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'] },
        { id: 'daily_activities', label: 'How would you rate your ability to perform daily activities independently?', type: 'radio', options: ['Poor', 'Fair', 'Good', 'V-good', 'Excellent'] },
        { id: 'manage_tasks', label: 'How often do you feel capable of managing your daily tasks?', type: 'radio', options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'] },
        { id: 'engagement', label: 'How would you rate your overall engagement in daily life activities?', type: 'radio', options: ['Poor', 'Fair', 'Good', 'V-good', 'Excellent'] },
        { id: 'motivated', label: 'How often do you feel motivated and enthusiastic about your daily activities?', type: 'radio', options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'] },
      ]
    },
  ];

  const renderQuestion = (question) => {
    switch (question.type) {
      case 'text':
      case 'number':
        return (
          <TextInput
            style={styles.textInput}
            placeholder={question.label}
            value={formData[question.id] || ''}
            onChangeText={(value) => updateFormData(question.id, value)}
            keyboardType={question.type === 'number' ? 'numeric' : 'default'}
            multiline={true}
            numberOfLines={3}
          />
        );
      
      case 'date':
        if (question.id === 'age') {
          return (
            <View>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={showDatePickerModal}
              >
                <Text style={styles.dateText}>
                  {formData.age || 'Select your date of birth'}
                </Text>
                <Ionicons name="calendar" size={20} color="#667eea" />
              </TouchableOpacity>
              {formData.calculatedAge && (
                <Text style={styles.ageText}>
                  Age: {formData.calculatedAge} years
                </Text>
              )}
            </View>
          );
        }
        return (
          <TextInput
            style={styles.textInput}
            placeholder={question.label}
            value={formData[question.id] || ''}
            onChangeText={(value) => updateFormData(question.id, value)}
            multiline={true}
            numberOfLines={3}
          />
        );
      
      case 'dropdown':
        if (question.id === 'country') {
          return (
            <View>
              <TouchableOpacity
                style={styles.dropdownInput}
                onPress={toggleCountryDropdown}
              >
                <Text style={styles.dropdownText}>
                  {formData.country || 'Select your country'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#667eea" />
              </TouchableOpacity>
              {showCountryDropdown && (
                <View style={styles.dropdownList}>
                  <ScrollView style={styles.dropdownScrollView} showsVerticalScrollIndicator={false}>
                    {countries.map((country, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.dropdownItem}
                        onPress={() => selectCountry(country)}
                      >
                        <Text style={styles.dropdownItemText}>{country}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          );
        }
        
        return (
          <TextInput
            style={styles.textInput}
            placeholder={question.label}
            value={formData[question.id] || ''}
            onChangeText={(value) => updateFormData(question.id, value)}
            multiline={true}
            numberOfLines={3}
          />
        );
      
      case 'radio':
        return (
          <View style={styles.optionsContainer}>
            {question.options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={styles.optionButton}
                onPress={() => updateFormData(question.id, option)}
              >
                <View style={[styles.radioCircle, formData[question.id] === option && styles.radioSelected]} />
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );
      
      case 'checkbox':
        return (
          <View>
            <View style={styles.optionsContainer}>
              {question.options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.optionButton}
                  onPress={() => handleCheckboxSelection(question.id, option)}
                >
                  <View style={[styles.checkbox, formData[question.id]?.includes(option) && styles.checkboxSelected]} />
                  <Text style={styles.optionText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {question.id === 'race' && showOtherRaceInput && (
              <TextInput
                style={[styles.textInput, styles.otherInput]}
                placeholder="Please specify your racial/ethnic background"
                value={formData.otherRace || ''}
                onChangeText={(value) => updateFormData('otherRace', value)}
              />
            )}
          </View>
        );
      
      case 'scale':
        return (
          <View style={styles.scaleContainer}>
            <Text style={styles.scaleLabel}>1 - {question.max}</Text>
            <View style={styles.scaleButtons}>
              {Array.from({ length: question.max }, (_, i) => i + 1).map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[styles.scaleButton, formData[question.id] == num && styles.scaleButtonSelected]}
                  onPress={() => updateFormData(question.id, num)}
                >
                  <Text style={styles.scaleButtonText}>{num}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader navigation={navigation} title="Health Profile" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.description}>
            Complete your comprehensive health profile to help us provide personalized care and insights.
          </Text>

          {sections.map((section) => (
            <View key={section.id} style={styles.section}>
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => toggleSection(section.id)}
              >
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Ionicons
                  name={expandedSections[section.id] ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color='#00008b'
                />
              </TouchableOpacity>

              {expandedSections[section.id] && (
                <View style={styles.sectionContent}>
                  {section.questions.map((question, index) => (
                    <View key={question.id} style={styles.questionContainer}>
                      <Text style={styles.questionNumber}>{index + 1}</Text>
                      <Text style={styles.questionLabel}>{question.label}</Text>
                      {renderQuestion(question)}
                    </View>
                  ))}
                  
                  {/* PCOS Phenotype Analysis */}
                  {section.id === 'pcos_phenotype' && pcosPhenotypeAnalysis && (
                    <View style={styles.phenotypeAnalysisContainer}>
                      <View style={styles.phenotypeAnalysisHeader}>
                        <Ionicons name="analytics" size={24} color="#00008b" />
                        <Text style={styles.phenotypeAnalysisTitle}>PCOS Phenotype Analysis</Text>
                      </View>
                      
                      <View style={styles.phenotypeResult}>
                        <Text style={styles.phenotypeLabel}>Rotterdam Criteria:</Text>
                        <Text style={styles.phenotypeValue}>{pcosPhenotypeAnalysis.rotterdamCriteria}/3</Text>
                      </View>
                      
                      <View style={styles.phenotypeResult}>
                        <Text style={styles.phenotypeLabel}>PCOS Status:</Text>
                        <Text style={[styles.phenotypeValue, styles[pcosPhenotypeAnalysis.meetsRotterdamCriteria ? 'statusPositive' : 'statusNegative']]}>
                          {pcosPhenotypeAnalysis.meetsRotterdamCriteria ? 'Meets PCOS Criteria' : 'Does Not Meet PCOS Criteria'}
                        </Text>
                      </View>
                      
                      <View style={styles.phenotypeResult}>
                        <Text style={styles.phenotypeLabel}>Phenotype:</Text>
                        <Text style={styles.phenotypeValue}>{pcosPhenotypeAnalysis.phenotype}</Text>
                      </View>
                      
                      <View style={styles.phenotypeResult}>
                        <Text style={styles.phenotypeLabel}>Risk Level:</Text>
                        <Text style={[styles.phenotypeValue, styles[`risk${pcosPhenotypeAnalysis.riskLevel}`]]}>
                          {pcosPhenotypeAnalysis.riskLevel}
                        </Text>
                      </View>
                      
                      <View style={styles.phenotypeResult}>
                        <Text style={styles.phenotypeLabel}>Total Symptoms:</Text>
                        <Text style={styles.phenotypeValue}>{pcosPhenotypeAnalysis.totalSymptoms}</Text>
                      </View>
                      
                      {pcosPhenotypeAnalysis.phenotypeDescription && (
                        <View style={styles.descriptionContainer}>
                          <Text style={styles.descriptionLabel}>Description:</Text>
                          <Text style={styles.descriptionText}>{pcosPhenotypeAnalysis.phenotypeDescription}</Text>
                        </View>
                      )}
                      
                      <View style={styles.criteriaContainer}>
                        <Text style={styles.criteriaLabel}>Rotterdam Criteria Met:</Text>
                        <View style={styles.criteriaList}>
                          <View style={styles.criteriaItem}>
                            <Ionicons 
                              name={pcosPhenotypeAnalysis.criteriaMet.hyperandrogenism ? "checkmark-circle" : "ellipse-outline"} 
                              size={16} 
                              color={pcosPhenotypeAnalysis.criteriaMet.hyperandrogenism ? "#10b981" : "#9ca3af"} 
                            />
                            <Text style={[styles.criteriaText, pcosPhenotypeAnalysis.criteriaMet.hyperandrogenism && styles.criteriaMet]}>Hyperandrogenism</Text>
                          </View>
                          <View style={styles.criteriaItem}>
                            <Ionicons 
                              name={pcosPhenotypeAnalysis.criteriaMet.ovulatoryDysfunction ? "checkmark-circle" : "ellipse-outline"} 
                              size={16} 
                              color={pcosPhenotypeAnalysis.criteriaMet.ovulatoryDysfunction ? "#10b981" : "#9ca3af"} 
                            />
                            <Text style={[styles.criteriaText, pcosPhenotypeAnalysis.criteriaMet.ovulatoryDysfunction && styles.criteriaMet]}>Ovulatory Dysfunction</Text>
                          </View>
                          <View style={styles.criteriaItem}>
                            <Ionicons 
                              name={pcosPhenotypeAnalysis.criteriaMet.polycysticOvaries ? "checkmark-circle" : "ellipse-outline"} 
                              size={16} 
                              color={pcosPhenotypeAnalysis.criteriaMet.polycysticOvaries ? "#10b981" : "#9ca3af"} 
                            />
                            <Text style={[styles.criteriaText, pcosPhenotypeAnalysis.criteriaMet.polycysticOvaries && styles.criteriaMet]}>Polycystic Ovaries</Text>
                          </View>
                        </View>
                      </View>
                      
                      {pcosPhenotypeAnalysis.dominantFeatures.length > 0 && (
                        <View style={styles.featureContainer}>
                          <Text style={styles.featureLabel}>Dominant Features:</Text>
                          <View style={styles.featureList}>
                            {pcosPhenotypeAnalysis.dominantFeatures.map((feature, index) => (
                              <View key={index} style={styles.featureItem}>
                                <Ionicons name="checkmark-circle" size={16} color="#667eea" />
                                <Text style={styles.featureText}>{feature}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}
                      
                      {pcosPhenotypeAnalysis.secondaryFeatures.length > 0 && (
                        <View style={styles.featureContainer}>
                          <Text style={styles.featureLabel}>Secondary Features:</Text>
                          <View style={styles.featureList}>
                            {pcosPhenotypeAnalysis.secondaryFeatures.map((feature, index) => (
                              <View key={index} style={styles.featureItem}>
                                <Ionicons name="checkmark" size={16} color="#10b981" />
                                <Text style={styles.featureText}>{feature}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              )}
            </View>
          ))}

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Health Profile</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={hideDatePicker}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.datePickerContainer}>
            <View style={styles.datePickerHeader}>
              <TouchableOpacity onPress={hideDatePicker}>
                <Text style={styles.datePickerCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.datePickerTitle}>Select Date of Birth</Text>
              <TouchableOpacity onPress={() => handleDateSelect({ type: 'set' }, selectedDate)}>
                <Text style={styles.datePickerDone}>Done</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="spinner"
              maximumDate={new Date()}
              onChange={(event, date) => {
                if (date) {
                  setSelectedDate(date);
                }
              }}
              style={styles.datePicker}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
    lineHeight: 24,
  },
  section: {
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    marginBottom: 4,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00008b',
    flex: 1,
  },
  sectionContent: {
    padding: 10,
    paddingTop: 0,
  },
  questionContainer: {
    marginBottom: 8,
    paddingLeft: 10,
    paddingRight: 10,
  },
  questionNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#00008b',
    marginBottom: 5,
  },
  questionLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 6,
    fontWeight: '500',
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    minHeight: 44,
    textAlignVertical: 'top',
  },
  otherInput: {
    marginTop: 10,
    fontStyle: 'italic',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    width: '100%',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  radioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 8,
  },
  radioSelected: {
    backgroundColor: '#00008b',
    borderColor: '#00008b',
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 8,
  },
  checkboxSelected: {
    backgroundColor: '#00008b',
    borderColor: '#00008b',
  },
  optionText: {
    fontSize: 14,
    color: '#333',
  },
  scaleContainer: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    width: '100%',
  },
  scaleLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  scaleButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 5,
  },
  scaleButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  scaleButtonSelected: {
    backgroundColor: '#00008b',
  },
  scaleButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#00008b',
    padding: 12,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 15,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dateText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  ageText: {
    fontSize: 12,
    color: '#667eea',
    marginTop: 5,
    fontWeight: '500',
  },
  dropdownInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dropdownInputDisabled: {
    backgroundColor: '#f8f9fa',
    borderColor: '#e9ecef',
  },
  dropdownText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  dropdownTextDisabled: {
    color: '#999',
  },
  dropdownList: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginTop: 5,
    maxHeight: 200,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownScrollView: {
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  datePickerContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  datePickerCancel: {
    fontSize: 16,
    color: '#666',
  },
  datePickerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  datePickerDone: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: 'bold',
  },
  datePicker: {
    marginTop: 20,
  },
  phenotypeAnalysisContainer: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#f8f9ff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#00008b',
    borderStyle: 'dashed',
  },
  phenotypeAnalysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  phenotypeAnalysisTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00008b',
    marginLeft: 10,
  },
  phenotypeResult: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  phenotypeLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  phenotypeValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: 'bold',
  },
  severitySevere: {
    color: '#dc2626',
  },
  severityModerate: {
    color: '#f59e0b',
  },
  severityMild: {
    color: '#10b981',
  },
  severityMinimal: {
    color: '#6b7280',
  },
  featureContainer: {
    marginTop: 15,
  },
  featureLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
    marginBottom: 8,
  },
  featureList: {
    gap: 6,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  featureText: {
    fontSize: 13,
    color: '#4b5563',
    marginLeft: 8,
  },
  statusPositive: {
    color: '#10b981',
  },
  statusNegative: {
    color: '#ef4444',
  },
  riskHigh: {
    color: '#ef4444',
  },
  riskModerate: {
    color: '#f59e0b',
  },
  riskLow: {
    color: '#10b981',
  },
  descriptionContainer: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#f0f4ff',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#00008b',
  },
  descriptionLabel: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 12,
    color: '#4b5563',
    lineHeight: 16,
  },
  criteriaContainer: {
    marginTop: 15,
  },
  criteriaLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
    marginBottom: 8,
  },
  criteriaList: {
    gap: 8,
  },
  criteriaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  criteriaText: {
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 8,
  },
  criteriaMet: {
    color: '#10b981',
    fontWeight: '500',
  },
});
