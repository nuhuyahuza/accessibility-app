import { MD } from '@/constants/MaterialDesign';
import { TTSService } from '@/services/TTSServices';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface PlaybackControlsProps {
  isPlaying: boolean;
  isPaused: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onRepeat: () => void;
  onSpeedChange?: (speed: number) => void;
  currentSpeed?: number;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  isPaused,
  onPlay,
  onPause,
  onStop,
  onRepeat,
  onSpeedChange,
  currentSpeed = 0.75,
}) => {
  const [speed, setSpeed] = useState(currentSpeed);
  const pulseAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    if (isPlaying) {
      startPulseAnimation();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [isPlaying]);

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

  const handleSpeedChange = async (increase: boolean) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      let newSpeed = speed;
      if (increase) {
        newSpeed = Math.min(1.5, speed + 0.25);
      } else {
        newSpeed = Math.max(0.5, speed - 0.25);
      }
      
      console.log('Speed changed from', speed, 'to', newSpeed);
      setSpeed(newSpeed);
      
      if (onSpeedChange) {
        onSpeedChange(newSpeed);
      }
      
      await AsyncStorage.setItem('reading_speed', newSpeed.toString());
      
      const speedText = newSpeed === 0.5 ? 'very slow' :
                        newSpeed === 0.75 ? 'normal' :
                        newSpeed === 1.0 ? 'fast' :
                        newSpeed === 1.25 ? 'faster' : 'very fast';
      
      await new Promise(resolve => setTimeout(resolve, 200));
      TTSService.speak(`Speed ${speedText}`);
    } catch (error) {
      console.error('Speed change error:', error);
    }
  };

  const handlePlay = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      console.log('Play button pressed');
      onPlay();
    } catch (error) {
      console.error('Play button error:', error);
    }
  };

  const handlePause = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      console.log('Pause button pressed');
      onPause();
    } catch (error) {
      console.error('Pause button error:', error);
    }
  };

  const handleStop = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      console.log('Stop button pressed');
      onStop();
    } catch (error) {
      console.error('Stop button error:', error);
    }
  };

  const handleRepeat = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      console.log('Repeat button pressed');
      onRepeat();
    } catch (error) {
      console.error('Repeat button error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.speedControls}>
        <TouchableOpacity
          style={styles.speedButton}
          onPress={() => handleSpeedChange(false)}
          accessibilityLabel="Decrease reading speed"
        >
          <Ionicons name="remove-circle" size={32} color={MD.colors.primary} />
        </TouchableOpacity>
        
        <View style={styles.speedIndicator}>
          <Text style={styles.speedValue}>{speed.toFixed(2)}x</Text>
          <Text style={styles.speedLabel}>Speed</Text>
        </View>
        
        <TouchableOpacity
          style={styles.speedButton}
          onPress={() => handleSpeedChange(true)}
          accessibilityLabel="Increase reading speed"
        >
          <Ionicons name="add-circle" size={32} color={MD.colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.playbackButtons}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleRepeat}
          accessibilityLabel="Repeat from beginning"
        >
          <Ionicons name="reload" size={28} color={MD.colors.textPrimary} />
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
            color={!isPlaying && !isPaused ? MD.colors.textDisabled : MD.colors.error}
          />
          <Text style={[
            styles.controlLabel,
            (!isPlaying && !isPaused) && styles.controlLabelDisabled
          ]}>
            Stop
          </Text>
        </TouchableOpacity>

        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={[
              styles.playButton,
              isPlaying && styles.playButtonActive,
              MD.elevation.level4,
            ]}
            onPress={isPlaying ? handlePause : handlePlay}
            accessibilityLabel={isPlaying ? "Pause reading" : "Play reading"}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={40}
              color="#FFFFFF"
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
            color={!isPlaying ? MD.colors.textDisabled : MD.colors.warning}
          />
          <Text style={[
            styles.controlLabel,
            !isPlaying && styles.controlLabelDisabled
          ]}>
            Pause
          </Text>
        </TouchableOpacity>

        <View style={styles.controlButton}>
          <View style={[
            styles.statusIndicator,
            isPlaying && styles.statusIndicatorActive,
          ]} />
          <Text style={styles.controlLabel}>
            {isPlaying ? 'Playing' : isPaused ? 'Paused' : 'Ready'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: MD.spacing.md,
  },
  speedControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: MD.spacing.lg,
  },
  speedButton: {
    padding: MD.spacing.sm,
    minWidth: MD.touchTarget.minimum,
    minHeight: MD.touchTarget.minimum,
    justifyContent: 'center',
    alignItems: 'center',
  },
  speedIndicator: {
    marginHorizontal: MD.spacing.lg,
    alignItems: 'center',
  },
  speedValue: {
    ...MD.typography.h4,
    color: MD.colors.primary,
  },
  speedLabel: {
    ...MD.typography.caption,
    color: MD.colors.textSecondary,
  },
  playbackButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  controlButton: {
    alignItems: 'center',
    minWidth: MD.touchTarget.comfortable,
    minHeight: MD.touchTarget.comfortable,
    justifyContent: 'center',
  },
  controlLabel: {
    ...MD.typography.caption,
    color: MD.colors.textPrimary,
    marginTop: MD.spacing.xs,
  },
  controlLabelDisabled: {
    color: MD.colors.textDisabled,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: MD.colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonActive: {
    backgroundColor: MD.colors.error,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: MD.colors.textDisabled,
  },
  statusIndicatorActive: {
    backgroundColor: MD.colors.accent,
  },
});

