# QR Scanner Debugging Guide

## Issue: "No Usable Data Found"

If you're seeing this message, here are the possible causes and solutions:

### 1. Check API Key Configuration

Verify your Google Vision API key is correctly set:

```bash
# Check .env file
cat .env

# Should show:
GOOGLE_VISION_API_KEY=your_actual_api_key_here
```

**Important**: Make sure the API key is valid and the Cloud Vision API is enabled!

### 2. Check Google Cloud Console

1. Go to https://console.cloud.google.com/
2. Select your project
3. Go to "APIs & Services" → "Enabled APIs"
4. Verify **Cloud Vision API** is enabled
5. Check API key restrictions (should allow Vision API)

### 3. Test with Different QR Codes

Try scanning different types of codes:
- ✅ Simple URL QR code (test at https://qr-code-generator.com/)
- ✅ Text-only QR code
- ✅ High contrast QR code
- ✅ Well-lit environment

**Tips**:
- Ensure good lighting
- QR code should be flat (not curved)
- Camera should be steady
- QR code should fill about 50-70% of frame
- Avoid glare/reflections

### 4. Check Console Logs

When scanning, check the console for these logs:
```
Processing image: file://...
Google Vision API Response: {...}
Barcodes detected: [...]
QR/Barcode data: ...
```

If you see errors like:
- `"API key not valid"` → Check your API key
- `"API not enabled"` → Enable Cloud Vision API in Console
- `"Quota exceeded"` → Check your API usage limits
- `No textAnnotations` → QR code not clearly visible

### 5. Common Fixes

#### Fix 1: Regenerate API Key
```bash
1. Go to Google Cloud Console
2. APIs & Services → Credentials
3. Create new API key
4. Update .env file
5. Rebuild app: npm run build:apk
```

#### Fix 2: Check API Restrictions
```bash
1. Go to API key settings
2. Under "API restrictions":
   - Select "Restrict key"
   - Add "Cloud Vision API"
3. Save changes
4. Wait 5 minutes for changes to propagate
```

#### Fix 3: Test with Curl
Test your API key directly:
```bash
# Replace YOUR_API_KEY with your actual key
curl -X POST \
  "https://vision.googleapis.com/v1/images:annotate?key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "requests": [{
      "image": {
        "source": {
          "imageUri": "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=TestQRCode"
        }
      },
      "features": [{
        "type": "TEXT_DETECTION"
      }]
    }]
  }'
```

If this works, your API key is valid!

### 6. Alternative: Use Camera Barcode Scanning

If Google Vision doesn't work, you can use Expo Camera's built-in barcode scanning:

```typescript
// In qr-scanner.tsx
<CameraView
  ref={cameraRef}
  style={styles.camera}
  facing="back"
  barcodeScannerSettings={{
    barcodeTypes: [
      "qr",
      "code128",
      "code39",
      "ean13",
      "ean8",
      "upc_a",
      "upc_e"
    ],
  }}
  onBarcodeScanned={handleBarcodeScanned}
/>

const handleBarcodeScanned = ({ type, data }) => {
  console.log(`Scanned ${type}: ${data}`);
  setScannedData(data);
  TTSService.speak(`QR code detected: ${data}`);
};
```

### 7. Debug Mode

Enable detailed logging:
```typescript
// In GoogleVisionService.ts
console.log('API Key:', GOOGLE_VISION_API_KEY?.substring(0, 10) + '...');
console.log('Image size:', base64Image.length);
console.log('Full API Response:', result);
```

### 8. Check Image Quality

The image might be:
- Too blurry
- Too dark/bright
- QR code too small in frame
- QR code distorted/damaged

**Solution**: 
- Use better lighting
- Hold camera steady
- Get closer to QR code
- Use `quality: 1` in camera settings (already set)

### 9. Free Tier Limits

Google Vision API free tier:
- 1,000 requests/month
- After that: $1.50 per 1,000 requests

Check if you've exceeded the free tier:
```bash
1. Go to Google Cloud Console
2. Billing → Reports
3. Check Vision API usage
```

### 10. Working Test QR Code

Generate a test QR code:
1. Go to https://www.qr-code-generator.com/
2. Enter: `https://www.google.com`
3. Download QR code
4. Try scanning it

This simple QR code should definitely work!

---

## Quick Checklist

- [ ] API key is in `.env` file
- [ ] Cloud Vision API is enabled in Console
- [ ] API key has no restrictions (or allows Vision API)
- [ ] Good lighting when scanning
- [ ] QR code is clear and visible
- [ ] Camera permission granted
- [ ] Internet connection active
- [ ] Not exceeded free tier (check Console)
- [ ] App rebuilt after .env changes

---

## Still Not Working?

If nothing works, the app logs detailed information to console. Check:
1. `expo start` logs in terminal
2. Error messages in Vision API response
3. Network tab if using web debugger

The issue is most likely:
1. **90% chance**: API key not configured or invalid
2. **5% chance**: API not enabled in Cloud Console
3. **3% chance**: Poor image quality
4. **2% chance**: Network/internet issue

---

**Remember**: Google Vision API requires:
- Valid API key
- Cloud Vision API enabled
- Internet connection
- Proper image quality



