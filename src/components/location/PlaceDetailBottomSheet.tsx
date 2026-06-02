// src/components/location/PlaceDetailBottomSheet.tsx

import React from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import GoogleLogo from "../../assets/google.svg";

const NAVER_LOGO = require("../../assets/naver.png");
const INSTAGRAM_LOGO = require("../../assets/instagram.png");

const REVIEW_TEXT_MAX_LENGTH = 80;

type DetailReview = {
  id: string;
  platform: string;
  logoType?: string;
  text: string;
};

type Props = {
  visible: boolean;
  place: any | null;
  address: string;
  rating?: number;
  tags: string[];
  formattedOpeningHours: string;
  businessHoursExpanded: boolean;
  isLoading: boolean;
  reanalyzeDisabled: boolean;
  reanalyzeSuccessMessage?: string;
  aiSummary: string;
  reviews: DetailReview[];
  hasAnyRealDetailContent: boolean;
  onClose: () => void;
  onToggleBusinessHours: () => void;
  onReanalyze: () => void;
};

const truncateText = (text: string, maxLength = REVIEW_TEXT_MAX_LENGTH) => {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

const ReviewPlatformLogo = ({ logoType }: { logoType?: string }) => {
  if (logoType === "google") {
    return <GoogleLogo width={22} height={22} />;
  }

  if (logoType === "naver") {
    return <Image source={NAVER_LOGO} style={styles.reviewPlatformLogoImage} />;
  }

  if (logoType === "instagram") {
    return (
      <Image source={INSTAGRAM_LOGO} style={styles.reviewPlatformLogoImage} />
    );
  }

  return null;
};

export default function PlaceDetailBottomSheet({
  visible,
  place,
  address,
  rating,
  tags,
  formattedOpeningHours,
  businessHoursExpanded,
  isLoading,
  reanalyzeDisabled,
  reanalyzeSuccessMessage,
  aiSummary,
  reviews,
  hasAnyRealDetailContent,
  onClose,
  onToggleBusinessHours,
  onReanalyze,
}: Props) {
  const isNoReviewNotice =
    reanalyzeSuccessMessage?.includes("표시 가능한 리뷰를 찾지 못했습니다") ||
    reanalyzeSuccessMessage?.includes("표시할 리뷰가 아직 없습니다.");

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.detailModalBackdrop}>
        <View style={styles.detailModalCard}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.detailModalScrollContent}
          >
            <View style={styles.detailHeaderRow}>
              <View style={styles.detailIconCircle}>
                <Text style={styles.detailIconEmoji}>🎡</Text>
              </View>

              <View style={styles.detailTitleArea}>
                <Text style={styles.detailTitle}>
                  {place?.name ?? "장소 상세 정보"}
                </Text>

                <Text style={styles.detailAddress}>{address}</Text>

                <View style={styles.detailMetaRow}>
                  <Ionicons name="star" size={14} color="#FFD600" />

                  <Text style={styles.detailMetaText}>
                    {typeof rating === "number" ?
                      rating.toFixed(1)
                    : "평점 정보 없음"}
                  </Text>

                  <Text style={styles.detailMetaDot}>·</Text>

                  <Ionicons name="time-outline" size={15} color="#8DC7FF" />

                  <Text style={styles.detailMetaText}>
                    {formattedOpeningHours ?
                      "영업시간 보기"
                    : "운영 시간 정보 없음"}
                  </Text>
                </View>

                {tags.length > 0 ?
                  <View style={styles.detailTagRow}>
                    {tags.map((tag) => (
                      <View key={tag} style={styles.detailTagPill}>
                        <Text style={styles.detailTagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                : null}
              </View>
            </View>

            {isLoading ?
              <View style={styles.detailLoadingBox}>
                <ActivityIndicator size="large" color="#2158E8" />
                <Text style={styles.detailLoadingText}>
                  리뷰 불러오는 중...
                </Text>
              </View>
            : <>
                {formattedOpeningHours ?
                  <View style={styles.businessHoursCard}>
                    <TouchableOpacity
                      style={styles.businessHoursHeader}
                      activeOpacity={0.75}
                      onPress={onToggleBusinessHours}
                    >
                      <View style={styles.businessHoursTitleRow}>
                        <Ionicons
                          name="time-outline"
                          size={17}
                          color="#2158E8"
                        />

                        <Text style={styles.businessHoursTitle}>영업시간</Text>
                      </View>

                      <Ionicons
                        name={
                          businessHoursExpanded ? "chevron-up" : (
                            "chevron-down"
                          )
                        }
                        size={18}
                        color="#64748B"
                      />
                    </TouchableOpacity>

                    <Text
                      style={styles.businessHoursText}
                      numberOfLines={businessHoursExpanded ? undefined : 2}
                    >
                      {formattedOpeningHours}
                    </Text>

                    {!businessHoursExpanded ?
                      <Text style={styles.businessHoursHint}>
                        눌러서 전체 영업시간 보기
                      </Text>
                    : null}
                  </View>
                : null}

                <TouchableOpacity
                  style={styles.reanalyzeButton}
                  activeOpacity={0.8}
                  disabled={reanalyzeDisabled}
                  onPress={onReanalyze}
                >
                  {reanalyzeDisabled ? (
                    <ActivityIndicator size="small" color="#2158E8" />
                  ) : (
                    <Ionicons name="refresh-outline" size={16} color="#2158E8" />
                  )}
                  <Text style={styles.reanalyzeButtonText}>
                    {reanalyzeDisabled ? "분석 중..." : "재분석 요청"}
                  </Text>
                </TouchableOpacity>

                {reanalyzeSuccessMessage ? (
                  <View
                    style={[
                      styles.reanalyzeSuccessBox,
                      isNoReviewNotice && styles.reanalyzeWarningBox,
                    ]}
                  >
                    <Ionicons
                      name={isNoReviewNotice ? "alert-circle" : "checkmark-circle"}
                      size={15}
                      color={isNoReviewNotice ? "#DC2626" : "#2563EB"}
                    />
                    <Text
                      style={[
                        styles.reanalyzeSuccessText,
                        isNoReviewNotice && styles.reanalyzeWarningText,
                      ]}
                    >
                      {reanalyzeSuccessMessage}
                    </Text>
                  </View>
                ) : null}

                {aiSummary ?
                  <View style={styles.aiSummaryCard}>
                    <Text style={styles.aiSummaryText}>📊 {aiSummary}</Text>

                    <View style={styles.aiCircleBadge}>
                      <Text style={styles.aiCircleText}>AI</Text>
                    </View>
                  </View>
                : null}

                {reviews.length > 0 ?
                  <View style={styles.reviewSection}>
                    <View style={styles.reviewSectionHeader}>
                      <Text style={styles.reviewSectionTitle}>
                        플랫폼별 리뷰
                      </Text>
                      <Text style={styles.reviewSectionSubtitle}>
                        Google · Naver
                      </Text>
                    </View>

                    <View style={styles.reviewList}>
                      {reviews.map((review) => (
                        <View key={review.id} style={styles.reviewCard}>
                          <View style={styles.reviewIconCircle}>
                            <ReviewPlatformLogo logoType={review.logoType} />
                          </View>

                          <View style={styles.platformTextBox}>
                            <View style={styles.reviewMetaRow}>
                              <Text style={styles.reviewRatingText}>
                                {review.platform}
                              </Text>
                            </View>

                            <Text style={styles.platformText}>
                              {truncateText(review.text)}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                : null}

                {!hasAnyRealDetailContent ?
                  <View style={styles.emptyDetailBox}>
                    <Ionicons
                      name="information-circle-outline"
                      size={24}
                      color="#94A3B8"
                    />
                    <Text style={styles.emptyDetailText}>
                      표시할 상세 정보가 없습니다.
                    </Text>
                  </View>
                : null}
              </>
            }

            <TouchableOpacity
              style={styles.compactButton}
              activeOpacity={0.85}
              onPress={onClose}
            >
              <Text style={styles.compactButtonText}>간략히</Text>
              <Ionicons name="chevron-up" size={18} color="#7A889B" />
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  detailModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.24)",
    justifyContent: "center",
    paddingHorizontal: 26,
  },
  detailModalCard: {
    maxHeight: "78%",
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 14,
    borderWidth: 1,
    borderColor: "#DDE6F1",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 14,
  },
  detailModalScrollContent: { paddingBottom: 2 },
  detailHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  detailIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFD0F7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },
  detailIconEmoji: { fontSize: 26 },
  detailTitleArea: { flex: 1, paddingTop: 1 },
  detailTitle: {
    color: "#000000",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  detailAddress: {
    color: "#A7B2C3",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 9,
  },
  detailMetaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailMetaText: {
    flexShrink: 1,
    color: "#111827",
    fontSize: 13,
    fontWeight: "900",
    marginLeft: 4,
  },
  detailMetaDot: {
    color: "#A7B2C3",
    fontSize: 13,
    fontWeight: "900",
    marginHorizontal: 7,
  },
  detailTagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
    marginBottom: 18,
  },
  detailTagPill: {
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  detailTagText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "800",
  },
  detailLoadingBox: {
    minHeight: 180,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  detailLoadingText: {
    marginTop: 12,
    color: "#617087",
    fontSize: 14,
    fontWeight: "900",
  },
  businessHoursCard: {
    marginTop: 16,
    marginBottom: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 18,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  businessHoursHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 10,
  },
  businessHoursTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
  },
  businessHoursTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "900",
    color: "#1E293B",
  },
  businessHoursText: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "700",
    color: "#64748B",
  },
  businessHoursHint: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "800",
    color: "#94A3B8",
  },
  reanalyzeButton: {
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CFE0FF",
    backgroundColor: "#F8FBFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 14,
  },
  reanalyzeButtonText: {
    color: "#2158E8",
    fontSize: 13,
    fontWeight: "800",
  },
  reanalyzeSuccessBox: {
    minHeight: 34,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 14,
    paddingHorizontal: 10,
  },
  reanalyzeSuccessText: {
    color: "#2563EB",
    fontSize: 12,
    fontWeight: "900",
  },
  reanalyzeWarningBox: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  reanalyzeWarningText: {
    color: "#DC2626",
  },
  aiSummaryCard: {
    position: "relative",
    minHeight: 78,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#C7DCFF",
    backgroundColor: "#EEF5FF",
    paddingLeft: 15,
    paddingRight: 52,
    paddingVertical: 13,
    justifyContent: "center",
    marginBottom: 11,
    overflow: "visible",
  },
  aiSummaryText: {
    color: "#2F6BFF",
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 21,
  },
  aiCircleBadge: {
    position: "absolute",
    right: 12,
    top: 12,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#2158E8",
    alignItems: "center",
    justifyContent: "center",
  },
  aiCircleText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },
  reviewSection: { marginBottom: 2 },
  reviewSectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 9,
  },
  reviewSectionTitle: {
    color: "#1E293B",
    fontSize: 13,
    fontWeight: "900",
  },
  reviewSectionSubtitle: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "800",
  },
  reviewList: {
    gap: 9,
    marginBottom: 12,
  },
  reviewCard: {
    minHeight: 72,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#DDE6F1",
    paddingHorizontal: 13,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  reviewIconCircle: {
    width: 25,
    height: 25,
    borderRadius: 12.5,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  platformTextBox: {
    flex: 1,
    marginLeft: 9,
  },
  reviewMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 3,
  },
  reviewRatingText: {
    color: "#1E293B",
    fontSize: 11,
    fontWeight: "900",
  },
  platformText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
  },
  reviewPlatformLogoImage: {
    width: 22,
    height: 22,
    resizeMode: "contain",
  },
  emptyDetailBox: {
    minHeight: 96,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    gap: 8,
  },
  emptyDetailText: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "800",
  },
  compactButton: {
    alignSelf: "center",
    width: "92%",
    height: 46,
    borderRadius: 13,
    backgroundColor: "#F4F7FA",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
    marginTop: 1,
  },
  compactButtonText: {
    color: "#8A97A8",
    fontSize: 17,
    fontWeight: "900",
  },
});
