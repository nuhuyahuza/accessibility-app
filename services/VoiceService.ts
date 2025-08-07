// src/services/VoiceService.ts
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import * as Speech from 'expo-speech';
import { ContactService } from './ContactService';
import { OCRService } from './OCRService';
import { TTSService } from './TTSServices';

// Note: Expo Speech doesn't have built-in speech recognition
// We'll need to add a speech recognition library or use a web service
// For now, this focuses on TTS functionality

export class VoiceService {
  private static router: any;
  private static setIsListening: (listening: boolean) => void;
  private static lastRecognizedText: string = '';
  private static commandHistory: string[] = [];
  private static isInitialized: boolean = false;

  static initialize(router: any, setIsListening: (listening: boolean) => void) {
    this.router = router;
    this.setIsListening = setIsListening;
    this.isInitialized = true;
  }

  static cleanup() {
    // Stop any ongoing speech
    Speech.stop();
    this.isInitialized = false;
  }

  // For now, we'll simulate voice recognition with a simple text input
  // You can integrate with a web-based speech recognition service later
  static async startListening() {
    if (!this.isInitialized) {
      console.error('VoiceService not initialized');
      return;
    }

    try {
      await TTSService.stop();
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      this.setIsListening(true);
      
      // Use Expo Speech for feedback
      Speech.speak('Listening for your command...', {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.9,
      });

      // For demo purposes, we'll simulate listening
      // In a real app, you'd integrate with a speech recognition service
      setTimeout(() => {
        this.simulateVoiceInput();
      }, 3000);

    } catch (error) {
      console.error('Voice start error:', error);
      this.setIsListening(false);
      Speech.speak('Voice recognition error. Please try again.');
    }
  }

  static async stopListening() {
    try {
      Speech.stop();
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      this.setIsListening(false);
    } catch (error) {
      console.error('Voice stop error:', error);
      this.setIsListening(false);
    }
  }

  // Simulate voice input for demo purposes
  private static simulateVoiceInput() {
    const sampleCommands = [
      'scan text',
      'help',
      'home',
      'contacts',
      'what time is it'
    ];
    
    const randomCommand = sampleCommands[Math.floor(Math.random() * sampleCommands.length)];
    console.log('🗣️ Simulated command:', randomCommand);
    this.processVoiceCommand(randomCommand);
    this.setIsListening(false);
  }

  // Method to manually process voice commands (for testing)
  static processTextCommand(command: string) {
    this.addToHistory(command);
    this.processVoiceCommand(command.toLowerCase().trim());
  }

  private static addToHistory(command: string) {
    this.lastRecognizedText = command;
    this.commandHistory.unshift(command);
    if (this.commandHistory.length > 10) {
      this.commandHistory.pop();
    }
  }

  private static async processVoiceCommand(command: string) {
    // Provide immediate feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Navigation commands
    if (this.matchCommand(command, ['home', 'main', 'go home', 'main menu'])) {
      this.router.push('/');
      this.speak('Navigating to home screen');
      return;
    }

    if (this.matchCommand(command, ['help', 'commands', 'what can you do', 'instructions'])) {
      this.router.push('/help');
      this.speak('Opening help and commands screen');
      return;
    }

    if (this.matchCommand(command, ['scan', 'read', 'camera', 'take photo', 'capture'])) {
      this.router.push('/scan');
      this.speak('Opening camera to scan text');
      return;
    }

    if (this.matchCommand(command, ['contacts', 'contact list', 'phone book', 'call list'])) {
      this.router.push('/contacts');
      this.speak('Opening contacts');
      return;
    }

    // Call commands
    if (command.includes('call ')) {
      await this.handleCallCommand(command);
      return;
    }

    // OCR commands
    if (this.matchCommand(command, ['take picture', 'capture image', 'photo', 'snap'])) {
      await this.takePicture();
      return;
    }

    // TTS control commands
    if (this.matchCommand(command, ['stop', 'quiet', 'silence', 'shut up', 'stop talking'])) {
      Speech.stop();
      this.speak('Stopped');
      return;
    }

    // Utility commands
    if (this.matchCommand(command, ['what time', 'time', 'current time'])) {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      this.speak(`The current time is ${timeString}`);
      return;
    }

    if (this.matchCommand(command, ['what date', 'date', 'today\'s date'])) {
      const now = new Date();
      const dateString = now.toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      this.speak(`Today is ${dateString}`);
      return;
    }

    // Emergency commands
    if (this.matchCommand(command, ['emergency', 'help me', '911', 'call emergency'])) {
      this.speak('Would you like me to call emergency services? Say yes to confirm or no to cancel.');
      return;
    }

    // Default response with suggestions
    const suggestions = this.getSuggestions(command);
    this.speak(`I didn't understand "${command}". ${suggestions}`);
  }

  // Enhanced speak method using Expo Speech
  private static speak(text: string, options?: Speech.SpeechOptions) {
    const defaultOptions: Speech.SpeechOptions = {
      language: 'en-US',
      pitch: 1.0,
      rate: 0.9,
      ...options
    };

    Speech.speak(text, defaultOptions);
  }

