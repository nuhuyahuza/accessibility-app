import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface Props {
  label: string;
  onPress: () => void;
}

const AccessibleButton: React.FC<Props> = ({ label, onPress }) => (
  <TouchableOpacity
    accessible
    accessibilityLabel={label}
    accessibilityRole="button"
    style={styles.button}
    onPress={onPress}
  >
    <Text style={styles.text}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#003B73',
    padding: 20,
    borderRadius: 10,
    margin: 10,
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 18,
  },
});

export default AccessibleButton;