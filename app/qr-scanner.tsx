import { AccessibleButton } from '@/components/AccessibilityButton1';
import { GoogleVisionService } from '@/services/GoogleVisionService';
import { TTSService } from '@/services/TTSServices';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

export default function QRScannerScreen() {
  const navigation = useNavigation();
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedData, setScannedData] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanType, setScanType] = useState<'qr' | 'barcode' | 'text'>('qr');
  const [useNativeScanner, setUseNativeScanner] = useState(true);
  const [hasScanned, setHasScanned] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  
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
      'QR and barcode scanner ready. Point your camera at a QR code or barcode. It will scan automatically when detected.'
    );
  }, []);

  const handleBarcodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (hasScanned || !data) return;
    
    setHasScanned(true);
    setScannedData(data);
    
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    console.log(`Native scanner detected ${type}:`, data);
    
    if (isUrl(data)) {
      TTSService.speak(`QR code detected. URL found: ${data}. Tap Open to visit the link.`);
    } else {
      TTSService.speak(`Code detected. Content: ${data}`);
    }
    
    setTimeout(() => {
      setHasScanned(false);
    }, 3000);
  };

  const handleCapture = async () => {
    try {
      if (!cameraRef.current) return;

      setIsProcessing(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      TTSService.speak('Capturing image...');

      const photo = await cameraRef.current.takePictureAsync();
      
      if (photo?.uri) {
        await processImage(photo.uri);
      }
    } catch (error) {
      console.error('Capture error:', error);
      setIsProcessing(false);
      TTSService.speak('Failed to capture image. Please try again.');
    }
  };

  const handleGalleryPick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setIsProcessing(true);
        await processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Gallery error:', error);
      TTSService.speak('Failed to select image from gallery.');
    }
  };

  const processImage = async (imageUri: string) => {
    try {
      setIsProcessing(true);
      TTSService.speak('Processing image...');
      
      console.log('Processing image:', imageUri);
      
      const barcodes = await GoogleVisionService.detectBarcodes(imageUri);
      
      console.log('Barcodes detected:', barcodes);
      
      setIsProcessing(false);

      if (barcodes.length > 0 && barcodes[0].value) {
        const data = barcodes[0].value;
        setScannedData(data);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        console.log('QR/Barcode data:', data);
        
        if (isUrl(data)) {
          TTSService.speak(`QR code detected. URL found: ${data}. Tap Open to visit the link.`);
        } else {
          TTSService.speak(`Code detected. Content: ${data}`);
        }
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        console.log('No data found in image');
        TTSService.speak('No QR code or barcode detected. Please ensure the code is clearly visible and well-lit, then try again.');
      }
    } catch (error) {
      setIsProcessing(false);
      console.error('Processing error:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      TTSService.speak('Error processing image. Please check your internet connection and try again.');
    }
  };

  const isUrl = (text: string): boolean => {
    try {
      new URL(text);
      return true;
    } catch {
      return text.startsWith('http://') || text.startsWith('https://');
    }
  };

  const handleOpenUrl = async () => {
    if (isUrl(scannedData)) {
      try {
        const canOpen = await Linking.canOpenURL(scannedData);
        if (canOpen) {
          await Linking.openURL(scannedData);
          TTSService.speak('Opening link in browser.');
        } else {
          TTSService.speak('Unable to open this link.');
        }
      } catch (error) {
        TTSService.speak('Error opening link.');
      }
    }
  };

  const handleReadData = () => {
    if (scannedData) {
      TTSService.speak(scannedData);
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.permissionContainer}
        >
          <Ionicons name="camera-outline" size={64} color="white" />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            We need camera access to scan QR codes and barcodes
          </Text>
          <AccessibleButton
            title="Grant Permission"
            onPress={requestPermission}
            description="Allow camera access for QR code scanning"
            variant="glass"
            size="large"
          />
        </LinearGradient>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        <BlurView intensity={20} tint="dark" style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>QR & Barcode Scanner</Text>
            <Text style={styles.subtitle}>Scan codes instantly</Text>
          </View>
        </BlurView>

      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={
            useNativeScanner
              ? {
                  barcodeTypes: [
                    'qr',
                    'code128',
                    'code39',
                    'code93',
                    'codabar',
                    'ean13',
                    'ean8',
                    'itf14',
                    'upc_a',
                    'upc_e',
                    'pdf417',
                    'aztec',
                    'datamatrix',
                  ],
                }
              : undefined
          }
          onBarcodeScanned={useNativeScanner ? handleBarcodeScanned : undefined}
        >
          <View style={styles.scanOverlay}>
              <View style={styles.scanFrame}>
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />
              </View>
              
              <BlurView intensity={60} tint="dark" style={styles.instructionBox}>
                <Ionicons name="scan-outline" size={24} color="#4CAF50" />
                <Text style={styles.instructionText}>
                  Align {scanType.toUpperCase()} within frame
                </Text>
              </BlurView>
            </View>
          </CameraView>

          {isProcessing && (
            <BlurView intensity={80} tint="dark" style={styles.processingOverlay}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.processingText}>Processing...</Text>
            </BlurView>
          )}
        </View>

        <View style={styles.controlsContainer}>
          <View style={styles.scanTypeSelector}>
            <TouchableOpacity
              style={[
                styles.scanTypeButton,
                useNativeScanner && styles.scanTypeButtonActive,
              ]}
              onPress={() => {
                setUseNativeScanner(true);
                setScannedData('');
                TTSService.speak('Automatic scanning enabled. Point camera at code.');
              }}
            >
              <Text
                style={[
                  styles.scanTypeText,
                  useNativeScanner && styles.scanTypeTextActive,
                ]}
              >
                AUTO
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.scanTypeButton,
                !useNativeScanner && styles.scanTypeButtonActive,
              ]}
              onPress={() => {
                setUseNativeScanner(false);
                setScannedData('');
                TTSService.speak('Manual mode. Capture photo to scan.');
              }}
            >
              <Text
                style={[
                  styles.scanTypeText,
                  !useNativeScanner && styles.scanTypeTextActive,
                ]}
              >
                MANUAL
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleGalleryPick}
              disabled={isProcessing}
            >
              <LinearGradient
                colors={['#f093fb', '#f5576c']}
                style={styles.iconButtonGradient}
              >
                <Ionicons name="images-outline" size={28} color="white" />
              </LinearGradient>
            </TouchableOpacity>

            {!useNativeScanner && (
              <TouchableOpacity
                style={styles.captureButton}
                onPress={handleCapture}
                disabled={isProcessing}
              >
                <LinearGradient
                  colors={['#4facfe', '#00f2fe']}
                  style={styles.captureButtonGradient}
                >
                  <Ionicons name="scan" size={40} color="white" />
                </LinearGradient>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => {
                setScannedData('');
                setHasScanned(false);
                TTSService.speak('Scanner reset. Ready to scan.');
              }}
              disabled={isProcessing}
            >
              <LinearGradient
                colors={['#43e97b', '#38f9d7']}
                style={styles.iconButtonGradient}
              >
                <Ionicons name="refresh-outline" size={28} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {scannedData && (
            <BlurView intensity={60} tint="dark" style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                <Text style={styles.resultTitle}>Code Detected</Text>
              </View>
              
              <ScrollView style={styles.resultTextContainer}>
                <Text style={styles.resultText}>{scannedData}</Text>
              </ScrollView>

              <View style={styles.resultActions}>
                <AccessibleButton
                  title="🔊 Read"
                  onPress={handleReadData}
                  description="Read the scanned code aloud"
                  variant="success"
                  size="small"
                />
                
                {isUrl(scannedData) && (
                  <AccessibleButton
                    title="🌐 Open"
                    onPress={handleOpenUrl}
                    description="Open the scanned URL in browser"
                    variant="gradient"
                    size="small"
                  />
                )}
              </View>
            </BlurView>
          )}
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
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
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
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
    color: 'white',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  scanOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: width * 0.7,
    height: width * 0.7,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#4CAF50',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  instructionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 40,
    overflow: 'hidden',
  },
  instructionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
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
  controlsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#000',
  },
  scanTypeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  scanTypeButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    marginHorizontal: 6,
  },
  scanTypeButtonActive: {
    backgroundColor: '#4CAF50',
  },
  scanTypeText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '600',
  },
  scanTypeTextActive: {
    color: 'white',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconButton: {
    marginHorizontal: 12,
  },
  iconButtonGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    marginHorizontal: 20,
  },
  captureButtonGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultCard: {
    padding: 20,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  resultTextContainer: {
    maxHeight: 100,
    marginBottom: 12,
  },
  resultText: {
    color: 'white',
    fontSize: 16,
    lineHeight: 24,
  },
  resultActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 32,
  },
});

