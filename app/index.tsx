import { View, Text } from 'react-native';
import AccessibleButton from '../components/AccessibleButton';
import { useRouter } from 'expo-router';

export default function Home() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Welcome to the Accessibility App</Text>
      <AccessibleButton label="Start Scanning" onPress={() => router.push('/camera')} />
    </View>
  );
}