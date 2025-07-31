import AccessibleButton from '@/components/AccessibleButton';
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, View } from "react-native";

export default function CameraScreen() {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const [facing, setFacing] = useState<CameraType>("back");
  const router = useRouter();

  const captureImage = async () => {
    if (!cameraRef.current) return;

    setLoading(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 1,
      });

      if (photo?.base64) {
        router.push({
          pathname: "/processing",
          params: { base64: photo.base64 },
        });
      } else {
        Alert.alert("Error", "Image capture failed.");
      }
    } catch (err) {
      console.error("Camera error:", err);
      Alert.alert("Error", "Failed to capture image.");
    } finally {
      setLoading(false);
    }
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  if (!permission) {
    // Camera permissions are still loading
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
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
      <CameraView
        style={styles.camera}
        ref={cameraRef}
        facing={facing}
        mode="picture"
      >
        <View style={styles.controls}>
          {loading ? (
            <ActivityIndicator size="large" color="white" />
          ) : (
            <>
              <AccessibleButton label="Capture Image" onPress={captureImage} />
              <AccessibleButton
                label="Flip Camera"
                onPress={toggleCameraFacing}
              />
            </>
          )}
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  controls: {
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
    flexDirection: "row",
    gap: 10,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});