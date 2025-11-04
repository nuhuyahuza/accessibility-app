import AccessibleButton from '@/components/AccessibleButton';
import { GoogleVisionService } from '@/services/GoogleVisionService';
import { TTSService } from '@/services/TTSServices';
import {
    CameraType,
    CameraView,
    useCameraPermissions,
} from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as MediaLibrary from 'expo-media-library';
import React, { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface CapturedImage {
  uri: string;
  text?: string;
  confidence?: number;
  processed: boolean;
}

export default function CaptureAndSave() {
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const cameraRef = useRef<InstanceType<typeof CameraView> | null>(null);
  const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([]);
  const [facing, setFacing] = useState<CameraType>('back');
  const [isProcessing, setIsProcessing] = useState(false);

  const capture = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const result = await cameraRef.current?.takePictureAsync?.();
      if (result?.uri) {
        setCapturedImages(prev => [...prev, { uri: result.uri, processed: false }]);
        TTSService.speak(`Image ${capturedImages.length + 1} captured. Tap process to extract text from all images.`);
      } else {
        Alert.alert('Capture failed.');
      }
    } catch {
      Alert.alert('Capture error.');
    }
  };

  const processAllImages = async () => {
    if (capturedImages.length === 0) {
      TTSService.speak('No images to process. Capture some images first.');
      return;
    }

    setIsProcessing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    TTSService.speak(`Processing ${capturedImages.length} images. Please wait...`);

    const results = await GoogleVisionService.batchProcessImages(
      capturedImages.map(img => img.uri)
    );

    const updatedImages = capturedImages.map((img, index) => ({
      ...img,
      text: results[index]?.text || '',
      confidence: results[index]?.confidence || 0,
      processed: true,
    }));

    setCapturedImages(updatedImages);
    setIsProcessing(false);

    const successCount = results.filter(r => r.text && !r.error).length;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    TTSService.speak(
      `Processing complete. Successfully extracted text from ${successCount} out of ${capturedImages.length} images.`
    );
  };

  const saveAll = async () => {
    if (!mediaPermission?.granted) {
      const { status } = await requestMediaPermission();
      if (status !== 'granted') {
        return Alert.alert('Permission denied.');
      }
    }

    if (capturedImages.length === 0) {
      TTSService.speak('No images to save.');
      return;
    }

    try {
      for (const image of capturedImages) {
        await MediaLibrary.saveToLibraryAsync(image.uri);
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      TTSService.speak(`Saved ${capturedImages.length} images to gallery.`);
      Alert.alert('Success', `Saved ${capturedImages.length} images to gallery.`);
    } catch (error) {
      TTSService.speak('Error saving images to gallery.');
      Alert.alert('Error', 'Failed to save images.');
    }
  };

  const clearAll = () => {
    setCapturedImages([]);
    TTSService.speak('All captured images cleared.');
  };

  const removeImage = (index: number) => {
    setCapturedImages(prev => prev.filter((_, i) => i !== index));
    TTSService.speak('Image removed.');
  };

  const readAllText = () => {
    const allText = capturedImages
      .filter(img => img.text)
      .map((img, index) => `Image ${index + 1}: ${img.text}`)
      .join('. ');

    if (allText) {
      TTSService.speak(allText);
    } else {
      TTSService.speak('No text extracted yet. Process the images first.');
    }
  };

  if (!permission) return <View style={styles.centered} />;
  if (!permission.granted) {
    return <AccessibleButton label="Grant Camera Permission" onPress={requestPermission} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Batch Scanner</Text>
        <Text style={styles.headerSubtitle}>
          {capturedImages.length} image{capturedImages.length !== 1 ? 's' : ''} captured
        </Text>
      </View>

      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
        />
        {isProcessing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.processingText}>Processing images...</Text>
          </View>
        )}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.captureButton}
          onPress={capture}
          disabled={isProcessing}
        >
          <Text style={styles.captureButtonText}>📷 Capture</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.flipButton}
          onPress={() => setFacing(prev => (prev === 'back' ? 'front' : 'back'))}
        >
          <Text style={styles.flip}>🔄 Flip</Text>
        </TouchableOpacity>
      </View>

      {capturedImages.length > 0 && (
        <View style={styles.batchControls}>
          <TouchableOpacity
            style={[styles.batchButton, styles.processButton]}
            onPress={processAllImages}
            disabled={isProcessing}
          >
            <Text style={styles.batchButtonText}>
              {isProcessing ? 'Processing...' : '🔍 Process All'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.batchButton, styles.readButton]}
            onPress={readAllText}
            disabled={isProcessing}
          >
            <Text style={styles.batchButtonText}>🔊 Read All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.batchButton, styles.saveButton]}
            onPress={saveAll}
            disabled={isProcessing}
          >
            <Text style={styles.batchButtonText}>💾 Save All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.batchButton, styles.clearButton]}
            onPress={clearAll}
            disabled={isProcessing}
          >
            <Text style={styles.batchButtonText}>🗑️ Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        horizontal
        style={styles.thumbnailsContainer}
        showsHorizontalScrollIndicator={false}
      >
        {capturedImages.map((image, index) => (
          <View key={index} style={styles.thumbnailWrapper}>
            <Image source={{ uri: image.uri }} style={styles.thumbnail} />
            <TouchableOpacity
              style={styles.removeThumbnail}
              onPress={() => removeImage(index)}
            >
              <Text style={styles.removeThumbnailText}>✕</Text>
            </TouchableOpacity>
            {image.processed && (
              <View style={styles.processedBadge}>
                <Text style={styles.processedBadgeText}>
                  {image.confidence}%
                </Text>
              </View>
            )}
            {image.text && (
              <View style={styles.textPreview}>
                <Text style={styles.textPreviewText} numberOfLines={2}>
                  {image.text}
                </Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000' 
  },
  header: {
    backgroundColor: '#111',
    paddingVertical: 16,
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#888',
    fontSize: 14,
    marginTop: 4,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: { 
    flex: 1 
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 12,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 12,
    backgroundColor: '#111',
  },
  captureButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    flex: 1,
    marginRight: 8,
  },
  captureButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  flipButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  flip: { 
    color: '#fff', 
    fontSize: 18,
    fontWeight: '600',
  },
  batchControls: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#111',
    justifyContent: 'space-between',
  },
  batchButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    flex: 1,
    marginHorizontal: 4,
  },
  processButton: {
    backgroundColor: '#667eea',
  },
  readButton: {
    backgroundColor: '#4CAF50',
  },
  saveButton: {
    backgroundColor: '#FF9800',
  },
  clearButton: {
    backgroundColor: '#f44336',
  },
  batchButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  thumbnailsContainer: {
    backgroundColor: '#111',
    paddingVertical: 12,
    maxHeight: 180,
  },
  thumbnailWrapper: {
    marginHorizontal: 8,
    position: 'relative',
  },
  thumbnail: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#333',
  },
  removeThumbnail: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#f44336',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeThumbnailText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  processedBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  processedBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  textPreview: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 6,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  textPreviewText: {
    color: '#fff',
    fontSize: 10,
  },
  centered: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
});
