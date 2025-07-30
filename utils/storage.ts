import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

export interface ScanItem {
  id: string;
  text: string;
  date: string;
}

const STORAGE_KEY = 'saved_scans';

export const saveScan = async (text: string) => {
  const newScan: ScanItem = {
    id: uuidv4(),
    text,
    date: new Date().toLocaleString(),
  };

  const existing = await getSavedScans();
  const updated = [newScan, ...existing];
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const getSavedScans = async (): Promise<ScanItem[]> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
};
