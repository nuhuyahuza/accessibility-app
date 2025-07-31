import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import AccessibleButton from "../components/AccessibleButton";

export default function Home() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Welcome to the Accessibility App</Text>
      <AccessibleButton
        label="Start Scanning"
        onPress={() => router.push("/camera")}
      />
    </View>
  );
}
