import { MD } from '@/constants/MaterialDesign';
import { useSettings } from '@/context/SettingsContext';
import { GoogleSpeechService } from '@/services/GoogleSpeechService';
import { TTSService } from '@/services/TTSServices';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const { width, height } = Dimensions.get('window');

const voiceOptions = [
  { id: 'default', name: 'Default Voice', description: 'System default', icon: 'volume-high' },
  { id: 'male', name: 'Male Voice', description: 'Deeper tone', icon: 'man' },
  { id: 'female', name: 'Female Voice', description: 'Higher tone', icon: 'woman' },
  { id: 'slow', name: 'Slow Pace', description: 'Slower reading', icon: 'speedometer' },
];

export default function Onboarding() {
  const router = useRouter();
  const { settings, update } = useSettings();
  const [currentStep, setCurrentStep] = useState(0);
  const [userName, setUserName] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('default');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const pulseAnim = useState(new Animated.Value(1))[0];
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  useEffect(() => {
    checkOnboardingStatus();
    requestEarlyPermissions();
  }, []);

  useEffect(() => {
    if (currentStep >= 0) {
      animateStep();
      speakStepInstructions();
    }
  }, [currentStep]);

  const requestEarlyPermissions = async () => {
    try {
      console.log('🔐 Requesting microphone permission early...');
      await GoogleSpeechService.checkAndRequestPermission();
    } catch (error) {
      console.log('⚠️ Early permission request failed:', error);
    }
  };

  const checkOnboardingStatus = async () => {
    try {
      const completed = await AsyncStorage.getItem('onboarding_completed');
      if (completed === 'true') {
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.log('Error checking onboarding:', error);
    }
  };

  const animateStep = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(50);
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const speakStepInstructions = async () => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (currentStep === 0) {
      TTSService.speak(
        "Welcome to your Accessibility App! I'm here to help you read documents and navigate the world around you. This app is fully voice-controlled. What is your name? You can say your name, or say Skip to continue with default settings."
      );
    } else if (currentStep === 1) {
      TTSService.speak(
        'Choose your preferred voice for reading. Tap a voice to hear a preview, or say Next to continue with the default.'
      );
    } else if (currentStep === 2) {
      TTSService.speak(
        `Perfect, ${userName || 'User'}! You're all set. The app can now scan and read documents for you. Say Get Started or tap the button to begin.`
      );
    }
  };

  useEffect(() => {
    if (isListening) {
      startPulseAnimation();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [isListening]);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleNext = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (currentStep === 0 && !userName.trim()) {
      TTSService.speak('Please enter your name to continue, or say skip to use default settings.');
      return;
    }
    
    if (currentStep < 2) {
      setCurrentStep(prev => prev + 1);
      announceStep(currentStep + 1);
    } else {
      update({
        userName: userName.trim() || 'User',
        preferredVoice: selectedVoice,
        isFirstLaunch: false,
      });
      
      await AsyncStorage.setItem('onboarding_completed', 'true');
      console.log('✅ Onboarding completed and saved');
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      TTSService.speak(`Welcome ${userName || 'User'}! Your setup is complete. Please create an account to continue.`);
      setTimeout(() => {
        router.replace('/auth/signup');
      }, 2000);
    }
  };

  const announceStep = async (step: number) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    if (step === 1) {
      TTSService.speak('Step 2: Choose your preferred voice. You can select different voice types. Say Next when ready, or say the name of a voice to select it.');
    } else if (step === 2) {
      TTSService.speak('Step 3: All set! You can now scan documents, use voice commands, and access all features. Say Get Started or tap the button to begin.');
    }
  };

  const handleVoiceCommand = async (command: string) => {
    const lowerCommand = command.toLowerCase();
    
    if (lowerCommand.includes('next') || lowerCommand.includes('continue')) {
      handleNext();
    } else if (lowerCommand.includes('back') || lowerCommand.includes('previous')) {
      if (currentStep > 0) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setCurrentStep(prev => prev - 1);
        TTSService.speak('Going back');
      } else {
        TTSService.speak('This is the first step.');
      }
    } else if (lowerCommand.includes('skip')) {
      update({
        userName: 'User',
        preferredVoice: 'default',
        isFirstLaunch: false,
      });
      await AsyncStorage.setItem('onboarding_completed', 'true');
      TTSService.speak('Skipping setup. Please create an account to continue.');
      setTimeout(() => router.replace('/auth/signup'), 1500);
    } else if (lowerCommand.includes('repeat') || lowerCommand.includes('again')) {
      announceStep(currentStep);
    } else if (lowerCommand.includes('help')) {
      TTSService.speak("You can say Next to continue, Back to go back, Skip to skip setup, or Help for assistance.");
    } else if (currentStep === 0 && !lowerCommand.includes('name')) {
      setUserName(command.trim());
      TTSService.speak(`Got it, ${command.trim()}. Say Next to continue.`);
    } else if (currentStep === 1) {
      if (lowerCommand.includes('default')) {
        setSelectedVoice('default');
        TTSService.speak('Default voice selected');
      } else if (lowerCommand.includes('male')) {
        setSelectedVoice('male');
        TTSService.speak('Male voice selected');
      } else if (lowerCommand.includes('female')) {
        setSelectedVoice('female');
        TTSService.speak('Female voice selected');
      } else if (lowerCommand.includes('slow')) {
        setSelectedVoice('slow');
        TTSService.speak('Slow voice selected');
      }
    } else if (currentStep === 2 && (lowerCommand.includes('start') || lowerCommand.includes('begin'))) {
      handleNext();
    } else {
      TTSService.speak(`I heard: ${command}. Say Help for available commands.`);
    }
  };

  const startVoiceInput = async () => {
    if (isListening || isProcessing) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsListening(true);
      
      await GoogleSpeechService.startRecording();
      TTSService.speak('Listening...');

      setTimeout(async () => {
        if (isListening) {
          setIsListening(false);
          setIsProcessing(true);
          
          const audioUri = await GoogleSpeechService.stopRecording();
          
          if (audioUri) {
            const result = await GoogleSpeechService.recognizeSpeech(audioUri);
            setIsProcessing(false);
            
            if (result.transcript) {
              await handleVoiceCommand(result.transcript);
            } else {
              TTSService.speak("I didn't hear anything. Please try again.");
            }
          } else {
            setIsProcessing(false);
            TTSService.speak('Recording failed. Please try again.');
          }
        }
      }, 4000);
    } catch (error) {
      setIsListening(false);
      setIsProcessing(false);
      console.error('Voice input error:', error);
      TTSService.speak('Error with voice input. Tap the button to try again.');
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.stepContainer}>
            <Ionicons name="person-outline" size={80} color="#667eea" />
            <Text style={styles.stepTitle}>What's your name?</Text>
            <Text style={styles.stepDescription}>
              I'd like to personalize your experience
            </Text>
            <TextInput
              style={styles.textInput}
              value={userName}
              onChangeText={setUserName}
              placeholder="Enter your name"
              placeholderTextColor="#999"
              autoFocus
            />
          </View>
        );
      
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Ionicons name="volume-high-outline" size={80} color="#667eea" />
            <Text style={styles.stepTitle}>Choose your voice</Text>
            <Text style={styles.stepDescription}>
              Select a voice that's comfortable for you
            </Text>
            <ScrollView style={styles.voiceList}>
              {voiceOptions.map((voice) => (
                <TouchableOpacity
                  key={voice.id}
                  style={[
                    styles.voiceOption,
                    selectedVoice === voice.id && styles.selectedVoice
                  ]}
                  onPress={() => setSelectedVoice(voice.id)}
                >
                  <View style={styles.voiceInfo}>
                    <Text style={styles.voiceName}>{voice.name}</Text>
                    <Text style={styles.voiceDescription}>{voice.description}</Text>
                  </View>
                  {selectedVoice === voice.id && (
                    <Ionicons name="checkmark-circle" size={24} color="#667eea" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );
      
      case 2:
        return (
          <View style={styles.stepContainer}>
            <Ionicons name="checkmark-circle-outline" size={80} color="#43e97b" />
            <Text style={styles.stepTitle}>You're all set!</Text>
            <Text style={styles.stepDescription}>
              I'm ready to help you read documents and navigate your world
            </Text>
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Ionicons name="document-text" size={20} color="#667eea" />
                <Text style={styles.featureText}>Scan and read documents</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="camera" size={20} color="#667eea" />
                <Text style={styles.featureText}>Take pictures of text</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="mic" size={20} color="#667eea" />
                <Text style={styles.featureText}>Voice commands</Text>
              </View>
            </View>
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={MD.colors.primary} />
      <LinearGradient
        colors={[MD.colors.primary, MD.colors.secondary]}
        style={styles.gradient}
      >
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              Step {currentStep + 1} of 3
            </Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${((currentStep + 1) / 3) * 100}%` }
                ]} 
              />
            </View>
          </View>

          {renderStep()}

          <View style={styles.buttonContainer}>
            <Animated.View style={[styles.buttonWrapper, { transform: [{ scale: pulseAnim }] }]}>
              <TouchableOpacity
                style={[
                  styles.voiceButton,
                  (isListening || isProcessing) && styles.voiceButtonActive,
                  MD.elevation.level3,
                ]}
                onPress={startVoiceInput}
                disabled={isListening || isProcessing}
                accessibilityLabel="Use voice input"
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Ionicons name={isListening ? "mic" : "mic-outline"} size={24} color="white" />
                )}
                <Text style={styles.voiceButtonText}>
                  {isProcessing ? 'Processing...' : isListening ? 'Listening...' : 'Voice Input'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
            
            <TouchableOpacity
              style={[styles.nextButton, MD.elevation.level3]}
              onPress={handleNext}
              accessibilityLabel={currentStep === 2 ? "Get started" : "Next step"}
            >
              <Text style={styles.nextButtonText}>
                {currentStep === 2 ? "Get Started" : "Next"}
              </Text>
              <Ionicons name="arrow-forward" size={24} color={MD.colors.primary} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: StatusBar.currentHeight || 44,
    paddingHorizontal: MD.spacing.lg,
    paddingBottom: MD.spacing.xl,
  },
  progressContainer: {
    marginBottom: MD.spacing.xl,
    marginTop: MD.spacing.lg,
  },
  progressText: {
    ...MD.typography.body2,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: MD.spacing.sm,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: MD.borderRadius.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: MD.borderRadius.sm,
  },
  stepContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: MD.spacing.md,
  },
  stepTitle: {
    ...MD.typography.h2,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: MD.spacing.lg,
    marginBottom: MD.spacing.md,
  },
  stepDescription: {
    ...MD.typography.body1,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: MD.spacing.xl,
    paddingHorizontal: MD.spacing.md,
  },
  textInput: {
    width: '100%',
    minHeight: MD.touchTarget.comfortable,
    backgroundColor: '#FFFFFF',
    borderRadius: MD.borderRadius.md,
    paddingHorizontal: MD.spacing.lg,
    ...MD.typography.body1,
    color: MD.colors.textPrimary,
    ...MD.elevation.level2,
  },
  voiceList: {
    width: '100%',
    maxHeight: 320,
  },
  voiceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: MD.borderRadius.md,
    padding: MD.spacing.md,
    marginBottom: MD.spacing.md,
    minHeight: MD.touchTarget.large,
    ...MD.elevation.level2,
  },
  selectedVoice: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255,255,255,0.95)',
    ...MD.elevation.level4,
  },
  voiceInfo: {
    flex: 1,
  },
  voiceName: {
    ...MD.typography.h6,
    color: MD.colors.textPrimary,
  },
  voiceDescription: {
    ...MD.typography.body2,
    color: MD.colors.textSecondary,
    marginTop: MD.spacing.xs,
  },
  featuresList: {
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: MD.borderRadius.md,
    padding: MD.spacing.md,
    marginBottom: MD.spacing.md,
    minHeight: MD.touchTarget.comfortable,
  },
  featureText: {
    ...MD.typography.body1,
    color: '#FFFFFF',
    marginLeft: MD.spacing.md,
  },
  buttonContainer: {
    gap: MD.spacing.md,
  },
  buttonWrapper: {
    width: '100%',
  },
  voiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: MD.borderRadius.md,
    paddingHorizontal: MD.spacing.lg,
    minHeight: MD.touchTarget.comfortable,
    width: '100%',
  },
  voiceButtonActive: {
    backgroundColor: MD.colors.error,
  },
  voiceButtonText: {
    ...MD.typography.button,
    color: '#FFFFFF',
    marginLeft: MD.spacing.sm,
    textTransform: 'none',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: MD.borderRadius.md,
    paddingHorizontal: MD.spacing.lg,
    minHeight: MD.touchTarget.comfortable,
    width: '100%',
  },
  nextButtonText: {
    ...MD.typography.button,
    color: MD.colors.primary,
    marginRight: MD.spacing.sm,
    textTransform: 'none',
  },
});
