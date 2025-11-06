# Recording Failure Debug Guide

## Current Issue
Based on logs:
- ✅ Permission granted successfully
- ❌ No audio recorded

This means recording is failing silently after permission is granted.

## Enhanced Logging Added

### Recording Start Process
Now logs each step:
1. `🔧 Setting audio mode...` → `✅ Audio mode set`
2. `📱 Creating recording instance...` → `✅ Recording instance created`
3. `⚙️ Preparing to record with AMR_WB encoding...` → `✅ Recording prepared`
4. `▶️ Starting recording...` → `✅ Recording start command sent`
5. `✅✅✅ Recording started successfully! isRecording: true`

If any step fails:
- `❌ Failed to prepare recording:` [error details]
- `❌ Failed to start recording:` [error details]
- `❌❌❌ Failed to start recording - MAIN CATCH:` [error details]

### Recording Stop Process
Now logs:
1. `⏹️ Attempting to stop recording...`
2. `⏹️ Recording object exists: true/false`
3. `⏹️ isRecording flag: true/false`
4. `⏹️ Stopping and unloading recording...` → `✅ Recording stopped`
5. `📁 Getting recording URI...` → `📁 Recording URI: [path]`
6. `✅✅✅ Recording stopped successfully, saved to: [path]`

If any step fails:
- `❌ No recording object found - recording may have failed to start`
- `❌ Recording URI is null - recording failed`
- `❌❌❌ Failed to stop recording:` [error details]

## How to Debug

### Step 1: Run with Enhanced Logging
```bash
# Clear existing logs and start fresh
adb logcat -c

# Run filtered logs
adb logcat | grep -E "🎤|🔧|📱|⚙️|▶️|⏹️|📁|✅|❌|⚠️|ReactNativeJS"
```

### Step 2: Test Voice Command
1. Tap microphone button
2. Watch console logs in real-time
3. Identify where process stops

### Step 3: Analyze Failure Point

#### If you see:
```
🎤 Attempting to start voice listening...
✅ Microphone permission granted
[NOTHING ELSE]
⏹️ Attempting to stop recording...
❌ No recording object found
```
**Diagnosis**: Recording failed to start (before audio mode setup)
**Possible cause**: Missing expo-av native module or incorrect build

#### If you see:
```
🎤 Attempting to start voice listening...
✅ Microphone permission granted
🔧 Setting audio mode...
❌ Failed to start recording - MAIN CATCH: [error]
```
**Diagnosis**: Audio mode setup failed
**Possible cause**: Android audio system issue

#### If you see:
```
✅ Audio mode set
📱 Creating recording instance...
❌ Failed to prepare recording: [error]
```
**Diagnosis**: Recording preparation failed
**Possible cause**: Unsupported audio format or codec

#### If you see:
```
✅ Recording prepared
▶️ Starting recording...
❌ Failed to start recording: [error]
```
**Diagnosis**: Recording start failed
**Possible cause**: Audio device busy or permission issue

## Common Issues & Fixes

### Issue 1: AMR_WB Not Supported
**Symptoms**: "Failed to prepare recording: Unsupported encoding"

**Fix**: Try alternative encoding (FLAC or OGG_OPUS)
```typescript
android: {
  extension: '.ogg',
  outputFormat: Audio.AndroidOutputFormat.OGG,
  audioEncoder: Audio.AndroidAudioEncoder.OPUS,
  sampleRate: 16000,
  numberOfChannels: 1,
  bitRate: 128000,
}
```

**Update API config**:
```typescript
config: {
  encoding: 'OGG_OPUS',  // or 'FLAC'
  sampleRateHertz: 16000,
}
```

### Issue 2: expo-av Not Linked
**Symptoms**: Recording fails immediately with no error

**Fix**: Rebuild app
```bash
# Clean and rebuild
rm -rf android/app/build
eas build --profile preview --platform android --local
```

### Issue 3: Audio Device Busy
**Symptoms**: "Recording device is busy"

**Fix**: Ensure TTS is stopped before recording
```typescript
// Already implemented in VoiceService.ts
await TTSService.stop();
await Haptics.impactAsync(...);
// Small delay to ensure TTS released audio
await new Promise(r => setTimeout(r, 100));
await GoogleSpeechService.startRecording();
```

### Issue 4: Permission Revoked
**Symptoms**: Permission granted but recording fails

**Fix**: Check permission again before recording
```typescript
// Already implemented
const hasPermission = await this.checkAndRequestPermission();
if (!hasPermission) {
  throw new Error('Permission not granted');
}
```

## Expected Successful Flow

When working correctly, you should see:
```
🎤 Attempting to start voice listening...
🎤 Current microphone permission status: granted
✅ Microphone permission already granted
🔧 Setting audio mode...
✅ Audio mode set
📱 Creating recording instance...
✅ Recording instance created
⚙️ Preparing to record with AMR_WB encoding...
✅ Recording prepared
▶️ Starting recording...
✅ Recording start command sent
✅✅✅ Recording started successfully! isRecording: true
[wait 5 seconds]
⏱️ Recording timeout reached (5 seconds)
⏹️ Attempting to stop recording...
⏹️ Recording object exists: true
⏹️ isRecording flag: true
⏹️ Stopping and unloading recording...
✅ Recording stopped
📁 Getting recording URI...
📁 Recording URI: file:///data/user/0/.../recording.3gp
✅✅✅ Recording stopped successfully, saved to: [path]
🎵 Audio recorded, processing...
📖 Reading audio file from: [path]
📦 Audio file size: 12345 characters
🌐 Sending request to Google Speech API...
📡 API Response status: 200
✅ Recognized: [your command]
```

## Next Steps

1. **Run with new logging**:
   ```bash
   adb install path/to/new-build.apk
   adb logcat | grep -E "🎤|🔧|📱|⚙️|▶️|⏹️|📁|✅|❌"
   ```

2. **Test voice command** and capture full log output

3. **Share the logs** showing:
   - Where it stops (last ✅ seen)
   - Any ❌ errors
   - Complete error messages

4. **If AMR_WB fails**, we'll switch to OGG_OPUS or FLAC encoding

## Alternative: Test with Simple Recording

Create a test button that just records and saves (no API):
```typescript
// Test recording only
const testRecording = async () => {
  await GoogleSpeechService.startRecording();
  await new Promise(r => setTimeout(r, 3000));
  const uri = await GoogleSpeechService.stopRecording();
  console.log('Test recording saved to:', uri);
  Alert.alert('Recording Test', uri ? 'Success!' : 'Failed');
};
```

This will confirm if the issue is with:
- Recording itself (audio capture)
- API communication
- Audio format conversion

---

## Status
🔍 Debugging in progress - waiting for detailed logs from next APK test

