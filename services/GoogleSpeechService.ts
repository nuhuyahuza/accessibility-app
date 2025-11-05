import { Audio } from 'expo-av';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';

const GOOGLE_SPEECH_API_KEY = Constants.expoConfig?.extra?.GOOGLE_VISION_API_KEY || Constants.manifest?.extra?.GOOGLE_VISION_API_KEY;
const GOOGLE_SPEECH_API_URL = 'https://speech.googleapis.com/v1/speech:recognize';

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  error?: string;
}

export class GoogleSpeechService {
  private static recording: Audio.Recording | null = null;
  private static isRecording: boolean = false;

  static async startRecording(): Promise<void> {
    try {
      console.log('Requesting audio permission...');
      const { status } = await Audio.requestPermissionsAsync();
      
      if (status !== 'granted') {
        throw new Error('Microphone permission not granted. Please enable microphone access in device settings.');
      }

      console.log('Setting audio mode...');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      console.log('Creating recording instance...');
      const recording = new Audio.Recording();
      
      console.log('Preparing to record...');
      await recording.prepareToRecordAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      });

      console.log('Starting recording...');
      await recording.startAsync();
      this.recording = recording;
      this.isRecording = true;
      console.log('Recording started successfully');
    } catch (error) {
      console.error('Failed to start recording:', error);
      this.recording = null;
      this.isRecording = false;
      
      if (error instanceof Error) {
        if (error.message.includes('recorder not prepared') || error.message.includes('E_AUDIO_RECORDINGERROR')) {
          throw new Error('Voice recording is not available in Expo Go. Please build a development APK to use voice features. Run: npm run build:apk');
        }
      }
      throw error;
    }
  }

  static async stopRecording(): Promise<string | null> {
    try {
      if (!this.recording) {
        throw new Error('No recording in progress');
      }

      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      this.recording = null;
      this.isRecording = false;
      
      console.log('Recording stopped, saved to:', uri);
      return uri;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      return null;
    }
  }

  static getIsRecording(): boolean {
    return this.isRecording;
  }

  static async recognizeSpeech(audioUri: string, languageCode: string = 'en-US'): Promise<SpeechRecognitionResult> {
    try {
      const base64Audio = await FileSystem.readAsStringAsync(audioUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const requestBody = {
        config: {
          encoding: 'LINEAR16',
          sampleRateHertz: 16000,
          languageCode: languageCode,
          enableAutomaticPunctuation: true,
          model: 'default',
        },
        audio: {
          content: base64Audio,
        },
      };

      const response = await fetch(`${GOOGLE_SPEECH_API_URL}?key=${GOOGLE_SPEECH_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (result.error) {
        return {
          transcript: '',
          confidence: 0,
          error: result.error.message,
        };
      }

      const results = result.results || [];
      
      if (results.length === 0 || !results[0].alternatives || results[0].alternatives.length === 0) {
        return {
          transcript: '',
          confidence: 0,
          error: 'No speech detected',
        };
      }

      const alternative = results[0].alternatives[0];
      
      return {
        transcript: alternative.transcript || '',
        confidence: Math.round((alternative.confidence || 0) * 100),
      };
    } catch (error) {
      console.error('Google Speech Recognition Error:', error);
      return {
        transcript: '',
        confidence: 0,
        error: error instanceof Error ? error.message : 'Speech recognition failed',
      };
    }
  }

  static async recordAndRecognize(languageCode: string = 'en-US'): Promise<SpeechRecognitionResult> {
    try {
      await this.startRecording();
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const audioUri = await this.stopRecording();
      
      if (!audioUri) {
        return {
          transcript: '',
          confidence: 0,
          error: 'Failed to record audio',
        };
      }

      return await this.recognizeSpeech(audioUri, languageCode);
    } catch (error) {
      return {
        transcript: '',
        confidence: 0,
        error: error instanceof Error ? error.message : 'Recording failed',
      };
    }
  }

  static async cancelRecording(): Promise<void> {
    try {
      if (this.recording && this.isRecording) {
        await this.recording.stopAndUnloadAsync();
        this.recording = null;
        this.isRecording = false;
      }
    } catch (error) {
      console.error('Failed to cancel recording:', error);
    }
  }
}

