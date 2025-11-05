# Expo Go QR Code "No Usable Data Found" - Fix

## Issue
When running `npm start`, the QR code shows "No usable data found" in Expo Go.

## ✅ Solutions

### Solution 1: Use Different Connection Mode

Try each of these in order:

#### Option A: Tunnel Mode (Best for Networks with Firewall)
```bash
npx expo start --clear --tunnel
```
- Works through Expo's servers
- Best for corporate/restricted networks
- No local network configuration needed

#### Option B: LAN Mode (Best for Same WiFi)
```bash
npx expo start --clear --lan
```
- Phone and computer must be on same WiFi
- Fastest connection
- No internet required (after initial download)

#### Option C: Localhost Mode (For Emulator/Simulator)
```bash
npx expo start --clear --localhost
```
- Only works with Android emulator or iOS simulator
- Not for physical devices

### Solution 2: Manual URL Entry

If QR code still doesn't work:

1. Start the server:
```bash
npx expo start --clear
```

2. Look for the URL in terminal output (example):
```
Metro waiting on exp://192.168.1.100:8081
```

3. In Expo Go app:
   - Tap "Enter URL manually"
   - Type the URL shown in terminal
   - Tap "Connect"

### Solution 3: Clear Everything and Restart

```bash
# Stop all processes
pkill -f expo
pkill -f metro

# Clear all caches
rm -rf .expo node_modules/.cache android/build ios/build

# Reinstall if needed
npm install

# Start fresh
npx expo start --clear --tunnel
```

### Solution 4: Check Network Configuration

#### Same WiFi Network?
- Computer and phone must be on the same WiFi
- Guest networks often block device-to-device communication
- Try your phone's hotspot

#### Firewall/Antivirus?
- Temporarily disable firewall
- Allow Node.js/Expo through firewall
- Check antivirus isn't blocking ports 8081-8082

### Solution 5: Use Development Build Instead

Instead of Expo Go, build a development APK:

```bash
# Build development APK (includes all features)
eas build --platform android --profile development

# Download and install
# This APK works independently of Expo Go
```

## 🎯 Current Fixes Applied

### 1. Metro Config ✅
Cleaned up to use pure Expo defaults:
```javascript
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
module.exports = config;
```

### 2. Cache Cleared ✅
Removed all cached data that might cause issues.

### 3. Tunnel Mode Started ✅
Running with `--tunnel` flag for better compatibility.

## 🔍 Debug the QR Code

### Check What's in the QR Code:
1. Take screenshot of QR code
2. Use any QR reader app to scan it
3. Check if it shows a valid `exp://` URL

If the QR code contains a valid URL but Expo Go says "No usable data", try:
- Update Expo Go app to latest version
- Reinstall Expo Go
- Try on different device

## 📱 Expo Go Limitations

Note: Expo Go has limitations:
- ❌ Voice recognition won't work (needs dev build)
- ❌ Some native features limited
- ✅ Most visual features work
- ✅ Camera/OCR works
- ✅ Text-to-speech works

## 🚀 Recommended: Use Development Build

For **full features** (especially voice):

```bash
# Build once (takes 10-15 minutes)
npm run build:apk

# Download and install
# Works like regular app
# All features enabled
# No Expo Go needed
```

## Quick Commands Reference

```bash
# Tunnel mode (try this first)
npx expo start --clear --tunnel

# LAN mode (if on same WiFi)
npx expo start --clear --lan

# With device IP (manual)
npx expo start --clear --host 192.168.1.100

# Build development APK (recommended)
npm run build:apk
```

## ✅ What Should Work Now

After the fixes:
1. Metro bundler properly configured
2. QR code should be scannable
3. If not, use manual URL entry
4. Or build development APK for best experience

Try scanning the QR code now! If it still doesn't work, use the manual URL entry method or build the APK.



