import AccessibleButton from '@/components/AccessibleButton';
import { useSettings } from '@/context/SettingsContext';
import { speak } from '@/utils/speechUtils';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function TextReviewScreen() {
  const { text } = useLocalSearchParams();
  const router = useRouter();
  const { settings } = useSettings();

  useEffect(() => {
    if (text) {
      speak(text as string, settings.pitch, settings.rate, settings.language);
    }
  }, [text, settings]);

  const handleReplay = () => {
    speak(text as string, settings.pitch, settings.rate, settings.language);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll}>
        <Text style={styles.text}>{text}</Text>
      </ScrollView>
      <AccessibleButton label="Read Again" onPress={handleReplay} />
      <AccessibleButton label="Go Home" onPress={() => router.replace('/')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  scroll: { flex: 1, marginBottom: 20 },
  text: { fontSize: 16 },
});
