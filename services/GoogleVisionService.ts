import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';

const GOOGLE_VISION_API_KEY = Constants.expoConfig?.extra?.GOOGLE_VISION_API_KEY;
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

      const result = await response.json();

      if (result.responses?.[0]?.error) {
        return {
          text: '',
          confidence: 0,
          error: result.responses[0].error.message,
        };
      }

      const textAnnotations = result.responses?.[0]?.textAnnotations;
      
      if (!textAnnotations || textAnnotations.length === 0) {
        return {
          text: '',
          confidence: 0,
          error: 'No text detected in image',
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

      const textAnnotations = result.responses?.[0]?.textAnnotations || [];
      const barcodes: BarcodeResult[] = [];

      if (textAnnotations.length > 0) {
        const detectedText = textAnnotations[0].description || '';
        barcodes.push({
          type: 'TEXT',
          value: detectedText,
          format: 'DETECTED_TEXT',
        });
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
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    } catch (error) {
      throw new Error('Failed to convert image to base64');
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

