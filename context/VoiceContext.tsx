import { GlobalVoiceCommandService } from '@/services/GlobalVoiceCommandService';
import { TTSService } from '@/services/TTSServices';
import { WakeWordService } from '@/services/WakeWordService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { VoiceService } from '../services/VoiceService';
import { useAccessibility } from './AccessibilityContext';

interface VoiceContextType {
  startListening: () => Promise<void>;
  stopListening: () => Promise<void>;
  processTextCommand: (command: string) => void;
  getLastRecognizedText: () => string;
  getCommandHistory: () => string[];
  clearHistory: () => void;
  startWakeWordListening: () => void;
  stopWakeWordListening: () => void;
  isWakeWordActive: boolean;
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
  const [isWakeWordActive, setIsWakeWordActive] = useState(false);

  useEffect(() => {
    VoiceService.initialize(router, setIsListening);
    GlobalVoiceCommandService.initialize(router);
    
    WakeWordService.initialize(() => {
      setIsWakeWordActive(true);
      TTSService.speak('Yes?');
    });

    // Auto-start wake word listening after onboarding completion
    const checkAndStartWakeWord = async () => {
      try {
        const onboarded = await AsyncStorage.getItem('onboarding_completed');
        if (onboarded === 'true') {
          // Start wake word after short delay to ensure everything is initialized
          setTimeout(() => {
            WakeWordService.startListening();
            setIsWakeWordActive(true);
            console.log('✅ Wake word listening auto-started');
          }, 3000);
        }
      } catch (error) {
        console.log('⚠️ Failed to check onboarding status:', error);
      }
    };
    
    checkAndStartWakeWord();

    return () => {
      VoiceService.cleanup();
      WakeWordService.cleanup();
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

  const startWakeWordListening = () => {
    WakeWordService.startListening();
    setIsWakeWordActive(true);
    console.log('Wake word listening started');
  };

  const stopWakeWordListening = () => {
    WakeWordService.stopListening();
    setIsWakeWordActive(false);
    console.log('Wake word listening stopped');
  };

  const value: VoiceContextType = {
    startListening,
    stopListening,
    processTextCommand,
    getLastRecognizedText,
    getCommandHistory,
    clearHistory,
    startWakeWordListening,
    stopWakeWordListening,
    isWakeWordActive,
  };

  return (
    <VoiceContext.Provider value={value}>
      {children}
    </VoiceContext.Provider>
  );
};