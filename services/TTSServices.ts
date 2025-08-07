import * as Speech from 'expo-speech';

export class TTSService {
  private static currentSpeech: string = '';
  private static isSpeaking: boolean = false;
  
  static async speak(text: string, options?: Speech.SpeechOptions): Promise<void> {
    if (!text.trim()) return;
    
    try {
      // Stop any current speech
      await this.stop();
      
      this.currentSpeech = text;
      this.isSpeaking = true;
      
      const defaultOptions: Speech.SpeechOptions = {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.75, // Slightly slower for better comprehension
        voice: undefined,
        volume: 1.0,
        ...options
      };

      await Speech.speak(text, {
        ...defaultOptions,
        onStart: () => {
          console.log('TTS Started:', text);
          this.isSpeaking = true;
        },
        onDone: () => {
          console.log('TTS Completed');
          this.currentSpeech = '';
          this.isSpeaking = false;
        },
        onStopped: () => {
          console.log('TTS Stopped');
          this.currentSpeech = '';
          this.isSpeaking = false;
        },
        onError: (error) => {
          console.error('TTS Error:', error);
          this.currentSpeech = '';
          this.isSpeaking = false;
        }
      });
    } catch (error) {
      console.error('TTS Service Error:', error);
      this.isSpeaking = false;
    }
  }

  static async stop(): Promise<void> {
    try {
      await Speech.stop();
      this.currentSpeech = '';
      this.isSpeaking = false;
    } catch (error) {
      console.error('TTS Stop Error:', error);
    }
  }

  static async pause(): Promise<void> {
    try {
      await Speech.pause();
    } catch (error) {
      console.error('TTS Pause Error:', error);
    }
  }

  static async resume(): Promise<void> {
    try {
      await Speech.resume();
    } catch (error) {
      console.error('TTS Resume Error:', error);
    }
  }

  static repeatLast(): void {
    if (this.currentSpeech) {
      this.speak(this.currentSpeech);
    } else {
      this.speak('No previous text to repeat.');
    }
  }

  static getCurrentSpeech(): string {
    return this.currentSpeech;
  }

  static getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  // Enhanced methods for better user experience
  static async speakWithPause(text: string, pauseMs: number = 500): Promise<void> {
    await this.speak(text);
    return new Promise(resolve => setTimeout(resolve, pauseMs));
  }

  static async speakSlowly(text: string): Promise<void> {
    await this.speak(text, { rate: 0.6 });
  }

  static async speakQuickly(text: string): Promise<void> {
    await this.speak(text, { rate: 1.2 });
  }
}