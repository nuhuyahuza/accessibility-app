import { VoiceProvider } from "@/context/VoiceContext";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AccessibilityProvider } from "../context/AccessibilityContext";

export default function RootLayout() {
  return (
    <>
      <AccessibilityProvider>
        <VoiceProvider>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="processing"
              options={{
                presentation: "modal",
                headerShown: false,
              }}
            />
          </Stack>
        </VoiceProvider>
      </AccessibilityProvider>
    </>
  );
}
