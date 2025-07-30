import { StyleSheet, Text, View } from 'react-native';

export default function ObjectDetectionScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Coming soon: Scene/Object Detection via ML Kit or TensorFlow.js</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  text: { fontSize: 18, textAlign: 'center' },
});
