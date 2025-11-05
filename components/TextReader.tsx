import { MD } from '@/constants/MaterialDesign';
import { TTSService } from '@/services/TTSServices';
import * as Speech from 'expo-speech';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface TextReaderProps {
  text: string;
  isPlaying: boolean;
  isPaused: boolean;
  speed: number;
  onPlaybackComplete?: () => void;
  onPositionChange?: (position: number) => void;
}

export const TextReader: React.FC<TextReaderProps> = ({
  text,
  isPlaying,
  isPaused,
  speed,
  onPlaybackComplete,
  onPositionChange,
}) => {
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [sentences, setSentences] = useState<string[]>([]);

  useEffect(() => {
    const splitText = text.match(/[^.!?]+[.!?]+/g) || [text];
    setSentences(splitText.map(s => s.trim()));
  }, [text]);

  useEffect(() => {
    if (isPlaying && !isPaused && sentences.length > 0) {
      speakFromPosition(currentSentenceIndex);
    } else if (isPaused) {
      Speech.stop();
    } else if (!isPlaying) {
      Speech.stop();
      setCurrentSentenceIndex(0);
    }
  }, [isPlaying, isPaused, currentSentenceIndex, sentences]);

  const speakFromPosition = async (startIndex: number) => {
    if (startIndex >= sentences.length) {
      setCurrentSentenceIndex(0);
      if (onPlaybackComplete) {
        onPlaybackComplete();
      }
      return;
    }

    setCurrentSentenceIndex(startIndex);
    if (onPositionChange) {
      onPositionChange(startIndex);
    }

    const sentence = sentences[startIndex];
    
    await Speech.speak(sentence, {
      rate: speed,
      onDone: () => {
        if (isPlaying && !isPaused) {
          speakFromPosition(startIndex + 1);
        }
      },
      onStopped: () => {
        console.log('Speech stopped at sentence:', startIndex);
      },
    });
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={true}
      contentContainerStyle={styles.content}
    >
      {sentences.map((sentence, index) => (
        <Text
          key={index}
          style={[
            styles.sentence,
            index === currentSentenceIndex && isPlaying && styles.sentenceActive,
            index < currentSentenceIndex && styles.sentenceRead,
          ]}
        >
          {sentence}{' '}
        </Text>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: MD.spacing.lg,
  },
  sentence: {
    ...MD.typography.body1,
    color: MD.colors.textPrimary,
    lineHeight: 28,
    fontSize: 18,
  },
  sentenceActive: {
    backgroundColor: '#FFF9C4',
    color: MD.colors.textPrimary,
    fontWeight: '600',
  },
  sentenceRead: {
    color: MD.colors.textSecondary,
    opacity: 0.7,
  },
});

