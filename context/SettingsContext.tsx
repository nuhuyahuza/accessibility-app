import React, { createContext, ReactNode, useContext, useState } from 'react';

type Settings = {
  pitch: number;
  rate: number;
  language: string;
};

const defaultSettings: Settings = {
  pitch: 1.0,
  rate: 1.0,
  language: 'en-US',
};

type SettingsContextType = {
  settings: Settings;
  update: (changes: Partial<Settings>) => void;
};

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  update: () => {},
});

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  const update = (changes: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...changes }));
  };

  return (
    <SettingsContext.Provider value={{ settings, update }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
