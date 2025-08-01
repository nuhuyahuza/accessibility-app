// utils/compressImage.ts
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';


export const compressImage = async (
  imageUri: string,
  maxSizeKB: number
): Promise<string> => {
  let quality = 1.0;
  let compressedUri = imageUri;

  while (true) {
    const fileInfo = await FileSystem.getInfoAsync(compressedUri);

    if (!fileInfo.exists) {
      throw new Error('File does not exist');
    }

    if (fileInfo.size && fileInfo.size / 1024 <= maxSizeKB) {
      return compressedUri;
    }

    quality -= 0.1;
    if (quality <= 0) {
      throw new Error('Cannot compress image below required size');
    }

    const result = await ImageManipulator.manipulateAsync(
      compressedUri,
      [],
      {
        compress: quality,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    compressedUri = result.uri;
  }
};


export const getImage = async (
  uri: string
): Promise<{ uri: string; base64: string }> => {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return { uri, base64 };
};

export const getAllImages = async (): Promise<string[]> => {
  const imagesDir = `${FileSystem.documentDirectory}images/`;
  const files = await FileSystem.readDirectoryAsync(imagesDir);
  return files.map((f) => `${imagesDir}${f}`);
};
