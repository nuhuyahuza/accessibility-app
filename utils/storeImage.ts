// utils/storeImage.ts
import * as FileSystem from 'expo-file-system';

export const storeImage = async (uri: string): Promise<string> => {
  const filename = uri.split('/').pop();
  const targetDir = FileSystem.documentDirectory + 'images/';
  const targetPath = targetDir + filename;

  await FileSystem.makeDirectoryAsync(targetDir, { intermediates: true });

  await FileSystem.moveAsync({
    from: uri,
    to: targetPath,
  });

  return targetPath;
};
