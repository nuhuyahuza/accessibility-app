import { AppState, AppStateStatus } from 'react-native';
import { GoogleSpeechService } from './GoogleSpeechService';
import { TTSService } from './TTSServices';
import * as Haptics from 'expo-haptics';

export class WakeWordService {
  private static isListening: boolean = false;
  private static isProcessingWakeWord: boolean = false;
  private static appState: AppStateStatus = 'active';
  private static wakeWords: string[] = ['hey assistant', 'hey app', 'assistant', 'hello assistant'];
  private static listeners: Set<(command: string) => void> = new Set();
  private static onWakeWordDetected?: () => void;
  private static continuousListeningEnabled: boolean = false;
  private static appStateSubscription: any = null;

  static initialize(onWakeWordDetected?: () => void) {
    this.onWakeWordDetected = onWakeWordDetected;
    
    // Use modern AppState subscription pattern
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
    
    console.log('WakeWordService initialized');
  }

  static cleanup() {
    this.stopListening();
    
    // Remove subscription using modern API
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
  }

  private static handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (this.appState.match(/inactive|background/) && nextAppState === 'active') {
      if (this.continuousListeningEnabled && !this.isListening) {
        this.startListening();
      }
    } else if (nextAppState.match(/inactive|background/)) {
      this.pauseListening();
    }
    
    this.appState = nextAppState;
  };

  static startListening() {
    if (this.isListening) return;
    
    this.isListening = true;
    this.continuousListeningEnabled = true;
    this.listenForWakeWord();
    
    console.log('Wake word listening started');
  }

  static stopListening() {
    this.isListening = false;
    this.continuousListeningEnabled = false;
    GoogleSpeechService.cancelRecording();
    
    console.log('Wake word listening stopped');
  }

  static pauseListening() {
    this.isListening = false;
    GoogleSpeechService.cancelRecording();
  }

  private static async listenForWakeWord() {
    while (this.isListening && this.appState === 'active') {
      try {
        if (this.isProcessingWakeWord) {
          await new Promise(resolve => setTimeout(resolve, 100));
          continue;
        }

        this.isProcessingWakeWord = true;
        
        await GoogleSpeechService.startRecording();
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const audioUri = await GoogleSpeechService.stopRecording();
        
        if (audioUri && this.isListening) {
          const result = await GoogleSpeechService.recognizeSpeech(audioUri);
          
          if (result.transcript) {
            const lowerTranscript = result.transcript.toLowerCase().trim();
            console.log('Wake word check:', lowerTranscript);
            
            if (this.containsWakeWord(lowerTranscript)) {
              await this.handleWakeWordDetected();
            }
          }
        }
        
        this.isProcessingWakeWord = false;
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error('Wake word listening error:', error);
        
        if (error instanceof Error && error.message.includes('Expo Go')) {
          console.log('Wake word detection not available in Expo Go - stopping');
          this.isListening = false;
          this.continuousListeningEnabled = false;
          break;
        }
        
        this.isProcessingWakeWord = false;
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  private static containsWakeWord(text: string): boolean {
    return this.wakeWords.some(wakeWord => 
      text.includes(wakeWord) || 
      this.levenshteinDistance(text, wakeWord) <= 2
    );
  }

  private static async handleWakeWordDetected() {
    console.log('Wake word detected!');
    
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    TTSService.speak('Yes?');
    
    if (this.onWakeWordDetected) {
      this.onWakeWordDetected();
    }
    
    this.pauseListening();
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    await this.listenForCommand();
  }

  private static async listenForCommand() {
    try {
      await GoogleSpeechService.startRecording();
      
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      const audioUri = await GoogleSpeechService.stopRecording();
      
      if (audioUri) {
        const result = await GoogleSpeechService.recognizeSpeech(audioUri);
        
        if (result.transcript) {
          console.log('Command received:', result.transcript);
          this.notifyListeners(result.transcript);
        } else {
          TTSService.speak("I didn't hear anything. Say Hey Assistant to try again.");
        }
      }
    } catch (error) {
      console.error('Command listening error:', error);
    } finally {
      if (this.continuousListeningEnabled) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        this.isListening = true;
        this.listenForWakeWord();
      }
    }
  }

  static addCommandListener(listener: (command: string) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private static notifyListeners(command: string) {
    this.listeners.forEach(listener => {
      try {
        listener(command);
      } catch (error) {
        console.error('Listener error:', error);
      }
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

  static getIsListening(): boolean {
    return this.isListening;
  }

  static setWakeWords(words: string[]) {
    this.wakeWords = words.map(w => w.toLowerCase());
  }
}

