import { AccessibleButton } from '@/components/AccessibilityButton1';
import { GoogleSpeechService } from '@/services/GoogleSpeechService';
import { TTSService } from '@/services/TTSServices';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

interface VoiceNote {
  id: string;
  title: string;
  transcript: string;
  confidence: number;
  timestamp: number;
  duration: number;
}

export default function VoiceNotesScreen() {
  const navigation = useNavigation();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [currentConfidence, setCurrentConfidence] = useState(0);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  
  const pulseAnim = useState(new Animated.Value(1))[0];
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    loadVoiceNotes();
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    TTSService.speak(
      'Voice notes screen loaded. Tap the record button to start recording your voice, or view your saved notes.'
    );

    return () => {
      if (isRecording) {
        GoogleSpeechService.cancelRecording();
      }
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRecording) {
      startPulseAnimation();
      interval = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingDuration(0);
      pulseAnim.stopAnimation();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const loadVoiceNotes = async () => {
    try {
      const savedData = await FileSystem.readAsStringAsync(
        FileSystem.documentDirectory + 'voice_notes.json'
      ).catch(() => '[]');
      const notes = JSON.parse(savedData);
      setVoiceNotes(notes);
    } catch (error) {
      console.log('Error loading voice notes:', error);
    }
  };

  const saveVoiceNotes = async (notes: VoiceNote[]) => {
    try {
      await FileSystem.writeAsStringAsync(
        FileSystem.documentDirectory + 'voice_notes.json',
        JSON.stringify(notes)
      );
    } catch (error) {
      console.log('Error saving voice notes:', error);
    }
  };

  const handleStartRecording = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsRecording(true);
      setCurrentTranscript('');
      setCurrentConfidence(0);
      
      await GoogleSpeechService.startRecording();
      TTSService.speak('Recording started. Speak clearly into the microphone.');
    } catch (error) {
      console.error('Recording start error:', error);
      setIsRecording(false);
      TTSService.speak('Failed to start recording. Please check microphone permissions.');
      Alert.alert('Recording Error', 'Failed to start recording. Please ensure microphone permission is granted.');
    }
  };

  const handleStopRecording = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsRecording(false);
      setIsProcessing(true);
      
      TTSService.speak('Recording stopped. Processing your voice...');

      const audioUri = await GoogleSpeechService.stopRecording();
      
      if (!audioUri) {
        setIsProcessing(false);
        TTSService.speak('Failed to save recording.');
        return;
      }

      const result = await GoogleSpeechService.recognizeSpeech(audioUri);
      
      setIsProcessing(false);

      if (result.error) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        TTSService.speak(`Error processing voice: ${result.error}`);
        Alert.alert('Processing Error', result.error);
      } else if (result.transcript) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setCurrentTranscript(result.transcript);
        setCurrentConfidence(result.confidence);
        
        const confidenceLevel = result.confidence > 80 ? 'high' : result.confidence > 60 ? 'medium' : 'low';
        TTSService.speak(`Voice recognized with ${confidenceLevel} confidence. Your transcript: ${result.transcript}`);
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        TTSService.speak('No speech detected. Please try again and speak more clearly.');
      }
    } catch (error) {
      setIsRecording(false);
      setIsProcessing(false);
      console.error('Recording stop error:', error);
      TTSService.speak('Error processing recording. Please try again.');
    }
  };

  const handleSaveNote = async () => {
    if (!currentTranscript) return;

    const newNote: VoiceNote = {
      id: Date.now().toString(),
      title: `Voice Note ${voiceNotes.length + 1}`,
      transcript: currentTranscript,
      confidence: currentConfidence,
      timestamp: Date.now(),
      duration: recordingDuration,
    };

    const updatedNotes = [newNote, ...voiceNotes];
    setVoiceNotes(updatedNotes);
    await saveVoiceNotes(updatedNotes);
    
    setCurrentTranscript('');
    setCurrentConfidence(0);
    
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    TTSService.speak('Voice note saved successfully.');
  };

  const handleDeleteNote = (id: string) => {
    Alert.alert(
      'Delete Voice Note',
      'Are you sure you want to delete this voice note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedNotes = voiceNotes.filter((note) => note.id !== id);
            setVoiceNotes(updatedNotes);
            await saveVoiceNotes(updatedNotes);
            TTSService.speak('Voice note deleted.');
          },
        },
      ]
    );
  };

  const handleReadNote = (note: VoiceNote) => {
    TTSService.speak(`Note title: ${note.title}. Transcript: ${note.transcript}`);
  };

  const handleEditTitle = (note: VoiceNote) => {
    setEditingTitle(note.id);
    setNewTitle(note.title);
  };

  const handleSaveTitle = async (id: string) => {
    const updatedNotes = voiceNotes.map((note) =>
      note.id === id ? { ...note, title: newTitle } : note
    );
    setVoiceNotes(updatedNotes);
    await saveVoiceNotes(updatedNotes);
    setEditingTitle(null);
    setNewTitle('');
    TTSService.speak('Title updated.');
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#43e97b', '#38f9d7', '#667eea']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <BlurView intensity={20} tint="light" style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.title}>🎤 Voice Notes</Text>
              <Text style={styles.subtitle}>Record and transcribe speech</Text>
            </View>
          </BlurView>

          <ScrollView
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContentContainer}
          >
            <View style={styles.recordingSection}>
              <Animated.View
                style={[
                  styles.recordingCircle,
                  isRecording && { transform: [{ scale: pulseAnim }] },
                ]}
              >
                <LinearGradient
                  colors={
                    isRecording
                      ? ['#ff6b6b', '#ee5a6f']
                      : ['#43e97b', '#38f9d7']
                  }
                  style={styles.recordingButton}
                >
                  <TouchableOpacity
                    style={styles.recordingButtonTouch}
                    onPress={isRecording ? handleStopRecording : handleStartRecording}
                    disabled={isProcessing}
                  >
                    <Ionicons
                      name={isRecording ? 'stop' : 'mic'}
                      size={48}
                      color="white"
                    />
                  </TouchableOpacity>
                </LinearGradient>
              </Animated.View>

              <Text style={styles.recordingStatus}>
                {isRecording
                  ? `Recording... ${formatDuration(recordingDuration)}`
                  : isProcessing
                  ? 'Processing...'
                  : 'Tap to Record'}
              </Text>

              {isRecording && (
                <View style={styles.recordingIndicator}>
                  <View style={styles.recordingDot} />
                  <Text style={styles.recordingText}>Live Recording</Text>
                </View>
              )}

              {isProcessing && (
                <ActivityIndicator size="large" color="#667eea" style={styles.loader} />
              )}
            </View>

            {currentTranscript && (
              <BlurView intensity={60} tint="dark" style={styles.transcriptCard}>
                <View style={styles.transcriptHeader}>
                  <Ionicons name="text" size={24} color="#4CAF50" />
                  <Text style={styles.transcriptTitle}>Transcript</Text>
                  <View style={styles.confidenceBadge}>
                    <Text style={styles.confidenceText}>
                      {currentConfidence}% confidence
                    </Text>
                  </View>
                </View>
                
                <ScrollView style={styles.transcriptContainer}>
                  <Text style={styles.transcriptText}>{currentTranscript}</Text>
                </ScrollView>

                <View style={styles.transcriptActions}>
                  <AccessibleButton
                    title="🔊 Read"
                    onPress={() => TTSService.speak(currentTranscript)}
                    description="Read the transcript aloud"
                    variant="success"
                    size="small"
                  />
                  <AccessibleButton
                    title="💾 Save"
                    onPress={handleSaveNote}
                    description="Save this voice note"
                    variant="gradient"
                    size="small"
                  />
                </View>
              </BlurView>
            )}

            <View style={styles.notesSection}>
              <Text style={styles.sectionTitle}>
                Saved Notes ({voiceNotes.length})
              </Text>

              {voiceNotes.length > 0 ? (
                voiceNotes.map((note) => (
                  <BlurView
                    key={note.id}
                    intensity={40}
                    tint="light"
                    style={styles.noteCard}
                  >
                    {editingTitle === note.id ? (
                      <View style={styles.editTitleContainer}>
                        <TextInput
                          style={styles.editTitleInput}
                          value={newTitle}
                          onChangeText={setNewTitle}
                          placeholder="Enter title"
                          autoFocus
                        />
                        <TouchableOpacity
                          onPress={() => handleSaveTitle(note.id)}
                          style={styles.saveTitleButton}
                        >
                          <Ionicons name="checkmark" size={20} color="#4CAF50" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => handleEditTitle(note)}
                        style={styles.noteTitleContainer}
                      >
                        <Text style={styles.noteTitle}>{note.title}</Text>
                        <Ionicons name="pencil" size={16} color="#666" />
                      </TouchableOpacity>
                    )}

                    <Text style={styles.noteTranscript} numberOfLines={2}>
                      {note.transcript}
                    </Text>

                    <View style={styles.noteFooter}>
                      <View style={styles.noteMetadata}>
                        <Text style={styles.noteDate}>
                          {formatDate(note.timestamp)}
                        </Text>
                        <Text style={styles.noteDuration}>
                          {formatDuration(note.duration)}
                        </Text>
                        <Text style={styles.noteConfidence}>
                          {note.confidence}%
                        </Text>
                      </View>

                      <View style={styles.noteActions}>
                        <TouchableOpacity
                          style={styles.noteActionButton}
                          onPress={() => handleReadNote(note)}
                        >
                          <Ionicons name="volume-high" size={20} color="#667eea" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.noteActionButton}
                          onPress={() => handleDeleteNote(note.id)}
                        >
                          <Ionicons name="trash-outline" size={20} color="#ff4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </BlurView>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="mic-outline" size={64} color="rgba(255,255,255,0.3)" />
                  <Text style={styles.emptyText}>No voice notes yet</Text>
                  <Text style={styles.emptySubtext}>
                    Tap the microphone to record your first note
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </Animated.View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    overflow: 'hidden',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  recordingSection: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  recordingCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    marginBottom: 20,
  },
  recordingButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  recordingButtonTouch: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingStatus: {
    fontSize: 20,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 12,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,107,107,0.2)',
    borderRadius: 20,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff6b6b',
    marginRight: 8,
  },
  recordingText: {
    color: '#ff6b6b',
    fontSize: 14,
    fontWeight: '600',
  },
  loader: {
    marginTop: 20,
  },
  transcriptCard: {
    padding: 20,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  transcriptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  transcriptTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
    flex: 1,
  },
  confidenceBadge: {
    backgroundColor: 'rgba(76,175,80,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
  },
  transcriptContainer: {
    maxHeight: 120,
    marginBottom: 16,
  },
  transcriptText: {
    color: 'white',
    fontSize: 16,
    lineHeight: 24,
  },
  transcriptActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  notesSection: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 16,
  },
  noteCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  editTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  editTitleInput: {
    flex: 1,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  saveTitleButton: {
    marginLeft: 10,
    padding: 8,
    backgroundColor: 'rgba(76,175,80,0.2)',
    borderRadius: 8,
  },
  noteTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  noteTranscript: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 12,
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  noteDate: {
    fontSize: 12,
    color: '#666',
    marginRight: 12,
  },
  noteDuration: {
    fontSize: 12,
    color: '#666',
    marginRight: 12,
  },
  noteConfidence: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  noteActions: {
    flexDirection: 'row',
  },
  noteActionButton: {
    marginLeft: 12,
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 8,
    textAlign: 'center',
  },
});

