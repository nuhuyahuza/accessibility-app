import { AccessibleButton } from '@/components/AccessibilityButton1';
import { TextReviewModal } from '../components/TextReviewModal';
import { MD } from '../constants/MaterialDesign';
import { GoogleVisionService } from '../services/GoogleVisionService';
import { SettingsService } from '../services/SettingsService';
import { TTSService } from '../services/TTSServices';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system/legacy';
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
	StatusBar,
	StyleSheet,
	Text,
	TouchableOpacity,
	View
} from 'react-native';
import { useAccessibility } from '../context/AccessibilityContext';
import { useVoice } from '../context/VoiceContext';

const { width, height } = Dimensions.get('window');

const ScanScreen: React.FC = () => {
  const navigation = useNavigation();
  const { startListening, stopListening } = useVoice();
  const { setCurrentScreen, isListening } = useAccessibility();
  const [scannedText, setScannedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [lastImageUri, setLastImageUri] = useState<string>('');
  const [showTextModal, setShowTextModal] = useState(false);
  const [appSettings, setAppSettings] = useState({
    autoSave: true,
    hapticFeedback: true,
    scanQuality: 'high' as 'low' | 'medium' | 'high',
  });
  
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  const pulseAnim = useState(new Animated.Value(1))[0];
  const scanLineAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    setCurrentScreen('Scan');
    
    // Load settings
    const loadSettings = async () => {
      const settings = await SettingsService.getSettings();
      setAppSettings({
        autoSave: settings.autoSave,
        hapticFeedback: settings.hapticFeedback,
        scanQuality: settings.scanQuality,
      });
      console.log('Scan screen settings loaded:', settings);
    };
    
    loadSettings();
    
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

    const announceScreen = async () => {
      await new Promise(resolve => setTimeout(resolve, 800));
      TTSService.speak(
        'Document scanner ready. Tap the capture button to scan text, or say Hey Assistant then Scan Document. The app will read the text aloud automatically.'
      );
    };
    
    announceScreen();

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
  }, []);

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

  const handleVoiceCommand = (command: string) => {
    const lowerCommand = command.toLowerCase();
    
    if (lowerCommand.includes('scan') || lowerCommand.includes('capture') || lowerCommand.includes('take photo')) {
      handleCapture();
    } else if (lowerCommand.includes('gallery') || lowerCommand.includes('select photo')) {
      handleGalleryPick();
    } else if (lowerCommand.includes('close') || lowerCommand.includes('back')) {
      navigation.goBack();
    }
  };

  const handleGalleryPick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setIsProcessing(true);
        await processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Gallery error:', error);
      TTSService.speak('Failed to open gallery');
    }
  };

  const processImage = async (imageUri: string) => {
    setLastImageUri(imageUri);
    TTSService.speak('Processing image. Please wait.');
    animateScanLine();
    
    const ocrResult = await GoogleVisionService.detectText(imageUri);
    
    setIsProcessing(false);
    
    if (ocrResult.error) {
      if (appSettings.hapticFeedback) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      TTSService.speak(`Error: ${ocrResult.error}`);
    } else if (ocrResult.text) {
      if (appSettings.hapticFeedback) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      setScannedText(ocrResult.text);
      setConfidence(ocrResult.confidence);
      
      // Auto-save if enabled
      if (appSettings.autoSave) {
        console.log('Auto-save enabled, saving document...');
        await autoSaveDocument(ocrResult.text);
      }
      
      setShowTextModal(true);
    } else {
      if (appSettings.hapticFeedback) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      TTSService.speak('No text found in image. Try again with better lighting.');
    }
  };

  const autoSaveDocument = async (text: string) => {
    try {
      const savedTexts = await FileSystem.readAsStringAsync(
        FileSystem.documentDirectory + 'saved_texts.json'
      ).catch(() => '[]');

      const texts = JSON.parse(savedTexts);
      const timestamp = Date.now();
      const title = `Document ${new Date(timestamp).toLocaleDateString()}`;

      const newText = {
        id: timestamp.toString(),
        text,
        timestamp,
        title,
      };

      texts.push(newText);

      await FileSystem.writeAsStringAsync(
        FileSystem.documentDirectory + 'saved_texts.json',
        JSON.stringify(texts)
      );

      console.log('Document auto-saved:', title);
      TTSService.speak('Document automatically saved to library');
    } catch (error) {
      console.error('Auto-save error:', error);
    }
  };

  const handleCapture = async () => {
    try {
      if (appSettings.hapticFeedback) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        TTSService.speak('Camera permission is required to scan text. Please enable camera access in settings.');
        return;
      }

      setIsProcessing(true);
      setScannedText('');
      setConfidence(0);
      animateScanLine();
      
      TTSService.speak('Taking photo. Hold the device steady and ensure text is clearly visible.');

      const qualityValue = SettingsService.getQualityValue(appSettings.scanQuality);
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: qualityValue,
        exif: false,
      });

      if (!result.canceled && result.assets[0]) {
        if (appSettings.hapticFeedback) {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        TTSService.speak('Image captured. Processing text...');
        await processImage(result.assets[0].uri);
      } else {
        setIsProcessing(false);
        TTSService.speak('Cancelled. Ready to try again.');
      }
    } catch (error) {
      setIsProcessing(false);
      console.error('Camera error:', error);
      if (appSettings.hapticFeedback) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      TTSService.speak('Error accessing camera. Please check permissions and try again.');
    }
  };

  const handleSaveDocument = async () => {
    if (!scannedText) return;

    try {
      const savedTexts = await FileSystem.readAsStringAsync(
        FileSystem.documentDirectory + 'saved_texts.json'
      ).catch(() => '[]');
      
      const texts = JSON.parse(savedTexts);
      const newDocument = {
        id: Date.now().toString(),
        text: scannedText,
        timestamp: Date.now(),
        title: `Scan ${texts.length + 1}`,
        confidence,
      };
      
      texts.unshift(newDocument);
      
      await FileSystem.writeAsStringAsync(
        FileSystem.documentDirectory + 'saved_texts.json',
        JSON.stringify(texts)
      );
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      TTSService.speak('Document saved to library successfully');
    } catch (error) {
      console.error('Save error:', error);
      TTSService.speak('Failed to save document');
    }
  };

  const handleCloseModal = () => {
    setShowTextModal(false);
    setScannedText('');
    setConfidence(0);
  };

  const handleGoHome = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[MD.colors.primary, MD.colors.secondary, '#f093fb']}
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

          {!scannedText && !isProcessing && (
            <View style={styles.placeholderSection}>
              <Ionicons name="document-text-outline" size={80} color="rgba(255,255,255,0.5)" />
              <Text style={styles.placeholderText}>
                No document scanned yet
              </Text>
              <Text style={styles.placeholderSubtext}>
                Tap capture to scan your first document
              </Text>
            </View>
          )}

          <View style={styles.bottomControls}>
            <TouchableOpacity
              style={[styles.bottomButton, MD.elevation.level2]}
              onPress={handleGoHome}
              accessibilityLabel="Go home"
            >
              <Ionicons name="home" size={24} color="#FFFFFF" />
              <Text style={styles.bottomButtonText}>Home</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.bottomButton, MD.elevation.level2]}
              onPress={handleGalleryPick}
              accessibilityLabel="Select from gallery"
            >
              <Ionicons name="images" size={24} color="#FFFFFF" />
              <Text style={styles.bottomButtonText}>Gallery</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </LinearGradient>

      <TextReviewModal
        visible={showTextModal}
        text={scannedText}
        title="Scanned Document"
        confidence={confidence}
        onClose={handleCloseModal}
        onSave={handleSaveDocument}
        autoPlay={true}
        initialSaved={appSettings.autoSave}
      />
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
    gap: MD.spacing.md,
    marginBottom: MD.spacing.md,
  },
  bottomButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: MD.borderRadius.md,
    paddingVertical: MD.spacing.md,
    minHeight: MD.touchTarget.comfortable,
  },
  bottomButtonText: {
    ...MD.typography.button,
    color: '#FFFFFF',
    marginLeft: MD.spacing.sm,
    textTransform: 'none',
  },
});

export default ScanScreen;