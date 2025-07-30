import { extractTextFromImage } from '@/services/ocrService';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';

export default function Processing() {
  const { base64 } = useLocalSearchParams();
  const router = useRouter();

  useEffect(() => {
    const runOCR = async () => {
      try {
        const text = await extractTextFromImage(base64 as string);
        if (!text.trim()) {
          Alert.alert('No text detected.');
          router.replace('/camera');
        } else {
          router.replace({ pathname: '/text-review', params: { text } });
        }
      } catch {
        Alert.alert('OCR failed.');
        router.replace('/camera');
      }
    };
    runOCR();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Extracting text...</Text>
      <ActivityIndicator size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18, marginBottom: 10 },
});
