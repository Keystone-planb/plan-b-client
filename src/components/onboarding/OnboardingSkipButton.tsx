// src/components/onboarding/OnboardingSkipButton.tsx

import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

type Props = {
  onPress: () => void;
  topInset?: number;
};

export default function OnboardingSkipButton({ onPress, topInset = 0 }: Props) {
  return (
    <TouchableOpacity
      testID="onboarding-skip-button"
      accessibilityLabel="Onboarding skip"
      activeOpacity={0.8}
      style={[styles.skipButton, { top: Math.max(topInset + 18, 58) }]}
      onPress={onPress}
    >
      <Text style={styles.skipText}>건너뛰기</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  skipButton: {
    position: "absolute",
    right: 34,
    zIndex: 100,
  },
  skipText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
  },
});
