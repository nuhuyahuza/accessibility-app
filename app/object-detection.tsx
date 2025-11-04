import { AccessibleButton } from '@/components/AccessibilityButton1';
import { GoogleVisionService, ObjectDetection } from '@/services/GoogleVisionService';
import { TTSService } from '@/services/TTSServices';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Image,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

export default function ObjectDetectionScreen() {
  const navigation = useNavigation();
  const [imageUri, setImageUri] = useState<string>('');
  const [objects, setObjects] = useState<ObjectDetection[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedObject, setSelectedObject] = useState<ObjectDetection | null>(null);
  
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    TTSService.speak(
      'Object detection screen loaded. Take a photo or select from gallery to detect objects in the image.'
    );
  }, []);

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        TTSService.speak('Camera permission is required to take photos.');
        return;
      }

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      TTSService.speak('Opening camera...');

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.9,
      });

      if (!result.canceled && result.assets[0]) {
        await processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      TTSService.speak('Error accessing camera. Please try again.');
    }
  };

  const handleSelectFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        TTSService.speak('Gallery permission is required to select photos.');
        return;
      }

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      TTSService.speak('Opening gallery...');

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.9,
      });

      if (!result.canceled && result.assets[0]) {
        await processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Gallery error:', error);
      TTSService.speak('Error accessing gallery. Please try again.');
    }
  };

  const processImage = async (uri: string) => {
    try {
      setImageUri(uri);
      setObjects([]);
      setIsProcessing(true);
      setSelectedObject(null);

      TTSService.speak('Analyzing image for objects. Please wait...');

      const detectedObjects = await GoogleVisionService.detectObjects(uri);
      const logos = await GoogleVisionService.detectLogos(uri);

      const allObjects = [...detectedObjects, ...logos];

      setIsProcessing(false);

      if (allObjects.length > 0) {
        setObjects(allObjects);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        const objectNames = allObjects.slice(0, 5).map(obj => obj.name).join(', ');
        TTSService.speak(
          `Detected ${allObjects.length} objects: ${objectNames}${allObjects.length > 5 ? ', and more' : ''}.`
        );
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        TTSService.speak('No objects detected in the image. Try a different image with clearer objects.');
      }
    } catch (error) {
      setIsProcessing(false);
      console.error('Object detection error:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      TTSService.speak('Error detecting objects. Please try again.');
    }
  };

  const handleObjectPress = (object: ObjectDetection) => {
    setSelectedObject(object);
    TTSService.speak(
      `${object.name}, detected with ${object.confidence} percent confidence.`
    );
  };

  const handleDescribeScene = () => {
    if (objects.length === 0) {
      TTSService.speak('No objects detected to describe.');
      return;
    }

    const description = objects
      .slice(0, 10)
      .map((obj, index) => `${index + 1}. ${obj.name} with ${obj.confidence}% confidence`)
      .join('. ');

    TTSService.speak(`Scene description: I can see ${objects.length} objects. ${description}.`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <BlurView intensity={20} tint="light" style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.title}>🔍 Object Detection</Text>
              <Text style={styles.subtitle}>Identify objects in images</Text>
            </View>
          </BlurView>

          <ScrollView
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContentContainer}
          >
            {!imageUri ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="camera-outline" size={64} color="rgba(255,255,255,0.5)" />
                </View>
                <Text style={styles.emptyTitle}>No Image Selected</Text>
                <Text style={styles.emptySubtext}>
                  Take a photo or select from gallery to detect objects
                </Text>
              </View>
            ) : (
              <View style={styles.imageContainer}>
                <Image source={{ uri: imageUri }} style={styles.image} />
                {isProcessing && (
                  <BlurView intensity={80} tint="dark" style={styles.processingOverlay}>
                    <ActivityIndicator size="large" color="#4CAF50" />
                    <Text style={styles.processingText}>Analyzing image...</Text>
                  </BlurView>
                )}
              </View>
            )}

            {objects.length > 0 && (
              <View style={styles.resultsSection}>
                <View style={styles.resultsSummary}>
                  <Text style={styles.resultsTitle}>
                    Detected Objects ({objects.length})
                  </Text>
                  <TouchableOpacity
                    style={styles.describeButton}
                    onPress={handleDescribeScene}
                  >
                    <Ionicons name="volume-high" size={20} color="white" />
                    <Text style={styles.describeButtonText}>Describe Scene</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.objectsList}>
                  {objects.map((object, index) => (
                    <TouchableOpacity
                      key={`${object.name}-${index}`}
                      style={[
                        styles.objectCard,
                        selectedObject?.name === object.name &&
                          styles.objectCardSelected,
                      ]}
                      onPress={() => handleObjectPress(object)}
                    >
                      <BlurView
                        intensity={40}
                        tint="light"
                        style={styles.objectCardInner}
                      >
                        <View style={styles.objectRank}>
                          <Text style={styles.objectRankText}>{index + 1}</Text>
                        </View>
                        <View style={styles.objectInfo}>
                          <Text style={styles.objectName}>{object.name}</Text>
                          <View style={styles.confidenceBar}>
                            <View
                              style={[
                                styles.confidenceFill,
                                {
                                  width: `${object.confidence}%`,
                                  backgroundColor:
                                    object.confidence > 80
                                      ? '#4CAF50'
                                      : object.confidence > 60
                                      ? '#FF9800'
                                      : '#FF5722',
                                },
                              ]}
                            />
                          </View>
                        </View>
                        <Text style={styles.objectConfidence}>
                          {object.confidence}%
                        </Text>
                      </BlurView>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.actionsSection}>
              <AccessibleButton
                title="📷 Take Photo"
                onPress={handleTakePhoto}
                description="Take a photo to detect objects"
                variant="gradient"
                size="large"
              />
              <View style={styles.actionSpacer} />
              <AccessibleButton
                title="🖼️ From Gallery"
                onPress={handleSelectFromGallery}
                description="Select an image from gallery"
                variant="glass"
                size="large"
              />
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  imageContainer: {
    width: '100%',
    height: width * 0.75,
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 20,
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
  },
  resultsSection: {
    marginBottom: 20,
  },
  resultsSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.9)',
  },
  describeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76,175,80,0.3)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  describeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  objectsList: {
    marginBottom: 20,
  },
  objectCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  objectCardSelected: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  objectCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  objectRank: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(102,126,234,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  objectRankText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  objectInfo: {
    flex: 1,
  },
  objectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  confidenceBar: {
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 3,
  },
  objectConfidence: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 12,
  },
  actionsSection: {
    marginTop: 20,
  },
  actionSpacer: {
    height: 12,
  },
});
