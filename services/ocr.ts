import Constants from "expo-constants";


export const extractTextFromImage = async (
  base64Image: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    onProgress?.(20);
    
    const formData = new FormData();
    formData.append('base64Image', `data:image/jpeg;base64,${base64Image}`);
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');
    
    onProgress?.(50);
    
    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: {
        'apikey': Constants?.expoConfig?.extra?.OCR_API_KEY, // Get from ocr.space
      },
      body: formData,
    });
    
    onProgress?.(80);
    
    const result = await response.json();
    onProgress?.(100);
    
    if (result.ParsedResults && result.ParsedResults.length > 0) {
      return result.ParsedResults[0].ParsedText;
    }
    
    throw new Error('No text found');
  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error('Failed to extract text from image');
  }
};