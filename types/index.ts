// src/types/index.ts
export interface OCRResult {
  text: string;
  confidence: number;
  error?: string;
}

export interface VoiceCommand {
  command: string;
  action: () => void;
  description: string;
}

export interface AccessibilityState {
  isListening: boolean;
  isSpeaking: boolean;
  currentScreen: string;
  lastSpokenText: string;
}

export interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
}

export interface CallConfirmation {
  contact: Contact;
  isVisible: boolean;
}

export interface AnimationConfig {
  duration: number;
  useNativeDriver: boolean;
}