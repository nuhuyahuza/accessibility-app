// src/screens/HomeScreen.tsx
import { AccessibleButton } from '@/components/AccessibilityButton1';
import { useVoice } from '@/context/VoiceContext';
import { TTSService } from '@/services/TTSServices';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
	Animated,
	Dimensions,
	SafeAreaView,
	StatusBar,
	StyleSheet,
	Text,
	View
} from 'react-native';
import { useAccessibility } from '../context/AccessibilityContext';
import { ContactService } from '../services/ContactService';

const { width, height } = Dimensions.get('window');

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { startListening, stopListening } = useVoice();
  const { setCurrentScreen, isListening } = useAccessibility();
  
  // Animations
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  const pulseAnim = useState(new Animated.Value(1))[0];
  const floatAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    setCurrentScreen('Home');
    
    // Initialize contacts
    ContactService.initialize();
    
    // Entrance animations
    Animated.stagger(200, [
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

    // Floating animation for title
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Pulse animation for voice button
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Announce screen
    const announceScreen = () => {
      TTSService.speak(
        'Welcome to Vision Assist home screen. Available options: Scan Text, Help and Commands, Contacts, or Voice Commands. You can also speak commands at any time.'
      );
    };
    
    // Delay announcement to ensure screen is loaded
    const timer = setTimeout(announceScreen, 1000);
    return () => clearTimeout(timer);
  }, [setCurrentScreen, fadeAnim, slideAnim, floatAnim, pulseAnim]);

  const handleScan = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Scan' as never);
  };

  const handleHelp = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Help' as never);
  };

  const handleContacts = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Contacts' as never);
  };

  const handleVoiceToggle = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
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
          {/* Header Section */}
          <Animated.View 
            style={[
              styles.header,
              { transform: [{ translateY: floatAnim }] }
            ]}
          >
            <BlurView intensity={20} tint="light" style={styles.headerBlur}>
              <Text style={styles.title}>👁️ Vision Assist</Text>
              <Text style={styles.subtitle}>
                Your AI-powered accessibility companion
              </Text>
              <View style={styles.statusIndicator}>
                <View style={[
                  styles.statusDot, 
                  { backgroundColor: isListening ? '#4CAF50' : '#FFC107' }
                ]} />
                <Text style={styles.statusText}>
                  {isListening ? 'Listening...' : 'Ready'}
                </Text>
              </View>
            </BlurView>
          </Animated.View>

          {/* Main Actions */}
          <View style={styles.buttonContainer}>
            <AccessibleButton
              title="📸 Scan Text"
              onPress={handleScan}
              description="Open camera to capture and read text from images, documents, or signs"
              variant="gradient"
              size="large"
            />

            <AccessibleButton
              title="🔊 Help & Commands"
              onPress={handleHelp}
              description="Learn about available voice commands and how to use Vision Assist effectively"
              variant="glass"
              size="large"
            />

            <AccessibleButton
              title="📞 Contacts"
              onPress={handleContacts}
              description="View your contacts and make hands-free phone calls"
              variant="success"
              size="large"
            />

            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <AccessibleButton
                title={isListening ? "🛑 Stop Listening" : "🎤 Voice Commands"}
                onPress={handleVoiceToggle}
                description={
                  isListening 
                    ? "Stop voice recognition and return to manual control" 
                    : "Start listening for voice commands to control the app hands-free"
                }
                variant={isListening ? "danger" : "warning"}
                size="large"
              />
            </Animated.View>
          </View>

          {/* Quick Tips */}
          <BlurView intensity={40} tint="dark" style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>💡 Quick Tips</Text>
            <Text style={styles.tipsText}>
              • Long press any button for detailed information{'\n'}
              • Say &quot;Help&quot; to learn voice commands{'\n'}
              • Say &quot;Call [Name]&quot; to make phone calls{'\n'}
              • Say &quot;Scan&quot; to quickly capture text
            </Text>
          </BlurView>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Speak naturally • Touch gently • Navigate easily
            </Text>
          </View>
        </Animated.View>

        {/* Animated Background Elements */}
        <View style={styles.backgroundElements}>
          <Animated.View 
            style={[
              styles.floatingElement,
              styles.element1,
              { transform: [{ rotate: floatAnim.interpolate({
                inputRange: [-10, 0],
                outputRange: ['0deg', '360deg']
              }) }] }
            ]}
          />
          <Animated.View 
            style={[
              styles.floatingElement,
              styles.element2,
              { transform: [{ rotate: floatAnim.interpolate({
                inputRange: [-10, 0],
                outputRange: ['360deg', '0deg']
              }) }] }
            ]}
          />
        </View>
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
    paddingVertical: 20,
  },
  header: {
    marginTop: 20,
    marginBottom: 30,
  },
  headerBlur: {
    padding: 25,
    borderRadius: 25,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  tipsContainer: {
    padding: 20,
    borderRadius: 20,
    marginVertical: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  tipsText: {
    fontSize: 14,
    color: '#e0e0e0',
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 10,
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  backgroundElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  floatingElement: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 50,
  },
  element1: {
    width: 100,
    height: 100,
    top: height * 0.2,
    right: -50,
  },
  element2: {
    width: 150,
    height: 150,
    bottom: height * 0.3,
    left: -75,
  },
});

export default HomeScreen;