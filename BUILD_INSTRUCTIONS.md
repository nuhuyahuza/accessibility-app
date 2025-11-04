# Building APK Instructions

## Prerequisites

### 1. Install EAS CLI
```bash
npm install -g eas-cli
```

### 2. Login to Expo
```bash
eas login
```

Or create account:
```bash
eas register
```

### 3. Configure Project
```bash
# Already configured in eas.json
# Just verify your project ID
eas project:info
```

---

## Build APK (Simple Commands)

### Option 1: Quick APK Build (Recommended)
```bash
npm run build:apk
```

This will:
- Build an APK (not AAB)
- Use the "apk" profile from eas.json
- Create an installable APK file
- Can be installed directly on Android devices

### Option 2: Preview Build
```bash
npm run build:preview
```

This creates an internal distribution APK for testing.

### Option 3: Production Build
```bash
npm run build:production
```

This creates a production-ready APK.

---

## After Build Completes

### 1. Download APK
After the build finishes, EAS will provide a download link:
```
✔ Build successful!
Download: https://expo.dev/artifacts/...
```

### 2. Install on Device
```bash
# Download the APK then:
adb install path/to/your-app.apk

# Or transfer to device and install manually
```

### 3. Share APK
You can share the download link directly or distribute the APK file.

---

## Build Profiles Explained

### Development Profile
```bash
eas build --platform android --profile development
```
- Includes development tools
- Faster iteration
- Larger file size

### Preview/APK Profile
```bash
npm run build:apk
```
- Optimized build
- Smaller file size
- Internal distribution
- **Best for testing**

### Production Profile
```bash
npm run build:production
```
- Fully optimized
- Ready for Play Store
- Smallest file size

---

## Environment Variables

EAS Build automatically uses your `.env` file during build. Make sure you have:

```env
GOOGLE_VISION_API_KEY=your_api_key_here
```

Or configure secrets in EAS:
```bash
eas secret:create --name GOOGLE_VISION_API_KEY --value your_api_key_here
```

---

## Build Configuration

The build is configured in `eas.json`:

```json
{
  "build": {
    "apk": {
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease"
      }
    }
  }
}
```

All Expo-managed native modules are automatically included:
- ✅ expo-camera
- ✅ expo-av (audio recording)
- ✅ expo-speech
- ✅ expo-haptics
- ✅ expo-contacts
- ✅ expo-image-picker
- ✅ All other expo-* modules

---

## Troubleshooting

### Build Fails
```bash
# Clear cache and retry
eas build --platform android --profile apk --clear-cache
```

### Check Build Status
```bash
# View all builds
eas build:list

# View specific build
eas build:view [build-id]
```

### Local Build (Advanced)
If you want to build locally instead of using EAS cloud:
```bash
# Requires Android Studio and SDK installed
eas build --platform android --profile apk --local
```

---

## Build Time

- **First build**: 15-20 minutes
- **Subsequent builds**: 5-10 minutes
- EAS caches dependencies for faster rebuilds

---

## Free Tier Limits

Expo EAS Build free tier includes:
- **30 builds per month**
- Android builds are free (no limit on priority)
- iOS builds have different limits

---

## Faster Development

For development, you can still use Expo Go for most features:
```bash
npm start
```

**Note**: Voice recognition requires a built app (not Expo Go).

---

## Common Commands

```bash
# Build APK
npm run build:apk

# Check build status
eas build:list

# Cancel running build
eas build:cancel

# View build logs
eas build:view [build-id]

# Configure build
eas build:configure

# Update project
eas update

# Run on device
npm start --android
```

---

## Installation on Device

### Method 1: Direct Install
1. Build completes
2. Download APK from link
3. Transfer to Android device
4. Enable "Install from Unknown Sources"
5. Tap APK to install

### Method 2: ADB Install
```bash
adb install your-app.apk
```

### Method 3: Internal Distribution
Use EAS Submit for internal testing:
```bash
eas submit --platform android --profile preview
```

---

## APK vs AAB

**APK (Android Package)**:
- Can install directly
- Single file for all devices
- Larger file size
- ✅ Best for testing and distribution outside Play Store

**AAB (Android App Bundle)**:
- Requires Play Store
- Smaller downloads (optimized per device)
- Google Play's required format
- Not directly installable

This project is configured to build APK by default for easy testing!

---

## Quick Reference

```bash
# ONE COMMAND TO BUILD APK
npm run build:apk

# Then wait for build to complete and download the APK!
```

That's it! 🎉

