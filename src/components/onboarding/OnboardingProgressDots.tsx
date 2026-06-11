// src/components/onboarding/OnboardingProgressDots.tsx

import React from "react";
import { StyleSheet, View } from "react-native";

const BLUE = "#2F5BEA";

type Props = {
  activeIndex: 0 | 1 | 2 | 3;
  bottomInset?: number;
};

export default function OnboardingProgressDots({ activeIndex, bottomInset = 0 }: Props) {
  return (
    <View pointerEvents="none" style={[styles.dots, { bottom: Math.max(bottomInset + 20, 36) }]}>
      {[0, 1, 2, 3].map((index) => (
        <View
          key={index}
          style={index === activeIndex ? styles.activeDot : styles.dot}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dots: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    zIndex: 999,
    elevation: 999,
  },
  activeDot: {
    width: 54,
    height: 12,
    borderRadius: 999,
    backgroundColor: BLUE,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
  },
});
