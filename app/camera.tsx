import { Ionicons } from "@expo/vector-icons";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

export default function CameraScreen() {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const [facing, setFacing] = useState<CameraType>("back");
  const [flash, setFlash] = useState<"off" | "on" | "auto">("off");
  const [zoom, setZoom] = useState(0);
  const router = useRouter();

  const captureImage = async () => {
    if (!cameraRef.current || loading) return;

    setLoading(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.8,
        exif: false,
      });

      if (photo?.base64) {
        router.push({
          pathname: "/processing",
          params: { base64: photo.base64 },
        });
      } else {
        Alert.alert("Error", "Failed to capture image");
      }
    } catch (err) {
      console.error("Camera capture error:", err);
      Alert.alert("Error", "Unable to take photo");
    } finally {
      setLoading(false);
    }
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  const toggleFlash = () => {
    setFlash((current) => {
      switch (current) {
        case "off":
          return "on";
        case "on":
          return "auto";
        case "auto":
          return "off";
        default:
          return "off";
      }
    });
  };

  const getFlashIcon = () => {
    switch (flash) {
      case "on":
        return "flash";
      case "auto":
        return "flash-outline";
      case "off":
        return "flash-off";
      default:
        return "flash-off";
    }
  };

  if (!permission) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={80} color="#666" />
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          This app needs access to your camera to take photos
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="black" />

      <CameraView
        style={styles.camera}
        ref={cameraRef}
        facing={facing}
        mode="picture"
        flash={flash}
        zoom={zoom}
        enableTorch={false}
      >
        {/* Top Controls */}
        <View style={styles.topControls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => router.back()}
          >
            <Ionicons name="close" size={30} color="white" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={toggleFlash}>
            <Ionicons name={getFlashIcon()} size={30} color="white" />
          </TouchableOpacity>
        </View>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          {/* Gallery/Last Photo */}
          <TouchableOpacity style={styles.galleryButton}>
            <View style={styles.galleryPreview}>
              <Ionicons name="images-outline" size={24} color="white" />
            </View>
          </TouchableOpacity>

          {/* Capture Button */}
          <TouchableOpacity
            style={[
              styles.captureButton,
              loading && styles.captureButtonDisabled,
            ]}
            onPress={captureImage}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <View style={styles.captureButtonInner} />
            )}
          </TouchableOpacity>

          {/* Flip Camera */}
          <TouchableOpacity
            style={styles.flipButton}
            onPress={toggleCameraFacing}
          >
            <Ionicons name="camera-reverse-outline" size={30} color="white" />
          </TouchableOpacity>
        </View>

        {/* Zoom Indicator (when zoomed) */}
        {zoom > 0 && (
          <View style={styles.zoomIndicator}>
            <Text style={styles.zoomText}>{(1 + zoom * 9).toFixed(1)}x</Text>
          </View>
        )}
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  camera: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "white",
    fontSize: 16,
    marginTop: 10,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  permissionTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },
  permissionText: {
    color: "#ccc",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 30,
  },
  permissionButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  permissionButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  topControls: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    zIndex: 1,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  bottomControls: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  galleryButton: {
    width: 50,
    height: 50,
  },
  galleryPreview: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.3)",
  },
  captureButtonDisabled: {
    opacity: 0.6,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "white",
  },
  flipButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  zoomIndicator: {
    position: "absolute",
    top: 120,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  zoomText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});
