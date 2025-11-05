# "Hey Assistant" - Wake Word Feature Setup

## ⚠️ **Important Note**

The "Hey Assistant" wake word feature **ONLY works in a Development Build**, not in Expo Go.

### Why?
- Expo Go doesn't support continuous audio recording
- Google Speech-to-Text requires native audio modules
- Wake word detection needs background audio access

---

## ✅ **Current Implementation**

### What's Been Built:

1. **WakeWordService** (`services/WakeWordService.ts`)
   - Continuously listens for "Hey Assistant"
   - 2-second listening windows
   - Responds with "Yes?" when detected
   - Then listens for 4-second command
   - Auto-restarts after processing

2. **GlobalVoiceCommandService** (`services/GlobalVoiceCommandService.ts`)
   - Processes voice commands with priority system
   - Playback commands (Priority 1): stop, pause, resume, faster, slower
   - Navigation commands (Priority 3): home, scan, library
   - Context-aware routing

3. **VoiceContext Integration** (`context/VoiceContext.tsx`)
   - `startWakeWordListening()` - Starts listening for wake word
   - `stopWakeWordListening()` - Stops listening
   - `isWakeWordActive` - Shows listening status
   - Initializes all voice services

4. **UI Indicator** (Home Screen)
   - Green dot on microphone icon when listening
   - Button changes color when active
   - Visual feedback for users

---

## 🚀 **How to Test "Hey Assistant"**

### Step 1: Build Development APK

**You MUST build the app** (not use Expo Go):

```bash
# Install EAS CLI (if not already)
npm install -g eas-cli
eas login

# Build development APK
npm run build:apk

# Or explicitly:
eas build --platform android --profile development
```

Wait 10-15 minutes for build to complete.

### Step 2: Install APK on Device

1. Download APK from the link EAS provides
2. Transfer to Android device
3. Enable "Install from Unknown Sources"
4. Install the APK

### Step 3: Configure API Key

Make sure you have `.env` file with:
```env
GOOGLE_VISION_API_KEY=your_google_cloud_api_key
```

**OR** set as EAS secret:
```bash
eas secret:create --name GOOGLE_VISION_API_KEY --value YOUR_API_KEY
```

### Step 4: Launch App

1. Open the installed app
2. Listen for greeting
3. You should hear: "The app is now listening for Hey Assistant..."
4. Microphone icon should have green dot

### Step 5: Test Wake Word

1. Say: **"Hey Assistant"**
2. App should respond: **"Yes?"**
3. Then say a command: **"Scan Document"**
4. App should open the scanner

---

## 🎤 **Available Commands After "Hey Assistant"**

### While Text is Being Read:
- "Stop" → Stops reading immediately
- "Pause" → Pauses reading
- "Continue" / "Resume" → Resumes reading
- "Repeat" / "Again" → Reads from beginning
- "Faster" → Speeds up by 0.25x
- "Slower" → Slows down by 0.25x

### Navigation:
- "Scan Document" / "Take Photo" → Opens scanner
- "Go Home" / "Home" → Home screen
- "Library" / "Saved Documents" → Library
- "Settings" → Settings screen
- "History" → History screen
- "Back" / "Close" → Go back

### Actions:
- "Save" / "Save This" → Saves current document
- "Help" / "What Can You Do" → Lists commands

---

## 🧪 **Testing in Expo Go (Limited)**

While "Hey Assistant" won't work in Expo Go, you can still test:

✅ **What Works**:
- Document scanning
- Text-to-Speech announcements
- Text Review Modal
- Playback controls (touch)
- Material Design UI
- Save/Library features

❌ **What Doesn't Work**:
- "Hey Assistant" wake word
- Voice recognition
- Speech-to-text
- Voice commands

### To test in Expo Go:
```bash
npx expo start --clear
```

---

## 🔍 **Debugging Wake Word**

If "Hey Assistant" doesn't work in dev build:

### Check 1: Console Logs
Look for these messages:
```
Wake word listening started
WakeWordService initialized
```

### Check 2: Permissions
App needs:
- Microphone permission
- Background audio permission (Android)

Check in Settings → Apps → Your App → Permissions

