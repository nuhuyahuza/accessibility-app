# Troubleshooting Guide

## "No text detected in image" Error

If you're getting this error even with clear text in well-lit photos, here are the possible causes and solutions:

### 1. API Key Not Configured ⚠️

**Symptom:** Getting "No text detected" for all images

**Check:**
Look in the console logs for:
```
API Key configured: false
API Key length: 0
```

**Solution:**
1. Create a `.env` file in the project root:
```bash
GOOGLE_VISION_API_KEY=your_actual_api_key_here
```

2. Restart the Expo development server:
```bash
# Stop the current server (Ctrl+C)
npx expo start -c
```

3. Verify the API key is loaded by checking console logs

### 2. Invalid API Key ❌

**Symptom:** 
- Console shows `API Response Status: 400` or `403`
- Error message mentions authentication

**Check Console for:**
```
Google Vision API Response Status: 403
Google Vision API Error Response: {"error": {"code": 403, "message": "..."}}
```

**Solution:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" → "Credentials"
3. Verify your API key exists and is enabled
4. Check that "Cloud Vision API" is enabled for your project
5. Copy the API key and update your `.env` file
6. Restart Expo server with `npx expo start -c`

### 3. API Quota Exceeded 📊

**Symptom:**
- Error code 429 in console
- "Quota exceeded" message

**Check Console for:**
```
Google Vision API Response Status: 429
```

**Solution:**
1. Check your usage in [Google Cloud Console](https://console.cloud.google.com/)
2. Free tier allows 1,000 requests/month
3. Either:
   - Wait until quota resets (monthly)
   - Upgrade to paid tier
   - Use fallback/mock mode for testing

### 4. Image Format Issues 🖼️

**Symptom:**
- API returns 200 but no text detected
- Only happens with certain images

**Check Console for:**
```
Text Annotations found: 0
```

**Possible Causes:**
- Image is too large (>20MB)
- Image resolution too high or too low
- Image is corrupted

**Solution:**
1. Try taking a new photo
2. Ensure the image is:
   - Clear and focused
   - Well-lit (not too dark/bright)
   - Text is readable to the human eye
   - At least 640x480 resolution
   - Not larger than 10MB

### 5. Text is Too Small/Blurry 👓

**Symptom:**
- Works with some images but not others
- Console shows API returns 200

**Solution:**
1. Get closer to the document when taking the photo
2. Ensure the camera is focused
3. Hold the device steady
4. Make sure text fills a good portion of the frame
5. Avoid shadows and glare
6. Try landscape orientation for wide text

### 6. Network Issues 🌐

**Symptom:**
- Timeout errors
- Network request failed

**Check Console for:**
```
Network request failed
TypeError: Failed to fetch
```

**Solution:**
1. Check your internet connection
2. Try switching between WiFi and mobile data
3. Check if Google services are accessible in your region
4. Verify firewall/proxy settings

## Debug Mode

To get detailed logging, check the console output when you take a photo. You should see:

```
=== Google Vision OCR Started ===
API Key configured: true
API Key length: 39
Image URI: file://...
Converting image to base64...
Base64 image size: 123456 characters
Google Vision API Response Status: 200
Text Annotations found: 5
```

## Testing Without API Key

If you want to test the app without configuring Google Vision:

1. The app will automatically fall back to mock mode
2. You'll see: "Using test mode with sample text"
3. Sample text will be read aloud for testing

## Quick Test Script

Create a test to verify your API key works:

```javascript
// Test your API key
const testAPIKey = async () => {
  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=YOUR_API_KEY`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{
          image: { content: 'YOUR_BASE64_IMAGE' },
          features: [{ type: 'TEXT_DETECTION' }]
        }]
      })
    }
  );
  console.log('Status:', response.status);
  console.log('Result:', await response.json());
};
```

## Still Not Working?

If you've tried all the above and still having issues:

1. **Check Console Logs**: Look for detailed error messages
2. **Restart Everything**: 
   - Kill Metro bundler
   - Clear cache: `npx expo start -c`
   - Restart your device/emulator
3. **Verify Environment**:
   - Check `.env` file exists
   - Verify file is in project root (not subdirectory)
   - Check for typos in environment variable name
4. **Test with Sample**: Try with a simple document with large, clear text
5. **Contact Support**: Share console logs for further debugging

## Common Console Log Patterns

### ✅ Working Correctly:
```
API Key configured: true
Google Vision API Response Status: 200
Text Annotations found: 10
```

### ❌ No API Key:
```
API Key configured: false
No API key configured!
```

### ❌ Invalid API Key:
```
Google Vision API Response Status: 403
API Error (403): API key not valid
```

### ❌ Quota Exceeded:
```
Google Vision API Response Status: 429
Quota exceeded for quota metric
```

### ⚠️ No Text in Image:
```
Google Vision API Response Status: 200
Text Annotations found: 0
```
(This is normal if image truly has no text!)




