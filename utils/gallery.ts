import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

export const openGallery = async () => {
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
      base64: true,
    });

    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      if (asset.base64) {
        return {
          pathname: "/processing",
          params: { base64: asset.base64, photoUri: asset.uri },
        };
      }
    }
  } catch (error) {
    console.error("Gallery error:", error);
    Alert.alert("Error", "Unable to access gallery");
  }
};
