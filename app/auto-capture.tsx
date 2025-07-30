import AccessibleButton from '@/components/AccessibleButton';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

export default function AutoCapture() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [facing, setFacing] = useState<CameraType>('back');

  useEffect(() => {
    let timer:any;
    if (capturing) {
      timer = setInterval(() => {
        handleCapture();
      }, 5000);
    }
    return () => clearInterval(timer);
  }, [capturing]);

  const handleCapture = async () => {
    try {
      const photo = await cameraRef.current?.takePictureAsync?.();
      if (photo?.base64) {
        console.log('[Auto-Captured Image]', photo.base64.substring(0, 30));
      }
    } catch (err) {
      console.warn('Auto-capture failed:', err);
    }
  };

  if (!permission) return <View style={styles.centered} />;
  if (!permission.granted) {
    return (
      <AccessibleButton label="Grant Camera Permission" onPress={requestPermission} />
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
      />
      <AccessibleButton
        label={capturing ? 'Stop Auto-Capture' : 'Start Auto-Capture'}
        onPress={() => setCapturing(prev => !prev)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
