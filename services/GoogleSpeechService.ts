import { Audio } from 'expo-av';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import { Alert, Linking } from 'react-native';

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

  static async checkAndRequestPermission(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Audio.getPermissionsAsync();
      console.log('🎤 Current microphone permission status:', existingStatus);
      
      if (existingStatus === 'granted') {
        console.log('✅ Microphone permission already granted');
        return true;
      }
      
      console.log('📋 Requesting microphone permission...');
      const { status } = await Audio.requestPermissionsAsync();
      console.log('📋 Permission request result:', status);
      
      if (status !== 'granted') {
        console.log('❌ Microphone permission denied');
        Alert.alert(
          'Microphone Permission Required',
          'Voice commands require microphone access. Please enable it in your device settings to use voice features.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Open Settings', 
              onPress: () => {
                Linking.openSettings().catch(() => {
                  console.log('Could not open settings');
                });
              }
            }
          ]
        );
        return false;
      }
      
      console.log('✅ Microphone permission granted');
      return true;
    } catch (error) {
      console.error('❌ Permission error:', error);
      return false;
    }
  }

  static async startRecording(): Promise<void> {
    try {
      console.log('🎙️ Starting recording...');
      
      // Check permission first
      const hasPermission = await this.checkAndRequestPermission();
      if (!hasPermission) {
        throw new Error('Microphone permission not granted. Please enable microphone access in device settings.');
      }

      console.log('🔧 Setting audio mode...');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      console.log('✅ Audio mode set');

      console.log('📱 Creating recording instance...');
      const recording = new Audio.Recording();
      console.log('✅ Recording instance created');
      
      console.log('⚙️ Preparing to record with WEBM/OPUS (best for Android)...');
      try {
        await recording.prepareToRecordAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        console.log('✅ Recording prepared with HIGH_QUALITY preset (WebM/Opus)');
      } catch (prepError) {
        console.error('❌ Failed to prepare recording:', prepError);
        throw prepError;
      }

      console.log('▶️ Starting recording...');
      try {
        await recording.startAsync();
        console.log('✅ Recording start command sent');
      } catch (startError) {
        console.error('❌ Failed to start recording:', startError);
        throw startError;
      }
      
      this.recording = recording;
      this.isRecording = true;
      console.log('✅✅✅ Recording started successfully! isRecording:', this.isRecording);
    } catch (error) {
      console.error('❌❌❌ Failed to start recording - MAIN CATCH:', error);
      this.recording = null;
      this.isRecording = false;
      
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack?.substring(0, 300));
        
        if (error.message.includes('recorder not prepared') || error.message.includes('E_AUDIO_RECORDINGERROR')) {
          throw new Error('Voice recording is not available in Expo Go. Please build a development APK to use voice features. Run: npm run build:apk');
        }
      }
      throw error;
    }
  }

  static async stopRecording(): Promise<string | null> {
    try {
      console.log('⏹️ Attempting to stop recording...');
      console.log('⏹️ Recording object exists:', !!this.recording);
      console.log('⏹️ isRecording flag:', this.isRecording);
      
      if (!this.recording) {
        console.error('❌ No recording object found - recording may have failed to start');
        throw new Error('No recording in progress');
      }

      // Check recording status BEFORE stopping
      console.log('📊 Getting recording status...');
      const status = await this.recording.getStatusAsync();
      console.log('📊 Recording status:', JSON.stringify(status));
      console.log('📊 Duration recorded (ms):', status.durationMillis);
      console.log('📊 Is recording:', status.isRecording);
      
      console.log('⏹️ Stopping and unloading recording...');
      await this.recording.stopAndUnloadAsync();
      console.log('✅ Recording stopped');
      
      console.log('📁 Getting recording URI...');
      const uri = this.recording.getURI();
      console.log('📁 Recording URI:', uri);
      
      this.recording = null;
      this.isRecording = false;
      
      if (!uri) {
        console.error('❌ Recording URI is null - recording failed');
        return null;
      }
      
      if (status.durationMillis < 100) {
        console.error('❌ Recording too short - likely no audio captured');
        return null;
      }
      
      // Check file size
      try {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        console.log('📏 File exists:', fileInfo.exists);
        console.log('📏 File size:', fileInfo.size, 'bytes');
        
        if (fileInfo.exists && fileInfo.size < 1000) {
          console.error('❌ File too small - likely silent recording');
          return null;
        }
      } catch (error) {
        console.error('⚠️ Could not check file info:', error);
      }
      
      console.log('✅✅✅ Recording stopped successfully, saved to:', uri);
      return uri;
    } catch (error) {
      console.error('❌❌❌ Failed to stop recording:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
      this.recording = null;
      this.isRecording = false;
      return null;
    }
  }

  static getIsRecording(): boolean {
    return this.isRecording;
  }

  static async recognizeSpeech(audioUri: string, languageCode: string = 'en-US'): Promise<SpeechRecognitionResult> {
    try {
      // Validate API key
      if (!GOOGLE_SPEECH_API_KEY || GOOGLE_SPEECH_API_KEY === 'fallback-key' || GOOGLE_SPEECH_API_KEY === 'undefined') {
        console.error('❌ Google Speech API key not configured');
        throw new Error('API_KEY_NOT_CONFIGURED');
      }
      
      console.log('🔑 API Key exists:', !!GOOGLE_SPEECH_API_KEY);
      console.log('🔑 API Key length:', GOOGLE_SPEECH_API_KEY?.length);
      console.log('🔑 API Key preview:', GOOGLE_SPEECH_API_KEY?.substring(0, 10) + '...');

      console.log('📖 Reading audio file from:', audioUri);
      const base64Audio = await FileSystem.readAsStringAsync(audioUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      console.log('📦 Audio file size:', base64Audio.length, 'characters');

      // Detect audio format from file extension
      const audioFormat = audioUri.toLowerCase().endsWith('.m4a') || audioUri.toLowerCase().endsWith('.mp4') 
        ? 'MP3'  // Google API accepts AAC/M4A as MP3
        : audioUri.toLowerCase().endsWith('.webm') 
        ? 'WEBM_OPUS'
        : 'LINEAR16';  // Fallback
      
      console.log('🎵 Detected audio format:', audioFormat, 'from URI:', audioUri);

      const requestBody = {
        config: {
          encoding: audioFormat,
          // Don't specify sampleRate for MP3/M4A - let API auto-detect
          ...(audioFormat !== 'MP3' && { sampleRateHertz: 48000 }),
          languageCode: languageCode,
          enableAutomaticPunctuation: true,
          model: 'command_and_search',
          useEnhanced: false,
        },
        audio: {
          content: base64Audio,
        },
      };
      
      console.log('📋 Request config:', JSON.stringify(requestBody.config));
      console.log('📋 Audio data length:', base64Audio.length, 'chars (~', Math.round(base64Audio.length * 0.75 / 1024), 'KB)');

      console.log('🌐 Sending request to Google Speech API...');
      const response = await fetch(`${GOOGLE_SPEECH_API_URL}?key=${GOOGLE_SPEECH_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📡 API Response status:', response.status);
      console.log('📡 API Response headers:', JSON.stringify(response.headers));
      
      const responseText = await response.text();
      console.log('📡📡📡 RAW API RESPONSE:', responseText.substring(0, 2000));
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Failed to parse API response as JSON');
        console.error('❌ Response was:', responseText.substring(0, 500));
        return {
          transcript: '',
          confidence: 0,
          error: 'Invalid API response format',
        };
      }
      
      if (response.status !== 200) {
        console.error('❌ API returned non-200 status:', response.status);
        console.error('❌ Error response:', JSON.stringify(result, null, 2));
        return {
          transcript: '',
          confidence: 0,
          error: `API Error ${response.status}: ${result.error?.message || 'Unknown error'}`,
        };
      }
      
      console.log('📡 Parsed API Response:', JSON.stringify(result, null, 2).substring(0, 1000));

      if (result.error) {
        console.error('❌ API Error:', result.error);
        console.error('❌ Error code:', result.error.code);
        console.error('❌ Error message:', result.error.message);
        console.error('❌ Error status:', result.error.status);
        
        // Check if Speech-to-Text API is not enabled
        if (result.error.message?.includes('Speech-to-Text API has not been used') || 
            result.error.message?.includes('API has not been enabled')) {
          return {
            transcript: '',
            confidence: 0,
            error: 'Speech-to-Text API not enabled. Please enable it in Google Cloud Console.',
          };
        }
        
        return {
          transcript: '',
          confidence: 0,
          error: result.error.message || 'API Error',
        };
      }

      const results = result.results || [];
      
      if (results.length === 0 || !results[0].alternatives || results[0].alternatives.length === 0) {
        console.log('⚠️ No speech detected in audio');
        console.log('⚠️ This could mean:');
        console.log('  1. Microphone is not picking up sound');
        console.log('  2. Audio file is silent/corrupted');
        console.log('  3. Background noise is too loud');
        console.log('  4. Speech is too quiet');
        return {
          transcript: '',
          confidence: 0,
          error: 'No speech detected',
        };
      }

      const alternative = results[0].alternatives[0];
      console.log('✅ Recognized:', alternative.transcript);
      
      return {
        transcript: alternative.transcript || '',
        confidence: Math.round((alternative.confidence || 0) * 100),
      };
    } catch (error) {
      console.error('❌ Google Speech Recognition Error:', error);
      
      // Check if it's API key error
      if (error instanceof Error && error.message === 'API_KEY_NOT_CONFIGURED') {
        return {
          transcript: '',
          confidence: 0,
          error: 'API_KEY_NOT_CONFIGURED',
        };
      }
      
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
      console.log('🚫 cancelRecording() called');
      if (this.recording && this.isRecording) {
        console.log('🚫 Canceling active recording...');
        await this.recording.stopAndUnloadAsync();
        this.recording = null;
        this.isRecording = false;
        console.log('✅ Recording canceled');
      } else {
        console.log('ℹ️ No active recording to cancel');
      }
    } catch (error) {
      console.error('❌ Failed to cancel recording:', error);
    }
  }
}

