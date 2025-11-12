import { SettingsProvider } from "@/context/SettingsContext";
import { VoiceProvider } from "@/context/VoiceContext";
import { AuthProvider } from "@/context/AuthContext";
import { SettingsService } from "@/services/SettingsService";
import { AuthService } from "@/services/AuthService";
import { useProtectedRoute } from "@/components/ProtectedRoute";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { AccessibilityProvider } from "../context/AccessibilityContext";

function RootNavigator() {
  const [isReady, setIsReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  useProtectedRoute();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await SettingsService.initialize();
        console.log('SettingsService initialized');
        
        const onboardingCompleted = await AsyncStorage.getItem('onboarding_completed');
        const isAuthenticated = await AuthService.isAuthenticated();
        
        if (onboardingCompleted !== 'true') {
          console.log('Onboarding not completed - will show onboarding');
          setInitialRoute('/onboarding');
        } else if (!isAuthenticated) {
          console.log('Not authenticated - will show login');
          setInitialRoute('/auth/login');
        } else {
          console.log('Authenticated - will show tabs');
          setInitialRoute('/(tabs)');
        }
        
        setIsReady(true);
      } catch (error) {
        console.error('App initialization error:', error);
        setInitialRoute('/onboarding');
        setIsReady(true);
      }
    };
    
    initializeApp();
  }, []);

  if (!isReady || !initialRoute) {
    return null;
  }

  const getInitialRouteName = () => {
    if (initialRoute === '/onboarding') return 'onboarding';
    if (initialRoute === '/auth/login') return 'auth/login';
    return '(tabs)';
  };

  return (
    <>
      <StatusBar style="auto" />
      <Stack 
        screenOptions={{ headerShown: false }}
        initialRouteName={getInitialRouteName()}
      >
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/signup" />
        <Stack.Screen name="help" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="scan" />
        <Stack.Screen name="object-detection" />
        <Stack.Screen
          name="processing"
          options={{
            presentation: "modal",
            headerShown: false,
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <AccessibilityProvider>
          <VoiceProvider>
            <RootNavigator />
          </VoiceProvider>
        </AccessibilityProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}
