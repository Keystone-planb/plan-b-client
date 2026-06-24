import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { getPlaceCategoryIcon } from "../../utils/placeCategoryIcon";
import {
  formatOpeningHoursText,
  formatTodayOpeningHoursText,
  getMoodLabel,
  getSpaceLabel,
  getTypeLabel,
} from "../../utils/recommendation/recommendationFormatters";
import RecommendationAiSummaryBox from "./RecommendationAiSummaryBox";
import RecommendationOpeningHours from "./RecommendationOpeningHours";
import RecommendationPlaceMainInfo from "./RecommendationPlaceMainInfo";
import RecommendationReviewDetailBox from "./RecommendationReviewDetailBox";
import RecommendationSelectButton from "./RecommendationSelectButton";
import RecommendationTagRow from "./RecommendationTagRow";

type PlaceLike = {
  placeId?: string | number;
  name?: string;
  category?: string;
  type?: string;
  mood?: string;
  space?: string;
  rating?: number;
  reviewCount?: number;
  userRatingsTotal?: number;
  address?: string;
};

type ExtraDetail = {
  loading?: boolean;
  aiSummary?: string;
  googleReview?: string;
  naverReview?: string;
  error?: string;
};

type Props = {
  place: PlaceLike;
  index: number;
  isExpanded: boolean;
  isHoursExpanded: boolean;
  isSelected: boolean;
  isSubmitting: boolean;
  isWeatherRecommendation: boolean;
  extraDetail?: ExtraDetail;
  onToggleHours: (placeId: string | number) => void;
  onSelect: (place: PlaceLike) => void;
  onRetryReview: (place: PlaceLike, placeId: string | number) => void;
  onToggleDetail: (place: PlaceLike, placeId: string | number) => void;
};

export default function RecommendationResultPlaceCard({
  place,
  index,
  isExpanded,
  isHoursExpanded,
  isSelected,
  isSubmitting,
  isWeatherRecommendation,
  extraDetail,
  onToggleHours,
  onSelect,
  onRetryReview,
  onToggleDetail,
}: Props) {
  const placeId = place.placeId ?? `place-${index}`;
  const displayAiSummary = extraDetail?.aiSummary ?? "";
  const displayNaverReview = extraDetail?.naverReview ?? "";
  const displayGoogleReview = extraDetail?.googleReview ?? "";
  const todayOpeningHoursText = formatTodayOpeningHoursText(
    (place as { openingHours?: string | null }).openingHours,
  );
  const fullOpeningHoursText = formatOpeningHoursText(
    (place as { openingHours?: string | null }).openingHours,
  );

  const reviewCount =
    typeof place.userRatingsTotal === "number"
      ? place.userRatingsTotal.toLocaleString()
      : typeof place.reviewCount === "number"
        ? place.reviewCount.toLocaleString()
        : "0";

  return (
    <View
      style={[
        styles.placeCard,
        isExpanded && styles.expandedPlaceCard,
        isSelected && styles.selectedCard,
      ]}
    >
      <RecommendationPlaceMainInfo
        iconSource={getPlaceCategoryIcon(place.category ?? place.type)}
        name={place.name || "장소 정보 없음"}
        ratingText={
          typeof place.rating === "number" ? place.rating.toFixed(2) : "0.00"
        }
        reviewCountText={reviewCount}
        address={place.address || "주소 정보 없음"}
      />

      <RecommendationTagRow
        tags={[
          getSpaceLabel(place.space),
          getTypeLabel(place.type),
          getMoodLabel(place.mood),
        ]}
      />

      <RecommendationOpeningHours
        placeId={placeId}
        todayText={todayOpeningHoursText}
        fullText={fullOpeningHoursText}
        isExpanded={isHoursExpanded}
        onToggle={() => onToggleHours(placeId)}
      />

      <RecommendationAiSummaryBox
        summary={displayAiSummary}
        isExpanded={isExpanded}
      />

      <RecommendationSelectButton
        isSelected={isSelected}
        isSubmitting={isSubmitting}
        isWeatherRecommendation={isWeatherRecommendation}
        onPress={() => onSelect(place)}
      />

      {isExpanded ? (
        <RecommendationReviewDetailBox
          loading={Boolean(extraDetail?.loading)}
          naverReview={displayNaverReview}
          googleReview={displayGoogleReview}
          onRetry={() => onRetryReview(place, placeId)}
        />
      ) : null}

      <TouchableOpacity
        style={styles.detailButton}
        activeOpacity={0.8}
        onPress={() => onToggleDetail(place, placeId)}
      >
        <Text style={styles.detailButtonText}>
          {isExpanded ? "리뷰 접기" : "AI 리뷰 요약 보기"}
        </Text>

        <Ionicons
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={16}
          color="#64748B"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  placeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#DCE5F2",
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 18,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 3,
  },

  expandedPlaceCard: {
    paddingBottom: 22,
    borderRadius: 22,
    borderColor: "#BFD7FF",
  },

  selectedCard: {
    borderColor: "#2158E8",
    backgroundColor: "#F8FBFF",
  },

  detailButton: {
    marginTop: 14,
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },

  detailButtonText: {
    color: "#64748B",
    fontSize: 16,
    fontWeight: "900",
  },
});
