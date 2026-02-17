 import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Dimensions,
  Modal,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import AppHeader from '../components/AppHeader';
import { featuredResources } from '../data/videosData';
import { getCommunityMemberCount, getTodayPostsCount } from '../services/usernameService';

const getScreenDimensions = () => {
  try {
    return Dimensions.get('window');
  } catch (error) {
    return { width: 375, height: 812 }; // Default iPhone dimensions
  }
};

const { width } = getScreenDimensions();

export default function ResourcesScreen({ navigation }) {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [communityStats, setCommunityStats] = useState({
    members: 0,
    todayPosts: 0
  });

  // Load community stats on component mount and set up real-time updates
  useEffect(() => {
    loadCommunityStats();
    
    // Set up real-time updates every 10 seconds
    const interval = setInterval(() => {
      loadCommunityStats();
    }, 10000); // 10 seconds for better real-time updates
    
    // Refresh when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      loadCommunityStats();
    });
    
    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [navigation]);

  const loadCommunityStats = async () => {
    try {
      const [membersCount, todayPostsCount] = await Promise.all([
        getCommunityMemberCount(),
        getTodayPostsCount()
      ]);
      
      console.log(`📚 ResourcesScreen - Updating community stats: ${membersCount} members, ${todayPostsCount} today posts`);
      setCommunityStats({
        members: membersCount,
        todayPosts: todayPostsCount
      });
    } catch (error) {
      console.log('Failed to load community stats, using defaults');
      setCommunityStats({
        members: 0,
        todayPosts: 0
      });
    }
  };

  const openVideo = (resource) => {
    if (resource.videoId) {
      setSelectedVideo(resource);
      setVideoModalVisible(true);
    }
  };

  const parseMarkdown = (text) => {
  if (!text) return [];
  
  const lines = text.split('\n');
  const elements = [];
  
  lines.forEach((line, index) => {
    if (line.startsWith('# ')) {
      // H1 Heading
      elements.push({
        type: 'h1',
        content: parseInlineFormatting(line.substring(2)),
        key: `h1-${index}`,
      });
    } else if (line.startsWith('## ')) {
      // H2 Heading
      elements.push({
        type: 'h2',
        content: parseInlineFormatting(line.substring(3)),
        key: `h2-${index}`,
      });
    } else if (line.startsWith('### ')) {
      // H3 Heading
      elements.push({
        type: 'h3',
        content: parseInlineFormatting(line.substring(4)),
        key: `h3-${index}`,
      });
    } else if (line.startsWith('> ')) {
      // Blockquote
      elements.push({
        type: 'blockquote',
        content: parseInlineFormatting(line.substring(2)),
        key: `blockquote-${index}`,
      });
    } else if (line.startsWith('- ')) {
      // Bullet point
      elements.push({
        type: 'bullet',
        content: parseInlineFormatting(line.substring(2)),
        key: `bullet-${index}`,
      });
    } else if (line.trim() === '') {
      // Empty line
      elements.push({
        type: 'space',
        key: `space-${index}`,
      });
    } else if (line.trim()) {
      // Regular paragraph
      elements.push({
        type: 'paragraph',
        content: parseInlineFormatting(line.trim()),
        key: `paragraph-${index}`,
      });
    }
  });
  
  return elements;
};

const parseInlineFormatting = (text) => {
  const parts = [];
  let currentText = '';
  let i = 0;
  
  while (i < text.length) {
    if (text.substring(i, i + 2) === '**') {
      // Bold text
      if (currentText) {
        parts.push({ type: 'text', content: currentText });
        currentText = '';
      }
      i += 2;
      let boldText = '';
      while (i < text.length && text.substring(i, i + 2) !== '**') {
        boldText += text[i];
        i++;
      }
      if (boldText) {
        parts.push({ type: 'bold', content: boldText });
      }
      i += 2; // Skip closing **
    } else if (text[i] === '*' && (i === 0 || text[i-1] !== '*')) {
      // Italic text (not part of **)
      if (currentText) {
        parts.push({ type: 'text', content: currentText });
        currentText = '';
      }
      i += 1;
      let italicText = '';
      while (i < text.length && text[i] !== '*' && (i === 0 || text[i-1] !== '*' || text[i+1] !== '*')) {
        italicText += text[i];
        i++;
      }
      if (italicText) {
        parts.push({ type: 'italic', content: italicText });
      }
      i += 1; // Skip closing *
    } else {
      currentText += text[i];
      i++;
    }
  }
  
  if (currentText) {
    parts.push({ type: 'text', content: currentText });
  }
  
  return parts;
};

