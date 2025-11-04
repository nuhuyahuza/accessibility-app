import AccessibleButton from '@/components/AccessibleButton';
import { useSettings } from '@/context/SettingsContext';
import { useVoice } from '@/context/VoiceContext';
import { GoogleSpeechService } from '@/services/GoogleSpeechService';
import { TTSService } from '@/services/TTSServices';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const { width, height } = Dimensions.get('window');

const voiceOptions = [
  { id: 'default', name: 'Default Voice', description: 'System default' },
  { id: 'male', name: 'Male Voice', description: 'Deeper tone' },
  { id: 'female', name: 'Female Voice', description: 'Higher tone' },
  { id: 'slow', name: 'Slow Voice', description: 'Slower speech' },
];

export default function Onboarding() {
  const router = useRouter();
  const { settings, update } = useSettings();
  const { startListening } = useVoice();
  const [currentStep, setCurrentStep] = useState(0);
  const [userName, setUserName] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('default');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const pulseAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    if (settings.isFirstLaunch) {
      TTSService.speak("Welcome to your Accessibility App! I'm here to help you read documents and navigate the world around you. This app is fully voice-controlled for your convenience. Let's get started by setting up your preferences. Say Next to continue, or tap the microphone button.");
    }
  }, []);

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
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      TTSService.speak(`Welcome ${userName || 'User'}! Your setup is complete. Taking you to the home screen now.`);
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 2000);
    }
  };

  const announceStep = (step: number) => {
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
      TTSService.speak('Skipping setup. Taking you to the home screen.');
      setTimeout(() => router.replace('/(tabs)'), 1500);
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
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${((currentStep + 1) / 3) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            Step {currentStep + 1} of 3
          </Text>
        </View>

        {renderStep()}

        <View style={styles.buttonContainer}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              style={[
                styles.voiceButton,
                (isListening || isProcessing) && styles.voiceButtonActive
              ]}
              onPress={startVoiceInput}
              disabled={isListening || isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name={isListening ? "mic" : "mic-outline"} size={24} color="white" />
              )}
              <Text style={styles.voiceButtonText}>
                {isProcessing ? 'Processing...' : isListening ? 'Listening...' : 'Use Voice'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
          
          <AccessibleButton
            label={currentStep === 2 ? "Get Started" : "Next"}
            onPress={handleNext}
            style={styles.nextButton}
          />
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  progressContainer: {
    marginBottom: 40,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 2,
  },
  progressText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    textAlign: 'center',
  },
  stepContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  stepDescription: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  textInput: {
    width: '100%',
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 25,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#333',
  },
  voiceList: {
    width: '100%',
    maxHeight: 300,
  },
  voiceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  selectedVoice: {
    borderWidth: 2,
    borderColor: '#667eea',
  },
  voiceInfo: {
    flex: 1,
  },
  voiceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  voiceDescription: {
    fontSize: 14,
    color: '#666',
  },
  featuresList: {
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  featureText: {
    fontSize: 16,
    color: 'white',
    marginLeft: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  voiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  voiceButtonActive: {
    backgroundColor: '#FF6B6B',
  },
  voiceButtonText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 8,
  },
  nextButton: {
    backgroundColor: 'white',
    borderRadius: 25,
    paddingHorizontal: 30,
    paddingVertical: 12,
  },
});
