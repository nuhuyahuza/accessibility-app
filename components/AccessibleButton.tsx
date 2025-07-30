import { vibrate } from "@/utils/haptics";
import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

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
    onPress={() => {
      vibrate();
      onPress();
    }}
  >
    <Text style={styles.text}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#003B73",
    padding: 20,
    borderRadius: 10,
    margin: 10,
    alignItems: "center",
    minWidth: 220,
  },
  text: {
    color: "#fff",
    fontSize: 18,
  },
});

export default AccessibleButton;