  // Speak with different voice qualities for different types of messages
  static speakAlert(text: string) {
    this.speak(text, {
      language: 'en-US',
      pitch: 1.2,
      rate: 0.8
    });
  }

  static speakInfo(text: string) {
    this.speak(text, {
      language: 'en-US',
      pitch: 1.0,
      rate: 0.9
    });
  }

  static speakError(text: string) {
    this.speak(text, {
      language: 'en-US',
      pitch: 0.8,
      rate: 0.7
    });
  }

  private static matchCommand(input: string, patterns: string[]): boolean {
    return patterns.some(pattern => 
      input.includes(pattern) || 
      this.levenshteinDistance(input, pattern) <= 2
    );
  }

  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  }

  private static getSuggestions(command: string): string {
    const suggestions = [
      "Try saying 'scan' to read text",
      "Say 'help' for available commands",
      "Say 'home' to go to main screen",
      "Try 'call' followed by a contact name",
      "Say 'contacts' to see your phone book"
    ];
    
    return suggestions[Math.floor(Math.random() * suggestions.length)];
  }

  private static async handleCallCommand(command: string) {
    try {
      const nameMatch = command.match(/call\s+(.+)/i);
      if (!nameMatch) {
        this.speak('Please specify who you want to call. For example, say "Call John"');
        return;
      }

      const contactName = nameMatch[1].trim();
      this.speak(`Searching for ${contactName} in your contacts...`);

      const contact = await ContactService.findContactByName(contactName);
      
      if (!contact) {
        this.speak(`I couldn't find ${contactName} in your contacts. Please check the name and try again.`);
        return;
      }

      this.speak(`Found ${contact.name}. Would you like to call ${contact.phoneNumber}? Say yes to confirm or no to cancel.`);
      
      ContactService.setPendingCall(contact);

    } catch (error) {
      console.error('Call command error:', error);
      this.speakError('Sorry, I encountered an error while trying to find that contact.');
    }
  }

  private static async confirmCall(isConfirmed: boolean) {
    const pendingCall = ContactService.getPendingCall();
    
    if (!pendingCall) {
      this.speak('No call to confirm.');
      return;
    }

    if (isConfirmed) {
      try {
        const phoneUrl = `tel:${pendingCall.phoneNumber}`;
        const canOpen = await Linking.canOpenURL(phoneUrl);
        
        if (canOpen) {
          this.speak(`Calling ${pendingCall.name} now.`);
          await Linking.openURL(phoneUrl);
        } else {
          this.speakError('Unable to make phone calls on this device.');
        }
      } catch (error) {
        this.speakError('Error making the call. Please try again.');
      }
    } else {
      this.speak('Call cancelled.');
    }

    ContactService.clearPendingCall();
  }

  private static async takePicture() {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        this.speakError('Camera permission required to scan text');
        return;
      }

      this.speak('Taking picture. Hold still and keep the text in frame.');

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        exif: false,
      });

      if (!result.canceled && result.assets[0]) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        this.speak('Image captured. Processing text, please wait.');
        
        const ocrResult = await OCRService.processImage(result.assets[0].uri);
        
        if (ocrResult.error) {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          this.speakError(`Error processing image: ${ocrResult.error}`);
        } else if (ocrResult.text) {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          this.speak(`Text detected with ${ocrResult.confidence}% confidence: ${ocrResult.text}`);
        } else {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          this.speak('No text found in the image. Try adjusting lighting or getting closer to the text.');
        }
      } else {
        this.speak('Picture cancelled');
      }
    } catch (error) {
      console.error('Camera error:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      this.speakError('Error taking picture. Please try again.');
    }
  }

  static handleConfirmation(command: string) {
    const pendingCall = ContactService.getPendingCall();
    
    if (pendingCall) {
      if (this.matchCommand(command, ['yes', 'yeah', 'yep', 'confirm', 'okay', 'ok', 'sure'])) {
        this.confirmCall(true);
        return true;
      } else if (this.matchCommand(command, ['no', 'nope', 'cancel', 'nevermind', 'stop'])) {
        this.confirmCall(false);
        return true;
      }
    }
    
    return false;
  }

  static getLastRecognizedText(): string {
    return this.lastRecognizedText;
  }

  static getCommandHistory(): string[] {
    return [...this.commandHistory];
  }

  static clearHistory() {
    this.commandHistory = [];
    this.lastRecognizedText = '';
  }

  // Method to get available voices
  static async getAvailableVoices() {
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      return voices;
    } catch (error) {
      console.error('Error getting available voices:', error);
      return [];
    }
  }

  // Check if speech is currently playing
  static async isSpeaking(): Promise<boolean> {
    return Speech.isSpeakingAsync();
  }

  // Stop current speech
  static stopSpeech() {
    Speech.stop();
  }

  // Pause speech (if supported)
  static pauseSpeech() {
    Speech.pause();
  }

  // Resume speech (if supported)  
  static resumeSpeech() {
    Speech.resume();
  }
}