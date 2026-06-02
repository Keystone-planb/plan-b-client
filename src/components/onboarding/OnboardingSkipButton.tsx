// src/components/onboarding/OnboardingSkipButton.tsx

import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

type Props = {
  onPress: () => void;
};

export default function OnboardingSkipButton({ onPress }: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.skipButton}
      onPress={onPress}
    >
      <Text style={styles.skipText}>건너뛰기</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  skipButton: {
    position: "absolute",
    top: 58,
    right: 34,
    zIndex: 100,
  },
  skipText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
  },
});
