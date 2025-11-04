# Accessibility App Setup Guide

## Overview
This accessibility app uses Google Cloud Vision API for OCR, object detection, and barcode/QR scanning, along with Google Cloud Speech-to-Text API for voice recognition.

## Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- Android Studio or Xcode (for mobile development)

## Installation Steps

### 1. Clone and Install Dependencies
```bash
cd accessibility-app
npm install
```

### 2. Set Up Google Cloud APIs

#### A. Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable billing for the project

#### B. Enable Required APIs
Enable the following APIs in your Google Cloud project:
- **Cloud Vision API** (for OCR, object detection, barcode scanning)
- **Cloud Speech-to-Text API** (for voice recognition)

To enable:
1. Go to [API Library](https://console.cloud.google.com/apis/library)
2. Search for each API
3. Click "Enable"

#### C. Create API Key
1. Go to [Credentials](https://console.cloud.google.com/apis/credentials)
2. Click "Create Credentials" → "API key"
3. Copy the generated API key
4. (Recommended) Click "Restrict Key" and:
   - Under "API restrictions", select "Restrict key"
   - Choose "Cloud Vision API" and "Cloud Speech-to-Text API"
   - Under "Application restrictions", configure for your app (Android/iOS)

### 3. Configure Environment Variables

Create a `.env` file in the project root:
```bash
cp .env.example .env
```

Edit `.env` and add your API key:
```env
GOOGLE_VISION_API_KEY=your_actual_api_key_here
```

### 4. Update app.config.js
The app.config.js already reads from environment variables, but verify it looks like this:
```javascript
export default {
  expo: {
    extra: {
      GOOGLE_VISION_API_KEY: process.env.GOOGLE_VISION_API_KEY,
      // ... other config
    }
  }
}
```

### 5. Install Expo Development Client
For full functionality (especially voice features), you need a development build:

```bash
# For Android
expo run:android

# For iOS  
expo run:ios
```

Or build with EAS:
```bash
eas build --profile development --platform android
eas build --profile development --platform ios
```

### 6. Run the App

#### Development with Expo Go (Limited Features)
```bash
npm start
```
Note: Voice recognition requires a development build and won't work in Expo Go.

#### Development Build (Full Features)
```bash
# Android
npm run android

# iOS
npm run ios
```

## Features Implemented

### ✅ Completed Features

1. **Google Vision OCR**
   - Text detection from images
   - High accuracy text extraction
   - Confidence scoring

2. **Object Detection**
   - Real-time object identification
   - Label detection
   - Logo recognition
   - Scene description

3. **QR & Barcode Scanner**
   - QR code scanning
   - Barcode detection
   - Text recognition in codes
   - Link opening functionality

4. **Voice Notes**
   - Speech-to-text transcription
   - Save and manage voice notes
   - Text-to-speech playback
   - Edit note titles

5. **Batch Scanner**
   - Multiple image capture
   - Batch OCR processing
   - Progress tracking
   - Combined text extraction

6. **Voice Commands**
   - Voice-controlled navigation
   - Command recognition
   - Text-to-speech feedback
   - Smart command interpretation

## Usage

### OCR Scanning
1. Navigate to "Scan Document" from home
2. Take a photo or select from gallery
3. Wait for text extraction
4. Listen to the extracted text or save it

### Object Detection
1. Navigate to "Object Detection"
2. Capture an image
3. View detected objects with confidence scores
4. Tap "Describe Scene" for audio description

### QR Scanner
1. Navigate to "QR Scanner"
2. Point camera at QR code or barcode
3. Scan automatically detects codes
4. Open links or save results

### Voice Notes
1. Navigate to "Voice Notes"
2. Tap the microphone button to record
3. Speak clearly into the microphone
4. Stop recording to see transcription
5. Save, edit, or listen to notes

### Batch Scanning
1. Open "Batch Scanner"
2. Capture multiple images
3. Tap "Process All" to extract text from all images
4. Tap "Read All" to hear all extracted text
5. Save to gallery or clear batch

## API Usage & Costs

### Google Cloud Vision API
- **Free Tier**: 1,000 units/month
- **Pricing after free tier**: $1.50 per 1,000 units
- Each feature detection counts as 1 unit

### Google Cloud Speech-to-Text API
- **Free Tier**: 60 minutes/month
- **Pricing after free tier**: $0.024 per minute (standard)

### Tips to Minimize Costs
1. Use caching where possible
2. Limit API calls during development
3. Set up budget alerts in Google Cloud Console
4. Consider using OCR.space API as fallback (5 MB/month free)

## Troubleshooting

### API Key Issues
- Verify API key is correctly set in `.env`
- Check that APIs are enabled in Google Cloud Console
- Ensure API key restrictions don't block your app

### Voice Recognition Not Working
- Voice features require a development build (not Expo Go)
- Check microphone permissions
- Verify Speech-to-Text API is enabled

### Camera Not Working
- Grant camera permissions when prompted
- Check device camera functionality
- Restart the app if camera freezes

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install

# Clear Expo cache
expo start -c
```

## Project Structure

```
accessibility-app/
├── app/                      # Screen components
│   ├── (tabs)/              # Tab navigation screens
│   ├── scan.tsx             # OCR scanning
│   ├── object-detection.tsx # Object detection
│   ├── qr-scanner.tsx       # QR/barcode scanning
│   ├── voice-notes.tsx      # Voice notes
│   └── batch-scanner.tsx    # Batch scanning
├── services/                # API services
│   ├── GoogleVisionService.ts   # Vision API integration
│   ├── GoogleSpeechService.ts   # Speech API integration
│   ├── TTSServices.ts          # Text-to-speech
│   └── VoiceService.ts         # Voice commands
├── components/              # Reusable components
├── context/                # React context providers
└── utils/                  # Utility functions
```

## Development Notes

- The app uses Expo SDK 54
- Minimum iOS version: 13.0
- Minimum Android version: 24 (Android 7.0)
- TypeScript is used throughout the project

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Google Cloud API documentation
3. Check Expo documentation for platform-specific issues

## License

This project is private and proprietary.

