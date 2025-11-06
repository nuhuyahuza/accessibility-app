# Speech Detection Debug Guide - "No Speech Detected" Issue

## Current Situation

Recording works perfectly:
- ✅ Permission granted
- ✅ Recording starts
- ✅ Recording stops
- ✅ File created
- ✅ Sent to Google API
- ❌ "No speech detected" result

Even after trying AMR_WB and OGG_OPUS, the problem persists.

## New Diagnostic Tools Added

### 1. Recording Quality Metrics
Now logs detailed recording information:
```typescript
📊 Recording status: {...}
📊 Duration recorded (ms): 5000
📊 Metering level: -160 to 0 (audio level)
📏 File exists: true
📏 File size: 12345 bytes
```

**What to look for**:
- Duration < 100ms = Recording failed to start
- File size < 1000 bytes = Silent recording (mic not working)
- Metering level = -160 = Completely silent (mic issue)
- Metering level = -40 to 0 = Audio detected ✅

### 2. API Response Details
Full error information from Google:
```typescript
📡 Full API Response: {...}
❌ Error code: 403
❌ Error message: "Speech-to-Text API has not been enabled"
❌ Error status: PERMISSION_DENIED
```

### 3. Possible Issues Diagnosed
```typescript
⚠️ This could mean:
  1. Microphone is not picking up sound
  2. Audio file is silent/corrupted
  3. Background noise is too loud
  4. Speech is too quiet
```

### 4. New Audio Format: LINEAR16
Switched to uncompressed PCM (WAV):
- Most basic format possible
- No compression = no quality loss
- Universally supported
- If this doesn't work, it's a microphone issue

## What to Check in Next Build

### Test 1: Recording Metrics
```bash
adb logcat | grep -E "📊|📏"
```

**Expected** (Working microphone):
```
📊 Duration recorded (ms): 5000
📊 Metering level: -20 to -5  ← Audio detected!
📏 File size: 80000 bytes  ← Reasonable size
```

**Problem** (Microphone not working):
```
📊 Duration recorded (ms): 5000
📊 Metering level: -160  ← Completely silent!
📏 File size: 800 bytes  ← Tiny file!
```

### Test 2: API Response
```bash
adb logcat | grep -E "📡|❌"
```

**Look for**:
- `📡 Full API Response:` - See the complete response
- `❌ Error code:` - Specific error codes
- `❌ Error message:` - Exact error message

**Common Issues**:

#### Issue A: Speech-to-Text API Not Enabled
```
❌ Error message: "Speech-to-Text API has not been used in project..."
```

**Fix**: 
1. Go to https://console.cloud.google.com
2. Enable "Cloud Speech-to-Text API"
3. Wait 5 minutes for propagation
4. Rebuild app with API key

#### Issue B: Wrong API Key
```
❌ Error code: 403
❌ Error message: "The request is missing a valid API key"
```

**Fix**: Use Speech-to-Text API key, not Vision API key

#### Issue C: Silent Recording
```
⚠️ No speech detected in audio
📊 Metering level: -160
📏 File size: 800 bytes
```

**Fix**: Microphone hardware/permission issue

### Test 3: File Size Analysis

| Scenario | Duration | Expected Size | Actual Size | Status |
|----------|----------|---------------|-------------|--------|
| Working audio | 5s | ~80KB | ? | Check |
| Silent recording | 5s | <1KB | ? | Check |
| Corrupted | 5s | varies | ? | Check |

### Test 4: Manual Voice Test

While recording, watch the logs and **speak loudly**:
```bash
adb logcat | grep -E "📊|metering"
```

If you see metering values changing (e.g., -40, -30, -20), the mic is working!
If it stays at -160, the mic is NOT capturing audio.

## Possible Root Causes

### 1. Google API Key Issue
**Symptom**: API returns error about Speech-to-Text not being enabled

**Check**:
```bash
# Look for this in logs:
❌ Error message: "Speech-to-Text API has not been used"
```

**Solution**:
1. Verify you're using a Google Cloud API key (not just any key)
2. Enable "Cloud Speech-to-Text API" in Google Cloud Console
3. Key must have Speech-to-Text permissions
4. Rebuild app with correct key

### 2. Microphone Not Working
**Symptom**: File size < 1KB, metering level = -160

**Check**:
```bash
# Look for this in logs:
📏 File size: 800 bytes  ← Way too small!
📊 Metering level: -160  ← Completely silent!
```

**Solution**:
1. Test mic in another app (e.g., Voice Recorder)
2. Check if mic is physically blocked
3. Try speaking VERY loudly during recording
4. Check Android audio settings

