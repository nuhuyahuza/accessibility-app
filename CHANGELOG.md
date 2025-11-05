# Changelog

## Recent Updates

### Fixed FileSystem API Deprecation (Expo SDK 54)
**Date**: 2025-11-04

#### Issue
The app was using deprecated `expo-file-system` API methods that were removed in Expo SDK 54:
- `FileSystem.getInfoAsync()` - deprecated
- `FileSystem.readAsStringAsync()` - deprecated  
- `FileSystem.readDirectoryAsync()` - deprecated

#### Solution
Migrated all FileSystem imports to use the legacy API:
```javascript
// Before
import * as FileSystem from 'expo-file-system';

// After
import * as FileSystem from 'expo-file-system/legacy';
```

#### Files Updated
1. `services/GoogleVisionService.ts` - Image to base64 conversion
2. `services/GoogleSpeechService.ts` - Audio file handling
3. `app/(tabs)/index.tsx` - Saved texts loading
4. `app/(tabs)/library.tsx` - Library file management
5. `app/processing.tsx` - OCR processing
6. `app/voice-notes.tsx` - Voice notes storage
7. `utils/texts.ts` - Text file utilities
8. `utils/Image.ts` - Image compression utilities
9. `utils/storeImage.ts` - Image storage utilities

#### Benefits
- ✅ No more deprecation warnings
- ✅ Maintains backward compatibility
- ✅ All file operations work correctly
- ✅ Future-proof (until legacy API is removed)

#### Migration Path
When ready to migrate to the new API (recommended for new projects):
- Use `File` and `Directory` classes from `expo-file-system`
- See: https://docs.expo.dev/versions/latest/sdk/filesystem/

---

### Enhanced Error Handling for Google Vision API
**Date**: 2025-11-04

#### Improvements
- Added API key validation before making requests
- Added file existence checks before processing
- Enhanced error messages with detailed debugging info
- Created fallback OCR service for testing without API keys
- Added `API_SETUP.md` documentation

#### Features
- ✅ Graceful degradation when API keys are missing
- ✅ Mock OCR functionality for testing
- ✅ Better user feedback with clear error messages
- ✅ Comprehensive API setup documentation

---

### Camera Permission Fix
**Date**: 2025-11-04

#### Issue
App was trying to call `permission?.requestPermission()` but the function didn't exist.

#### Solution
Properly destructured the `useCameraPermissions()` hook:
```javascript
// Before
const [permission] = useCameraPermissions();

// After
const [permission, requestPermission] = useCameraPermissions();
```

#### Result
- ✅ Camera permissions now requested correctly
- ✅ Scan Document button works as expected

---

## Known Issues

### Voice Recognition
- Requires Google Speech-to-Text API key
- Currently works in test mode without API key
- See `API_SETUP.md` for configuration

### InternalBytecode.js Error
- Harmless Metro bundler error during symbolication
- Does not affect app functionality
- Can be safely ignored

---

## Future Improvements

1. **Migrate to New FileSystem API**
   - Use modern `File` and `Directory` classes
   - Better performance and type safety

2. **Add Tesseract.js for Client-Side OCR**
   - Remove dependency on Google Vision API for basic OCR
   - Offline functionality

3. **Implement Web Speech API**
   - Browser-based speech recognition
   - No API keys required for web version

4. **Add User Preferences Backup**
   - Cloud sync for settings
   - Cross-device preferences

---

## Documentation

- `API_SETUP.md` - Google Cloud API configuration guide
- `README.md` - General project information
- `CHANGELOG.md` - This file



