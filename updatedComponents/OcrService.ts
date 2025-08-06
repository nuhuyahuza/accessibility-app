// src/services/OCRService.ts
import { OCRResult } from '../types';

export class OCRService {
  private static readonly API_URL = 'https://api.ocr.space/parse/image';
  // Replace with your OCR.space API key - get free key at https://ocr.space/ocrapi
  private static readonly API_KEY = 'K87899142388957'; // Free tier key (replace with yours)

  static async processImage(imageUri: string): Promise<OCRResult> {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'image.jpg',
      } as any);
      
      formData.append('apikey', this.API_KEY);
      formData.append('language', 'eng');
      formData.append('isOverlayRequired', 'false');
      formData.append('detectOrientation', 'true');
      formData.append('scale', 'true');
      formData.append('OCREngine', '2'); // Use OCR Engine 2 for better accuracy
      formData.append('isTable', 'false');
      formData.append('filetype', 'jpg');

      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const result = await response.json();
      console.log('OCR Response:', result);

      if (result.OCRExitCode === 1 && result.ParsedResults?.length > 0) {
        const extractedText = result.ParsedResults[0].ParsedText || '';
        
        // Clean up the text
        const cleanedText = this.cleanText(extractedText);
        
        // Calculate confidence based on text quality
        const confidence = this.calculateConfidence(cleanedText, result.ParsedResults[0]);
        
        return {
          text: cleanedText,
          confidence: confidence,
        };
      } else {
        return {
          text: '',
          confidence: 0,
          error: result.ErrorMessage?.[0] || 'No text found in image',
        };
      }
    } catch (error) {
      console.error('OCR Service Error:', error);
      return {
        text: '',
        confidence: 0,
        error: error instanceof Error ? error.message : 'OCR processing failed',
      };
    }
  }

  static async processImageBase64(base64Image: string): Promise<OCRResult> {
    try {
      const formData = new FormData();
      formData.append('base64Image', `data:image/jpeg;base64,${base64Image}`);
      formData.append('apikey', this.API_KEY);
      formData.append('language', 'eng');
      formData.append('isOverlayRequired', 'false');
      formData.append('OCREngine', '2');

      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const result = await response.json();

      if (result.OCRExitCode === 1 && result.ParsedResults?.length > 0) {
        const cleanedText = this.cleanText(result.ParsedResults[0].ParsedText || '');
        return {
          text: cleanedText,
          confidence: this.calculateConfidence(cleanedText, result.ParsedResults[0]),
        };
      } else {
        return {
          text: '',
          confidence: 0,
          error: result.ErrorMessage?.[0] || 'No text detected',
        };
      }
    } catch (error) {
      return {
        text: '',
        confidence: 0,
        error: error instanceof Error ? error.message : 'OCR failed',
      };
    }
  }

  private static cleanText(text: string): string {
    if (!text) return '';
    
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove common OCR artifacts
      .replace(/[|\\]/g, ' ')
      // Fix common character misrecognitions
      .replace(/0/g, 'O') // In some contexts
      .replace(/5/g, 'S') // In some contexts
      // Clean up line breaks
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Remove extra spaces around punctuation
      .replace(/\s+([,.!?;:])/g, '$1')
      .replace(/([,.!?;:])\s+/g, '$1 ')
      // Trim whitespace
      .trim();
  }

  private static calculateConfidence(text: string, result: any): number {
    let confidence = 70; // Base confidence
    
    // Increase confidence if text has good structure
    if (text.length > 10) confidence += 10;
    if (/[A-Z]/.test(text)) confidence += 5; // Has uppercase letters
    if (/[a-z]/.test(text)) confidence += 5; // Has lowercase letters
    if (/\d/.test(text)) confidence += 5; // Has numbers
    if (/[.!?]/.test(text)) confidence += 5; // Has sentence endings
    
    // Decrease confidence for suspicious patterns
    if (text.length < 3) confidence -= 30;
    if (/[^a-zA-Z0-9\s.,!?;:()-]/.test(text)) confidence -= 10; // Strange characters
    if (text.split(' ').length < 2) confidence -= 10; // Too few words
    
    // Ensure confidence is within bounds
    return Math.max(0, Math.min(100, confidence));
  }

  // Batch processing for multiple images
  static async processMultipleImages(imageUris: string[]): Promise<OCRResult[]> {
    const results: OCRResult[] = [];
    
    for (const uri of imageUris) {
      const result = await this.processImage(uri);
      results.push(result);
      
      // Add delay to respect API rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return results;
  }

  // Combine multiple OCR results into one
  static combineResults(results: OCRResult[]): OCRResult {
    const validResults = results.filter(r => r.text && !r.error);
    
    if (validResults.length === 0) {
      return {
        text: '',
        confidence: 0,
        error: 'No valid text found in any image'
      };
    }

    const combinedText = validResults.map(r => r.text).join('\n\n');
    const avgConfidence = validResults.reduce((sum, r) => sum + r.confidence, 0) / validResults.length;

    return {
      text: combinedText,
      confidence: Math.round(avgConfidence)
    };
  }
}