### 3. Audio Encoding Issue
**Symptom**: Large file but "no speech detected"

**Check**:
```bash
# Look for this in logs:
📏 File size: 80000 bytes  ← Good size
⚠️ No speech detected in audio  ← But API can't decode it
```

**Solution**: LINEAR16 should fix this (already implemented)

### 4. Background App Recording Restriction
**Symptom**: Recording starts but captures nothing

**Solution**:
- Already using `staysActiveInBackground: false`
- Keep app in foreground during recording
- Some Android manufacturers restrict audio recording

## Debug Commands

### Complete Diagnostic Log
```bash
# Clear logs
adb logcat -c

# Watch all relevant logs
adb logcat | grep -E "🎤|📱|⚙️|▶️|📊|📏|📡|❌|✅|ReactNativeJS"

# Tap microphone and speak
```

### Extract Just Recording Stats
```bash
adb logcat | grep -E "📊|📏"
```

### Extract Just API Response
```bash
adb logcat | grep -E "📡|Full API Response"
```

### Check for Errors
```bash
adb logcat | grep -E "❌|Error"
```

## Expected Working Flow

```
🎤 Attempting to start voice listening...
✅ Microphone permission already granted
🔧 Setting audio mode...
✅ Audio mode set
📱 Creating recording instance...
✅ Recording instance created
⚙️ Preparing to record with LINEAR16 (uncompressed PCM - most compatible)...
✅ Recording prepared with LINEAR16/PCM format
▶️ Starting recording...
✅ Recording start command sent
✅✅✅ Recording started successfully! isRecording: true

[User speaks: "Scan document"]

⏱️ Recording timeout reached (5 seconds)
⏹️ Attempting to stop recording...
⏹️ Recording object exists: true
⏹️ isRecording flag: true
⏹️ Stopping and unloading recording...
✅ Recording stopped
📁 Getting recording URI...
📁 Recording URI: file:///data/user/0/.../recording-xyz.wav
📊 Recording status: {"canRecord":false,"durationMillis":5000,"isRecording":false,"metering":-20}
📊 Duration recorded (ms): 5000
📊 Metering level: -20  ← AUDIO DETECTED! ✅
📏 File exists: true
📏 File size: 160000 bytes  ← Good size! ✅
✅✅✅ Recording stopped successfully

🎵 Audio recorded, processing...
📖 Reading audio file from: [path]
📦 Audio file size: 213333 characters
📋 Request config: {"encoding":"LINEAR16","sampleRateHertz":16000,...}
📋 Audio data length: 213333 chars (~ 160 KB)
🌐 Sending request to Google Speech API...
📡 API Response status: 200
📡 Full API Response: {"results":[{"alternatives":[{"transcript":"scan document","confidence":0.95}]}]}
✅ Recognized: scan document  ← SUCCESS! ✅
```

## Quick Diagnosis Table

| Symptom | Metering | File Size | API Status | Issue |
|---------|----------|-----------|------------|-------|
| No speech detected | -160 | <1KB | 200 | **Mic not working** |
| No speech detected | -20 | 80KB | 200 | **API encoding issue** |
| No speech detected | -20 | 80KB | 403 | **API not enabled** |
| API error | any | any | 403 | **Wrong API key** |
| Success | -20 to 0 | 80KB | 200 | **Working!** ✅ |

## Next Steps

1. **Rebuild** with all diagnostic tools:
   ```bash
   eas build --profile preview --platform android
   ```

2. **Install and test**:
   ```bash
   adb install app.apk
   adb logcat -c
   adb logcat | grep -E "📊|📏|📡|❌|✅"
   ```

3. **Tap microphone and SPEAK LOUDLY**: "Scan document"

4. **Check the logs** for:
   - `📊 Metering level:` value (should NOT be -160)
   - `📏 File size:` value (should be > 10KB)
   - `📡 Full API Response:` content

5. **Share the complete logs** showing:
   - Recording metrics (📊 📏)
   - API response (📡)
   - Any errors (❌)

## Most Likely Issue

Based on multiple encoding attempts failing, the most likely cause is:

**A) Google API Key Issue**:
- Using Vision API key instead of Speech-to-Text API key
- Speech-to-Text API not enabled in Google Cloud Console
- API key doesn't have Speech-to-Text permissions

**Check**: Look for `❌ Error message:` in logs after rebuild

**B) Microphone Not Capturing Audio**:
- Microphone physically blocked
- Android audio system issue
- App doesn't have proper audio focus

**Check**: Look for `📊 Metering level: -160` and `📏 File size: <1000`

---

**Status**: Comprehensive diagnostics added. Next build will reveal the exact issue! 🔍

