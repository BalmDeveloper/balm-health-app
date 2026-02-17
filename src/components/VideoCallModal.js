import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';

const { width, height } = Dimensions.get('window');

export default function VideoCallModal({ visible, onClose }) {
  // permissions & camera state
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraType, setCameraType] = useState('front');
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  // call / transcript state
  const [isConnected, setIsConnected] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [transcript, setTranscript] = useState([]);
  const [showTranscript, setShowTranscript] = useState(true);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [currentUserText, setCurrentUserText] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);

  const cameraRef = useRef(null);
  const recordingRef = useRef(null);
  const callTimerRef = useRef(null);

  useEffect(() => {
    if (visible) {
      getPermissions();
      startCall();
    } else {
      endCall();
    }
    // cleanup on unmount
    return () => {
      endCall();
      Speech.stop();
    };
  }, [visible]);

  const getPermissions = async () => {
    try {
      if (!permission?.granted) {
        const result = await requestPermission();
        if (!result.granted) {
          Alert.alert(
            'Permissions Required',
            'Camera and microphone access are required for video calls.',
            [{ text: 'OK', onPress: onClose }]
          );
          return;
        }
      }

      const { status: audioStatus } = await Audio.requestPermissionsAsync();
      if (audioStatus !== 'granted') {
        Alert.alert(
          'Microphone Permission Required',
          'Microphone access is required for video calls.',
          [{ text: 'OK', onPress: onClose }]
        );
      }
    } catch (error) {
      console.error('Permission error:', error);
    }
  };

  const startCall = () => {
    setIsConnected(true);
    setCallDuration(0);

    // Start call timer
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
    }
    callTimerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    // Simulate AI connection + welcome message
    setTimeout(() => {
      const initialMessage = "Hello! I can see and hear you clearly. How are you feeling today?";
      setAiResponse(initialMessage);
      addToTranscript('AI', initialMessage);
      speakAiMessage(initialMessage);
    }, 1500);
  };

  const endCall = () => {
    setIsConnected(false);
    setCallDuration(0);
    setAiResponse('');
    setIsAiSpeaking(false);
    setTranscript([]);
    setIsUserSpeaking(false);
    setCurrentUserText('');
    Speech.stop();

    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }

    if (recordingRef.current && typeof recordingRef.current.stopAndUnloadAsync === 'function') {
      try {
        recordingRef.current.stopAndUnloadAsync();
      } catch (e) {
        // ignore
      }
    }
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  const toggleVideo = () => {
    setIsVideoEnabled(prev => !prev);
  };

  const flipCamera = () => {
    setCameraType(prev => (prev === 'back' ? 'front' : 'back'));
  };

  const addToTranscript = (speaker, text, timestamp = new Date()) => {
    const newEntry = {
      id: Date.now() + Math.random(),
      speaker,
      text,
      timestamp,
    };
    setTranscript(prev => [...prev, newEntry]);
  };

  const speakAiMessage = (text) => {
    setIsAiSpeaking(true);
    try {
      Speech.stop();
    } catch (error) {
      // ignore
    }

    Speech.speak(text, {
      language: 'en-US',
      rate: 0.94,
      pitch: 1.02,
      onDone: () => setIsAiSpeaking(false),
      onStopped: () => setIsAiSpeaking(false),
      onError: () => setIsAiSpeaking(false),
    });
  };

  const simulateUserSpeech = () => {
    const userPhrases = [
      "I've been feeling a bit anxious lately",
      "Work has been really stressful",
      "I'm having trouble sleeping",
      "I feel overwhelmed sometimes",
      "Thank you for listening",
      "That's really helpful advice",
      "I want to feel more balanced",
      "How can I manage my stress better?"
    ];

    const randomPhrase = userPhrases[Math.floor(Math.random() * userPhrases.length)];

    setIsUserSpeaking(true);
    setCurrentUserText('');

    // Simulate real-time speech recognition with character-by-character typing
    let currentIndex = 0;
    const chars = randomPhrase.split('');

    const typingInterval = setInterval(() => {
      if (currentIndex < chars.length) {
        const partialText = chars.slice(0, currentIndex + 1).join('');
        setCurrentUserText(partialText);
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        setTimeout(() => {
          setIsUserSpeaking(false);
          addToTranscript('You', randomPhrase);
          setCurrentUserText('');
        }, 500);
      }
    }, 50); // Adjust speed: lower = faster typing
  };

  const handleUserSpeech = () => {
    Speech.stop();
    setIsAiSpeaking(false);
    simulateUserSpeech();

    const responses = [
      "I understand. Can you tell me more about that?",
      "That's interesting. How does that make you feel?",
      "I'm here to listen. What would help you feel better?",
      "Thank you for sharing. Let's explore that together.",
      "I can see from your expression that this is important to you.",
      "It sounds like you're going through a challenging time.",
      "Your feelings are completely valid. Let's work through this together."
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    setTimeout(() => {
      setAiResponse(randomResponse);
      addToTranscript('AI', randomResponse);
      speakAiMessage(randomResponse);
    }, 3000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!permission) {
    return null;
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-off" size={80} color="#ccc" />
          <Text style={styles.permissionText}>
            Camera and microphone permissions are required for video calls.
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" statusBarHidden>
      <View style={styles.container}>
        {/* Video Area */}
        <View style={styles.videoContainer}>
          {isVideoEnabled ? (
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing={cameraType}
            />
          ) : (
            <View style={styles.videoDisabled}>
              <Ionicons name="videocam-off" size={60} color="white" />
              <Text style={styles.videoDisabledText}>Video Off</Text>
            </View>
          )}

          {/* Call Info Overlay */}
          <View style={styles.callInfoOverlay}>
            <View style={styles.callStatus}>
              <View style={styles.connectionIndicator}>
                <View style={[styles.connectionDot, isConnected && styles.connected]} />
                <Text style={styles.connectionText}>
                  {isConnected ? 'Connected' : 'Connecting...'}
                </Text>
              </View>
              <Text style={styles.callTimer}>{formatTime(callDuration)}</Text>
            </View>

            {/* AI welcome bubble if present */}
            {aiResponse ? (
              <View style={styles.aiResponseBubble}>
                <Text style={styles.aiResponseText}>{aiResponse}</Text>
              </View>
            ) : null}
          </View>

          {/* Real-time Transcript Overlay */}
          {showTranscript && (
            <View style={styles.transcriptOverlay}>
              <View style={styles.transcriptHeader}>
                <Text style={styles.transcriptTitle}>Live Transcript</Text>
                <TouchableOpacity
                  style={styles.transcriptToggle}
                  onPress={() => setShowTranscript(false)}
                >
                  <Ionicons name="close" size={16} color="white" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.transcriptContent}
                showsVerticalScrollIndicator={false}
              >
                {transcript.map((entry) => (
                  <View key={entry.id} style={styles.transcriptEntry}>
                    <Text style={[
                      styles.transcriptSpeaker,
                      entry.speaker === 'AI' ? styles.aiSpeaker : styles.userSpeaker
                    ]}>
                      {entry.speaker}:
                    </Text>
                    <Text style={styles.transcriptText}>{entry.text}</Text>
                  </View>
                ))}

                {/* Real-time user speech with typing effect */}
                {isUserSpeaking && currentUserText && (
                  <View style={styles.transcriptEntry}>
                    <Text style={[styles.transcriptSpeaker, styles.userSpeaker]}>You:</Text>
                    <View style={styles.typingContainer}>
                      <Text style={[styles.transcriptText, styles.liveText]}>
                        {currentUserText}
                      </Text>
                      <View style={styles.typingCursor} />
                    </View>
                  </View>
                )}

                {/* AI speaking indicator */}
                {isAiSpeaking && (
                  <View style={styles.transcriptEntry}>
                    <Text style={[styles.transcriptSpeaker, styles.aiSpeaker]}>AI:</Text>
                    <View style={styles.aiTypingIndicator}>
                      <ActivityIndicator size="small" color="#4169e1" />
                      <Text style={styles.aiTypingText}>Speaking...</Text>
                    </View>
                  </View>
                )}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Controls */}
        <View style={styles.controlsContainer}>
          <LinearGradient
            colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.6)']}
            style={styles.controlsGradient}
          >
            <View style={styles.controls}>
              {/* Mute Button */}
              <TouchableOpacity
                style={[styles.controlButton, isMuted && styles.controlButtonActive]}
                onPress={toggleMute}
              >
                <Ionicons
                  name={isMuted ? 'mic-off' : 'mic'}
                  size={24}
                  color="white"
                />
              </TouchableOpacity>

              {/* Video Toggle */}
              <TouchableOpacity
                style={[styles.controlButton, !isVideoEnabled && styles.controlButtonActive]}
                onPress={toggleVideo}
              >
                <Ionicons
                  name={isVideoEnabled ? 'videocam' : 'videocam-off'}
                  size={24}
                  color="white"
                />
              </TouchableOpacity>

              {/* Flip Camera */}
              <TouchableOpacity
                style={styles.controlButton}
                onPress={flipCamera}
              >
                <Ionicons name="camera-reverse" size={24} color="white" />
              </TouchableOpacity>

              {/* Transcript Toggle */}
              <TouchableOpacity
                style={[styles.controlButton, showTranscript && styles.controlButtonActive]}
                onPress={() => setShowTranscript(!showTranscript)}
              >
                <Ionicons
                  name="document-text"
                  size={24}
                  color="white"
                />
              </TouchableOpacity>

              {/* Speak Button */}
              <TouchableOpacity
                style={[styles.controlButton, styles.speakButton, isUserSpeaking && styles.controlButtonActive]}
                onPress={handleUserSpeech}
                disabled={isUserSpeaking || isAiSpeaking}
              >
                <Ionicons
                  name={isUserSpeaking ? 'radio-button-on' : 'chatbubble'}
                  size={24}
                  color="white"
                />
              </TouchableOpacity>

              {/* End Call */}
              <TouchableOpacity
                style={[styles.controlButton, styles.endCallButton]}
                onPress={onClose}
              >
                <Ionicons name="call" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  permissionText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
  },
  closeButton: {
    backgroundColor: '#00008b',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  videoDisabled: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333',
  },
  videoDisabledText: {
    color: 'white',
    fontSize: 16,
    marginTop: 10,
  },
  callInfoOverlay: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
  },
  callStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  connectionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff4757',
    marginRight: 8,
  },
  connected: {
    backgroundColor: '#2ed573',
  },
  connectionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  callTimer: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  aiResponseBubble: {
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 15,
    borderRadius: 20,
    borderBottomLeftRadius: 5,
  },
  aiResponseText: {
    color: '#000',
    fontSize: 16,
    lineHeight: 22,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  controlsGradient: {
    flex: 1,
    justifyContent: 'center',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonActive: {
    backgroundColor: '#ff4757',
  },
  speakButton: {
    backgroundColor: '#00008b',
  },
  endCallButton: {
    backgroundColor: '#ff4757',
    transform: [{ rotate: '135deg' }],
  },
  transcriptOverlay: {
    position: 'absolute',
    top: 80,
    right: 20,
    width: width * 0.4,
    maxHeight: height * 0.5,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderRadius: 15,
    overflow: 'hidden',
  },
  transcriptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(0,0,139,0.8)',
  },
  transcriptTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  transcriptToggle: {
    padding: 4,
  },
  transcriptContent: {
    maxHeight: height * 0.4,
    padding: 12,
  },
  transcriptEntry: {
    marginBottom: 8,
  },
  transcriptSpeaker: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  aiSpeaker: {
    color: '#4169e1',
  },
  userSpeaker: {
    color: '#2ed573',
  },
  transcriptText: {
    color: 'white',
    fontSize: 12,
    lineHeight: 16,
  },
  liveText: {
    color: '#ffd700',
  },
  cursor: {
    opacity: 0.7,
  },
  aiTypingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiTypingText: {
    color: '#4169e1',
    fontSize: 12,
    marginLeft: 8,
    fontStyle: 'italic',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  typingCursor: {
    width: 2,
    height: 16,
    backgroundColor: '#2ed573',
    marginLeft: 4,
    opacity: 0.8,
  },
});
