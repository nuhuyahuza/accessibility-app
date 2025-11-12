# Infinite Loop Fix - App Won't Start

## Problem

The app was stuck in an infinite loop, repeatedly checking microphone permissions hundreds of times per second, preventing the app from starting.

**Symptoms in logs**:
```
11-07 03:09:54.742 I ReactNativeJS: '🎤 Current microphone permission status:', 'granted'
11-07 03:09:54.742 I ReactNativeJS: ✅ Microphone permission already granted
11-07 03:09:54.745 I ReactNativeJS: '🎤 Current microphone permission status:', 'granted'
11-07 03:09:54.745 I ReactNativeJS: ✅ Microphone permission already granted
11-07 03:09:54.745 I ReactNativeJS: '🎤 Current microphone permission status:', 'granted'
...
```

Repeated multiple times per millisecond - app never reached home screen.

---

## Root Cause

The issue was in `app/_layout.tsx` (lines 10-43 in the broken version).

### What Went Wrong:

```typescript
// BROKEN CODE:
export default function RootLayout() {
  const router = useRouter();
  
  useEffect(() => {
    const initializeApp = async () => {
      const onboardingCompleted = await AsyncStorage.getItem('onboarding_completed');
      
      if (onboardingCompleted !== 'true') {
        router.replace('/onboarding');  // ❌ Causes re-render
      } else {
        router.replace('/(tabs)');      // ❌ Causes re-render
      }
      
      setIsReady(true);
    };
    
    initializeApp();
  }, []); // Empty deps but router.replace triggers component remount
  
  if (!isReady) return null;
  
  return <Stack>...</Stack>;
}
```

### The Loop:

1. Component mounts → `useEffect` runs
2. `router.replace()` changes route
3. Route change triggers component **remount**
4. Component remounts → `useEffect` runs again
5. `router.replace()` changes route again
6. **INFINITE LOOP** 🔁

The `router.replace()` calls were triggering the root component to remount, causing the effect to run over and over. This also repeatedly initialized `VoiceContext` → `WakeWordService` → permission checks, explaining the rapid permission check logs.

---

## Solution

Instead of using `router.replace()` inside the effect, **set the initial route declaratively** using the `initialRouteName` prop on Stack.

### Fixed Code:

```typescript
// FIXED CODE:
export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<string | null>(null);
  
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await SettingsService.initialize();
        
        const onboardingCompleted = await AsyncStorage.getItem('onboarding_completed');
        
        // ✅ Just set state - don't navigate
        if (onboardingCompleted !== 'true') {
          setInitialRoute('/onboarding');
        } else {
          setInitialRoute('/(tabs)');
        }
        
        setIsReady(true);
      } catch (error) {
        setInitialRoute('/(tabs)');
        setIsReady(true);
      }
    };
    
    initializeApp();
  }, []); // Runs only once on mount
  
  // Wait for initialization
  if (!isReady || !initialRoute) {
    return null;
  }
  
  // ✅ Use initialRouteName instead of router.replace()
  return (
    <Stack 
      screenOptions={{ headerShown: false }}
      initialRouteName={initialRoute === '/onboarding' ? 'onboarding' : '(tabs)'}
    >
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
      ...
    </Stack>
  );
}
```

### Key Changes:

1. **Added `initialRoute` state** - Stores which route to show
2. **Removed `router.replace()` calls** - These caused the loop
3. **Set `initialRouteName` prop** - Declarative routing instead of imperative
4. **Effect runs only once** - No dependencies that trigger re-runs
5. **No router import** - Not needed anymore

---

## Why This Works

### Before (Broken):
```
Mount → useEffect → router.replace() → Remount → useEffect → router.replace() → ∞
```

### After (Fixed):
```
Mount → useEffect → setInitialRoute → Stack renders with correct initial screen → Done ✅
```

The `initialRouteName` prop is evaluated **once** when the Stack is first rendered. It doesn't cause remounts or trigger effects.

---

## Testing

After this fix, the app should:

1. ✅ Start normally without looping
2. ✅ Show onboarding on first launch
3. ✅ Show tabs on subsequent launches
4. ✅ Initialize voice services once (not hundreds of times)
5. ✅ Check microphone permission once (not in a loop)

### Expected Logs:
```
SettingsService initialized
Onboarding completed - will show tabs
✅ Wake word listening auto-started
[App loads normally]
```

**Not**:
```
🎤 Current microphone permission status: granted
🎤 Current microphone permission status: granted
🎤 Current microphone permission status: granted
[hundreds of times per second]
```

---

## Key Lesson

**Never use `router.replace()` or `router.push()` inside a root-level `useEffect` without proper guards**, as it can cause the component to remount and trigger an infinite loop.

**Correct patterns**:
1. ✅ Use `initialRouteName` for initial route selection
2. ✅ Use `<Redirect />` component for conditional routing
3. ✅ Use navigation inside event handlers (button clicks)
4. ❌ Don't navigate in root component effects

---

## Files Modified

1. ✅ `app/_layout.tsx` - Fixed infinite loop by removing router.replace() and using initialRouteName

**Status**: Bug fixed, app should start normally now! 🎉


