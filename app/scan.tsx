import { AccessibleButton } from '@/components/AccessibilityButton1';
import { TTSService } from '@/services/TTSServices';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { useAccessibility } from '../context/AccessibilityContext';
import { useVoice } from '../context/VoiceContext';
import { GoogleVisionService } from '../services/GoogleVisionService';

const { width, height } = Dimensions.get('window');

const ScanScreen: React.FC = () => {
  const navigation = useNavigation();
  const { startListening, stopListening } = useVoice();
  const { setCurrentScreen, isListening } = useAccessibility();
  const [scannedText, setScannedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [lastImageUri, setLastImageUri] = useState<string>('');
  
  // Animations
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  const pulseAnim = useState(new Animated.Value(1))[0];
  const scanLineAnim = useState(new Animated.Value(0))[0];
  const resultAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    setCurrentScreen('Scan');
    
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    TTSService.speak(
      'Scan screen loaded. Tap capture button to take a photo of text, or say "take photo" to use voice commands.'
    );

    // Pulse animation for scan button
    const startPulse = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    startPulse();
  }, [setCurrentScreen, fadeAnim, slideAnim, pulseAnim]);

  const animateScanLine = () => {
    scanLineAnim.setValue(0);
    Animated.loop(
      Animated.timing(scanLineAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }),
      { iterations: 3 }
    ).start();
  };

  const animateResults = () => {
    Animated.timing(resultAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const handleCapture = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        TTSService.speak('Camera permission is required to scan text. Please enable camera access in settings.');
        return;
      }

      setIsProcessing(true);
      setScannedText('');
      setConfidence(0);
      resultAnim.setValue(0);
      animateScanLine();
      
      TTSService.speak('Taking photo. Hold the device steady and ensure text is clearly visible.');

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.9,
        exif: false,
      });

      if (!result.canceled && result.assets[0]) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setLastImageUri(result.assets[0].uri);
        TTSService.speak('Image captured successfully. Processing text, please wait.');
        
        const ocrResult = await GoogleVisionService.detectText(result.assets[0].uri);
        
        setIsProcessing(false);
        
        if (ocrResult.error) {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          TTSService.speak(`Error processing image: ${ocrResult.error}. Please try taking another photo with better lighting.`);
        } else if (ocrResult.text) {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setScannedText(ocrResult.text);
          setConfidence(ocrResult.confidence);
          animateResults();
          
          const confidenceDescription = ocrResult.confidence > 80 ? 'high' : ocrResult.confidence > 60 ? 'medium' : 'low';
          TTSService.speak(`Text detected with ${confidenceDescription} confidence. The text reads: ${ocrResult.text}`);
        } else {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          TTSService.speak('No text found in the image. Please try again with better lighting, clearer text, or get closer to the document.');
        }
      } else {
        setIsProcessing(false);
        TTSService.speak('Photo cancelled. Ready to try again.');
      }
    } catch (error) {
      setIsProcessing(false);
      console.error('Camera error:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      TTSService.speak('Error accessing camera. Please check permissions and try again.');
    }
  };

  const handleReadAgain = () => {
    if (scannedText) {
      TTSService.speak(`Reading text again: ${scannedText}`);
    } else {
      TTSService.speak('No text to read. Please scan an image first.');
    }
  };

  const handleReadSlowly = () => {
    if (scannedText) {
      TTSService.speakSlowly(`Reading slowly: ${scannedText}`);
    } else {
      TTSService.speak('No text to read slowly. Please scan an image first.');
    }
  };

  const handleRetry = () => {
    if (lastImageUri) {
      setIsProcessing(true);
      setScannedText('');
      setConfidence(0);
      resultAnim.setValue(0);
      
      TTSService.speak('Reprocessing the last image...');
      
      GoogleVisionService.detectText(lastImageUri).then(ocrResult => {
        setIsProcessing(false);
        
        if (ocrResult.error) {
          TTSService.speak(`Retry failed: ${ocrResult.error}`);
        } else if (ocrResult.text) {
          setScannedText(ocrResult.text);
          setConfidence(ocrResult.confidence);
          animateResults();
          TTSService.speak(`Retry successful. Text detected: ${ocrResult.text}`);
        } else {
          TTSService.speak('Retry completed but no text was found.');
        }
      });
    } else {
      TTSService.speak('No previous image to retry. Please take a new photo.');
    }
  };

  const handleGoHome = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          {/* Header */}
          <BlurView intensity={20} tint="light" style={styles.header}>
            <Text style={styles.title}>📸 Scan Text</Text>
            <Text style={styles.subtitle}>Point camera at text to read aloud</Text>
          </BlurView>

          {/* Scan Area */}
          <View style={styles.scanArea}>
            <View style={styles.scanFrame}>
              {isProcessing && (
                <Animated.View 
                  style={[
                    styles.scanLine,
                    {
                      transform: [{
                        translateY: scanLineAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-200, 200],
                        })
                      }]
                    }
                  ]}
                />
              )}
              
              {/* Corner indicators */}
              <View style={styles.cornerTL} />
              <View style={styles.cornerTR} />
              <View style={styles.cornerBL} />
              <View style={styles.cornerBR} />
              
              {/* Processing overlay */}
              {isProcessing && (
                <BlurView intensity={80} tint="dark" style={styles.processingOverlay}>
                  <ActivityIndicator size="large" color="#4CAF50" />
                  <Text style={styles.processingText}>Analyzing Image...</Text>
                  <Text style={styles.processingSubtext}>Please wait</Text>
                </BlurView>
              )}

              {/* Instruction text when not processing */}
              {!isProcessing && !scannedText && (
                <View style={styles.instructionContainer}>
                  <Text style={styles.instructionText}>
                    📄 Position text within frame
                  </Text>
                  <Text style={styles.instructionSubtext}>
                    Ensure good lighting and clear focus
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Capture Button */}
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <AccessibleButton
              title={isProcessing ? "⏳ Processing..." : "📷 Capture Image"}
              onPress={handleCapture}
              description="Take a photo to scan and extract text for reading aloud"
              variant="gradient"
              size="large"
              disabled={isProcessing}
            />
          </Animated.View>

          {/* Results Section */}
          {scannedText && (
            <Animated.View 
              style={[
                styles.resultsSection,
                {
                  opacity: resultAnim,
                  transform: [{
                    translateY: resultAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    })
                  }]
                }
              ]}
            >
              <BlurView intensity={60} tint="dark" style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <Text style={styles.confidenceText}>
                    🎯 Confidence: {confidence}%
                  </Text>
                  <View style={[
                    styles.confidenceBadge,
                    { backgroundColor: confidence > 80 ? '#4CAF50' : confidence > 60 ? '#FF9500' : '#FF3B30' }
                  ]}>
                    <Text style={styles.confidenceBadgeText}>
                      {confidence > 80 ? 'HIGH' : confidence > 60 ? 'MEDIUM' : 'LOW'}
                    </Text>
                  </View>
                </View>
                
                <ScrollView style={styles.textContainer} showsVerticalScrollIndicator={false}>
                  <Text style={styles.scannedText}>{scannedText}</Text>
                </ScrollView>
                
                <View style={styles.actionButtons}>
                  <AccessibleButton
                    title="🔊 Read Again"
                    onPress={handleReadAgain}
                    description="Read the scanned text again at normal speed"
                    variant="success"
                    size="small"
                  />
                  
                  <AccessibleButton
                    title="🐌 Read Slowly"
                    onPress={handleReadSlowly}
                    description="Read the scanned text at a slower pace"
                    variant="warning"
                    size="small"
                  />
                </View>

                {lastImageUri && (
                  <AccessibleButton
                    title="🔄 Retry OCR"
                    onPress={handleRetry}
                    description="Process the last image again to improve text recognition"
                    variant="glass"
                    size="small"
                  />
                )}
              </BlurView>
            </Animated.View>
          )}

          {/* Empty State */}
          {!scannedText && !isProcessing && (
            <View style={styles.placeholderSection}>
              <Text style={styles.placeholderText}>
                📄 Captured text will appear here
              </Text>
              <Text style={styles.placeholderSubtext}>
                Take a photo to get started
              </Text>
            </View>
          )}

          {/* Bottom Controls */}
          <View style={styles.bottomControls}>
            <AccessibleButton
              title="🏠 Home"
              onPress={handleGoHome}
              description="Return to the main home screen"
              variant="secondary"
              size="medium"
            />
            
            <AccessibleButton
              title={isListening ? "🛑 Stop Listening" : "🎤 Voice Commands"}
              onPress={isListening ? stopListening : startListening}
              description={isListening ? "Stop voice recognition" : "Start listening for voice commands"}
              variant={isListening ? "danger" : "warning"}
              size="medium"
            />
          </View>
        </Animated.View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  header: {
    marginTop: 10,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  scanFrame: {
    width: width - 60,
    height: 220,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    borderRadius: 20,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    zIndex: 10,
  },
  cornerTL: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopColor: '#ffffff',
    borderLeftColor: '#ffffff',
    borderTopLeftRadius: 20,
  },
  cornerTR: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopColor: '#ffffff',
    borderRightColor: '#ffffff',
    borderTopRightRadius: 20,
  },
  cornerBL: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomColor: '#ffffff',
    borderLeftColor: '#ffffff',
    borderBottomLeftRadius: 20,
  },
  cornerBR: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomColor: '#ffffff',
    borderRightColor: '#ffffff',
    borderBottomRightRadius: 20,
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    overflow: 'hidden',
  },
  processingText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 15,
  },
  processingSubtext: {
    color: '#cccccc',
    fontSize: 14,
    marginTop: 5,
  },
  instructionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  instructionSubtext: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
  },
  resultsSection: {
    marginBottom: 20,
  },
  resultCard: {
    padding: 20,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  confidenceText: {
    color: '#4ecdc4',
    fontSize: 16,
    fontWeight: '600',
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  textContainer: {
    maxHeight: 120,
    marginBottom: 15,
  },
  scannedText: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  placeholderSection: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 30,
  },
  placeholderText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  placeholderSubtext: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    textAlign: 'center',
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
});

export default ScanScreen;