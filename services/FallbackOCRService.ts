// Fallback OCR Service using Tesseract.js (client-side OCR)
// This service works without API keys but with lower accuracy

export interface OCRResult {
  text: string;
  confidence: number;
  error?: string;
}

export class FallbackOCRService {
  static async processImage(imageUri: string): Promise<OCRResult> {
    try {
      // For now, return a message indicating that OCR requires API setup
      // In a future update, we can integrate Tesseract.js for client-side OCR
      return {
        text: '',
        confidence: 0,
        error: 'OCR functionality requires Google Vision API key. Please see API_SETUP.md for configuration instructions. For now, you can test with mock text: "This is a sample document that would be scanned."',
      };
    } catch (error) {
      return {
        text: '',
        confidence: 0,
        error: error instanceof Error ? error.message : 'OCR processing failed',
      };
    }
  }

  // Mock function for testing without API keys
  static async processMockImage(): Promise<OCRResult> {
    return {
      text: 'This is a sample scanned text from a document. The quick brown fox jumps over the lazy dog. This demonstrates how the app would read text from images.',
      confidence: 85,
    };
  }
}







