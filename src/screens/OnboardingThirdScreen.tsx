// src/screens/OnboardingThirdScreen.tsx

import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import OnboardingProgressDots from "../components/onboarding/OnboardingProgressDots";
import OnboardingSkipButton from "../components/onboarding/OnboardingSkipButton";

type Props = {
  navigation: {
    navigate: (screen: string) => void;
    replace: (screen: string) => void;
  };
};

const BLUE = "#2F5BEA";
const TEXT = "#111827";
const MUTED = "#667085";
const BG = "#F6F8FC";
const BORDER = "#E4EAF3";

export default function OnboardingThirdScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <TouchableOpacity
      activeOpacity={1}
      style={styles.screen}
      onPress={() => navigation.replace("OnboardingFourth")}
    >
      <ResultBackground />
      <View style={styles.dim} />
        <OnboardingSkipButton topInset={insets.top} onPress={() => navigation.replace("Login")} />

      <View style={styles.tooltip} pointerEvents="none">
        <View style={styles.tooltipBody}>
          <Text style={styles.tooltipText}>일정의 변수를 빠르게 복구해드려요</Text>
        </View>
        <View style={styles.tooltipArrow} />
      </View>

      <View style={styles.focusCard} pointerEvents="none">
        <ResultCard />
      </View>
      <OnboardingProgressDots activeIndex={2} bottomInset={insets.bottom} />
    </TouchableOpacity>
  );
}

function ResultBackground() {
  return (
    <View style={styles.bg}>
      <View style={styles.header}>
        <Text style={styles.backIcon}>‹</Text>
        <Text style={styles.logo}>Plan.B</Text>
        <Text style={styles.headerSkip}>건너뛰기</Text>
      </View>

      <Text style={styles.pageTitle}>AI 대안 추천</Text>
      <Text style={styles.pageSub}>거리와 리뷰를 기반으로 추천된 top5예요</Text>

      <Text style={styles.sectionTitle}>기존 일정</Text>
      <View style={styles.originCard}>
        <View>
          <Text style={styles.originName}>강릉역</Text>
          <Text style={styles.originSub}>사직공원</Text>
          <Text style={styles.originDate}>◷ 2026.05.27 - 2026.05.30</Text>
        </View>
        <View style={styles.weatherBadge}>
          <Text style={styles.weatherText}>☔ 비예보</Text>
        </View>
      </View>

      <Text style={styles.recommendTitle}>추천 대안</Text>

      <View style={styles.backgroundCard}>
        <ResultCard />
      </View>
      <View style={[styles.backgroundCard, styles.backgroundCardDim]}>
        <ResultCard />
      </View>
    </View>
  );
}

function ResultCard() {
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>🎡</Text>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.nameRow}>
            <Text style={styles.placeName}>에버랜드</Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>아웃도어</Text>
            </View>
          </View>

          <Text style={styles.rating}>⭐ 4.58 (2,239)</Text>

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={12} color="#8A98AA" />
            <Text style={styles.locationText} numberOfLines={1}>
              경기도 용인시 처인구 포곡읍 에버랜드로 199
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.aiReviewBox}>
        <View style={styles.reviewIcon}>
          <Text style={styles.reviewIconText}>📊</Text>
        </View>
        <Text style={styles.reviewText} numberOfLines={2}>
          아이들과 함께 가기 너무 좋아요! 구경거리도 많아서 좋아요
        </Text>
        <View style={styles.aiBadge}>
          <Text style={styles.aiBadgeText}>AI</Text>
        </View>
      </View>

      <View style={styles.detailButton}>
        <Text style={styles.detailText}>자세히</Text>
        <Ionicons name="chevron-down" size={13} color="#667085" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BG,
  },
  bg: {
    flex: 1,
    backgroundColor: BG,
    paddingHorizontal: 20,
  },
  header: {
    marginTop: 56,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    position: "absolute",
    left: 0,
    top: -2,
    fontSize: 34,
    fontWeight: "500",
    color: "#667085",
  },
  logo: {
    fontSize: 27,
    fontWeight: "900",
    color: "#111827",
  },
  headerSkip: {
    position: "absolute",
    right: 0,
    top: 9,
    fontSize: 15,
    fontWeight: "900",
    color: TEXT,
  },
  pageTitle: {
    marginTop: 24,
    fontSize: 17,
    fontWeight: "900",
    color: TEXT,
  },
  pageSub: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: "700",
    color: "#98A2B3",
  },
  sectionTitle: {
    marginTop: 26,
    fontSize: 14,
    fontWeight: "900",
    color: TEXT,
  },
  originCard: {
    marginTop: 10,
    minHeight: 84,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  originName: {
    fontSize: 14,
    fontWeight: "900",
    color: TEXT,
  },
  originSub: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: "700",
    color: MUTED,
  },
  originDate: {
    marginTop: 5,
    fontSize: 10,
    fontWeight: "700",
    color: "#667085",
  },
  weatherBadge: {
    height: 30,
    borderRadius: 15,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 11,
  },
  weatherText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },
  recommendTitle: {
    marginTop: 22,
    marginBottom: 10,
    fontSize: 14,
    fontWeight: "900",
    color: TEXT,
  },
  backgroundCard: {
    opacity: 0.45,
    marginBottom: 8,
  },
  backgroundCardDim: {
    opacity: 0.28,
  },

  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.62)",
  },
  tooltip: {
    position: "absolute",
    top: 287,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 100,
  },
  tooltipBody: {
    minWidth: 292,
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  tooltipText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
    lineHeight: 21,
  },
  tooltipArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 16,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: BLUE,
    marginTop: -1,
  },
  focusCard: {
    position: "absolute",
    top: 374,
    left: 20,
    right: 20,
    zIndex: 95,
  },

  card: {
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: BLUE,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    shadowColor: "#000000",
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  cardTop: {
    flexDirection: "row",
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#FFD9F4",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 22,
  },
  cardContent: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  placeName: {
    fontSize: 15,
    fontWeight: "900",
    color: TEXT,
  },
  categoryBadge: {
    height: 18,
    borderRadius: 9,
    backgroundColor: "#F2F4F7",
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryText: {
    fontSize: 8,
    fontWeight: "900",
    color: "#667085",
  },
  rating: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "900",
    color: "#344054",
  },
  locationRow: {
    marginTop: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  locationText: {
    flex: 1,
    fontSize: 10,
    fontWeight: "700",
    color: "#475467",
  },
  aiReviewBox: {
    position: "relative",
    marginTop: 15,
    marginLeft: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BFD7FF",
    backgroundColor: "#F5FAFF",
    minHeight: 44,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  reviewIcon: {
    width: 18,
    alignItems: "center",
  },
  reviewIconText: {
    fontSize: 12,
  },
  reviewText: {
    flex: 1,
    color: "#1D4ED8",
    fontSize: 10,
    fontWeight: "900",
    lineHeight: 15,
  },
  aiBadge: {
    position: "absolute",
    top: -11,
    right: -11,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#5B35D5",
    alignItems: "center",
    justifyContent: "center",
  },
  aiBadgeText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "900",
  },
  detailButton: {
    marginTop: 12,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#F7F9FC",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 4,
  },
  detailText: {
    color: "#667085",
    fontSize: 11,
    fontWeight: "900",
  },

});
