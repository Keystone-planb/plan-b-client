import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";

import OnboardingSecondSvg from "../assets/onboarding-second.svg";

type Props = {
  navigation: any;
};

export default function OnboardingSecondScreen({ navigation }: Props) {
  const handleSkip = async () => {
    await AsyncStorage.setItem("onboarding_seen", "true");
    navigation.replace("Login");
  };

  const handleNext = async () => {
    navigation.navigate("OnboardingThird");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.8}
          >
            <Text style={styles.skipText}>건너뛰기</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.logoSection}>
          <Text style={styles.logoText}>Plan.B</Text>
          <Text style={styles.logoSubText}>더 스마트한 여행의 시작</Text>
        </View>

        <View style={styles.centerSection}>
          <View style={styles.illustrationContainer}>
            <OnboardingSecondSvg width={108} height={108} />
          </View>

          <Text style={styles.title}>
            예상치 못한 상황에도{"\n"}대안을 찾을 수 있어요
          </Text>

          <Text style={styles.description}>
            여행 중 문제가 생겨도{"\n"}Plan.B가 새로운 선택지를 제안해드려요
          </Text>
        </View>

        <View style={styles.footerSection}>
          <View style={styles.pagination}>
            <View style={styles.dot} />
            <View style={styles.activeDot} />
            <View style={styles.dot} />
            <View style={styles.dotNoMargin} />
          </View>

          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
            activeOpacity={0.85}
          >
            <Text style={styles.nextButtonText}>다음</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  container: {
    flex: 1,
    backgroundColor: "#F7F9FB",
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 21,
    paddingTop: 18,
    paddingBottom: 48,
  },

  headerRow: {
    alignItems: "flex-end",
    marginBottom: 40,
  },

  skipButton: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },

  skipText: {
    color: "#8C9BB1",
    fontSize: 16,
    fontWeight: "700",
  },

  logoSection: {
    alignItems: "center",
    marginBottom: 30,
  },

  logoText: {
    color: "#1C2534",
    fontSize: 50,
    fontWeight: "900",
    lineHeight: 58,
    marginBottom: 8,
  },

  logoSubText: {
    color: "#627187",
    fontSize: 15,
    fontWeight: "500",
  },

  centerSection: {
    alignItems: "center",
    marginBottom: 48,
  },

  illustrationContainer: {
    width: 214,
    height: 214,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },

  title: {
    color: "#000000",
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 40,
    marginBottom: 24,
  },

  description: {
    color: "#627187",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 24,
  },

  footerSection: {
    marginTop: "auto",
  },

  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
  },

  activeDot: {
    width: 24,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#2158E8",
    marginRight: 8,
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#E1E7EF",
    marginRight: 8,
  },

  dotNoMargin: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#E1E7EF",
  },

  nextButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2158E8",
    borderRadius: 14,
    minHeight: 56,
    shadowColor: "#2158E8",
    shadowOpacity: 0.3,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowRadius: 10,
    elevation: 10,
  },

  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
