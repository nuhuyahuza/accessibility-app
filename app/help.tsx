// src/screens/HelpScreen.tsx
import { AccessibleButton } from '@/components/AccessibilityButton1';
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
	ScrollView,
	StatusBar,
	StyleSheet,
	Text,
	View
} from 'react-native';
import { useAccessibility } from '../context/AccessibilityContext';
import { useVoice } from '../context/VoiceContext';

const { width } = Dimensions.get('window');

interface Command {
  command: string;
  description: string;
  category: string;
  icon: string;
}

const HelpScreen: React.FC = () => {
  const navigation = useNavigation();
  const { setCurrentScreen, isListening } = useAccessibility();
  const { startListening, stopListening } = useVoice();
  
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];
  const [selectedCategory, setSelectedCategory] = useState('all');

  const commands: Command[] = [
    // Navigation Commands
    { command: '"Home" or "Main"', description: 'Navigate to the home screen', category: 'navigation', icon: '🏠' },
    { command: '"Scan" or "Camera"', description: 'Open camera to scan text', category: 'navigation', icon: '📸' },
    { command: '"Help" or "Commands"', description: 'Open this help screen', category: 'navigation', icon: '❓' },
    { command: '"Contacts" or "Phone Book"', description: 'View your contact list', category: 'navigation', icon: '📞' },
    
    // OCR Commands
    { command: '"Take Photo" or "Capture"', description: 'Capture image for text scanning', category: 'ocr', icon: '📷' },
    { command: '"Read Again" or "Repeat"', description: 'Re-read the last scanned text', category: 'ocr', icon: '🔄' },
    { command: '"Read Slowly"', description: 'Read text at a slower pace', category: 'ocr', icon: '🐌' },
    
    // Phone Commands
    { command: '"Call [Name]"', description: 'Call a contact by name (e.g., "Call John")', category: 'phone', icon: '📱' },
    { command: '"Yes" or "Confirm"', description: 'Confirm a phone call', category: 'phone', icon: '✅' },
    { command: '"No" or "Cancel"', description: 'Cancel a phone call', category: 'phone', icon: '❌' },
    
    // Control Commands
    { command: '"Stop" or "Quiet"', description: 'Stop current speech', category: 'control', icon: '🛑' },
    { command: '"Pause"', description: 'Pause current speech', category: 'control', icon: '⏸️' },
    { command: '"Continue" or "Resume"', description: 'Resume paused speech', category: 'control', icon: '▶️' },
    
    // Utility Commands
    { command: '"What Time"', description: 'Announce current time', category: 'utility', icon: '🕐' },
    { command: '"What Date"', description: 'Announce current date', category: 'utility', icon: '📅' },
    { command: '"Emergency" or "911"', description: 'Emergency assistance', category: 'utility', icon: '🚨' },
  ];

  const categories = [
    { id: 'all', name: 'All Commands', icon: '📋' },
    { id: 'navigation', name: 'Navigation', icon: '🧭' },
    { id: 'ocr', name: 'Text Scanning', icon: '📖' },
    { id: 'phone', name: 'Phone Calls', icon: '📞' },
    { id: 'control', name: 'Voice Control', icon: '🎤' },
    { id: 'utility', name: 'Utilities', icon: '🔧' },
  ];

  useEffect(() => {
    setCurrentScreen('Help');
    
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
      'Help and Commands screen loaded. Here you can learn about all available voice commands and features. You can filter commands by category or listen to all commands.'
    );
  }, [setCurrentScreen, fadeAnim, slideAnim]);

  const filteredCommands = selectedCategory === 'all' 
    ? commands 
    : commands.filter(cmd => cmd.category === selectedCategory);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    const category = categories.find(cat => cat.id === categoryId);
    TTSService.speak(`Showing ${category?.name || 'all'} commands`);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const readAllCommands = () => {
    const commandList = filteredCommands
      .map(cmd => `${cmd.command}: ${cmd.description}`)
      .join('. ');
    
    TTSService.speak(`Reading all commands in the current category. ${commandList}`);
  };

  const readCommandsByCategory = () => {
    const categoryCommands = categories.map(category => {
      const categoryCommandsList = commands
        .filter(cmd => cmd.category === category.id)
        .map(cmd => `${cmd.command}: ${cmd.description}`)
        .join('. ');
      
      return `${category.name} commands: ${categoryCommandsList}`;
    }).join('. ');

    TTSService.speak(`Reading all commands organized by category. ${categoryCommands}`);
  };

  const handleGoHome = () => {
    navigation.navigate('Home' as never);
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
            <Text style={styles.title}>❓ Help & Commands</Text>
            <Text style={styles.subtitle}>Voice commands and how to use them</Text>
          </BlurView>

          {/* Category Filter */}
          <View style={styles.categorySection}>
            <Text style={styles.sectionTitle}>📂 Filter by Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
			{categories.map((category) => (
				<AccessibleButton
					key={category.id}
					title={`${category.icon} ${category.name}`}
					onPress={() => handleCategorySelect(category.id)}
					description={`Filter to show only ${category.name.toLowerCase()} commands`}
					variant={selectedCategory === category.id ? "success" : "glass"}
					size="small"
          style={
            selectedCategory === category.id
              ? { ...styles.categoryButton, ...styles.selectedCategory }
              : styles.categoryButton
          }
				/>
			))}
            </ScrollView>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <AccessibleButton
              title="🔊 Read All Commands"
              onPress={readAllCommands}
              description="Listen to all commands in the current category"
              variant="warning"
              size="small"
            />
            <AccessibleButton
              title="📚 Read by Category"
              onPress={readCommandsByCategory}
              description="Listen to all commands organized by category"
              variant="secondary"
              size="small"
            />
          </View>

          {/* Commands List */}
          <View style={styles.commandsSection}>
            <Text style={styles.sectionTitle}>
              🎤 {selectedCategory === 'all' ? 'All Commands' : categories.find(c => c.id === selectedCategory)?.name + ' Commands'}
              ({filteredCommands.length})
            </Text>
            
            <ScrollView style={styles.commandsList} showsVerticalScrollIndicator={false}>
              {filteredCommands.map((command, index) => (
                <BlurView key={index} intensity={40} tint="dark" style={styles.commandCard}>
                  <View style={styles.commandHeader}>
                    <Text style={styles.commandIcon}>{command.icon}</Text>
                    <Text style={styles.commandText}>{command.command}</Text>
                  </View>
                  <Text style={styles.commandDescription}>{command.description}</Text>
                  <AccessibleButton
                    title="🔊 Test Command"
                    onPress={() => TTSService.speak(`Command: ${command.command}. ${command.description}`)}
                    description={`Listen to explanation of ${command.command}`}
                    variant="glass"
                    size="small"
                    style={styles.testButton}
                  />
                </BlurView>
              ))}
            </ScrollView>
          </View>

          {/* Tips Section */}
          <BlurView intensity={60} tint="dark" style={styles.tipsSection}>
            <Text style={styles.tipsTitle}>💡 Usage Tips</Text>
            <Text style={styles.tipsText}>
              • Speak clearly and naturally{'\n'}
              • Wait for the beep before speaking{'\n'}
              • Commands work from any screen{'\n'}
              • Long press buttons for descriptions{'\n'}
              • Say &quot;Stop&quot; to interrupt speech
            </Text>
          </BlurView>

          {/* Bottom Controls */}
          <View style={styles.bottomControls}>
            <AccessibleButton
              title="🏠 Home"
              onPress={handleGoHome}
              description="Return to the main home screen"
              variant="primary"
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
    marginBottom: 15,
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
  categorySection: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  categoryScroll: {
    flexGrow: 0,
  },
  categoryButton: {
    marginRight: 10,
    minWidth: 120,
  },
  selectedCategory: {
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  commandsSection: {
    flex: 1,
    marginBottom: 15,
  },
  commandsList: {
    flex: 1,
  },
  commandCard: {
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  commandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  commandIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  commandText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4ecdc4',
    flex: 1,
  },
  commandDescription: {
    fontSize: 14,
    color: '#e0e0e0',
    lineHeight: 20,
    marginBottom: 10,
  },
  testButton: {
    alignSelf: 'flex-start',
  },
  tipsSection: {
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 14,
    color: '#e0e0e0',
    lineHeight: 20,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
});

export default HelpScreen;