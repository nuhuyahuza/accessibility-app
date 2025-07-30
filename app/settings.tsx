import AccessibleButton from '@/components/AccessibleButton';
import { useSettings } from '@/context/SettingsContext';
import { speak } from '@/utils/speechUtils';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function SettingsScreen() {
  const { settings, update } = useSettings();
  const router = useRouter();

  const handleTest = () => {
    speak('This is your current voice setting.', settings.pitch, settings.rate, settings.language);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Pitch: {settings.pitch.toFixed(2)}</Text>
      <Slider
        minimumValue={0.5}
        maximumValue={2.0}
        step={0.1}
        value={settings.pitch}
        onValueChange={(v) => update({ pitch: v })}
      />

      <Text style={styles.label}>Rate: {settings.rate.toFixed(2)}</Text>
      <Slider
        minimumValue={0.5}
        maximumValue={2.0}
        step={0.1}
        value={settings.rate}
        onValueChange={(v) => update({ rate: v })}
      />

      <AccessibleButton label="Test Voice" onPress={handleTest} />
      <AccessibleButton label="Back to Home" onPress={() => router.replace('/')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  label: { fontSize: 18, marginTop: 20 },
});
