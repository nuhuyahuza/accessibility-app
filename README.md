# Accessibility App for Visually Impaired Users

A fully voice-controlled mobile application designed for visually impaired users to scan, read, and manage documents.

## ✨ Key Features

- 🎤 **Complete Voice Control** - Navigate entire app using voice commands
- 📄 **Document Scanning** - OCR with Google Cloud Vision API
- 🔊 **Text-to-Speech** - Read documents aloud with playback controls
- ⏯️ **Playback Controls** - Play, pause, stop, resume, adjust speed
- 🎙️ **Voice Notes** - Record and transcribe voice notes
- 📱 **QR/Barcode Scanner** - Scan codes and read information
- 🔍 **Object Detection** - Identify objects in photos
- 👥 **Voice Onboarding** - Setup via voice commands only

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure API Key
Create `.env` file:
```env
GOOGLE_VISION_API_KEY=your_google_cloud_api_key_here
```

Get your API key from [Google Cloud Console](https://console.cloud.google.com/)

### 3. Build APK
```bash
npm run build:apk
```

That's it! The APK will be ready to download when build completes.

## 📱 Installation

After building, you'll get a download link:
1. Download the APK file
2. Transfer to your Android device
3. Enable "Install from Unknown Sources" in settings
4. Tap the APK to install

## 🎤 Voice Commands

### Global Commands
- "Help" - Get available commands
- "Home" - Go to home screen
- "Scan document" - Start scanning
- "Library" - View saved documents
- "Settings" - Open settings

### Document Reading
- "Play" / "Read" - Start reading
- "Pause" - Pause reading
- "Stop" - Stop completely
- "Continue" - Resume reading
- "Faster" / "Slower" - Adjust speed
- "Repeat" - Read again
- "Save" - Save document

### Navigation
- "Next" - Go forward
- "Back" - Go back
- "Repeat" - Hear again
- "Skip" - Skip section

## 🛠️ Development

### Run in Development
```bash
npm start
```

Then scan QR code with Expo Go app.

**Note**: Voice features require a built app, not Expo Go.

### Build Commands
```bash
# Build APK (recommended)
npm run build:apk

# Preview build
npm run build:preview

# Production build
npm run build:production
```

## 📚 Documentation

- [`SETUP.md`](SETUP.md) - Complete setup guide
- [`BUILD_INSTRUCTIONS.md`](BUILD_INSTRUCTIONS.md) - APK building guide
- [`VOICE_ACCESSIBILITY_FEATURES.md`](VOICE_ACCESSIBILITY_FEATURES.md) - Voice features
- [`IMPLEMENTATION_SUMMARY.md`](IMPLEMENTATION_SUMMARY.md) - Technical details

## 🔑 API Requirements

### Google Cloud APIs
1. **Cloud Vision API** - For OCR and object detection
2. **Cloud Speech-to-Text API** - For voice recognition

Both use the same API key. Free tier includes:
- Vision: 1,000 requests/month
- Speech: 60 minutes/month

## 🎯 For Visually Impaired Users

This app is designed to be used entirely by voice:

1. **First Time**: Voice-guided onboarding
2. **Scanning**: Say "Scan document" to take photo
3. **Reading**: App automatically reads text aloud
4. **Control**: Use voice for play/pause/speed
5. **Save**: Say "Save" to keep documents

All features provide voice feedback and can be controlled without looking at the screen.

## 📦 Tech Stack

- **Framework**: React Native (Expo)
- **OCR**: Google Cloud Vision API
- **Speech Recognition**: Google Cloud Speech-to-Text API
- **Text-to-Speech**: Expo Speech
- **UI**: React Native with Expo modules

## 🏗️ Build System

Uses **EAS Build** (Expo Application Services):
- Cloud-based builds
- No local Android Studio required
- Automatic dependency management
- 30 free builds per month

## 🔒 Permissions

- **Camera**: For document scanning
- **Microphone**: For voice commands
- **Storage**: For saving documents
- **Internet**: For API calls

## 📄 License

Private and Proprietary

## 🤝 Support

For issues or questions:
1. Check documentation files
2. Review troubleshooting sections
3. Verify API keys are configured

## 📊 Status

**Version**: 1.0.0  
**Platform**: Android  
**Build System**: EAS Build  
**Status**: ✅ Production Ready

---

Built with ❤️ for accessibility
