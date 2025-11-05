import { MD } from '@/constants/MaterialDesign';
import { TTSService } from '@/services/TTSServices';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import * as Speech from 'expo-speech';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PlaybackControls } from './PlaybackControls';

const { width, height } = Dimensions.get('window');

interface TextReviewModalProps {
  visible: boolean;
  text: string;
  title?: string;
  confidence?: number;
  onClose: () => void;
  onSave?: () => void;
  onShare?: () => void;
  autoPlay?: boolean;
  initialSaved?: boolean; // If true, document is already saved (e.g., from auto-save)
}

export const TextReviewModal: React.FC<TextReviewModalProps> = ({
  visible,
  text,
  title = 'Scanned Text',
  confidence,
  onClose,
  onSave,
  onShare,
  autoPlay = true,
  initialSaved = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [readingSpeed, setReadingSpeed] = useState(0.75);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [sentences, setSentences] = useState<string[]>([]);
  
  // Word-level tracking for precise pause/resume
  const [words, setWords] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  
  // Track if document has been saved
  const [isSaved, setIsSaved] = useState(false);
  
  // Use ref for immediate access to shouldContinue value
  const shouldContinueRef = useRef(true);
  const isSpeakingRef = useRef(false);
  
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(height))[0];

  useEffect(() => {
    if (visible && text) {
      // Split into words for word-level tracking
      const allWords = text.split(/\s+/).filter(w => w.trim().length > 0);
      setWords(allWords);
      
      // Also keep sentence splitting for display structure (optional)
      let newSentences: string[] = [];
      
      // Try to split by sentence punctuation
      const sentenceSplit = text.match(/[^.!?]+[.!?]+/g);
      
      if (sentenceSplit && sentenceSplit.length > 0) {
        // Has proper sentences
        newSentences = sentenceSplit.map(s => s.trim()).filter(s => s.length > 0);
      } else {
        // No sentence punctuation - split by newlines or keep as one
        const lineSplit = text.split(/\n+/).filter(s => s.trim().length > 0);
        
        if (lineSplit.length > 1) {
          // Multiple lines
          newSentences = lineSplit.map(s => s.trim());
        } else {
          // Single block of text - just use the whole text
          newSentences = [text.trim()];
        }
      }
      
      console.log('📝 Modal opened with', allWords.length, 'words,', newSentences.length, 'segments');
      console.log('📝 First words:', allWords.slice(0, 5).join(' '));
      
      setSentences(newSentences);
      setCurrentSentenceIndex(0);
      setCurrentWordIndex(0);
      setIsSaved(initialSaved); // Set initial saved state (true if auto-saved)
      shouldContinueRef.current = true;
      isSpeakingRef.current = false;
      setIsPlaying(false);
      setIsPaused(false);
      
      loadSettings();
      animateIn();
      
      if (autoPlay && allWords.length > 0) {
        // Start playing after animation - use a slightly longer delay to ensure state is ready
        setTimeout(() => {
          console.log('🎬 Auto-play starting with', allWords.length, 'words...');
          shouldContinueRef.current = true;
          setIsPlaying(true);
          setIsPaused(false);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          // Start speaking from word 0
          speakWithWordTracking(0);
        }, 1500);
      } else if (allWords.length > 0) {
        TTSService.speak(`${title} ready. ${allWords.length} words detected. Tap play to begin reading.`);
      } else {
        TTSService.speak(`${title} opened but no text detected.`);
      }
    } else if (!visible) {
      // STOP EVERYTHING when closing modal
      console.log('🚪 Modal closing - STOPPING ALL SPEECH');
      shouldContinueRef.current = false;
      isSpeakingRef.current = false;
      Speech.stop();
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentSentenceIndex(0);
      setCurrentWordIndex(0);
      animateOut();
    }
  }, [visible, text]);

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

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: MD.transitions.normal,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateOut = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: MD.transitions.fast,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: height,
        duration: MD.transitions.normal,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePlay = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      console.log('▶️ PLAY pressed');
      console.log('📊 Current state - words:', words.length, 'wordIndex:', currentWordIndex, 'isPaused:', isPaused);
      
      if (words.length === 0) {
        // Silent handling - no error popup, just voice feedback
        console.log('ℹ️ No text available to read');
        TTSService.speak('No text to read');
        return;
      }
      
      shouldContinueRef.current = true;
      setIsPlaying(true);
      setIsPaused(false);
      
      await speakWithWordTracking(currentWordIndex);
    } catch (error) {
      console.log('ℹ️ Play error:', error);
      setIsPlaying(false);
    }
  };

  const speakWithWordTracking = async (startWordIndex: number) => {
    if (!words || words.length === 0) {
      // Silent handling - no error popup
      console.log('ℹ️ No words to speak');
      setIsPlaying(false);
      return;
    }

    console.log(`🎬 Starting word-by-word from word ${startWordIndex + 1} of ${words.length}`);
    isSpeakingRef.current = true;

    // Read words in small chunks (2-3 words) for better naturalness and precision
    const chunkSize = 3;
    
    for (let i = startWordIndex; i < words.length; i += chunkSize) {
      // Check ref for immediate stop BEFORE starting chunk
      if (!shouldContinueRef.current) {
        console.log('⏸️ Stopped at word:', i + 1);
        setCurrentWordIndex(i);
        isSpeakingRef.current = false;
        return;
      }

      setCurrentWordIndex(i);
      
      // Get next 2-3 words as a chunk for natural flow
      const endIndex = Math.min(i + chunkSize, words.length);
      const chunk = words.slice(i, endIndex).join(' ');
      
      console.log(`🔊 Speaking words ${i + 1}-${endIndex}/${words.length}: "${chunk}"`);

      let wasInterrupted = false;

      await new Promise<void>((resolve) => {
        Speech.speak(chunk, {
          rate: readingSpeed,
          language: 'en-US',
          pitch: 1.0,
          volume: 1.0,
          onDone: () => {
            console.log(`✅ Completed words ${i + 1}-${endIndex}`);
            wasInterrupted = false;
            resolve();
          },
          onStopped: () => {
            console.log(`⏹️ Words ${i + 1}-${endIndex} interrupted`);
            wasInterrupted = true;
            resolve();
          },
          onError: (error) => {
            console.log(`ℹ️ Speech error at words ${i + 1}-${endIndex}:`, error);
            resolve();
          },
        });
      });

      // Check immediately after chunk ends
      if (!shouldContinueRef.current) {
        if (wasInterrupted) {
          // If interrupted mid-chunk, stay on current word for replay
          console.log('⏸️ PAUSED during words', i + 1, '- will resume from here');
          setCurrentWordIndex(i);
        } else {
          // If chunk completed naturally, move to next chunk
          console.log('⏸️ PAUSED after words', endIndex, '- will resume from next');
          setCurrentWordIndex(endIndex);
        }
        isSpeakingRef.current = false;
        return;
      }

      // Small delay between chunks
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('🎉 All words read! Playback complete');
    isSpeakingRef.current = false;
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentWordIndex(0);
    
    setTimeout(() => {
      if (shouldContinueRef.current) {
        Speech.speak('Reading complete', { rate: readingSpeed });
      }
    }, 500);
  };

  const handlePause = async () => {
    try {
      console.log('⏸️ PAUSE button pressed');
      
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // IMMEDIATELY stop everything
      shouldContinueRef.current = false;
      await Speech.stop();
      
      setIsPaused(true);
      setIsPlaying(false);
      
      console.log('⏸️ PAUSED - Position saved at word:', currentWordIndex + 1, 'of', words.length);
      
      // Only announce pause after ensuring everything is stopped
      setTimeout(async () => {
        await Speech.stop(); // Double-check
        if (!shouldContinueRef.current) {
          Speech.speak(`Paused at word ${currentWordIndex + 1}`, { rate: readingSpeed });
        }
      }, 800);
    } catch (error) {
      console.log('ℹ️ Pause error:', error);
    }
  };

  const handleStop = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // IMMEDIATELY stop everything
      shouldContinueRef.current = false;
      await Speech.stop();
      
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentWordIndex(0);
      
      console.log('⏹️ STOPPED - Reset to beginning');
      
      setTimeout(async () => {
        await Speech.stop(); // Double-check
        if (!shouldContinueRef.current) {
          Speech.speak('Stopped', { rate: readingSpeed });
        }
      }, 800);
    } catch (error) {
      console.log('ℹ️ Stop error:', error);
    }
  };

  const handleResume = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      shouldContinueRef.current = true;
      setIsPlaying(true);
      setIsPaused(false);
      
      console.log('▶️ RESUMING from word:', currentWordIndex + 1, 'of', words.length);
      
      await speakWithWordTracking(currentWordIndex);
    } catch (error) {
      console.log('ℹ️ Resume error:', error);
    }
  };

  const handleRepeat = async () => {
    try {
      shouldContinueRef.current = false;
      await Speech.stop();
      
      setCurrentWordIndex(0);
      setIsPaused(false);
      
      await new Promise(resolve => setTimeout(resolve, 400));
      
      console.log('🔁 REPEAT - Starting from beginning');
      await handlePlay();
    } catch (error) {
      console.log('ℹ️ Repeat error:', error);
    }
  };

  const handleSpeedChange = async (newSpeed: number) => {
    try {
      setReadingSpeed(newSpeed);
      await AsyncStorage.setItem('reading_speed', newSpeed.toString());
      
      const wasPlaying = isPlaying;
      const currentPosition = currentWordIndex;
      
      console.log('⚡ Speed changed to:', newSpeed, 'Current word:', currentPosition + 1);
      
      if (wasPlaying) {
        shouldContinueRef.current = false;
        await Speech.stop();
        
        await new Promise(resolve => setTimeout(resolve, 400));
        
        shouldContinueRef.current = true;
        setIsPlaying(true);
        await speakWithWordTracking(currentPosition);
      }
    } catch (error) {
      console.log('ℹ️ Speed change error:', error);
    }
  };

  const handleSave = async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      if (onSave) {
        onSave();
      }
      
      // Mark as saved
      setIsSaved(true);
      
      await new Promise(resolve => setTimeout(resolve, 300));
      TTSService.speak('Document saved to library successfully');
      
      // Don't auto-close - let user continue reading or close manually
      console.log('💾 Document saved - staying open for user');
    } catch (error) {
      console.log('ℹ️ Save error:', error);
      TTSService.speak('Error saving document');
    }
  };

  const handleShare = async () => {
    if (onShare) {
      onShare();
    } else {
      try {
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          TTSService.speak('Opening share options');
        }
      } catch (error) {
        TTSService.speak('Sharing not available');
      }
    }
  };

  const handleClose = async () => {
    try {
      console.log('🚪 Closing modal - STOPPING ALL SPEECH');
      
      // IMMEDIATELY stop everything - no announcements
      shouldContinueRef.current = false;
      isSpeakingRef.current = false;
      await Speech.stop();
      
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentSentenceIndex(0);
      
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Close immediately without any speech announcement
      setTimeout(() => {
        onClose();
      }, 100);
    } catch (error) {
      console.error('Close error:', error);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={styles.backdropTouchable} />
        </TouchableWithoutFeedback>
        
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
              <View style={[styles.header, MD.elevation.level2]}>
                <View style={styles.headerLeft}>
                  <Ionicons name="document-text" size={24} color={MD.colors.primary} />
                  <View style={styles.headerText}>
                    <Text style={styles.title}>{title}</Text>
                    {confidence !== undefined && (
                      <Text style={styles.confidence}>
                        {confidence}% confidence
                      </Text>
                    )}
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleClose}
                  accessibilityLabel="Close"
                >
                  <Ionicons name="close" size={28} color={MD.colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.textContainer}
                showsVerticalScrollIndicator={true}
                contentContainerStyle={styles.textContent}
                nestedScrollEnabled={true}
                scrollEnabled={true}
              >
                <Text style={styles.text} selectable={true}>
                  {words.map((word, index) => {
                    // Calculate the chunk this word belongs to (3 words per chunk)
                    const chunkStart = Math.floor(currentWordIndex / 3) * 3;
                    const chunkEnd = chunkStart + 3;
                    const isCurrentChunk = index >= chunkStart && index < chunkEnd && isPlaying;
                    const isRead = index < currentWordIndex;
                    
                    return (
                      <Text
                        key={index}
                        style={[
                          styles.word,
                          isCurrentChunk && styles.wordActive,
                          isRead && styles.wordRead,
                        ]}
                      >
                        {word}{' '}
                      </Text>
                    );
                  })}
                </Text>
              </ScrollView>

              <View style={[styles.controlsSection, MD.elevation.level3]}>
                <PlaybackControls
                  isPlaying={isPlaying}
                  isPaused={isPaused}
                  onPlay={isPaused ? handleResume : handlePlay}
                  onPause={handlePause}
                  onStop={handleStop}
                  onRepeat={handleRepeat}
                  onSpeedChange={handleSpeedChange}
                  currentSpeed={readingSpeed}
                />
              </View>

              <View style={styles.actionButtons}>
                {onSave && (
                  <TouchableOpacity
                    style={[
                      styles.actionButton, 
                      isSaved ? styles.savedButton : styles.saveButton, 
                      MD.elevation.level2,
                      isSaved && styles.disabledButton
                    ]}
                    onPress={isSaved ? undefined : handleSave}
                    disabled={isSaved}
                    accessibilityLabel={isSaved ? "Document saved" : "Save document"}
                  >
                    <Ionicons 
                      name={isSaved ? "checkmark-circle" : "save"} 
                      size={24} 
                      color="#FFFFFF" 
                    />
                    <Text style={styles.actionButtonText}>
                      {isSaved ? "Saved" : "Save"}
                    </Text>
                  </TouchableOpacity>
                )}
                
                {onShare && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.shareButton, MD.elevation.level2]}
                    onPress={handleShare}
                    accessibilityLabel="Share document"
                  >
                    <Ionicons name="share-social" size={24} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Share</Text>
                  </TouchableOpacity>
                )}
              </View>
          </SafeAreaView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  backdropTouchable: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: MD.colors.surface,
    borderTopLeftRadius: MD.borderRadius.xl,
    borderTopRightRadius: MD.borderRadius.xl,
    maxHeight: height * 0.9,
    minHeight: height * 0.7,
  },
  safeArea: {
    flex: 1,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: MD.spacing.lg,
    paddingVertical: MD.spacing.md,
    backgroundColor: MD.colors.surface,
    borderTopLeftRadius: MD.borderRadius.xl,
    borderTopRightRadius: MD.borderRadius.xl,
    borderBottomWidth: 1,
    borderBottomColor: MD.colors.divider,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    marginLeft: MD.spacing.md,
    flex: 1,
  },
  title: {
    ...MD.typography.h5,
    color: MD.colors.textPrimary,
  },
  confidence: {
    ...MD.typography.caption,
    color: MD.colors.accent,
    marginTop: MD.spacing.xs,
  },
  closeButton: {
    width: MD.touchTarget.minimum,
    height: MD.touchTarget.minimum,
    borderRadius: MD.borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: MD.colors.background,
  },
  textContainer: {
    flex: 1,
    maxHeight: height * 0.4,
  },
  textContent: {
    padding: MD.spacing.lg,
    paddingBottom: MD.spacing.xl,
  },
  text: {
    ...MD.typography.body1,
    color: MD.colors.textPrimary,
    lineHeight: 28,
    fontSize: 18,
  },
  textActive: {
    backgroundColor: '#FFF9C4',
    color: MD.colors.textPrimary,
    fontWeight: '700',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  textRead: {
    color: MD.colors.textSecondary,
    opacity: 0.6,
  },
  word: {
    ...MD.typography.body1,
    fontSize: 18,
    lineHeight: 28,
  },
  wordActive: {
    backgroundColor: '#FFD54F',
    color: MD.colors.textPrimary,
    fontWeight: '700',
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 3,
  },
  wordRead: {
    color: MD.colors.textSecondary,
    opacity: 0.5,
  },
  controlsSection: {
    backgroundColor: MD.colors.surface,
    paddingHorizontal: MD.spacing.lg,
    paddingVertical: MD.spacing.md,
    borderTopWidth: 1,
    borderTopColor: MD.colors.divider,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: MD.spacing.lg,
    paddingVertical: MD.spacing.md,
    paddingBottom: MD.spacing.lg,
    gap: MD.spacing.md,
    backgroundColor: MD.colors.background,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: MD.spacing.md,
    paddingHorizontal: MD.spacing.md,
    borderRadius: MD.borderRadius.md,
    minHeight: MD.touchTarget.comfortable,
    ...MD.elevation.level3,
  },
  saveButton: {
    backgroundColor: MD.colors.primary,
  },
  savedButton: {
    backgroundColor: '#4CAF50', // Green for success
  },
  disabledButton: {
    opacity: 0.7,
  },
  shareButton: {
    backgroundColor: MD.colors.secondary,
  },
  actionButtonText: {
    ...MD.typography.button,
    color: '#FFFFFF',
    marginLeft: MD.spacing.sm,
    textTransform: 'none',
    fontSize: 16,
    fontWeight: '600',
  },
});

