import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import AppHeader from '../components/AppHeader';
import { auth, db } from '../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function LabsScreen({ navigation }) {
  const [expandedSections, setExpandedSections] = useState({});
  const [completedTests, setCompletedTests] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [processingFile, setProcessingFile] = useState(false);
  const [extractedData, setExtractedData] = useState(null);

  // Firestore helpers
  const loadLabsData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const labsDocRef = doc(db, 'users', user.uid, 'health', 'labs');
      const labsSnap = await getDoc(labsDocRef);
      if (labsSnap.exists()) {
        const data = labsSnap.data();
        setCompletedTests(data.completedTests || {});
        setUploadedFiles(data.uploadedFiles || []);
      }
    } catch (err) {
      console.log('🔥 Error loading labs data', err);
    }
  };

  const saveLabsDataToFirestore = async (completed, uploads) => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const labsDocRef = doc(db, 'users', user.uid, 'health', 'labs');
      await setDoc(labsDocRef, {
        completedTests: completed,
        uploadedFiles: uploads,
      });
    } catch (err) {
      console.log('🔥 Error saving labs data', err);
    }
  };

  useEffect(() => {
    loadLabsData();
  }, []);

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const toggleTestCompletion = (labId, sectionId, testIndex) => {
    const testKey = `${labId}_${sectionId}_${testIndex}`;
    setCompletedTests(prev => {
      const updated = { ...prev, [testKey]: !prev[testKey] };
      saveLabsDataToFirestore(updated, uploadedFiles);
      return updated;
    });
  };

  const getProgressPercentage = (lab) => {
    let totalTests = 0;
    let completedTestsCount = 0;
    
    lab.sections.forEach(section => {
      section.tests.forEach((test, index) => {
        totalTests++;
        const testKey = `${lab.id}_${section.id}_${index}`;
        if (completedTests[testKey]) {
          completedTestsCount++;
        }
      });
    });
    
    return totalTests > 0 ? Math.round((completedTestsCount / totalTests) * 100) : 0;
  };

  const getOverallStats = () => {
    let totalTests = 0;
    let completedTestsCount = 0;
    let uploadedFilesCount = uploadedFiles.length;
    
    // Calculate checklist stats
    labs.forEach(lab => {
      lab.sections.forEach(section => {
        section.tests.forEach((test, index) => {
          totalTests++;
          const testKey = `${lab.id}_${section.id}_${index}`;
          if (completedTests[testKey]) {
            completedTestsCount++;
          }
        });
      });
    });
    
    return {
      totalTests,
      completedTests: completedTestsCount,
      uploadedFiles,
      completionRate: totalTests > 0 ? Math.round((completedTestsCount / totalTests) * 100) : 0,
      totalItems: completedTestsCount + uploadedFilesCount
    };
  };

  const handleUploadFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        processFile(file);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to upload file. Please try again.');
      setProcessingFile(false);
    }
  };

  const handleSnapPhoto = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required to take photos of lab results.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        processFile(file);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
      setProcessingFile(false);
    }
  };

  const processFile = async (file) => {
    setProcessingFile(true);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      // Prepare Firebase Storage path
      const storage = getStorage();
      // Sanitize filename (remove spaces and special chars) and ensure extension preserved
      const originalName = file.name || `lab_${Date.now()}`;
      const filename = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storageRef = ref(storage, `users/${user.uid}/labs/${filename}`);

      // Convert local file URI to blob in a robust way
      let blob;
      try {
        const response = await fetch(file.uri);
        blob = await response.blob();
      } catch (fetchErr) {
        console.log('⚠️ fetch to blob failed, attempting FileSystem read', fetchErr);
        const base64 = await FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.Base64 });
        blob = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
      }

      const metadata = { contentType: file.mimeType || file.type || 'application/pdf' };
      // Upload with progress feedback and capture download URL
      const downloadURL = await new Promise((resolve, reject) => {
        const task = uploadBytesResumable(storageRef, blob, metadata);
        task.on('state_changed', null, reject, async () => {
          const url = await getDownloadURL(task.snapshot.ref);
          resolve(url);
        });
      });

      // Simulate AI processing
      const mockExtractedData = {
        fileName: filename,
        fileType: file.mimeType || 'application/octet-stream',
        uploadDate: new Date().toLocaleDateString(),
        summary: generateMockSummary(filename),
        keyFindings: generateMockFindings(filename),
        recommendations: generateMockRecommendations(filename),
        downloadURL,
      };

      setUploadedFiles(prev => {
        const updated = [...prev, { ...file, uri: downloadURL, extractedData: mockExtractedData }];
        saveLabsDataToFirestore(completedTests, updated);
        return updated;
      });
      setExtractedData(mockExtractedData);
    } catch (error) {
      console.error('Upload error:', error);
      if (error && error.customData && error.customData._serverResponse) {
        console.log('Server response:', error.customData._serverResponse);
      }
      Alert.alert('Upload Failed', 'Could not upload the file. Please try again.');
    } finally {
      setProcessingFile(false);
      setShowUploadModal(true);
    }
  };


  // --------------------------------------------------
  // Helper: generate mock AI summary for uploaded lab files
  const generateMockSummary = (fileName) => {
    const summaries = [
      "Complete blood count shows normal hemoglobin and hematocrit levels. White blood cell count within normal range. Platelet count adequate.",
      "Lipid panel reveals elevated LDL cholesterol at 145 mg/dL. HDL cholesterol at 38 mg/dL. Triglycerides moderately elevated at 180 mg/dL.",
      "Comprehensive metabolic panel indicates normal kidney function. Liver enzymes slightly elevated. Blood glucose within normal limits.",
      "Thyroid function tests show TSH within normal range at 2.1 mIU/L. Free T4 and T3 levels normal. No evidence of thyroid dysfunction.",
      "Hormone panel shows LH:FSH ratio of 2:1, consistent with PCOS. Testosterone levels mildly elevated at 65 ng/dL. DHEAS normal."
    ];

    if (!fileName) return summaries[0];
    const lower = fileName.toLowerCase();
    if (lower.includes('cbc')) return summaries[0];
    if (lower.includes('lipid')) return summaries[1];
    if (lower.includes('metabolic')) return summaries[2];
    if (lower.includes('thyroid')) return summaries[3];
    if (lower.includes('hormone') || lower.includes('pcos')) return summaries[4];
    return summaries[Math.floor(Math.random() * summaries.length)];
  };

  const generateMockFindings = (fileName) => {
    const findings = [
      "All values within reference range",
      "Mild abnormalities detected, follow-up recommended",
      "Borderline values requiring monitoring",
      "Significant findings requiring medical attention",
      "Normal results with no concerns"
    ];
    
    return [
      findings[Math.floor(Math.random() * findings.length)],
      findings[Math.floor(Math.random() * findings.length)]
    ];
  };

  const generateMockRecommendations = (fileName) => {
    const recommendations = [
      "Continue current treatment plan",
      "Schedule follow-up appointment in 3 months",
      "Consider lifestyle modifications",
      "Consult with specialist for further evaluation",
      "Repeat testing in 6 months"
    ];
    
    return recommendations.slice(0, 2);
  };

  const labs = [
    {
      id: 'pcos_checklist',
      title: 'PCOS Checklist',
      description: 'Comprehensive lab tests for PCOS diagnosis and management',
      icon: 'water-outline',
      color: '#00008b',
      sections: [
        {
          id: 'metabolic',
          title: 'Metabolic Markers',
          description: 'Assess metabolic health and insulin resistance',
          tests: [
            { name: 'Lipid Profile', description: 'Measures cholesterol and triglyceride levels' },
            { name: 'Creatine Kinase', description: 'Assesses muscle health and inflammation' },
            { name: 'Uric Acid', description: 'Indicates metabolic issues and insulin resistance' },
            { name: 'HbA1c', description: 'Average blood glucose over 2-3 months' },
            { name: 'Fasting Glucose', description: 'Blood sugar levels after overnight fast' },
            { name: 'Fasting Insulin', description: 'Insulin levels for insulin resistance assessment' },
            { name: 'Vitamin D 25 OH', description: 'Vitamin D levels, often low in PCOS' },
            { name: 'Liver Profile', description: 'Assesses liver function affected by metabolic syndrome' },
            { name: 'C-Reactive Protein (CRP)', description: 'Measures inflammation in the body' }
          ]
        },
        {
          id: 'hormonal',
          title: 'Hormonal Markers',
          description: 'Assess hormonal imbalances central to PCOS',
          tests: [
            { name: 'LH (Luteinizing Hormone)', description: 'Often elevated in PCOS' },
            { name: 'FSH (Follicle-Stimulating Hormone)', description: 'Assesses ovarian function' },
            { name: 'TSH (Thyroid-Stimulating Hormone)', description: 'Assesses thyroid function affecting cycles' },
            { name: '17 OH Progesterone', description: 'Rules out congenital adrenal hyperplasia' },
            { name: 'Prolactin', description: 'Can interfere with ovulation and cycles' },
            { name: 'Total Testosterone', description: 'Often elevated in PCOS' }
          ]
        },
        {
          id: 'radiology',
          title: 'Radiology',
          description: 'Imaging studies for physical changes and health risks',
          tests: [
            { name: 'Electrocardiography (ECG)', description: 'Assesses heart function and cardiovascular issues' },
            { name: 'Liver Elastography', description: 'Fatty liver scan for liver health assessment' },
            { name: '3D Body Composition Analysis', description: 'Body fat distribution for weight management' },
            { name: 'Transvaginal Ultrasound', description: 'Visualizes ovaries and polycystic ovaries' },
            { name: 'AI-based Retinal Scan', description: 'Cardiovascular risk assessment through retinal imaging' }
          ]
        },
        {
          id: 'additional',
          title: 'Additional Tests',
          description: 'Fertility and overall health assessments',
          tests: [
            { name: 'Hysterosalpingography (HSG)', description: 'X-ray test for fallopian tube blockages' },
            { name: 'Partner Semen Analysis', description: 'Assesses sperm health and fertility' }
          ]
        }
      ]
    },
    {
      id: 'pregnancy_checklist',
      title: 'Pregnancy Checklist',
      description: 'Complete preparation guide for pregnancy readiness',
      icon: 'people-outline',
      color: '#FFD700',
      sections: [
        {
          id: 'lifestyle',
          title: 'Lifestyle Preparation',
          description: 'Essential lifestyle changes for pregnancy readiness',
          tests: [
            { name: 'Quit Smoking and Alcohol', description: 'Eliminate harmful substances for fetal development' },
            { name: 'Reduce Caffeine Intake', description: 'Limit to 200mg or less per day' },
            { name: 'Avoid Chemical Exposures', description: 'Use BPA-free containers, avoid plastics, parabens, and harsh chemicals' },
            { name: 'Establish Regular Sleep Schedule', description: '7-9 hours of quality sleep per night' },
            { name: 'Stress Management', description: 'Practice meditation, yoga, or relaxation techniques' },
            { name: 'Regular Exercise Routine', description: '30 minutes of moderate exercise most days' },
            { name: 'Maintain Healthy Weight', description: 'Achieve BMI between 18.5-24.9' }
          ]
        },
        {
          id: 'nutrition',
          title: 'Nutrition & Wellness',
          description: 'Optimal nutrition and wellness for conception preparation',
          tests: [
            { name: 'Start Prenatal Vitamins', description: 'Daily prenatal vitamins for nutritional support' },
            { name: 'Balanced Diet Plan', description: 'Include fruits, vegetables, lean proteins, whole grains' },
            { name: 'Increase Iron Intake', description: 'Prevent anemia during pregnancy' },
            { name: 'Calcium and Vitamin D', description: 'Support bone health for mother and baby' },
            { name: 'Omega-3 Fatty Acids', description: 'Support fetal brain development' },
            { name: 'Stay Hydrated', description: '8-10 glasses of water daily' },
            { name: 'Limit Processed Foods', description: 'Reduce sugar and unhealthy fats' }
          ]
        },
        {
          id: 'medical',
          title: 'Medical Preparation',
          description: 'Health assessments and wellness readiness',
          tests: [
            { name: 'Preconception Checkup', description: 'Complete physical exam with healthcare provider' },
            { name: 'PCOS Screening', description: 'Check for polycystic ovary syndrome symptoms and markers' },
            { name: 'Pap Smear', description: 'Cervical cancer screening and reproductive health check' },
            { name: 'Egg Reserve Testing', description: 'AMH or AFC test to assess ovarian reserve' },
            { name: 'Fallopian Tube Check', description: 'HSG or ultrasound to check for blockages' },
            { name: 'PID Screening', description: 'Test for pelvic inflammatory disease' },
            { name: 'Partner Health Check', description: 'Comprehensive health screening for partner' },
            { name: 'Mental Health Screening', description: 'Assess mental wellness and stress levels' },
            { name: 'Update Vaccinations', description: 'MMR, chickenpox, and flu shots' },
            { name: 'Dental Checkup', description: 'Address oral health issues before pregnancy' },
            { name: 'Genetic Counseling', description: 'Assess genetic risks if family history exists' },
            { name: 'Screen for Infections', description: 'STI testing and treatment if needed' }
          ]
        },
        {
          id: 'tracking',
          title: 'Cycle & Ovulation Tracking',
          description: 'Monitor fertility signs and optimal conception timing',
          tests: [
            { name: 'Track Menstrual Cycles', description: 'Record cycle length and regularity' },
            { name: 'Monitor Basal Body Temperature', description: 'Track temperature changes for ovulation' },
            { name: 'Use Ovulation Predictor Kits', description: 'Identify fertile window' },
            { name: 'Track Cervical Mucus Changes', description: 'Monitor fertility signs' },
            { name: 'Record Intercourse Timing', description: 'Optimize conception chances' },
            { name: 'Consider Fertility Apps', description: 'Use technology to track cycles' }
          ]
        },
        {
          id: 'financial',
          title: 'Financial & Insurance Planning',
          description: 'Prepare financially for pregnancy and childcare',
          tests: [
            { name: 'Review Health Insurance', description: 'Understand maternity coverage' },
            { name: 'Budget for Baby Expenses', description: 'Plan for prenatal care and baby costs' },
            { name: 'Maternity Leave Planning', description: 'Understand workplace policies' },
            { name: 'Research Childcare Options', description: 'Plan for post-birth care arrangements' },
            { name: 'Emergency Fund', description: 'Set aside savings for unexpected costs' }
          ]
        }
      ]
    }
  ];

  const handleLabPress = (lab) => {
    navigation.navigate('LabDetail', { lab });
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader navigation={navigation} title="Checklists" />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>Health Checklists</Text>
          <Text style={styles.headerDescription}>
            Comprehensive health checklists and assessments for your wellness journey
          </Text>
        </View>

        <View style={styles.labsSection}>
          {labs.map((lab) => {
            const progressPercentage = getProgressPercentage(lab);
            
            return (
              <View key={lab.id} style={styles.labCard}>
                <TouchableOpacity 
                  style={styles.labHeader}
                  onPress={() => toggleSection(lab.id)}
                >
                  <View style={styles.labHeaderLeft}>
                    <View style={[styles.labIcon, { backgroundColor: lab.color }]}>
                      <Ionicons name={lab.icon} size={24} color="white" />
                    </View>
                    <View style={styles.labInfo}>
                      <Text style={styles.labTitle}>{lab.title}</Text>
                      <Text style={styles.labDescription}>{lab.description}</Text>
                      <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                          <View 
                            style={[
                              styles.progressFill, 
                              { width: `${progressPercentage}%` }
                            ]} 
                          />
                        </View>
                        <Text style={styles.progressText}>{progressPercentage}% Complete</Text>
                      </View>
                    </View>
                  </View>
                  <Ionicons 
                    name={expandedSections[lab.id] ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color="#666" 
                  />
                </TouchableOpacity>

                {expandedSections[lab.id] && (
                  <View style={styles.labContent}>
                    {lab.sections.map((section) => (
                      <View key={section.id} style={styles.section}>
                        <Text style={styles.sectionTitle}>{section.title}</Text>
                        <Text style={styles.sectionDescription}>{section.description}</Text>
                        
                        <View style={styles.testsList}>
                          {section.tests.map((test, index) => {
                            const testKey = `${lab.id}_${section.id}_${index}`;
                            const isCompleted = completedTests[testKey];
                            
                            return (
                              <TouchableOpacity
                                key={index}
                                style={styles.testItem}
                                onPress={() => toggleTestCompletion(lab.id, section.id, index)}
                              >
                                <View style={styles.testCheckbox}>
                                  <Ionicons 
                                    name={isCompleted ? "checkbox" : "square-outline"} 
                                    size={20} 
                                    color={isCompleted ? "#00008b" : "#666"} 
                                  />
                                </View>
                                <View style={styles.testContent}>
                                  <Text style={[
                                    styles.testName,
                                    isCompleted && styles.completedTestName
                                  ]}>
                                    {test.name}
                                  </Text>
                                  <Text style={styles.testDescription}>{test.description}</Text>
                                </View>
                                {isCompleted && (
                                  <View style={styles.completedBadge}>
                                    <Ionicons name="checkmark-circle" size={16} color="#4caf50" />
                                  </View>
                                )}
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={24} color="#00008b" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>About Checklists</Text>
              <Text style={styles.infoDescription}>
                These health checklists help in comprehensive assessment and management of your wellness. 
                Use them to track your health progress and identify areas for improvement.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Upload Results Modal */}
      <Modal
        visible={showUploadModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowUploadModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Lab Results Analysis</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowUploadModal(false)}
            >
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {extractedData && (
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <Ionicons name="document-text" size={24} color="#00008b" />
                  <View style={styles.resultInfo}>
                    <Text style={styles.resultFileName}>{extractedData.fileName}</Text>
                    <Text style={styles.resultDate}>{extractedData.uploadDate}</Text>
                  </View>
                </View>

                <View style={styles.resultSection}>
                  <Text style={styles.resultSectionTitle}>AI Summary</Text>
                  <Text style={styles.resultText}>{extractedData.summary}</Text>
                </View>

                <View style={styles.resultSection}>
                  <Text style={styles.resultSectionTitle}>Key Findings</Text>
                  {extractedData.keyFindings.map((finding, index) => (
                    <View key={index} style={styles.findingItem}>
                      <Ionicons name="checkmark-circle" size={16} color="#4caf50" />
                      <Text style={styles.findingText}>{finding}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.resultSection}>
                  <Text style={styles.resultSectionTitle}>Recommendations</Text>
                  {extractedData.recommendations.map((recommendation, index) => (
                    <View key={index} style={styles.recommendationItem}>
                      <Ionicons name="arrow-forward" size={16} color="#00008b" />
                      <Text style={styles.recommendationText}>{recommendation}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity style={styles.shareButton}>
                  <Ionicons name="share-outline" size={20} color="white" />
                  <Text style={styles.shareButtonText}>Share Results</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
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
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  headerDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  labsSection: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  labCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  labHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  labHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  labIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  labInfo: {
    flex: 1,
  },
  labTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  labDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    marginRight: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00008b',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#00008b',
    fontWeight: '600',
    minWidth: 80,
  },
  labContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00008b',
    marginBottom: 6,
  },
  sectionDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    lineHeight: 16,
  },
  testsList: {
    paddingLeft: 8,
  },
  testItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#fafafa',
  },
  testCheckbox: {
    marginTop: 2,
    marginRight: 12,
  },
  testContent: {
    flex: 1,
  },
  testName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  completedTestName: {
    color: '#666',
    textDecorationLine: 'line-through',
  },
  testDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 14,
  },
  completedBadge: {
    marginLeft: 8,
    alignSelf: 'flex-start',
  },
  uploadCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  uploadHeader: {
    padding: 16,
  },
  uploadHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  uploadInfo: {
    flex: 1,
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  uploadDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  uploadButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#f0f4ff',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#00008b',
    borderStyle: 'dashed',
    paddingVertical: 12,
    alignItems: 'center',
  },
  uploadOptions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  uploadOptionButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingVertical: 16,
    alignItems: 'center',
  },
  uploadOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f4ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  uploadOptionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  uploadOptionSubtext: {
    fontSize: 12,
    color: '#666',
  },
  uploadContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00008b',
    marginLeft: 8,
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#f0f4ff',
    borderRadius: 8,
  },
  processingText: {
    fontSize: 14,
    color: '#00008b',
    marginLeft: 8,
    fontWeight: '500',
  },
  uploadedFilesSection: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    padding: 16,
  },
  uploadedFilesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  uploadedFileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  fileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  fileDate: {
    fontSize: 12,
    color: '#666',
  },
  viewButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#00008b',
    borderRadius: 12,
  },
  viewButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  resultCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  resultInfo: {
    marginLeft: 12,
    flex: 1,
  },
  resultFileName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  resultDate: {
    fontSize: 14,
    color: '#666',
  },
  resultSection: {
    marginBottom: 24,
  },
  resultSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00008b',
    marginBottom: 12,
  },
  resultText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  findingItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  findingText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00008b',
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 20,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  historyCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  historyHeader: {
    padding: 16,
  },
  historyHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  historyInfo: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  historyDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00008b',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  statSubtext: {
    fontSize: 12,
    color: '#666',
  },
  progressOverview: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  progressOverviewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  overallProgressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  overallProgressFill: {
    height: '100%',
    backgroundColor: '#00008b',
    borderRadius: 4,
  },
  progressOverviewText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingBottom: 50,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#f0f4ff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'flex-start',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
});
