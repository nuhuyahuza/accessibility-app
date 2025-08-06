// App.tsx
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { AccessibilityProvider } from './src/contexts/AccessibilityContext';
import { VoiceProvider } from './src/contexts/VoiceContext';
import ContactScreen from './src/screens/ContactScreen';
import HelpScreen from './src/screens/HelpScreen';
import HomeScreen from './src/screens/HomeScreen';
import ScanScreen from './src/screens/ScanScreen';
import { TTSService } from './src/services/TTSService';

const Stack = createStackNavigator();

export default function App() {
  useEffect(() => {
    // Initialize app with welcome message
    setTimeout(() => {
      TTSService.speak("Vision Assist app loaded. Say 'Help' for commands or 'Scan' to read text.");
    }, 1000);
  }, []);

  return (
    <AccessibilityProvider>
      <VoiceProvider>
        <NavigationContainer>
          <StatusBar style="light" backgroundColor="#667eea" />
          <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{
              headerShown: false,
              gestureEnabled: false, // Disable gestures for accessibility
              cardStyleInterpolator: ({ current, layouts }) => {
                return {
                  cardStyle: {
                    transform: [
                      {
                        translateX: current.progress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [layouts.screen.width, 0],
                        }),
                      },
                    ],
                  },
                };
              },
            }}
          >
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Scan" component={ScanScreen} />
            <Stack.Screen name="Help" component={HelpScreen} />
            <Stack.Screen name="Contacts" component={ContactScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </VoiceProvider>
    </AccessibilityProvider>
  );
}