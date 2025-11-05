# API Setup Guide

This accessibility app requires Google Cloud API keys for full functionality.

## Required API Keys

### 1. Google Vision API (for OCR/Text Detection)
- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Create a new project or select an existing one
- Enable the "Cloud Vision API"
- Go to "Credentials" and create an API key
- Copy the API key

### 2. Google Speech-to-Text API (for Voice Recognition)
- In the same Google Cloud project
- Enable the "Cloud Speech-to-Text API"
- Use the same API key or create a new one
- Copy the API key

## Setup Instructions

### Option 1: Environment Variables (Recommended)

Create a `.env` file in the project root:

```bash
GOOGLE_VISION_API_KEY=your_google_vision_api_key_here
GOOGLE_SPEECH_API_KEY=your_google_speech_api_key_here
```

### Option 2: Direct Configuration

Edit `app.config.js` and add your keys directly (not recommended for production):

```javascript
export default ({ config }) => {
  return {
    ...config,
    extra: {
      ...config.extra,
      GOOGLE_VISION_API_KEY: 'your_api_key_here',
      GOOGLE_SPEECH_API_KEY: 'your_api_key_here',
    },
  };
};
```

## Testing Without API Keys

The app will work with limited functionality:
- ✅ Text-to-Speech (uses Expo Speech)
- ✅ Navigation and UI
- ✅ Voice commands (limited, no speech recognition)
- ❌ Document scanning (requires Google Vision API)
- ❌ Voice input (requires Google Speech API)

## Cost Information

- Google Cloud offers a **free tier** with generous limits:
  - Vision API: 1,000 requests/month free
  - Speech-to-Text API: 60 minutes/month free
- Perfect for personal use and testing

## Troubleshooting

### "API key not configured" error
- Check that your `.env` file exists in the project root
- Restart the Expo development server: `npx expo start -c`
- Verify the API key is correct in Google Cloud Console

### "Failed to convert image to base64" error
- This usually means there's an issue with the image file path
- Try taking a new photo
- Check camera permissions are granted

### API quota exceeded
- Check your usage in Google Cloud Console
- Consider upgrading to a paid plan if needed
- Or wait until the quota resets (monthly)

## Security Notes

⚠️ **Important**: 
- Never commit your `.env` file to version control
- Add `.env` to your `.gitignore` file
- For production apps, use environment variables or secure secret management
- Consider using Firebase or a backend service to proxy API requests



