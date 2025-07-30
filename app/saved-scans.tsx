import AccessibleButton from '@/components/AccessibleButton';
import { speak } from '@/utils/speechUtils';
import { getSavedScans } from '@/utils/storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

type ScanItem = {
  id: string;
  text: string;
  date: string;
};

export default function SavedScansScreen() {
  const [scans, setScans] = useState<ScanItem[]>([]);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      try {
        const items = await getSavedScans();
        setScans(items);
      } catch {
        Alert.alert('Error loading saved scans');
      }
    };
    load();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Saved Scans</Text>
      {scans.length === 0 ? (
        <Text style={styles.empty}>No saved scans yet.</Text>
      ) : (
        scans.map(scan => (
          <View key={scan.id} style={styles.card}>
            <Text style={styles.date}>{scan.date}</Text>
            <Text numberOfLines={4} style={styles.preview}>{scan.text}</Text>
            <AccessibleButton label="Read Aloud" onPress={() => speak(scan.text)} />
          </View>
        ))
      )}
      <AccessibleButton label="Back to Home" onPress={() => router.replace('/')} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  empty: { textAlign: 'center', fontSize: 16, marginTop: 20 },
  card: {
    backgroundColor: '#f1f1f1',
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
  },
  date: { fontSize: 12, marginBottom: 5 },
  preview: { fontSize: 16 },
});
