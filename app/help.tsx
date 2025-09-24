import { useSettings } from '@/context/SettingsContext';
import { speak } from '@/utils/speechUtils';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

export default function HelpScreen() {
  const router = useRouter();
  const { settings } = useSettings();

  useEffect(() => {
    const helpText = `Welcome to the help screen, ${settings.userName || 'user'}. Here you can learn about all the voice commands available. You can say commands like "read document", "go home", or "help" to navigate the app.`;
    speak(helpText);
  }, [settings.userName]);

  const commandCategories = [
    {
      title: 'Document Reading',
      icon: 'document-text-outline',
      commands: [
        'read document',
        'scan document', 
        'read text',
        'take picture',
        'capture text'
      ],
      description: 'Commands to scan and read documents'
    },
    {
      title: 'Navigation',
      icon: 'home-outline',
      commands: [
        'go home',
        'main menu',
        'home screen'
      ],
      description: 'Navigate between screens'
    },
    {
      title: 'Help & Information',
      icon: 'help-circle-outline',
      commands: [
        'help',
        'what can you do',
        'commands'
      ],
      description: 'Get help and information'
    },
    {
      title: 'Settings',
      icon: 'settings-outline',
      commands: [
        'settings',
        'preferences'
      ],
      description: 'Access app settings'
    },
    {
      title: 'History',
      icon: 'time-outline',
      commands: [
        'history',
        'recent scans',
        'previous scans'
      ],
      description: 'View your scan history'
    },
    {
      title: 'Voice Control',
      icon: 'volume-high-outline',
      commands: [
        'stop talking',
        'quiet',
        'silence',
        'repeat',
        'say again'
      ],
      description: 'Control speech output'
    }
  ];

  const handleCommandPress = (command: string) => {
    speak(`You can say "${command}" to use this command.`);
  };

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Voice Commands</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.introSection}>
          <Ionicons name="mic-outline" size={60} color="white" />
          <Text style={styles.introTitle}>Voice Commands Guide</Text>
          <Text style={styles.introText}>
            Use these voice commands to navigate and control the app. 
            RJust speak naturally and I&apos;ll understand what you want to do.
          </Text>
        </View>

        {commandCategories.map((category, index) => (
          <View key={index} style={styles.categoryCard}>
            <View style={styles.categoryHeader}>
              <Ionicons name={category.icon as any} size={24} color="#667eea" />
              <Text style={styles.categoryTitle}>{category.title}</Text>
            </View>
            <Text style={styles.categoryDescription}>{category.description}</Text>
            
            <View style={styles.commandsList}>
              {category.commands.map((command, cmdIndex) => (
                <TouchableOpacity
                  key={cmdIndex}
                  style={styles.commandItem}
                  onPress={() => handleCommandPress(command)}
                >
                  <Ionicons name="mic" size={16} color="#667eea" />
                  <Text style={styles.commandText}>&quot;{command}&quot;</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>💡 Tips</Text>
          <View style={styles.tipItem}>
            <Text style={styles.tipText}>• Speak clearly and at a normal pace</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipText}>• You can use variations of commands</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipText}>• Say &quot;help&quot; anytime for assistance</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipText}>• Use &quot;stop talking&quot; to silence the app</Text>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  introSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  introText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 24,
  },
  categoryCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 12,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  commandsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  commandItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4ff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  commandText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '500',
    marginLeft: 6,
  },
  tipsSection: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  tipItem: {
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 40,
  },
});