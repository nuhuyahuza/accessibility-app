import AccessibleButton from '@/components/AccessibleButton';
import { summarizeText } from '@/services/summarizeService';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput } from 'react-native';

export default function SummarizeScreen() {
  const [input, setInput] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSummarize = async () => {
    setLoading(true);
    try {
      const result = await summarizeText(input);
      setSummary(result);
    } catch (err) {
      setSummary('Error generating summary.');
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Paste OCR Text:</Text>
      <TextInput
        style={styles.input}
        multiline
        value={input}
        onChangeText={setInput}
        placeholder="Paste scanned text here..."
      />

      <AccessibleButton label="Summarize" onPress={handleSummarize} />

      {loading && <ActivityIndicator size="large" />}
      {summary && (
        <>
          <Text style={styles.label}>Summary:</Text>
          <Text style={styles.output}>{summary}</Text>
        </>
      )}

      <AccessibleButton label="Back to Home" onPress={() => router.replace('/')} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  label: { fontSize: 16, fontWeight: 'bold', marginVertical: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    height: 150,
    textAlignVertical: 'top',
  },
  output: {
    marginTop: 10,
    fontSize: 15,
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
  },
});
