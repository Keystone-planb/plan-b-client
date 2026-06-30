// src/screens/onboarding/OnboardingFourthScreen.tsx

import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import OnboardingSwipe from "../../components/onboarding/OnboardingSwipe";

type Props = {
  navigation: {
    replace: (screen: string) => void;
  };
};

const BLUE = "#2F5BEA";
const TEXT = "#111827";
const MUTED = "#667085";

export default function OnboardingFourthScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <OnboardingSwipe onSwipeRight={() => navigation.replace("OnboardingThird")}>
      <View style={styles.screen}>
      <View style={styles.center}>
        <Text style={styles.logo}>Plan.B</Text>
        <View style={styles.rocketCircle}>
          <Text style={styles.rocket}>🚀</Text>
        </View>

        <View style={styles.tooltip}>
          <View style={styles.tooltipArrow} />
          <View style={styles.tooltipBody}>
            <Text style={styles.tooltipText}>
              Plan.B와 함께 새로운 여행을 시작해보세요!
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        style={[styles.startButton, { bottom: Math.max(insets.bottom + 24, 44) }]}
        onPress={() => navigation.replace("Login")}
      >
        <Text style={styles.startButtonText}>시작하기</Text>
      </TouchableOpacity>
      </View>
    </OnboardingSwipe>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#5A5A5A",
  },
  center: {
    alignItems: "center",
    paddingTop: 110,
  },
  logo: {
    color: "#050505",
    fontSize: 52,
    fontWeight: "900",
    letterSpacing: -1.5,
  },
  rocketCircle: {
    marginTop: 96,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#4968B5",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  rocket: {
    fontSize: 100,
    transform: [{ rotate: "-18deg" }],
  },
  tooltip: {
    marginTop: 48,
    alignItems: "center",
  },
  tooltipArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderBottomWidth: 18,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: BLUE,
    marginBottom: -1,
  },
  tooltipBody: {
    height: 48,
    minWidth: 292,
    borderRadius: 16,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 15,
  },
  tooltipText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
  },
  startButton: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 44,
    height: 64,
    borderRadius: 18,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: BLUE,
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  startButtonText: {
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "900",
  },
});
