import { useRouter } from 'expo-router';
import React, { createContext, ReactNode, useContext, useEffect } from 'react';
import { VoiceService } from '../services/VoiceService';
import { useAccessibility } from './AccessibilityContext';

interface VoiceContextType {
  startListening: () => Promise<void>;
  stopListening: () => Promise<void>;
  processTextCommand: (command: string) => void;
  getLastRecognizedText: () => string;
  getCommandHistory: () => string[];
  clearHistory: () => void;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export const useVoice = (): VoiceContextType => {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
};

export const VoiceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { setIsListening } = useAccessibility();
  const router = useRouter();

  useEffect(() => {
    // Initialize VoiceService with Expo Router
    VoiceService.initialize(router, setIsListening);

    return () => {
      VoiceService.cleanup();
    };
  }, [router, setIsListening]);

  const startListening = async () => {
    await VoiceService.startListening();
  };

  const stopListening = async () => {
    await VoiceService.stopListening();
  };

  const processTextCommand = (command: string) => {
    VoiceService.processTextCommand(command);
  };

  const getLastRecognizedText = () => {
    return VoiceService.getLastRecognizedText();
  };

  const getCommandHistory = () => {
    return VoiceService.getCommandHistory();
  };

  const clearHistory = () => {
    VoiceService.clearHistory();
  };

  const value: VoiceContextType = {
    startListening,
    stopListening,
    processTextCommand,
    getLastRecognizedText,
    getCommandHistory,
    clearHistory,
  };

  return (
    <VoiceContext.Provider value={value}>
      {children}
    </VoiceContext.Provider>
  );
};