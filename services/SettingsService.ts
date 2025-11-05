import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

export interface AppSettings {
  autoSave: boolean;
  speechEnabled: boolean;
  darkMode: boolean;
  notifications: boolean;
  hapticFeedback: boolean;
  autoCapture: boolean;
  scanQuality: 'low' | 'medium' | 'high';
  readingSpeed: number;
}

const DEFAULT_SETTINGS: AppSettings = {
  autoSave: true,
  speechEnabled: true,
  darkMode: false,
  notifications: true,
  hapticFeedback: true,
  autoCapture: false,
  scanQuality: 'high',
  readingSpeed: 0.75,
};

class SettingsServiceClass {
  private settings: AppSettings = DEFAULT_SETTINGS;
  private listeners: Set<(settings: AppSettings) => void> = new Set();

  async initialize() {
    try {
      const saved = await AsyncStorage.getItem('app_settings');
      if (saved) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
      console.log('Settings initialized:', this.settings);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  async getSettings(): Promise<AppSettings> {
    if (!this.settings) {
      await this.initialize();
    }
    return this.settings;
  }

  async updateSetting<K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ): Promise<void> {
    try {
      this.settings = { ...this.settings, [key]: value };
      await AsyncStorage.setItem('app_settings', JSON.stringify(this.settings));
      this.notifyListeners();
      console.log(`Setting updated: ${key} = ${value}`);
    } catch (error) {
      console.error('Error saving setting:', error);
      throw error;
    }
  }

  async updateSettings(updates: Partial<AppSettings>): Promise<void> {
    try {
      this.settings = { ...this.settings, ...updates };
      await AsyncStorage.setItem('app_settings', JSON.stringify(this.settings));
      this.notifyListeners();
      console.log('Settings updated:', updates);
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }

  subscribe(listener: (settings: AppSettings) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.settings);
      } catch (error) {
        console.error('Error notifying listener:', error);
      }
    });
  }

  async exportData(): Promise<void> {
    try {
      // Get all saved texts
      const savedTextsData = await FileSystem.readAsStringAsync(
        FileSystem.documentDirectory + 'saved_texts.json'
      ).catch(() => '[]');

      const savedTexts = JSON.parse(savedTextsData);

      // Get app settings
      const settings = await this.getSettings();

      // Create export object
      const exportData = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        settings,
        savedTexts,
        totalDocuments: savedTexts.length,
      };

      // Create export file
      const fileName = `accessibility-app-export-${Date.now()}.json`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(
        fileUri,
        JSON.stringify(exportData, null, 2)
      );

      // Check if sharing is available
      const isSharingAvailable = await Sharing.isAvailableAsync();

      if (isSharingAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Export App Data',
        });
        console.log('Data exported successfully');
      } else {
        Alert.alert(
          'Export Complete',
          `Data saved to: ${fileName}\nLocation: ${FileSystem.documentDirectory}`
        );
      }
    } catch (error) {
      console.error('Export error:', error);
      throw new Error('Failed to export data');
    }
  }

  getQualityValue(quality: 'low' | 'medium' | 'high'): number {
    switch (quality) {
      case 'low':
        return 0.5;
      case 'medium':
        return 0.75;
      case 'high':
        return 1.0;
      default:
        return 0.9;
    }
  }

  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.clear();
      this.settings = DEFAULT_SETTINGS;
      this.notifyListeners();
      console.log('All data cleared');
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  }
}

export const SettingsService = new SettingsServiceClass();


