// src/contexts/AccessibilityContext.tsx
import React, { createContext, ReactNode, useContext, useState } from 'react';
import { AccessibilityState } from '../types';

interface AccessibilityContextType extends AccessibilityState {
  setIsListening: (listening: boolean) => void;
  setIsSpeaking: (speaking: boolean) => void;
  setCurrentScreen: (screen: string) => void;
  setLastSpokenText: (text: string) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};

export const AccessibilityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('Home');
  const [lastSpokenText, setLastSpokenText] = useState('');

  return (
    <AccessibilityContext.Provider
      value={{
        isListening,
        isSpeaking,
        currentScreen,
        lastSpokenText,
        setIsListening,
        setIsSpeaking,
        setCurrentScreen,
        setLastSpokenText,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};