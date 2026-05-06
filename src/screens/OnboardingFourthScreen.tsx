import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";

const OnboardingFourthImage = require("../assets/onboarding-fourth.png");

type Props = {
  navigation: any;
};

export default function OnboardingFourthScreen({ navigation }: Props) {
  const handleSkip = async () => {
    await AsyncStorage.setItem("onboarding_seen", "true");
    navigation.reset({
      index: 0,
      routes: [{ name: "Login" }],
    });
  };

  const handleStart = async () => {
    await AsyncStorage.setItem("onboarding_seen", "true");
    navigation.reset({
      index: 0,
      routes: [{ name: "Login" }],
    });
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
          <View style={styles.illustrationWrapper}>
            <Image
              source={OnboardingFourthImage}
              style={styles.illustrationImage}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>
            이제 더 스마트한 여행을{"\n"}시작해보세요
          </Text>

          <Text style={styles.description}>
            Plan.B와 함께라면 여행 중 어떤 상황도{"\n"}더 유연하게 대처할 수
            있어요
          </Text>
        </View>

        <View style={styles.footerSection}>
          <View style={styles.pagination}>
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.activeDotNoMargin} />
          </View>

          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleStart}
            activeOpacity={0.85}
          >
            <Text style={styles.nextButtonText}>시작하기</Text>
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
    marginBottom: 54,
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
    marginBottom: 78,
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
    marginBottom: 84,
  },

  illustrationWrapper: {
    width: 180,
    height: 180,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 42,
  },

  illustrationImage: {
    width: 180,
    height: 180,
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

  activeDotNoMargin: {
    width: 24,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#2158E8",
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#E1E7EF",
    marginRight: 8,
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
