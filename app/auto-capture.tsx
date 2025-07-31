import AccessibleButton from '@/components/AccessibleButton';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

export default function AutoCapture() {
  const [permission, requestPermission] = useCameraPermissions(); // ✅ correctly using hook
  const cameraRef = useRef<CameraView | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [facing, setFacing] = useState<CameraType>("back");

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;

    if (capturing) {
      timer = setInterval(() => {
        handleCapture();
      }, 5000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [capturing]);

  const handleCapture = async () => {
    try {
      const photo = await cameraRef.current?.takePictureAsync?.({
        base64: true, // Ensure base64 is returned
      });

      if (photo?.base64) {
        console.log("[Auto-Captured Image]", photo.base64.substring(0, 30));
        // you can upload or process the base64 here
      }
    } catch (err) {
      console.warn("Auto-capture failed:", err);
    }
  };

  // Still loading permissions
  if (!permission) {
    return <View style={styles.centered} />;
  }

  // Permission denied, show button to request
  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <AccessibleButton
          label="Grant Camera Permission"
          onPress={requestPermission}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing={facing} />
      <AccessibleButton
        label={capturing ? "Stop Auto-Capture" : "Start Auto-Capture"}
        onPress={() => setCapturing((prev) => !prev)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
