import { TTSService } from '@/services/TTSServices';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import {
    Animated,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface DocumentReaderProps {
  text: string;
  onSave?: () => void;
  autoPlay?: boolean;
}

export const DocumentReader: React.FC<DocumentReaderProps> = ({
  text,
  onSave,
  autoPlay = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [readingSpeed, setReadingSpeed] = useState(0.75);
  const [currentPosition, setCurrentPosition] = useState(0);
  
  const pulseAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    loadSettings();
    if (autoPlay && text) {
      handlePlay();
    }
  }, [autoPlay, text]);

  useEffect(() => {
    if (isPlaying) {
      startPulseAnimation();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [isPlaying]);

  const loadSettings = async () => {
    try {
      const speed = await AsyncStorage.getItem('reading_speed');
      if (speed) {
        setReadingSpeed(parseFloat(speed));
      }
    } catch (error) {
      console.log('Error loading settings:', error);
    }
  };

  const saveSettings = async (speed: number) => {
    try {
      await AsyncStorage.setItem('reading_speed', speed.toString());
    } catch (error) {
      console.log('Error saving settings:', error);
    }
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handlePlay = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (isPaused) {
      await TTSService.resume();
      setIsPaused(false);
      setIsPlaying(true);
      TTSService.speak('Resuming');
    } else {
      setIsPlaying(true);
      setIsPaused(false);
      await TTSService.speak(text, { rate: readingSpeed });
      setIsPlaying(false);
    }
  };

  const handlePause = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await TTSService.pause();
    setIsPaused(true);
    setIsPlaying(false);
    TTSService.speak('Paused');
  };

  const handleStop = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await TTSService.stop();
    setIsPlaying(false);
    setIsPaused(false);
    TTSService.speak('Stopped');
  };

  const handleRepeat = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await TTSService.stop();
    setIsPlaying(true);
    setIsPaused(false);
    await TTSService.speak(text, { rate: readingSpeed });
    setIsPlaying(false);
  };

  const handleSpeedChange = async (increase: boolean) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    let newSpeed = readingSpeed;
    if (increase) {
      newSpeed = Math.min(1.5, readingSpeed + 0.25);
    } else {
      newSpeed = Math.max(0.5, readingSpeed - 0.25);
    }
    
    setReadingSpeed(newSpeed);
    await saveSettings(newSpeed);
    
    const speedText = newSpeed === 0.5 ? 'very slow' :
                      newSpeed === 0.75 ? 'normal' :
                      newSpeed === 1.0 ? 'fast' :
                      newSpeed === 1.25 ? 'faster' : 'very fast';
    
    TTSService.speak(`Reading speed set to ${speedText}`);
  };

  const handleSave = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (onSave) {
      onSave();
    }
    TTSService.speak('Document saved successfully');
  };

  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.text}>{text}</Text>
        </ScrollView>
      </View>

      <BlurView intensity={80} tint="dark" style={styles.controlsContainer}>
        <View style={styles.speedControls}>
          <Text style={styles.speedLabel}>Speed: {readingSpeed.toFixed(2)}x</Text>
          <View style={styles.speedButtons}>
            <TouchableOpacity
              style={styles.speedButton}
              onPress={() => handleSpeedChange(false)}
            >
              <Ionicons name="remove-circle-outline" size={24} color="white" />
              <Text style={styles.speedButtonText}>Slower</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.speedButton}
              onPress={() => handleSpeedChange(true)}
            >
              <Ionicons name="add-circle-outline" size={24} color="white" />
              <Text style={styles.speedButtonText}>Faster</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.playbackControls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleRepeat}
            accessibilityLabel="Repeat from beginning"
          >
            <Ionicons name="reload" size={28} color="white" />
            <Text style={styles.controlLabel}>Repeat</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleStop}
            disabled={!isPlaying && !isPaused}
            accessibilityLabel="Stop reading"
          >
            <Ionicons
              name="stop"
              size={28}
              color={!isPlaying && !isPaused ? '#666' : 'white'}
            />
            <Text style={[styles.controlLabel, (!isPlaying && !isPaused) && styles.controlLabelDisabled]}>
              Stop
            </Text>
          </TouchableOpacity>

          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              style={[styles.playButton, isPlaying && styles.playButtonActive]}
              onPress={isPlaying ? handlePause : handlePlay}
              accessibilityLabel={isPlaying ? "Pause reading" : "Play reading"}
            >
              <Ionicons
                name={isPlaying ? 'pause' : isPaused ? 'play' : 'play'}
                size={40}
                color="white"
              />
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={handlePause}
            disabled={!isPlaying}
            accessibilityLabel="Pause reading"
          >
            <Ionicons
              name="pause"
              size={28}
              color={!isPlaying ? '#666' : 'white'}
            />
            <Text style={[styles.controlLabel, !isPlaying && styles.controlLabelDisabled]}>
              Pause
            </Text>
          </TouchableOpacity>

          {onSave && (
            <TouchableOpacity
              style={styles.controlButton}
              onPress={handleSave}
              accessibilityLabel="Save document"
            >
              <Ionicons name="save" size={28} color="white" />
              <Text style={styles.controlLabel}>Save</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, isPlaying && styles.statusDotActive]} />
          <Text style={styles.statusText}>
            {isPlaying ? '🔊 Reading...' : isPaused ? '⏸️ Paused' : '⏹️ Ready'}
          </Text>
        </View>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  textContainer: {
    flex: 1,
    padding: 20,
  },
  text: {
    fontSize: 18,
    lineHeight: 28,
    color: 'white',
  },
  controlsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  speedControls: {
    marginBottom: 20,
  },
  speedLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  speedButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  speedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 8,
  },
  speedButtonText: {
    color: 'white',
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '600',
  },
  playbackControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 16,
  },
  controlButton: {
    alignItems: 'center',
  },
  controlLabel: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  controlLabelDisabled: {
    color: '#666',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  playButtonActive: {
    backgroundColor: '#FF6B6B',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#666',
    marginRight: 8,
  },
  statusDotActive: {
    backgroundColor: '#4CAF50',
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

