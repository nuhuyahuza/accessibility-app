import AccessibleButton from '@/components/AccessibleButton';
import { Camera, CameraType } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';

export default function CameraScreen() {
  const cameraRef = useRef<Camera>(null);
  const [permission, requestPermission] = Camera.useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const captureImage = async () => {
    setLoading(true);
    try {
      const photo = await cameraRef.current?.takePictureAsync({ base64: true });
      if (photo?.base64) {
        router.push({ pathname: '/processing', params: { base64: photo.base64 } });
      } else {
        Alert.alert('Error', 'Image capture failed.');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to access camera.');
    } finally {
      setLoading(false);
    }
  };

  if (!permission?.granted) {
    return (
      <View style={styles.centered}>
        <AccessibleButton label="Grant Camera Permission" onPress={() => requestPermission()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera style={styles.camera} ref={cameraRef} type={CameraType.back} />
      <View style={styles.controls}>
        {loading ? (
          <ActivityIndicator size="large" />
        ) : (
          <AccessibleButton label="Capture Image" onPress={captureImage} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  controls: { position: 'absolute', bottom: 30, alignSelf: 'center' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
