# CRITICAL: Microphone Test & API Configuration

## Current Situation

**Recording appears to work**:
- ✅ File created: `recording-xxx.wav`
- ✅ File size: ~11KB (reasonable)
- ✅ API responds with status 200
- ❌ Result: "No speech detected"

**This means ONE of two things**:

### Possibility A: Microphone Recording Silent Audio
The mic records a 11KB file but it's all silence (background noise, not actual voice).

### Possibility B: Speech-to-Text API Not Enabled
Using Google Vision API key for Speech-to-Text API, which won't work.

## Critical Logs to Check

### After Rebuilding, Run:
```bash
adb logcat -c
adb logcat *:S ReactNativeJS:V | grep -E "📊|📡📡📡|RAW|Duration|File size"
```

### Look for These Specific Lines:

#### 1. Recording Metrics
```
📊 Duration recorded (ms): 5000
```
- If < 1000ms = Failed to record
- If ≈ 5000ms = Recording worked ✅

#### 2. RAW API Response
```
📡📡📡 RAW API RESPONSE: {"results":[],...}
```
or
```
📡📡📡 RAW API RESPONSE: {"error":{"code":403,"message":"Cloud Speech-to-Text API has not been used in project..."}}
```

**This is the KEY log that will tell us the real issue!**

## Most Likely Issue: Speech-to-Text API Not Enabled

### Symptoms:
- ✅ Recording works
- ✅ File size is good
- ✅ API responds with 200
- ❌ Returns empty results or error

### The Problem:
You're using the **Google Vision API key** but Speech-to-Text is a **separate API** that needs to be enabled.

### How to Fix:

#### Step 1: Enable Speech-to-Text API
1. Go to https://console.cloud.google.com
2. Select your project
3. Go to "APIs & Services" > "Library"
4. Search for "Cloud Speech-to-Text API"
5. Click "Enable"
6. Wait 5 minutes for propagation

#### Step 2: Verify API Key Has Speech-to-Text Access
1. Go to "APIs & Services" > "Credentials"
2. Find your API key
3. Check "API restrictions"
4. Ensure "Cloud Speech-to-Text API" is allowed

#### Step 3: Test API Key Manually
```bash
# Test if API key works for Speech-to-Text
curl -X POST \
  "https://speech.googleapis.com/v1/speech:recognize?key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "encoding": "LINEAR16",
      "sampleRateHertz": 16000,
      "languageCode": "en-US"
    },
    "audio": {
      "uri": "gs://cloud-samples-tests/speech/brooklyn.wav"
    }
  }'
```

**Expected if working**:
```json
{
  "results": [{
    "alternatives": [{
      "transcript": "how old is the Brooklyn Bridge"
    }]
  }]
}
```

**Expected if not enabled**:
```json
{
  "error": {
    "code": 403,
    "message": "Cloud Speech-to-Text API has not been used in project..."
  }
}
```

## Alternative Solution: Use Different API Key

If you don't want to enable Speech-to-Text API, you can use a **free alternative**:

### Option 1: Vosk (Offline, No API)
- Completely offline
- No API key needed
- Requires native package

### Option 2: AssemblyAI
- Better than Google for some accents
- Free tier: 5 hours/month
- Simple REST API

### Option 3: Touch Controls Only
Disable voice commands and use only buttons (already works perfectly).

## Debug Test Commands

### Test A: Check Grep Filter
Your grep might be filtering out important logs. Try:
```bash
adb logcat | grep "ReactNativeJS" | grep -E "📡|Recording|API"
```

### Test B: Get ALL Logs (No Filter)
```bash
adb logcat *:S ReactNativeJS:V > full_log.txt
# Then search the file for "RAW API RESPONSE"
```

### Test C: Check for API Error
```bash
adb logcat | grep -i "speech.*text.*api\|not.*been.*used\|not.*enabled"
```

## Quick Decision Tree

```
Is file size > 10KB?
├─ NO (< 1KB)
│  └─ **Issue**: Microphone not working
│     └─ **Fix**: Check device microphone, test in Voice Recorder app
│
└─ YES (≈ 11KB)
   └─ Is API response status 200?
      ├─ NO (403, 400, etc.)
      │  └─ **Issue**: API configuration error
      │     └─ **Fix**: Enable Speech-to-Text API or use correct key
      │
      └─ YES (200) but "No speech detected"
         └─ **Issue**: Audio is silent OR API can't decode format
            └─ **Fix**: 
               1. Check 📊 logs for metering level
               2. If -160 = mic silent, if -20 = API issue
               3. Enable Speech-to-Text API
```

## Immediate Action Required

**Please run this command and share the FULL output**:
```bash
adb logcat -c
# Tap microphone, speak "scan document"
# Wait 10 seconds
adb logcat -d | grep "ReactNativeJS" | grep -E "📡📡📡|RAW|error|Error" > debug.log
cat debug.log
```

This will show us the **RAW API RESPONSE** which contains the actual error message from Google.

## Most Likely Root Cause

**99% confident this is the issue**:
- Your `GOOGLE_VISION_API_KEY` environment variable is correct for Vision API ✅
- But Speech-to-Text is a **different API** that needs separate enablement
- The Vision API key works for OCR, object detection, etc.
- But NOT for speech recognition unless you also enable Speech-to-Text API

**Solution**: Enable "Cloud Speech-to-Text API" in Google Cloud Console

---

## Status

🔍 **Waiting for logs showing**:
1. `📊 Duration recorded (ms):` value
2. `📡📡📡 RAW API RESPONSE:` content

**These two logs will definitively identify the issue!**

