import AccessibleButton from '@/components/AccessibleButton';
import { speak } from '@/utils/speechUtils';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function Onboarding() {
  const router = useRouter();

  useEffect(() => {
    speak(
      "Welcome to the Accessibility App. Tap the screen to scan text. Your phone will read it aloud."
    );
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to the Accessibility App</Text>
      <AccessibleButton label="Get Started" onPress={() => router.replace('/')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
});
