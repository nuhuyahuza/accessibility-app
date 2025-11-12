import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import type { Router } from 'expo-router';

export const openGallery = async (router: Router) => {
  try {
    // Request gallery permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        "Permission Required",
        "Please grant gallery access to select photos"
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      // Navigate to scan screen with image URI
      router.push({
        pathname: '/scan',
        params: { imageUri: asset.uri },
      });
    }
  } catch (error) {
    console.error("Gallery error:", error);
    Alert.alert("Error", "Unable to access gallery");
  }
};
