// src/screens/onboarding/OnboardingFirstScreen.tsx

import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import OnboardingProgressDots from "../../components/onboarding/OnboardingProgressDots";
import OnboardingSkipButton from "../../components/onboarding/OnboardingSkipButton";
import OnboardingSwipe from "../../components/onboarding/OnboardingSwipe";
import MainScreen from "../home/MainScreen";

type Props = {
  navigation: {
    navigate: (screen: string) => void;
    replace: (screen: string) => void;
  };
  route?: unknown;
};

const BLUE = "#2F5BEA";
const TEXT = "#111827";
const MUTED = "#667085";

export default function OnboardingFirstScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <OnboardingSwipe onSwipeLeft={() => navigation.replace("OnboardingSecond")}>
      <View style={styles.container}>
      <View style={styles.backgroundScreen} pointerEvents="none">
        <MainScreen navigation={navigation as never} route={{} as never} />
      </View>

      <View style={styles.dimLayer} />

      <TouchableOpacity
        activeOpacity={1}
        style={styles.touchLayer}
        onPress={() => navigation.replace("OnboardingSecond")}
      >
        <OnboardingSkipButton topInset={insets.top} onPress={() => navigation.replace("Login")} />

        <FocusedWeatherModal />

        <View style={styles.tooltip}>
          <View style={styles.tooltipArrow} />
          <View style={styles.tooltipBody}>
            <Text style={styles.tooltipText}>
              날씨에 영향 받는 일정을 미리 알려드려요
            </Text>
          </View>
        </View>

        <OnboardingProgressDots activeIndex={0} bottomInset={insets.bottom} />

      </TouchableOpacity>
      </View>
    </OnboardingSwipe>
  );
}

function FocusedWeatherModal() {
  return (
    <View style={styles.weatherModal}>
      <View style={styles.modalHeader}>
        <View style={styles.alertCircle}>
          <Text style={styles.alertText}>!</Text>
        </View>

        <Text style={styles.modalTitle}>날씨정보</Text>
        <Text style={styles.closeText}>×</Text>
      </View>

      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>영향받는 일정</Text>

      <View style={styles.placeCard}>
        <View>
          <Text style={styles.placeName}>강릉역</Text>
          <Text style={styles.placeSub}>강원도 강릉시</Text>
          <Text style={styles.timeText}>12:00 - 14:00</Text>
        </View>

        <View style={styles.weatherBadge}>
          <Text style={styles.weatherBadgeText}>☔ 비 예보</Text>
        </View>
      </View>

      <View style={styles.rainCard}>
        <Text style={styles.rainText}>
          강수 확률 <Text style={styles.bold}>85%</Text> · 10:00~12:00
        </Text>
      </View>

      <View style={styles.actionButton}>
        <Text style={styles.actionText}>대안 추천받기 〉</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  backgroundScreen: {
    ...StyleSheet.absoluteFillObject,
  },
  dimLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.66)",
  },
  touchLayer: {
    flex: 1,
  },


  weatherModal: {
    position: "absolute",
    left: 12,
    right: 12,
    top: 235,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 26,
    paddingTop: 24,
    paddingBottom: 24,
    zIndex: 20,
  },
  modalHeader: {
    height: 36,
    flexDirection: "row",
    alignItems: "center",
  },
  alertCircle: {
    width: 27,
    height: 27,
    borderRadius: 14,
    borderWidth: 2.4,
    borderColor: "#FF1F1F",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  alertText: {
    color: "#FF1F1F",
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 20,
  },
  modalTitle: {
    flex: 1,
    color: TEXT,
    fontSize: 23,
    fontWeight: "900",
  },
  closeText: {
    color: "#667085",
    fontSize: 31,
    lineHeight: 32,
  },
  divider: {
    height: 1,
    backgroundColor: "#E4E7EC",
    marginTop: 18,
    marginBottom: 18,
  },
  sectionTitle: {
    color: TEXT,
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 13,
  },

  placeCard: {
    height: 96,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E1E7EF",
    backgroundColor: "#F7F9FB",
    paddingHorizontal: 21,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  placeName: {
    color: "#252D3C",
    fontSize: 19,
    fontWeight: "900",
  },
  placeSub: {
    color: "#627187",
    fontSize: 13,
    fontWeight: "400",
    marginTop: 4,
  },
  timeText: {
    color: "#627187",
    fontSize: 15,
    fontWeight: "400",
    marginTop: 6,
  },
  weatherBadge: {
    height: 40,
    minWidth: 94,
    borderRadius: 20,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 11,
  },
  weatherBadgeText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  rainCard: {
    marginTop: 15,
    height: 60,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E1E7EF",
    backgroundColor: "#F7F9FB",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  rainText: {
    color: "#627187",
    fontSize: 15,
    fontWeight: "500",
  },
  bold: {
    color: "#252D3C",
    fontWeight: "900",
  },
  actionButton: {
    marginTop: 16,
    height: 58,
    borderRadius: 24,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },

  tooltip: {
    position: "absolute",
    top: 645,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 25,
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
    minWidth: 292,
    height: 48,
    borderRadius: 16,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 15,
  },
  tooltipText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center",
  },

  touchText: {
    position: "absolute",
    bottom: 112,
    left: 0,
    right: 0,
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.55)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    zIndex: 80,
  },
});
