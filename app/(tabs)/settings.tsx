import { SettingsService } from "@/services/SettingsService";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import * as Speech from "expo-speech";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  type: "toggle" | "navigation" | "action";
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
}

export default function SettingsScreen() {
  const router = useRouter();
  const { currentUser, logout } = useAuth();
  const [settings, setSettings] = useState({
    autoSave: true,
    speechEnabled: true,
    darkMode: false,
    notifications: true,
    hapticFeedback: true,
    autoCapture: false,
    scanQuality: 'high' as 'low' | 'medium' | 'high',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem("app_settings");
      if (savedSettings) {
        setSettings({ ...settings, ...JSON.parse(savedSettings) });
      }
    } catch (error) {
      console.log("Error loading settings:", error);
    }
  };

  const saveSettings = async (newSettings: typeof settings) => {
    try {
      await AsyncStorage.setItem("app_settings", JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.log("Error saving settings:", error);
    }
  };

  const toggleSetting = async (key: keyof typeof settings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    saveSettings(newSettings);
    
    // Haptic feedback if enabled
    if (settings.hapticFeedback && key !== 'hapticFeedback') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else if (key === 'hapticFeedback' && newSettings.hapticFeedback) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    // Announce the change if speech is enabled
    if (settings.speechEnabled || key === 'speechEnabled') {
      const value = newSettings[key] ? "enabled" : "disabled";
      const settingName = key.replace(/([A-Z])/g, ' $1').trim();
      Speech.speak(`${settingName} ${value}`, { rate: 0.8 });
    }
  };

  const testTTS = async () => {
    try {
      if (settings.hapticFeedback) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      
      await Speech.speak("This is a test of the text-to-speech feature. Your voice sounds great!", {
        language: "en",
        pitch: 1.0,
        rate: 0.75,
      });
    } catch (error) {
      console.error("TTS test error:", error);
      Alert.alert("Error", "Failed to test text-to-speech");
    }
  };

  const clearAllData = () => {
    if (settings.speechEnabled) {
      Speech.speak("Warning: This will delete all your data", { rate: 0.8 });
    }
    
    Alert.alert(
      "Clear All Data",
      "This will delete all saved texts and settings. This action cannot be undone.",
      [
        { 
          text: "Cancel", 
          style: "cancel",
          onPress: () => {
            if (settings.speechEnabled) {
              Speech.speak("Cancelled", { rate: 0.8 });
            }
          }
        },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            try {
              if (settings.hapticFeedback) {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              }
              
              await AsyncStorage.clear();
              
              if (settings.hapticFeedback) {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
              
              Alert.alert("Success", "All data has been cleared");
              Speech.speak("All data has been cleared", { rate: 0.8 });
              
              // Reload default settings
              setSettings({
                autoSave: true,
                speechEnabled: true,
                darkMode: false,
                notifications: true,
                hapticFeedback: true,
                autoCapture: false,
              });
            } catch (error) {
              console.error("Clear data error:", error);
              Alert.alert("Error", "Failed to clear data");
              Speech.speak("Failed to clear data", { rate: 0.8 });
            }
          },
        },
      ]
    );
  };

  const openURL = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert("Error", "Unable to open link");
    });
  };

  const handleExportData = async () => {
    try {
      if (settings.hapticFeedback) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      if (settings.speechEnabled) {
        Speech.speak("Exporting your data", { rate: 0.8 });
      }

      await SettingsService.exportData();

      if (settings.hapticFeedback) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert("Success", "Data exported successfully!");
      
      if (settings.speechEnabled) {
        Speech.speak("Data exported successfully", { rate: 0.8 });
      }
    } catch (error) {
      console.error("Export error:", error);
      
      if (settings.hapticFeedback) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      Alert.alert("Error", "Failed to export data. Please try again.");
      
      if (settings.speechEnabled) {
        Speech.speak("Failed to export data", { rate: 0.8 });
      }
    }
  };

  const handleScanQuality = () => {
    const qualities: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high'];
    const currentIndex = qualities.indexOf(settings.scanQuality);
    const nextQuality = qualities[(currentIndex + 1) % qualities.length];

    const qualityDescriptions = {
      low: 'Low quality - Faster processing, smaller files',
      medium: 'Medium quality - Balanced',
      high: 'High quality - Best accuracy, larger files',
    };

    const newSettings = { ...settings, scanQuality: nextQuality };
    saveSettings(newSettings);

    if (settings.hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    Alert.alert(
      "Scan Quality",
      qualityDescriptions[nextQuality],
      [{ text: "OK" }]
    );

    if (settings.speechEnabled) {
      Speech.speak(`Scan quality set to ${nextQuality}`, { rate: 0.8 });
    }
  };

  const handleLogout = () => {
    if (settings.speechEnabled) {
      Speech.speak("Are you sure you want to logout?", { rate: 0.8 });
    }
    
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { 
          text: "Cancel", 
          style: "cancel",
          onPress: () => {
            if (settings.speechEnabled) {
              Speech.speak("Cancelled", { rate: 0.8 });
            }
          }
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              if (settings.hapticFeedback) {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
              
              await logout();
              
              if (settings.speechEnabled) {
                Speech.speak("You have been logged out", { rate: 0.8 });
              }
              
              router.replace('/auth/login');
            } catch (error) {
              console.error("Logout error:", error);
              Alert.alert("Error", "Failed to logout");
              if (settings.speechEnabled) {
                Speech.speak("Failed to logout", { rate: 0.8 });
              }
            }
          },
        },
      ]
    );
  };

  const settingSections = [
    {
      title: "Account",
      items: [
        {
          id: "userName",
          title: currentUser?.name || "User",
          subtitle: currentUser?.email || "Not logged in",
          icon: "person-circle-outline" as const,
          type: "navigation" as const,
          onPress: () => {},
        },
        {
          id: "logout",
          title: "Logout",
          subtitle: "Sign out of your account",
          icon: "log-out-outline" as const,
          type: "action" as const,
          onPress: handleLogout,
        },
      ],
    },
    {
      title: "General",
      items: [
        {
          id: "autoSave",
          title: "Auto Save",
          subtitle: "Automatically save extracted text",
          icon: "save-outline" as const,
          type: "toggle" as const,
          value: settings.autoSave,
          onToggle: () => toggleSetting("autoSave"),
        },
        {
          id: "notifications",
          title: "Notifications",
          subtitle: "Get notified about scan results",
          icon: "notifications-outline" as const,
          type: "toggle" as const,
          value: settings.notifications,
          onToggle: () => toggleSetting("notifications"),
        },
        {
          id: "hapticFeedback",
          title: "Haptic Feedback",
          subtitle: "Vibrate on interactions",
          icon: "phone-portrait-outline" as const,
          type: "toggle" as const,
          value: settings.hapticFeedback,
          onToggle: () => toggleSetting("hapticFeedback"),
        },
      ],
    },
    {
      title: "Camera & Scanning",
      items: [
        {
          id: "autoCapture",
          title: "Auto Capture",
          subtitle: "Automatically capture when document detected",
          icon: "camera-outline" as const,
          type: "toggle" as const,
          value: settings.autoCapture,
          onToggle: () => toggleSetting("autoCapture"),
        },
        {
          id: "scanQuality",
          title: "Scan Quality",
          subtitle: `${settings.scanQuality.charAt(0).toUpperCase() + settings.scanQuality.slice(1)} quality`,
          icon: "eye-outline" as const,
          type: "navigation" as const,
          onPress: handleScanQuality,
        },
      ],
    },
    {
      title: "Text-to-Speech",
      items: [
        {
          id: "speechEnabled",
          title: "Enable TTS",
          subtitle: "Text-to-speech functionality",
          icon: "volume-high-outline" as const,
          type: "toggle" as const,
          value: settings.speechEnabled,
          onToggle: () => toggleSetting("speechEnabled"),
        },
        {
          id: "testTTS",
          title: "Test Voice",
          subtitle: "Play a sample text",
          icon: "play-outline" as const,
          type: "action" as const,
          onPress: testTTS,
        },
      ],
    },
    {
      title: "Data & Privacy",
      items: [
        {
          id: "exportData",
          title: "Export Data",
          subtitle: "Export all saved texts",
          icon: "download-outline" as const,
          type: "action" as const,
          onPress: handleExportData,
        },
        {
          id: "clearData",
          title: "Clear All Data",
          subtitle: "Delete all saved texts and settings",
          icon: "trash-outline" as const,
          type: "action" as const,
          onPress: clearAllData,
        },
      ],
    },
    {
      title: "About",
      items: [
        {
          id: "version",
          title: "App Version",
          subtitle: "1.0.0",
          icon: "information-circle-outline" as const,
          type: "navigation" as const,
          onPress: () => {},
        },
        {
          id: "privacy",
          title: "Privacy Policy",
          subtitle: "How we handle your data",
          icon: "shield-outline" as const,
          type: "navigation" as const,
          onPress: () => openURL("https://example.com/privacy"),
        },
        {
          id: "terms",
          title: "Terms of Service",
          subtitle: "Usage terms and conditions",
          icon: "document-text-outline" as const,
          type: "navigation" as const,
          onPress: () => openURL("https://example.com/terms"),
        },
        {
          id: "support",
          title: "Support",
          subtitle: "Get help and report issues",
          icon: "help-circle-outline" as const,
          type: "navigation" as const,
          onPress: () => openURL("mailto:support@example.com"),
        },
      ],
    },
  ];

  const renderSettingItem = (item: SettingItem) => {
    return (
      <TouchableOpacity
        key={item.id}
        style={styles.settingItem}
        onPress={item.onPress}
        disabled={item.type === "toggle"}
      >
        <View style={styles.settingIcon}>
          <Ionicons name={item.icon} size={22} color="#667eea" />
        </View>
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>{item.title}</Text>
          {item.subtitle && (
            <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
          )}
        </View>
        {item.type === "toggle" ? (
          <Switch
            value={item.value}
            onValueChange={item.onToggle}
            trackColor={{ false: "#f0f0f0", true: "#667eea" }}
            thumbColor={item.value ? "white" : "#f4f3f4"}
          />
        ) : (
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>
          Customize your scanning experience
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {settingSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map(renderSettingItem)}
            </View>
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Made with ❤️ for better document scanning
          </Text>
          <Text style={styles.footerVersion}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    paddingTop: StatusBar.currentHeight || 44,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: "white",
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 32,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  sectionContent: {
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f4ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  settingSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  footer: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  footerVersion: {
    fontSize: 12,
    color: "#999",
    marginTop: 8,
  },
});