const renderInlineContent = (parts) => {
  if (!parts || !Array.isArray(parts)) return parts;
  
  return parts.map((part, index) => {
    switch (part.type) {
      case 'bold':
        return (
          <Text key={index} style={styles.inlineBold}>
            {part.content}
          </Text>
        );
      case 'italic':
        return (
          <Text key={index} style={styles.inlineItalic}>
            {part.content}
          </Text>
        );
      case 'text':
      default:
        return part.content;
    }
  });
};

  const openYouTubeChannel = () => {
    Linking.openURL('https://www.youtube.com/@balmdotai');
  };
  const resourceCategories = [
    {
      id: 1,
      title: 'Metabolic Health',
      description: 'Nutrition, insulin resistance, and metabolism',
      color: '#E8F4F8',
      count: 1
    },
    {
      id: 2,
      title: 'Women\'s Health',
      description: 'Menstrual health, period care, and wellness',
      color: '#FFF8E7',
      count: 2
    },
    {
      id: 3,
      title: 'PCOS Care',
      description: 'Fertility, hormonal balance, and PCOS management',
      color: '#F5F5F5',
      count: 2
    },
    {
      id: 4,
      title: 'Mental Wellness',
      description: 'Managing stress, anxiety, and emotional wellness',
      color: '#F0F8FF',
      count: 1
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader navigation={navigation} title="Resources" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Community Section */}
        <View style={styles.communitySection}>
          <TouchableOpacity 
            style={styles.communityCard}
            onPress={() => navigation.navigate('Community')}
          >
            <View style={styles.communityHeader}>
              <View style={styles.communityIcon}>
                <Ionicons name="people-outline" size={24} color="#00008b" />
              </View>
              <View style={styles.communityContent}>
                <Text style={styles.communityTitle}>Community</Text>
                <Text style={styles.communitySubtitle}>Ask any questions and learn from others</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </View>
            <View style={styles.communityPreview}>
              <View style={styles.communityStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{communityStats.members}</Text>
                  <Text style={styles.statLabel}>Members</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{communityStats.todayPosts}</Text>
                  <Text style={styles.statLabel}>Daily Posts</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>24/7</Text>
                  <Text style={styles.statLabel}>Support</Text>
                </View>
              </View>
              <View style={styles.communityCategories}>
                <View style={[styles.communityCategory, { backgroundColor: '#e8f5e8' }]}>
                  <Text style={styles.categoryText}>PCOS</Text>
                </View>
                <View style={[styles.communityCategory, { backgroundColor: '#fff8e7' }]}>
                  <Text style={styles.categoryText}>TTC</Text>
                </View>
                <View style={[styles.communityCategory, { backgroundColor: '#f0f8ff' }]}>
                  <Text style={styles.categoryText}>Women's Health</Text>
                </View>
                <View style={[styles.communityCategory, { backgroundColor: '#f5f5f5' }]}>
                  <Text style={styles.categoryText}>+2</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Featured Resources */}
        <View style={styles.featuredSection}>
          <Text style={styles.sectionTitle}>Featured</Text>
          {featuredResources.map((resource) => (
            <TouchableOpacity 
              key={resource.id} 
              style={styles.featuredCard}
              onPress={() => openVideo(resource)}
            >
              <Image
                source={typeof resource.thumbnail === 'string' 
                  ? { uri: resource.thumbnail } 
                  : resource.thumbnail
                }
                style={styles.featuredThumbnail}
                resizeMode="contain"
              />
              <View style={styles.featuredContent}>
                <Text style={styles.featuredType}>{resource.type}</Text>
                <Text style={styles.featuredTitle}>{resource.title}</Text>
                <Text style={styles.featuredSpeaker}>{resource.speaker}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* YouTube Channel Link */}
        <View style={styles.channelSection}>
          <TouchableOpacity style={styles.channelCard} onPress={openYouTubeChannel}>
            <View style={styles.channelIcon}>
              <Ionicons name="logo-youtube" size={32} color="#ff0000" />
            </View>
            <View style={styles.channelContent}>
              <Text style={styles.channelTitle}>Visit our YouTube Channel</Text>
              <Text style={styles.channelSubtitle}>@balmdotai</Text>
              <Text style={styles.channelDescription}>
                Discover more wellness content, guided meditations, and spiritual growth resources
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Video Modal */}
      <Modal
        visible={videoModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setVideoModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setVideoModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {selectedVideo?.title}
            </Text>
            <View style={styles.modalSpacer} />
          </View>
          
          {selectedVideo && (
            <WebView
              source={{
                uri: `https://www.youtube.com/watch?v=${selectedVideo.videoId}`
              }}
              style={styles.webView}
              allowsFullscreenVideo={true}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              mediaPlaybackRequiresUserAction={false}
              allowsInlineMediaPlayback={true}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#6c5ce7" />
                  <Text style={styles.loadingText}>Loading video...</Text>
                </View>
              )}
              onError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.warn('WebView error: ', nativeEvent);
                // Fallback to opening in external browser
                Linking.openURL(selectedVideo.url);
              }}
            />
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
  categoriesSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 20,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: (width - 60) / 2,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
  },
  categoryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 8,
  },
  categoryDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 16,
  },
  categoryCount: {
    fontSize: 12,
    color: '#00008b',
    fontWeight: '500',
  },
  featuredSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  featuredCard: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
    minHeight: 100,
  },
  featuredThumbnail: {
    width: 140,
    height: 100,
    resizeMode: 'contain',
  },
  featuredContent: {
    flex: 1,
    padding: 15,
  },
  featuredType: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  featuredTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
    lineHeight: 18,
    flexWrap: 'wrap',
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredSpeaker: {
    fontSize: 12,
    color: '#00008b',
    marginTop: 4,
    fontWeight: '500',
  },
  channelDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  channelSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  channelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
  },
  channelIcon: {
    marginRight: 15,
  },
  channelContent: {
    flex: 1,
  },
  channelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  channelSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  channelDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  communitySection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  communityCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
  },
  communityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  communityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f4ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  communityContent: {
    flex: 1,
  },
  communityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  communitySubtitle: {
    fontSize: 14,
    color: '#666',
  },
  communityPreview: {
    gap: 16,
  },
  communityStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00008b',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  communityCategories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  communityCategory: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
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
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  modalSpacer: {
    width: 40,
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 14,
  },
  // Markdown styles
  h1: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
    marginTop: 8,
  },
  h2: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
    marginTop: 8,
  },
  h3: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
    marginTop: 8,
  },
  bold: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
    lineHeight: 24,
  },
  italic: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#2c3e50',
    marginBottom: 8,
    lineHeight: 24,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 10,
  },
  bullet: {
    fontSize: 16,
    color: '#2c3e50',
    marginRight: 8,
    fontWeight: 'bold',
  },
  bulletText: {
    fontSize: 16,
    color: '#2c3e50',
    flex: 1,
    lineHeight: 24,
  },
  space: {
    height: 10,
  },
  paragraph: {
    fontSize: 16,
    color: '#2c3e50',
    marginBottom: 12,
    lineHeight: 24,
  },
  // Blockquote styles
  blockquote: {
    backgroundColor: '#f8f9fa',
    borderLeftWidth: 4,
    borderLeftColor: '#00008b',
    padding: 16,
    marginVertical: 12,
    borderRadius: 4,
  },
  blockquoteText: {
    fontSize: 16,
    color: '#2c3e50',
    fontStyle: 'italic',
    lineHeight: 24,
  },
  // Inline formatting styles
  inlineBold: {
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  inlineItalic: {
    fontStyle: 'italic',
    color: '#2c3e50',
  },
});
