import AccessibleButton from '@/components/AccessibleButton';
import { useSettings } from '@/context/SettingsContext';
import { useVoice } from '@/context/VoiceContext';
import { speak } from '@/utils/speechUtils';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
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

  useEffect(() => {
    if (settings.isFirstLaunch) {
      speak("Welcome to the Accessibility App! I'm here to help you read documents and navigate the world around you. Let's get started by setting up your preferences.");
    }
  }, []);

  const handleNext = () => {
    if (currentStep === 0 && !userName.trim()) {
      Alert.alert('Name Required', 'Please enter your name to continue.');
      return;
    }
    
    if (currentStep < 2) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Complete onboarding
      update({
        userName: userName.trim(),
        preferredVoice: selectedVoice,
        isFirstLaunch: false,
      });
      speak(`Welcome ${userName}! Your setup is complete. How can I help you today?`);
      router.replace('/(tabs)');
    }
  };

  const handleVoiceCommand = (command: string) => {
    const lowerCommand = command.toLowerCase();
    
    if (lowerCommand.includes('next') || lowerCommand.includes('continue')) {
      handleNext();
    } else if (lowerCommand.includes('back') || lowerCommand.includes('previous')) {
      if (currentStep > 0) {
        setCurrentStep(prev => prev - 1);
      }
    } else if (lowerCommand.includes('help')) {
      speak("You can say 'next' to continue, 'back' to go back, or 'help' for assistance.");
    }
  };

  const startVoiceInput = async () => {
    try {
      await startListening();
      // In a real implementation, you'd process the voice input
      // For now, we'll simulate it
      setTimeout(() => {
        const mockCommand = "next";
        handleVoiceCommand(mockCommand);
      }, 2000);
    } catch (error) {
      console.error('Voice input error:', error);
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
          <TouchableOpacity
            style={styles.voiceButton}
            onPress={startVoiceInput}
          >
            <Ionicons name="mic" size={24} color="white" />
            <Text style={styles.voiceButtonText}>Use Voice</Text>
          </TouchableOpacity>
          
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
