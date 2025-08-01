import { openGallery } from "@/utils/gallery";
import { Ionicons } from "@expo/vector-icons";
import { useCameraPermissions } from "expo-camera";
import * as FileSystem from "expo-file-system";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import type { ColorValue } from "react-native";

const { width, height } = Dimensions.get("window");

interface RecentScan {
  id: string;
  title: string;
  preview: string;
  timestamp: number;
  type: "document" | "text" | "qr";
}

interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: readonly [ColorValue, ColorValue, ...ColorValue[]];
  route?: string;
  requiresCamera?: boolean;
  requiresGallery?: boolean;
}

export default function HomeScreen() {
  const router = useRouter();
  const [permission] = useCameraPermissions();
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [savedTextsCount, setSavedTextsCount] = useState(0);

  const quickActions: QuickAction[] = [
    {
      id: "1",
      title: "Scan Document",
      subtitle: "Capture & extract text",
      icon: "document-text-outline",
      gradient: ["#667eea", "#764ba2"],
      route: "/(tabs)/camera",
      requiresCamera: true,
    },
    {
      id: "2",
      title: "From Gallery",
      subtitle: "Select existing photo",
      icon: "images-outline",
      gradient: ["#f093fb", "#f5576c"],
      requiresGallery: true,
    },
    {
      id: "3",
      title: "QR Scanner",
      subtitle: "Scan QR & barcodes",
      icon: "qr-code-outline",
      gradient: ["#4facfe", "#00f2fe"],
      route: "/qr-scanner",
      requiresCamera: true,
    },
    {
      id: "4",
      title: "Voice Notes",
      subtitle: "Audio to text",
      icon: "mic-outline",
      gradient: ["#43e97b", "#38f9d7"],
      route: "/voice-notes",
    },
  ];

  useEffect(() => {
    loadRecentScans();
    loadSavedTextsCount();
  }, []);

  const loadRecentScans = async () => {
    try {
      // Mock recent scans - replace with actual data loading
      const mockScans: RecentScan[] = [
        {
          id: "1",
          title: "Business Contract",
          preview: "This agreement is made between...",
          timestamp: Date.now() - 3600000,
          type: "document",
        },
        {
          id: "2",
          title: "Recipe Notes",
          preview: "Ingredients: 2 cups flour, 1 cup sugar...",
          timestamp: Date.now() - 7200000,
          type: "text",
        },
        {
          id: "3",
          title: "QR Code Result",
          preview: "https://example.com/product/123",
          timestamp: Date.now() - 86400000,
          type: "qr",
        },
      ];
      setRecentScans(mockScans);
    } catch (error) {
      console.log("Error loading recent scans:", error);
    }
  };

  const loadSavedTextsCount = async () => {
    try {
      const savedData = await FileSystem.readAsStringAsync(
        FileSystem.documentDirectory + "saved_texts.json"
      ).catch(() => "[]");
      const texts = JSON.parse(savedData);
      setSavedTextsCount(texts.length);
    } catch (error) {
      console.log("Error loading saved texts count:", error);
    }
  };

  const handleQuickAction = (action: QuickAction) => {

    if (action.requiresGallery ) {
      openGallery();
      return;
    }
    if (action.requiresCamera && !permission?.granted) {
      Alert.alert(
        "Camera Permission Required",
        "Please grant camera access to use this feature.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Settings", onPress: () => router.push("/(tabs)/settings") },
        ]
      );
      return;
    }


    router.push(action.route as any);
  };

  const getTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return "Just now";
  };

  const getTypeIcon = (type: RecentScan["type"]) => {
    switch (type) {
      case "document":
        return "document-text";
      case "text":
        return "text";
      case "qr":
        return "qr-code";
      default:
        return "document";
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Header */}
      <LinearGradient
        colors={["#667eea", "#764ba2", "#f093fb"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Good morning!</Text>
            <Text style={styles.headerTitle}>Ready to scan?</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.push("/settings")}
          >
            <Ionicons name="settings-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="document-text" size={24} color="#667eea" />
            <Text style={styles.statNumber}>{savedTextsCount}</Text>
            <Text style={styles.statLabel}>Saved Texts</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="scan" size={24} color="#f093fb" />
            <Text style={styles.statNumber}>{recentScans.length}</Text>
            <Text style={styles.statLabel}>Recent Scans</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="cloud-upload" size={24} color="#43e97b" />
            <Text style={styles.statNumber}>100%</Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.actionCard}
                onPress={() => handleQuickAction(action)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={action.gradient}
                  style={styles.actionGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.actionIcon}>
                    <Ionicons name={action.icon} size={28} color="white" />
                  </View>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                  <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Scans */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Scans</Text>
            <TouchableOpacity onPress={() => router.push("/history")}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {recentScans.length > 0 ? (
            <View style={styles.recentList}>
              {recentScans.slice(0, 3).map((scan) => (
                <TouchableOpacity
                  key={scan.id}
                  style={styles.recentItem}
                  onPress={() => router.push(`/scan-detail/${scan.id}`)}
                >
                  <View style={styles.recentIcon}>
                    <Ionicons
                      name={getTypeIcon(scan.type)}
                      size={20}
                      color="#667eea"
                    />
                  </View>
                  <View style={styles.recentContent}>
                    <Text style={styles.recentTitle}>{scan.title}</Text>
                    <Text style={styles.recentPreview} numberOfLines={1}>
                      {scan.preview}
                    </Text>
                  </View>
                  <Text style={styles.recentTime}>
                    {getTimeAgo(scan.timestamp)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="scan-outline" size={48} color="#666" />
              <Text style={styles.emptyText}>No recent scans</Text>
              <Text style={styles.emptySubtext}>
                Start by capturing your first document
              </Text>
            </View>
          )}
        </View>

        {/* Features Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <Ionicons name="eye-outline" size={24} color="#667eea" />
              <Text style={styles.featureText}>Advanced OCR</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="volume-high-outline" size={24} color="#f093fb" />
              <Text style={styles.featureText}>Text-to-Speech</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="share-outline" size={24} color="#43e97b" />
              <Text style={styles.featureText}>Easy Sharing</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="cloud-outline" size={24} color="#4facfe" />
              <Text style={styles.featureText}>Cloud Sync</Text>
            </View>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    paddingTop: StatusBar.currentHeight || 44,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  greeting: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 16,
    fontWeight: "400",
  },
  headerTitle: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 4,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statCard: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 30,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  seeAllText: {
    color: "#667eea",
    fontSize: 16,
    fontWeight: "600",
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionCard: {
    width: (width - 50) / 2,
    marginBottom: 16,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  actionGradient: {
    padding: 20,
    alignItems: "center",
    minHeight: 140,
    justifyContent: "center",
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  actionTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
  },
  actionSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    textAlign: "center",
  },
  recentList: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 4,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  recentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f4ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  recentContent: {
    flex: 1,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  recentPreview: {
    fontSize: 14,
    color: "#666",
  },
  recentTime: {
    fontSize: 12,
    color: "#999",
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
    backgroundColor: "white",
    borderRadius: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
    textAlign: "center",
  },
  featuresContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  featureItem: {
    width: (width - 50) / 2,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginLeft: 12,
  },
  bottomSpacing: {
    height: 100,
  },
});
