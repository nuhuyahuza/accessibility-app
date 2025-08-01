import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import * as Speech from "expo-speech";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

// Mock OCR function - Replace with actual OCR service like Google Vision API, AWS Textract, etc.
const extractTextFromImage = async (base64Image: string): Promise<string> => {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Mock extracted text - Replace with actual OCR implementation
  return `This is a sample extracted text from the image. In a real implementation, you would use services like:

• Google Cloud Vision API
• AWS Textract
• Azure Computer Vision
• Tesseract.js for client-side OCR

The extracted text would appear here with proper formatting and line breaks preserved from the original document.

You can edit this text below, save it, share it, or have it read aloud using the controls provided.`;
};

interface SavedText {
  id: string;
  text: string;
  timestamp: number;
  title: string;
}

export default function ProcessingScreen() {
  const { base64 } = useLocalSearchParams();
  const router = useRouter();

  const [extractedText, setExtractedText] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [editableText, setEditableText] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");
  const [savedTexts, setSavedTexts] = useState<SavedText[]>([]);
  const [showSavedTexts, setShowSavedTexts] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const speechRef = useRef<any>(null);
  const imageUri = base64 ? `data:image/jpeg;base64,${base64}` : null;

  useEffect(() => {
    if (base64) {
      processImage();
    }
    loadSavedTexts();
  }, [base64]);

  useEffect(() => {
    // Simulate processing progress
    if (isProcessing) {
      const interval = setInterval(() => {
        setProcessingProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);
      return () => clearInterval(interval);
    }
  }, [isProcessing]);

  const processImage = async () => {
    if (!base64) return;

    setIsProcessing(true);
    setError(null);

    try {
      const text = await extractTextFromImage(base64 as string);
      setExtractedText(text);
      setEditableText(text);
      setProcessingProgress(100);
    } catch (err) {
      console.error("OCR Error:", err);
      setError("Failed to extract text from image. Please try again.");
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
      }, 500);
    }
  };

  const loadSavedTexts = async () => {
    try {
      const savedData = await FileSystem.readAsStringAsync(
        FileSystem.documentDirectory + "saved_texts.json"
      ).catch(() => "[]");
      setSavedTexts(JSON.parse(savedData));
    } catch (error) {
      console.log("Error loading saved texts:", error);
    }
  };

  const speakText = async () => {
    if (!editableText.trim()) return;

    if (isPlaying && !isPaused) {
      // Stop speaking
      Speech.stop();
      setIsPlaying(false);
      setIsPaused(false);
    } else if (isPaused) {
      // Resume speaking (Note: expo-speech doesn't support pause/resume, so restart)
      Speech.stop();
      setTimeout(() => {
        Speech.speak(editableText, {
          onStart: () => {
            setIsPlaying(true);
            setIsPaused(false);
          },
          onDone: () => {
            setIsPlaying(false);
            setIsPaused(false);
          },
          onStopped: () => {
            setIsPlaying(false);
            setIsPaused(false);
          },
          onError: () => {
            setIsPlaying(false);
            setIsPaused(false);
            Alert.alert("Error", "Failed to play text");
          },
        });
      }, 100);
    } else {
      // Start speaking
      Speech.speak(editableText, {
        onStart: () => {
          setIsPlaying(true);
          setIsPaused(false);
        },
        onDone: () => {
          setIsPlaying(false);
          setIsPaused(false);
        },
        onStopped: () => {
          setIsPlaying(false);
          setIsPaused(false);
        },
        onError: () => {
          setIsPlaying(false);
          setIsPaused(false);
          Alert.alert("Error", "Failed to play text");
        },
      });
    }
  };

  const pauseText = () => {
    Speech.stop();
    setIsPaused(true);
    setIsPlaying(false);
  };

  const saveText = async () => {
    if (!saveTitle.trim() || !editableText.trim()) {
      Alert.alert("Error", "Please enter a title and ensure text is not empty");
      return;
    }

    const newSavedText: SavedText = {
      id: Date.now().toString(),
      title: saveTitle.trim(),
      text: editableText,
      timestamp: Date.now(),
    };

    const updatedTexts = [...savedTexts, newSavedText];
    setSavedTexts(updatedTexts);

    try {
      await FileSystem.writeAsStringAsync(
        FileSystem.documentDirectory + "saved_texts.json",
        JSON.stringify(updatedTexts)
      );
      Alert.alert("Success", "Text saved successfully!");
      setShowSaveModal(false);
      setSaveTitle("");
    } catch (error) {
      Alert.alert("Error", "Failed to save text");
    }
  };

  const shareText = async () => {
    if (!editableText.trim()) return;

    try {
      await Share.share({
        message: editableText,
        title: "Extracted Text",
      });
    } catch (error) {
      Alert.alert("Error", "Failed to share text");
    }
  };

  const exportAsFile = async () => {
    if (!editableText.trim()) return;

    try {
      const fileName = `extracted_text_${Date.now()}.txt`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, editableText);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert("Success", `Text saved as ${fileName}`);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to export text file");
    }
  };

  const deleteSavedText = async (id: string) => {
    const updatedTexts = savedTexts.filter((text) => text.id !== id);
    setSavedTexts(updatedTexts);

    try {
      await FileSystem.writeAsStringAsync(
        FileSystem.documentDirectory + "saved_texts.json",
        JSON.stringify(updatedTexts)
      );
    } catch (error) {
      console.log("Error deleting saved text:", error);
    }
  };

  const loadSavedText = (savedText: SavedText) => {
    setEditableText(savedText.text);
    setExtractedText(savedText.text);
    setShowSavedTexts(false);
  };

  if (isProcessing) {
    return (
      <View style={styles.processingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
        <LinearGradient
          colors={["#1a1a1a", "#2d2d2d"]}
          style={styles.processingGradient}
        >
          {imageUri && (
            <View style={styles.processingImageContainer}>
              <Image
                source={{ uri: imageUri }}
                style={styles.processingImage}
              />
              <View style={styles.processingOverlay}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.processingTitle}>Extracting Text...</Text>
                <Text style={styles.processingSubtitle}>
                  Using advanced OCR technology
                </Text>
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${processingProgress}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>{processingProgress}%</Text>
                </View>
              </View>
            </View>
          )}
        </LinearGradient>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
        <Ionicons name="alert-circle-outline" size={80} color="#ff4444" />
        <Text style={styles.errorTitle}>Processing Failed</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={processImage}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Text Extraction</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setShowSavedTexts(true)}
        >
          <Ionicons name="folder-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image Preview */}
        {imageUri && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.capturedImage} />
          </View>
        )}

        {/* Text Content */}
        <View style={styles.textContainer}>
          <View style={styles.textHeader}>
            <Text style={styles.textTitle}>Extracted Text</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setIsEditing(!isEditing)}
            >
              <Ionicons
                name={isEditing ? "checkmark" : "create-outline"}
                size={20}
                color="#007AFF"
              />
            </TouchableOpacity>
          </View>

          {isEditing ? (
            <TextInput
              style={styles.textInput}
              multiline
              value={editableText}
              onChangeText={setEditableText}
              placeholder="Edit extracted text..."
              placeholderTextColor="#666"
              textAlignVertical="top"
            />
          ) : (
            <ScrollView style={styles.textDisplay} nestedScrollEnabled>
              <Text style={styles.extractedText}>{editableText}</Text>
            </ScrollView>
          )}
        </View>
      </ScrollView>

      {/* Control Buttons */}
      <View style={styles.controlsContainer}>
        {/* Playback Controls */}
        <View style={styles.playbackControls}>
          <TouchableOpacity
            style={[styles.playButton, isPlaying && styles.playButtonActive]}
            onPress={speakText}
          >
            <Ionicons
              name={isPlaying ? "stop" : "play"}
              size={24}
              color={isPlaying ? "white" : "#007AFF"}
            />
          </TouchableOpacity>

          {isPlaying && (
            <TouchableOpacity style={styles.pauseButton} onPress={pauseText}>
              <Ionicons name="pause" size={20} color="#007AFF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowSaveModal(true)}
          >
            <Ionicons name="save-outline" size={20} color="white" />
            <Text style={styles.actionButtonText}>Save</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={shareText}>
            <Ionicons name="share-outline" size={20} color="white" />
            <Text style={styles.actionButtonText}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={exportAsFile}>
            <Ionicons name="download-outline" size={20} color="white" />
            <Text style={styles.actionButtonText}>Export</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Save Modal */}
      <Modal
        visible={showSaveModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSaveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Save Text</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter title..."
              placeholderTextColor="#666"
              value={saveTitle}
              onChangeText={setSaveTitle}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowSaveModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={saveText}
              >
                <Text style={styles.modalButtonTextPrimary}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Saved Texts Modal */}
      <Modal
        visible={showSavedTexts}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSavedTexts(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.savedTextsModal}>
            <View style={styles.savedTextsHeader}>
              <Text style={styles.modalTitle}>Saved Texts</Text>
              <TouchableOpacity onPress={() => setShowSavedTexts(false)}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.savedTextsList}>
              {savedTexts.length === 0 ? (
                <Text style={styles.emptyText}>No saved texts yet</Text>
              ) : (
                savedTexts.map((savedText) => (
                  <View key={savedText.id} style={styles.savedTextItem}>
                    <TouchableOpacity
                      style={styles.savedTextContent}
                      onPress={() => loadSavedText(savedText)}
                    >
                      <Text style={styles.savedTextTitle}>
                        {savedText.title}
                      </Text>
                      <Text style={styles.savedTextPreview}>
                        {savedText.text.substring(0, 100)}...
                      </Text>
                      <Text style={styles.savedTextDate}>
                        {new Date(savedText.timestamp).toLocaleDateString()}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => deleteSavedText(savedText.id)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color="#ff4444"
                      />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  processingContainer: {
    flex: 1,
  },
  processingGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  processingImageContainer: {
    width: width * 0.8,
    height: height * 0.6,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  processingImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  processingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  processingTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 16,
    textAlign: "center",
  },
  processingSubtitle: {
    color: "#ccc",
    fontSize: 16,
    marginTop: 8,
    textAlign: "center",
  },
  progressContainer: {
    width: "100%",
    marginTop: 24,
    alignItems: "center",
  },
  progressBar: {
    width: "100%",
    height: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#007AFF",
    borderRadius: 2,
  },
  progressText: {
    color: "#ccc",
    fontSize: 14,
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  errorTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },
  errorText: {
    color: "#ccc",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 30,
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 15,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  backButton: {
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  backButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 60,
    backgroundColor: "#1a1a1a",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    margin: 20,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#333",
  },
  capturedImage: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
  },
  textContainer: {
    margin: 20,
    backgroundColor: "#2d2d2d",
    borderRadius: 12,
    padding: 16,
  },
  textHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  textTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  editButton: {
    padding: 8,
  },
  textInput: {
    color: "white",
    fontSize: 16,
    lineHeight: 24,
    minHeight: 200,
    maxHeight: 300,
    padding: 12,
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  textDisplay: {
    maxHeight: 300,
  },
  extractedText: {
    color: "white",
    fontSize: 16,
    lineHeight: 24,
  },
  controlsContainer: {
    backgroundColor: "#2d2d2d",
    paddingVertical: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  playbackControls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(0, 122, 255, 0.2)",
    borderWidth: 2,
    borderColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  playButtonActive: {
    backgroundColor: "#007AFF",
  },
  pauseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 122, 255, 0.2)",
    borderWidth: 1,
    borderColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  actionButton: {
    alignItems: "center",
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    minWidth: 80,
  },
  actionButtonText: {
    color: "white",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#2d2d2d",
    borderRadius: 12,
    padding: 24,
    width: width * 0.8,
  },
  modalTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  modalInput: {
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    padding: 12,
    color: "white",
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  modalButtonPrimary: {
    backgroundColor: "#007AFF",
  },
  modalButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  modalButtonTextPrimary: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  savedTextsModal: {
    backgroundColor: "#2d2d2d",
    borderRadius: 12,
    width: width * 0.9,
    height: height * 0.7,
    padding: 20,
  },
  savedTextsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  savedTextsList: {
    flex: 1,
  },
  emptyText: {
    color: "#666",
    fontSize: 16,
    textAlign: "center",
    marginTop: 40,
  },
  savedTextItem: {
    flexDirection: "row",
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    marginBottom: 12,
    overflow: "hidden",
  },
  savedTextContent: {
    flex: 1,
    padding: 16,
  },
  savedTextTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  savedTextPreview: {
    color: "#ccc",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  savedTextDate: {
    color: "#666",
    fontSize: 12,
  },
  deleteButton: {
    width: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 68, 68, 0.1)",
  },
});