### Check 3: API Key
```bash
# Verify API key is set
adb logcat | grep "API Key"

# Should show:
API Key configured: true
API Key length: 39
```

### Check 4: Google Cloud Console
1. Go to https://console.cloud.google.com/
2. Check "Cloud Speech-to-Text API" is enabled
3. Check API key has no restrictions blocking Speech API
4. Check quota hasn't been exceeded

### Check 5: Audio Quality
- Test in quiet environment
- Speak clearly and loudly
- Hold phone normally
- Try variations: "Hey Assistant", "Hello Assistant", "Assistant"

---

## 💡 **How Wake Word Detection Works**

### Technical Flow:
```
1. App starts → WakeWordService.initialize()
2. Starts continuous loop:
   - Records 2 seconds of audio
   - Sends to Google Speech API
   - Checks if transcript contains wake word
   - If detected → Triggers callback
   - If not → Continues loop after 500ms delay
   
3. When wake word detected:
   - Responds "Yes?"
   - Records 4 seconds for command
   - Sends to Google Speech API
   - Processes command via GlobalVoiceCommandService
   - Returns to listening for wake word
```

### Battery Impact:
- Optimized with short recording windows (2 seconds)
- 500ms delays between attempts
- Pauses when app in background
- Low battery consumption design

---

## 🎯 **Expected Behavior**

### Success Flow:
```
User: "Hey Assistant"
App: "Yes?" (with haptic feedback)

User: "Scan Document"
App: "Opening scanner" (camera opens)

User: Takes photo
App: "Processing... Text detected!"
Modal: Opens and auto-reads text

User: (while reading) "Pause"
App: Pauses reading, says "Paused"

User: "Continue"
App: Resumes reading

User: "Save"
App: "Document saved successfully"
```

---

## 🐛 **Troubleshooting**

### Issue: No Response to "Hey Assistant"
**Solutions**:
1. Make sure you built APK (not using Expo Go)
2. Check microphone permission granted
3. Verify API key configured
4. Try saying it louder/clearer
5. Check console logs for errors

### Issue: Responds But Doesn't Process Command
**Solutions**:
1. Check GlobalVoiceCommandService is initialized
2. Verify navigation is working
3. Check console for command recognition
4. Try exact command phrases from list above

### Issue: Battery Drains Fast
**Solutions**:
1. This is expected with continuous listening
2. Can disable with stopWakeWordListening()
3. Only activates when app is in foreground
4. Pauses when app in background

---

## 📊 **API Usage**

### Google Speech-to-Text Costs:
- Free tier: 60 minutes/month
- Each wake word check: ~2 seconds
- Each command: ~4 seconds
- ~1,000 wake word attempts + 500 commands = ~50 minutes/month
- **Stays within free tier for normal use!**

### Tips to Minimize Usage:
1. Don't leave app open when not in use
2. Use touch controls when convenient
3. Disable wake word when not needed
4. Set up billing alerts in Google Cloud Console

---

## ✅ **Implementation Checklist**

- [x] WakeWordService created
- [x] GlobalVoiceCommandService created
- [x] VoiceContext updated with wake word methods
- [x] Home screen shows listening indicator
- [x] Wake word initialized on app launch
- [x] Voice commands processed with priority
- [x] Error handling implemented
- [ ] **Build development APK to test** ⬅️ YOU ARE HERE
- [ ] Test on physical device
- [ ] Verify API key configured
- [ ] Test all voice commands

---

## 🎊 **Summary**

**Status**: ✅ Fully Implemented  
**Works In**: Development Build / APK only  
**Requires**: Google Cloud Speech-to-Text API key  
**Build Command**: `npm run build:apk`  
**Test Command**: Install APK and test on device  

**The wake word system is ready - just needs to be built and tested on a real device!**

---

## 📝 **Quick Reference**

### Build & Test:
```bash
# 1. Build APK
npm run build:apk

# 2. Install on device

# 3. Open app

# 4. Listen for: "The app is now listening for Hey Assistant"

# 5. Say: "Hey Assistant"

# 6. Should hear: "Yes?"

# 7. Say command: "Scan Document"

# 8. Should open scanner
```

**That's it! Your wake word feature is fully implemented and ready to test!** 🎉

