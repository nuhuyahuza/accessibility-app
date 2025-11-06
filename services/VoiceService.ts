import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as Linking from "expo-linking";
import { AICommandService } from './AICommandService';
import { ContactService } from './ContactService';
import { FallbackOCRService } from './FallbackOCRService';
import { GoogleSpeechService } from './GoogleSpeechService';
import { GoogleVisionService } from './GoogleVisionService';
import { TTSService } from './TTSServices';

export class VoiceService {
  private static navigation: any;
  private static setIsListening: (listening: boolean) => void;
  private static lastRecognizedText: string = "";
  private static commandHistory: string[] = [];
  private static isListening: boolean = false;

  static initialize(
    navigation: any,
    setIsListening: (listening: boolean) => void
  ) {
    this.navigation = navigation;
    this.setIsListening = setIsListening;
  }

  static cleanup() {
    // Cleanup if needed
  }

  static async startListening() {
    try {
      await TTSService.stop();
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      this.setIsListening(true);
      this.isListening = true;
      
      console.log('🎤 Attempting to start voice listening...');
      
      await GoogleSpeechService.startRecording();
      // Silent - just beep (haptic feedback already provided above)
      
      setTimeout(async () => {
        if (this.isListening) {
          console.log('⏱️ Recording timeout reached (8 seconds)');
          
          // Update UI state but DON'T cancel recording yet
          this.setIsListening(false);
          this.isListening = false;
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          
          // Now stop recording and get the audio
          const audioUri = await GoogleSpeechService.stopRecording();
          
          if (audioUri) {
            console.log('🎵 Audio recorded, processing...');
            // Silent processing - no voice announcement
            const result = await GoogleSpeechService.recognizeSpeech(audioUri);
            
            console.log('📝 Recognition result:', result);
            
            if (result.error) {
              console.error('🚨 Speech recognition error:', result.error);
              
              if (result.error === 'API_KEY_NOT_CONFIGURED') {
                console.log('⚠️ API key not configured');
                TTSService.speak("Voice service not configured. Please use touch controls.");
              } else if (result.error.includes('Speech-to-Text API has not been used') || 
                         result.error.includes('API has not been enabled')) {
                console.log('⚠️ Speech-to-Text API not enabled in Google Cloud');
                TTSService.speak("Voice recognition service not enabled. Please enable Speech to Text API in Google Cloud Console, or use touch controls.");
              } else if (result.error === 'No speech detected') {
                console.log('⚠️ No speech detected - might be silent recording or API issue');
                TTSService.speak("I didn't hear anything. Please speak louder or try again.");
              } else if (result.error.includes('permission')) {
                TTSService.speak("Microphone permission denied. Please enable it in settings.");
              } else if (result.error.includes('API key not valid') || result.error.includes('invalid')) {
                console.log('⚠️ Invalid API key for Speech-to-Text');
                TTSService.speak("Voice API key is invalid. Please use touch controls.");
              } else {
                TTSService.speak(`Recognition error: ${result.error.substring(0, 50)}. Please use touch controls.`);
              }
            } else if (result.transcript) {
              console.log('✅ Recognized text:', result.transcript);
              this.addToHistory(result.transcript);
              await this.processVoiceCommand(result.transcript);
            } else {
              TTSService.speak("I didn't hear anything. Please try again.");
            }
          } else {
            console.log('❌ No audio recorded');
            TTSService.speak("Recording failed. Please try again.");
          }
        }
      }, 8000); // Increased to 8 seconds for more natural speech
    } catch (error) {
      console.error("❌ Voice start error:", error);
      this.setIsListening(false);
      this.isListening = false;
      
      // Detailed error handling
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack?.substring(0, 200)
        });
        
