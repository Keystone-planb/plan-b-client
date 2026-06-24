import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import GoogleReviewIcon from "../../assets/google-review.svg";
import NaverIcon from "../../assets/naver.png";

type Props = {
  loading?: boolean;
  naverReview?: string;
  googleReview?: string;
  onRetry: () => void;
};

export default function RecommendationReviewDetailBox({
  loading = false,
  naverReview,
  googleReview,
  onRetry,
}: Props) {
  return (
    <View style={styles.detailBox}>
      <View style={styles.sourceList}>
        <View style={styles.sourceCard}>
          <View style={[styles.sourceIconBox, styles.naverBox]}>
            <Image
              source={NaverIcon}
              style={styles.platformLogo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.sourceText}>
            {loading
              ? "네이버 리뷰 요약을 불러오는 중이에요."
              : naverReview || "서버에서 네이버 리뷰 요약을 제공하지 않았습니다."}
          </Text>
        </View>

        <View style={styles.sourceCard}>
          <View style={[styles.sourceIconBox, styles.googleBox]}>
            <GoogleReviewIcon width={18} height={18} />
          </View>

          <Text style={styles.sourceText}>
            {loading
              ? "구글 리뷰 요약을 불러오는 중이에요."
              : googleReview || "서버에서 구글 리뷰 요약을 제공하지 않았습니다."}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.retryReviewButton}
        activeOpacity={0.82}
        onPress={onRetry}
        disabled={loading}
      >
        <Ionicons
          name="refresh-outline"
          size={18}
          color={loading ? "#94A3B8" : "#2158E8"}
        />

        <Text
          style={[
            styles.retryReviewButtonText,
            loading && styles.retryReviewButtonTextDisabled,
          ]}
        >
          리뷰 다시 분석
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  detailBox: {
    marginTop: 12,
    position: "relative",
  },

  sourceList: {
    gap: 12,
  },

  sourceCard: {
    minHeight: 58,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DDE5F0",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  sourceIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },

  naverBox: {
    backgroundColor: "#FFFFFF",
  },

  googleBox: {
    backgroundColor: "#FFFFFF",
  },

  platformLogo: {
    width: 30,
    height: 30,
  },

  sourceText: {
    flex: 1,
    color: "#8A97AA",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
  },

  retryReviewButton: {
    marginTop: 12,
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: "#F8FBFF",
    borderWidth: 1,
    borderColor: "#C7D5FF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  retryReviewButtonText: {
    color: "#2158E8",
    fontSize: 15,
    fontWeight: "900",
  },

  retryReviewButtonTextDisabled: {
    color: "#94A3B8",
  },
});
