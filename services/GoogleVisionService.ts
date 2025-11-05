import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';

const GOOGLE_VISION_API_KEY = Constants.expoConfig?.extra?.GOOGLE_VISION_API_KEY || Constants.manifest?.extra?.GOOGLE_VISION_API_KEY;
const GOOGLE_VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';

export interface VisionOCRResult {
  text: string;
  confidence: number;
  error?: string;
}

export interface ObjectDetection {
  name: string;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface BarcodeResult {
  type: string;
  value: string;
  format: string;
}

export class GoogleVisionService {
  static async detectText(imageUri: string): Promise<VisionOCRResult> {
    try {
      console.log('=== Google Vision OCR Started ===');
      console.log('API Key configured:', !!GOOGLE_VISION_API_KEY);
      console.log('API Key length:', GOOGLE_VISION_API_KEY?.length || 0);
      console.log('Image URI:', imageUri);
      
      if (!GOOGLE_VISION_API_KEY) {
        console.error('No API key configured!');
        return {
          text: '',
          confidence: 0,
          error: 'Google Vision API key not configured. Please add GOOGLE_VISION_API_KEY to your app config.',
        };
      }
      
      console.log('Converting image to base64...');
      const base64Image = await this.convertImageToBase64(imageUri);
      console.log('Base64 image size:', base64Image.length, 'characters');
      
      const requestBody = {
        requests: [
          {
            image: {
              content: base64Image,
            },
            features: [
              {
                type: 'TEXT_DETECTION',
                maxResults: 1,
              },
            ],
          },
        ],
      };

      const response = await fetch(`${GOOGLE_VISION_API_URL}?key=${GOOGLE_VISION_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Google Vision API Response Status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Google Vision API Error Response:', errorText);
        return {
          text: '',
          confidence: 0,
          error: `API Error (${response.status}): ${errorText}`,
        };
      }

      const result = await response.json();
      console.log('Google Vision API Result:', JSON.stringify(result).substring(0, 200));

      if (result.responses?.[0]?.error) {
        console.error('Google Vision Response Error:', result.responses[0].error);
        return {
          text: '',
          confidence: 0,
          error: result.responses[0].error.message,
        };
      }

      const textAnnotations = result.responses?.[0]?.textAnnotations;
      console.log('Text Annotations found:', textAnnotations?.length || 0);
      
      if (!textAnnotations || textAnnotations.length === 0) {
        console.log('Full API Response:', JSON.stringify(result));
        return {
          text: '',
          confidence: 0,
          error: 'No text detected in image. This could mean: 1) The image has no text, 2) The text is too small/blurry, 3) API key is invalid, or 4) API quota exceeded. Check console logs for details.',
        };
      }

      const fullText = textAnnotations[0].description || '';
      const avgConfidence = this.calculateConfidence(textAnnotations);

      return {
        text: fullText,
        confidence: Math.round(avgConfidence * 100),
      };
    } catch (error) {
      console.error('Google Vision Text Detection Error:', error);
      return {
        text: '',
        confidence: 0,
        error: error instanceof Error ? error.message : 'Failed to detect text',
      };
    }
  }

  static async detectObjects(imageUri: string): Promise<ObjectDetection[]> {
    try {
      const base64Image = await this.convertImageToBase64(imageUri);
      
      const requestBody = {
        requests: [
          {
            image: {
              content: base64Image,
            },
            features: [
              {
                type: 'OBJECT_LOCALIZATION',
                maxResults: 10,
              },
              {
                type: 'LABEL_DETECTION',
                maxResults: 10,
              },
            ],
          },
        ],
      };

      const response = await fetch(`${GOOGLE_VISION_API_URL}?key=${GOOGLE_VISION_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (result.responses?.[0]?.error) {
        throw new Error(result.responses[0].error.message);
      }

      const objects: ObjectDetection[] = [];
      
      const localizedObjects = result.responses?.[0]?.localizedObjectAnnotations || [];
      localizedObjects.forEach((obj: any) => {
        const vertices = obj.boundingPoly?.normalizedVertices || [];
        objects.push({
          name: obj.name,
          confidence: Math.round(obj.score * 100),
          boundingBox: vertices.length >= 2 ? {
            x: vertices[0].x,
            y: vertices[0].y,
            width: vertices[2].x - vertices[0].x,
            height: vertices[2].y - vertices[0].y,
          } : undefined,
        });
      });

      const labels = result.responses?.[0]?.labelAnnotations || [];
      labels.forEach((label: any) => {
        if (!objects.find(obj => obj.name.toLowerCase() === label.description.toLowerCase())) {
          objects.push({
            name: label.description,
            confidence: Math.round(label.score * 100),
          });
        }
      });

      return objects.sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      console.error('Google Vision Object Detection Error:', error);
      return [];
    }
  }

  static async detectBarcodes(imageUri: string): Promise<BarcodeResult[]> {
    try {
      const base64Image = await this.convertImageToBase64(imageUri);
      
      const requestBody = {
        requests: [
          {
            image: {
              content: base64Image,
            },
            features: [
              {
                type: 'TEXT_DETECTION',
                maxResults: 10,
              },
            ],
          },
        ],
      };

      const response = await fetch(`${GOOGLE_VISION_API_URL}?key=${GOOGLE_VISION_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      console.log('Google Vision API Response:', JSON.stringify(result, null, 2));

      if (result.responses?.[0]?.error) {
        console.error('Vision API Error:', result.responses[0].error);
        throw new Error(result.responses[0].error.message);
      }

      const barcodes: BarcodeResult[] = [];

      const textAnnotations = result.responses?.[0]?.textAnnotations;
      if (textAnnotations && textAnnotations.length > 0) {
        const fullText = textAnnotations[0].description;
        if (fullText) {
          barcodes.push({
            type: 'QR_CODE',
            value: fullText.trim(),
            format: 'TEXT_DETECTION',
          });
          console.log('Detected text from QR/Barcode:', fullText);
        }
      }

      const fullTextAnnotation = result.responses?.[0]?.fullTextAnnotation;
      if (fullTextAnnotation && fullTextAnnotation.text && barcodes.length === 0) {
        barcodes.push({
          type: 'TEXT',
          value: fullTextAnnotation.text.trim(),
          format: 'FULL_TEXT',
        });
        console.log('Detected full text:', fullTextAnnotation.text);
      }

      return barcodes;
    } catch (error) {
      console.error('Google Vision Barcode Detection Error:', error);
      return [];
    }
  }

  static async detectLogos(imageUri: string): Promise<ObjectDetection[]> {
    try {
      const base64Image = await this.convertImageToBase64(imageUri);
      
      const requestBody = {
        requests: [
          {
            image: {
              content: base64Image,
            },
            features: [
              {
                type: 'LOGO_DETECTION',
                maxResults: 10,
              },
            ],
          },
        ],
      };

      const response = await fetch(`${GOOGLE_VISION_API_URL}?key=${GOOGLE_VISION_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (result.responses?.[0]?.error) {
        throw new Error(result.responses[0].error.message);
      }

      const logos = result.responses?.[0]?.logoAnnotations || [];
      return logos.map((logo: any) => ({
        name: logo.description,
        confidence: Math.round(logo.score * 100),
      }));
    } catch (error) {
      console.error('Google Vision Logo Detection Error:', error);
      return [];
    }
  }

  static async analyzeImage(imageUri: string) {
    try {
      const base64Image = await this.convertImageToBase64(imageUri);
      
      const requestBody = {
        requests: [
          {
            image: {
              content: base64Image,
            },
            features: [
              { type: 'TEXT_DETECTION' },
              { type: 'LABEL_DETECTION', maxResults: 10 },
              { type: 'OBJECT_LOCALIZATION', maxResults: 10 },
              { type: 'LOGO_DETECTION', maxResults: 5 },
              { type: 'SAFE_SEARCH_DETECTION' },
              { type: 'IMAGE_PROPERTIES' },
            ],
          },
        ],
      };

      const response = await fetch(`${GOOGLE_VISION_API_URL}?key=${GOOGLE_VISION_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();
      return result.responses?.[0] || {};
    } catch (error) {
      console.error('Google Vision Image Analysis Error:', error);
      return {};
    }
  }

  private static async convertImageToBase64(imageUri: string): Promise<string> {
    try {
      // Handle different URI formats
      let processedUri = imageUri;
      
      // Remove file:// prefix if present
      if (imageUri.startsWith('file://')) {
        processedUri = imageUri;
      } else if (!imageUri.startsWith('/')) {
        // If it's not an absolute path and doesn't have file://, add it
        processedUri = imageUri;
      }
      
      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(processedUri);
      if (!fileInfo.exists) {
        console.error('File does not exist:', processedUri);
        throw new Error(`Image file not found: ${processedUri}`);
      }
      
      const base64 = await FileSystem.readAsStringAsync(processedUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      if (!base64) {
        throw new Error('Base64 conversion returned empty string');
      }
      
      return base64;
    } catch (error) {
      console.error('Base64 conversion error:', error);
      console.error('Original URI:', imageUri);
      throw new Error(`Failed to convert image to base64: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static calculateConfidence(annotations: any[]): number {
    if (!annotations || annotations.length === 0) return 0;
    
    let totalConfidence = 0;
    let count = 0;

    annotations.slice(1).forEach(annotation => {
      if (annotation.confidence) {
        totalConfidence += annotation.confidence;
        count++;
      }
    });

    if (count === 0) return 0.85;
    
    return totalConfidence / count;
  }

  static async batchProcessImages(imageUris: string[]): Promise<VisionOCRResult[]> {
    const results: VisionOCRResult[] = [];
    
    for (const uri of imageUris) {
      const result = await this.detectText(uri);
      results.push(result);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return results;
  }
}