        if (error.message.includes('Expo Go')) {
          TTSService.speak("Voice recognition is not available in Expo Go. You can use touch controls, or build a development APK for full voice features.");
        } else if (error.message.includes('permission')) {
          TTSService.speak("Microphone permission denied. Please enable it in device settings.");
        } else if (error.message.includes('API_KEY')) {
          TTSService.speak("Voice service not configured. Using touch controls.");
        } else {
          TTSService.speak("Voice recognition error. Please use touch controls.");
        }
      } else {
        TTSService.speak("Voice recognition error. Please use touch controls.");
      }
    }
  }

  static async stopListening() {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await GoogleSpeechService.cancelRecording();
      this.setIsListening(false);
      this.isListening = false;
    } catch (error) {
      console.error("Voice stop error:", error);
      this.setIsListening(false);
      this.isListening = false;
    }
  }

  // Note: Speech recognition is not available in Expo Go
  // These methods are placeholders for when using a development build

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
    if (this.matchCommand(command, ["home", "main", "go home", "main menu"])) {
      this.navigation.navigate("Home");
      TTSService.speak("Navigating to home screen");
      return;
    }

    if (
      this.matchCommand(command, [
        "help",
        "commands",
        "what can you do",
        "instructions",
      ])
    ) {
      this.navigation.navigate("Help");
      TTSService.speak("Opening help and commands screen");
      return;
    }

    if (
      this.matchCommand(command, [
        "scan",
        "read",
        "camera",
        "take photo",
        "capture",
      ])
    ) {
      this.navigation.navigate("Scan");
      TTSService.speak("Opening camera to scan text");
      return;
    }

    if (
      this.matchCommand(command, [
        "contacts",
        "contact list",
        "phone book",
        "call list",
      ])
    ) {
      this.navigation.navigate("Contacts");
      TTSService.speak("Opening contacts");
      return;
    }

    // Call commands
    if (command.includes("call ")) {
      await this.handleCallCommand(command);
      return;
    }

    // OCR commands
    if (
      this.matchCommand(command, [
        "take picture",
        "capture image",
        "photo",
        "snap",
      ])
    ) {
      await this.takePicture();
      return;
    }

    // TTS control commands
    if (
      this.matchCommand(command, [
        "stop",
        "quiet",
        "silence",
        "shut up",
        "stop talking",
      ])
    ) {
      await TTSService.stop();
      TTSService.speak("Stopped");
      return;
    }

    if (
      this.matchCommand(command, ["repeat", "again", "say again", "read again"])
    ) {
      TTSService.repeatLast();
      return;
    }

    if (this.matchCommand(command, ["pause", "hold on", "wait"])) {
      await TTSService.pause();
      TTSService.speak("Paused");
      return;
    }

    if (
      this.matchCommand(command, ["continue", "resume", "go on", "keep going"])
    ) {
      await TTSService.resume();
      return;
    }

    // Utility commands
    if (this.matchCommand(command, ["what time", "time", "current time"])) {
      const now = new Date();
      const timeString = now.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      TTSService.speak(`The current time is ${timeString}`);
      return;
    }

    if (this.matchCommand(command, ["what date", "date", "today's date"])) {
      const now = new Date();
      const dateString = now.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      TTSService.speak(`Today is ${dateString}`);
      return;
    }

    // Emergency commands
    if (
      this.matchCommand(command, [
        "emergency",
        "help me",
        "911",
        "call emergency",
      ])
    ) {
      TTSService.speak(
        "Would you like me to call emergency services? Say yes to confirm or no to cancel."
      );
      // This would need additional confirmation logic
      return;
    }

    // Default response with suggestions
    const suggestions = this.getSuggestions(command);
    TTSService.speak(`I didn't understand "${command}". ${suggestions}`);
  }

  private static matchCommand(input: string, patterns: string[]): boolean {
    const normalizedInput = input.toLowerCase().trim();
    
    return patterns.some((pattern) => {
      const normalizedPattern = pattern.toLowerCase().trim();
      
      // Exact substring match (case-insensitive)
      if (normalizedInput.includes(normalizedPattern)) {
        console.log(`✅ Exact match: "${normalizedPattern}" found in "${normalizedInput}"`);
        return true;
      }
      
      // Word boundary match - check if any word in the pattern matches any word in input
      const patternWords = normalizedPattern.split(/\s+/);
      const inputWords = normalizedInput.split(/\s+/);
      
      // Check if all keywords from pattern exist in input
      const keywordsMatch = patternWords.every(patternWord => 
        inputWords.some(inputWord => 
          inputWord.includes(patternWord) || patternWord.includes(inputWord)
        )
      );
      
      if (keywordsMatch) {
        console.log(`✅ Keyword match: "${normalizedPattern}" keywords found in "${normalizedInput}"`);
        return true;
      }
      
      // Fuzzy match with Levenshtein distance for typos
      if (this.levenshteinDistance(normalizedInput, normalizedPattern) <= 2) {
        console.log(`✅ Fuzzy match: "${normalizedPattern}" close to "${normalizedInput}"`);
        return true;
      }
      
      return false;
    });
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
      "Say 'contacts' to see your phone book",
    ];

    return suggestions[Math.floor(Math.random() * suggestions.length)];
  }

  private static async handleCallCommand(command: string) {
    try {
      // Extract name from command
      const nameMatch = command.match(/call\s+(.+)/i);
      if (!nameMatch) {
        TTSService.speak(
          'Please specify who you want to call. For example, say "Call John"'
        );
        return;
      }

      const contactName = nameMatch[1].trim();
      TTSService.speak(`Searching for ${contactName} in your contacts...`);

      const contact = await ContactService.findContactByName(contactName);

      if (!contact) {
        TTSService.speak(
          `I couldn't find ${contactName} in your contacts. Please check the name and try again.`
        );
        return;
      }

      // Confirm before calling
      TTSService.speak(
        `Found ${contact.name}. Would you like to call ${contact.phoneNumber}? Say yes to confirm or no to cancel.`
      );

      // Start listening for confirmation
      setTimeout(() => {
        this.startListening();
      }, 3000);

      // Store pending call for confirmation
      ContactService.setPendingCall(contact);
    } catch (error) {
      console.error("Call command error:", error);
      TTSService.speak(
        "Sorry, I encountered an error while trying to find that contact."
      );
    }
  }

  private static async confirmCall(isConfirmed: boolean) {
    const pendingCall = ContactService.getPendingCall();

    if (!pendingCall) {
      TTSService.speak("No call to confirm.");
      return;
    }

    if (isConfirmed) {
      try {
        const phoneUrl = `tel:${pendingCall.phoneNumber}`;
        const canOpen = await Linking.canOpenURL(phoneUrl);

        if (canOpen) {
          TTSService.speak(`Calling ${pendingCall.name} now.`);
          await Linking.openURL(phoneUrl);
        } else {
          TTSService.speak("Unable to make phone calls on this device.");
        }
      } catch (error) {
        TTSService.speak("Error making the call. Please try again.");
      }
    } else {
      TTSService.speak("Call cancelled.");
    }

    ContactService.clearPendingCall();
  }

  private static async takePicture() {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== "granted") {
        TTSService.speak("Camera permission required to scan text");
        return;
      }

      TTSService.speak(
        "Taking picture. Hold still and keep the text in frame."
      );

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        exif: false,
      });

      if (!result.canceled && result.assets[0]) {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
        TTSService.speak("Image captured. Processing text, please wait.");

        let ocrResult = await GoogleVisionService.detectText(result.assets[0].uri);

        // If Google Vision fails or has no API key, try fallback
        if (ocrResult.error && ocrResult.error.includes('API key')) {
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Warning
          );
          TTSService.speak("Google Vision API not configured. Using test mode with sample text.");
          ocrResult = await FallbackOCRService.processMockImage();
        }

        if (ocrResult.error && !ocrResult.text) {
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Error
          );
          TTSService.speak(`Error processing image: ${ocrResult.error}`);
        } else if (ocrResult.text) {
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success
          );
          TTSService.speak(
            `Text detected with ${ocrResult.confidence}% confidence: ${ocrResult.text}`
          );
        } else {
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Warning
          );
          TTSService.speak(
            "No text found in the image. Try adjusting lighting or getting closer to the text."
          );
        }
      } else {
        TTSService.speak("Picture cancelled");
      }
    } catch (error) {
      console.error("Camera error:", error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      TTSService.speak("Error taking picture. Please try again.");
    }
  }

  // Handle confirmation responses
  static handleConfirmation(command: string) {
    const pendingCall = ContactService.getPendingCall();

    if (pendingCall) {
      if (
        this.matchCommand(command, [
          "yes",
          "yeah",
          "yep",
          "confirm",
          "okay",
          "ok",
          "sure",
        ])
      ) {
        this.confirmCall(true);
        return true;
      } else if (
        this.matchCommand(command, [
          "no",
          "nope",
          "cancel",
          "nevermind",
          "stop",
        ])
      ) {
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
    this.lastRecognizedText = "";
  }

  static processTextCommand(command: string) {
    // Use AI command service to process the command
    const result = AICommandService.processCommand(command);
    
    if (result && result.confidence > 0.6) {
      this.executeCommand(result.action, command);
    } else {
      // Fallback to original voice command processing
      this.processVoiceCommand(command);
    }
  }

  private static executeCommand(action: string, originalCommand: string) {
    switch (action) {
      case 'scan_document':
        this.navigation.navigate('Scan');
        TTSService.speak('Opening camera to scan document');
        break;
        
      case 'navigate_home':
        this.navigation.navigate('Home');
        TTSService.speak('Navigating to home screen');
        break;
        
      case 'show_help':
        this.navigation.navigate('Help');
        TTSService.speak('Opening help screen');
        break;
        
      case 'open_settings':
        this.navigation.navigate('Settings');
        TTSService.speak('Opening settings');
        break;
        
      case 'open_history':
        this.navigation.navigate('History');
        TTSService.speak('Opening scan history');
        break;
        
      case 'stop_speech':
        TTSService.stop();
        TTSService.speak('Stopped');
        break;
        
      case 'repeat_last':
        TTSService.repeatLast();
        break;
        
      default:
        // Fallback to original processing
        this.processVoiceCommand(originalCommand);
        break;
    }
  }
}