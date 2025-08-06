// src/contexts/VoiceContext.tsx
import { useNavigation } from '@react-navigation/native';
import React, { createContext, ReactNode, useContext, useEffect } from 'react';
import { VoiceService } from '../services/VoiceService';
import { useAccessibility } from './AccessibilityContext';

interface VoiceContextType {
  startListening: () => void;
  stopListening: () => void;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export const useVoice = () => {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoice must be used within VoiceProvider');
  }
  return context;
};

export const VoiceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { setIsListening } = useAccessibility();
  const navigation = useNavigation();

  useEffect(() => {
    VoiceService.initialize(navigation, setIsListening);
    
    return () => {
      VoiceService.cleanup();
    };
  }, [navigation, setIsListening]);

  const startListening = () => {
    VoiceService.startListening();
  };

  const stopListening = () => {
    VoiceService.stopListening();
  };

  return (
    <VoiceContext.Provider value={{ startListening, stopListening }}>
      {children}
    </VoiceContext.Provider>
  );
};