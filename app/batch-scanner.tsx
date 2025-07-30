import AccessibleButton from '@/components/AccessibleButton';
import {
  CameraType,
  CameraView,
  useCameraPermissions,
} from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import React, { useRef, useState } from 'react';
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function CaptureAndSave() {
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const cameraRef = useRef<InstanceType<typeof CameraView> | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [facing, setFacing] = useState<CameraType>('back');

  const capture = async () => {
    try {
      const result = await cameraRef.current?.takePictureAsync?.();
      if (result?.uri) {
        setPhotoUri(result.uri);
      } else {
        Alert.alert('Capture failed.');
      }
    } catch {
      Alert.alert('Capture error.');
    }
  };

  const save = async () => {
    if (!mediaPermission?.granted) {
      const { status } = await requestMediaPermission();
      if (status !== 'granted') {
        return Alert.alert('Permission denied.');
      }
    }
    if (photoUri) {
      await MediaLibrary.saveToLibraryAsync(photoUri);
      Alert.alert('Saved to gallery.');
      setPhotoUri(null);
    }
  };

  const retake = () => setPhotoUri(null);

  if (!permission) return <View style={styles.centered} />;
  if (!permission.granted) {
    return <AccessibleButton label="Grant Camera Permission" onPress={requestPermission} />;
  }

  return (
    <View style={styles.container}>
      {photoUri ? (
        <>
          <Image source={{ uri: photoUri }} style={styles.preview} />
          <View style={styles.controls}>
            <AccessibleButton label="Save Photo" onPress={save} />
            <AccessibleButton label="Retake" onPress={retake} />
          </View>
        </>
      ) : (
        <>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={facing}
          />
          <View style={styles.controls}>
            <AccessibleButton label="Capture" onPress={capture} />
            <TouchableOpacity onPress={() => setFacing(prev => (prev === 'back' ? 'front' : 'back'))}>
              <Text style={styles.flip}>Flip</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  preview: { flex: 1 },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 12,
    backgroundColor: '#111',
  },
  flip: { color: '#fff', fontSize: 18, alignSelf: 'center' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
