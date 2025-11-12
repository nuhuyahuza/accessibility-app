import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

type Settings = {
  pitch: number;
  rate: number;
  language: string;
  userName: string;
  voiceName: string;
  isFirstLaunch: boolean;
  preferredVoice: string;
};

const defaultSettings: Settings = {
  pitch: 1.0,
  rate: 1.0,
  language: 'en-US',
  userName: '',
  voiceName: 'Default',
  isFirstLaunch: true,
  preferredVoice: 'default',
};

type SettingsContextType = {
  settings: Settings;
  update: (changes: Partial<Settings>) => void;
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
};

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  update: () => {},
  loadSettings: async () => {},
  saveSettings: async () => {},
});

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  const update = (changes: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...changes }));
  };

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('userSettings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(parsedSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem('userSettings', JSON.stringify(settings));
      
      // Sync isFirstLaunch with onboarding_completed
      if (!settings.isFirstLaunch) {
        await AsyncStorage.setItem('onboarding_completed', 'true');
        console.log('✅ Synced onboarding_completed with settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    saveSettings();
  }, [settings]);

  return (
    <SettingsContext.Provider value={{ settings, update, loadSettings, saveSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
