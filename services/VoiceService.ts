// src/services/VoiceService.ts
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as Linking from "expo-linking";
import { AICommandService } from './AICommandService';
import { ContactService } from './ContactService';
import { OCRService } from './OCRService';
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
      TTSService.speak("Voice recognition is not available in Expo Go. Please use text input or create a development build for full voice features.");
    } catch (error) {
      console.error("Voice start error:", error);
      this.setIsListening(false);
      this.isListening = false;
      TTSService.speak("Voice recognition error. Please try again.");
    }
  }

  static async stopListening() {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
    return patterns.some(
      (pattern) =>
        input.includes(pattern) || this.levenshteinDistance(input, pattern) <= 2
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

        const ocrResult = await OCRService.processImage(result.assets[0].uri);

        if (ocrResult.error) {
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