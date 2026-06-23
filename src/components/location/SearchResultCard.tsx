import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  place: any;
  isPreview: boolean;
  isSelected: boolean;
  isDetailLoading: boolean;
  isReviewLoading: boolean;

  onDetailPress: () => void;
  onSelectPress: () => void;
  onCancelReviewLoading?: () => void;
  onCardPress?: () => void;
  isFavorite?: boolean;
  isFavoriteLoading?: boolean;
  onFavoritePress?: () => void;
};

export default function SearchResultCard({
  place,
  isPreview,
  isSelected,
  isDetailLoading,
  isReviewLoading,
  onDetailPress,
  onSelectPress,
  onCancelReviewLoading,
  onCardPress,
  isFavorite = false,
  isFavoriteLoading = false,
  onFavoritePress,
}: Props) {
  if (isPreview) {
    return (
      <View style={[styles.placeCard, styles.previewCard]}>
        <View style={styles.previewIconCircle}>
          <Ionicons name="search-outline" size={24} color="#2158E8" />
        </View>

        <Text style={styles.previewTitle}>어디로 떠나시나요?</Text>

        <Text style={styles.previewDescription}>
          맛집, 관광지, 카페, 숙소를 검색해보세요.
        </Text>

        <Text style={styles.previewHintText}>
          지도를 움직이거나 검색어를 입력해보세요.
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.placeCard,
        isReviewLoading && styles.reviewLoadingPlaceCard,
        isSelected && styles.selectedPlaceCard,
      ]}
    >
      {onFavoritePress ? (
        <TouchableOpacity
          style={styles.favoriteButton}
          activeOpacity={0.75}
          hitSlop={{
            top: 10,
            bottom: 10,
            left: 10,
            right: 10,
          }}
          accessibilityRole="button"
          accessibilityLabel={
            isFavorite
              ? "즐겨찾기에서 삭제"
              : "즐겨찾기에 추가"
          }
          disabled={isFavoriteLoading}
          onPress={onFavoritePress}
        >
          {isFavoriteLoading ? (
            <ActivityIndicator
              size="small"
              color="#2F66F3"
            />
          ) : (
            <Ionicons
              name={
                isFavorite
                  ? "heart"
                  : "heart-outline"
              }
              size={24}
              color="#2F66F3"
            />
          )}
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity
        activeOpacity={0.7}
        disabled={!onCardPress}
        onPress={onCardPress}
      >
        <View style={styles.resultHeaderRow}>
          <View style={styles.resultIconCircle}>
            <Ionicons name="location" size={20} color="#2158E8" />
          </View>

          <View style={styles.resultTitleArea}>
            <Text style={styles.placeName}>{place.name}</Text>

            <View style={styles.addressRow}>
              <Ionicons
                name="location-outline"
                size={14}
                color="#8A9BB2"
              />

              <Text
                style={styles.placeAddress}
                numberOfLines={1}
              >
                {place.address}
              </Text>
            </View>

            {typeof place.rating === "number" ? (
              <View style={styles.ratingRow}>
                <Ionicons
                  name="star"
                  size={13}
                  color="#FFD600"
                />

                <Text style={styles.ratingText}>
                  {place.rating.toFixed(2)}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.resultActionRow}>
        <TouchableOpacity
          style={styles.detailButton}
          activeOpacity={0.8}
          disabled={isReviewLoading}
          onPress={onDetailPress}
        >
          {isReviewLoading ? (
            <ActivityIndicator size="small" color="#2158E8" />
          ) : (
            <>
              <Ionicons name="information-circle-outline" size={16} color="#2158E8" />
              <Text style={styles.detailButtonText}>
                상세 보기
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.selectPlaceButton,
            isSelected && styles.selectPlaceButtonActive,
          ]}
          activeOpacity={0.85}
          disabled={isDetailLoading}
          onPress={onSelectPress}
        >
        {isDetailLoading ? (
          <ActivityIndicator
            size="small"
            color={isSelected ? "#FFFFFF" : "#2158E8"}
          />
        ) : (
          <Text
            style={[
              styles.selectPlaceButtonText,
              isSelected &&
                styles.selectPlaceButtonTextActive,
            ]}
          >
            {isSelected ? "선택 완료" : "이 장소 선택"}
          </Text>
        )}
        </TouchableOpacity>
      </View>

      {isReviewLoading && (
        <View style={styles.reviewLoadingPanel}>
          <ActivityIndicator size="large" color="#2158E8" />

          <Text style={styles.reviewLoadingTitle}>
            리뷰 분석 중
          </Text>

          <Text style={styles.reviewLoadingDescription}>
            최초 조회 시 최대 1분 정도 소요될 수 있어요.
          </Text>

          <TouchableOpacity
            style={styles.reviewLoadingCancelButton}
            activeOpacity={0.8}
            onPress={onCancelReviewLoading}
          >
            <Text style={styles.reviewLoadingCancelText}>취소</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  placeCard: {
    position: "relative",
    minHeight: 154,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DCE5F1",
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 18,
    marginBottom: 12,
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  },
  reviewLoadingPlaceCard: {
    minHeight: 360,
  },
  selectedPlaceCard: {
    borderColor: "#2158E8",
    backgroundColor: "#F8FBFF",
  },
  resultHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 13,
  },
  resultIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#EEF5FF",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  resultTitleArea: {
    flex: 1,
    minWidth: 0,
    paddingRight: 36,
  },

  favoriteButton: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
  },
  addressRow: {
    marginTop: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  resultActionRow: {
    marginTop: 16,
    flexDirection: "row",
    gap: 10,
  },
  previewCard: {
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 20,
  },
  previewIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#EEF5FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  previewTitle: {
    color: "#111827",
    fontSize: 21,
    fontWeight: "900",
    textAlign: "center",
  },
  previewDescription: {
    marginTop: 7,
    color: "#64748B",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
    textAlign: "center",
  },
  previewHintText: {
    marginTop: 12,
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
    textAlign: "center",
  },
  previewExampleTitle: {
    alignSelf: "flex-start",
    marginTop: 20,
    marginBottom: 9,
    color: "#111827",
    fontSize: 13,
    fontWeight: "900",
  },
  previewChipRow: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  previewChip: {
    height: 34,
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  previewChipText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "800",
  },
  previewMapTip: {
    width: "100%",
    marginTop: 18,
    borderRadius: 16,
    backgroundColor: "#F8FBFF",
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  previewMapTipTextArea: {
    flex: 1,
  },
  previewMapTipTitle: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "900",
  },
  previewMapTipText: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
  },
  placeName: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "900",
  },
  placeAddress: {
    flex: 1,
    color: "#8A9BB2",
    fontSize: 13,
    fontWeight: "800",
  },
  ratingRow: {
    marginTop: 9,
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    marginLeft: 5,
    color: "#111827",
    fontSize: 13,
    fontWeight: "800",
  },
  detailButton: {
    flex: 1,
    height: 44,
    borderRadius: 13,
    backgroundColor: "#F8FBFF",
    borderWidth: 1,
    borderColor: "#CFE3FF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  disabledDetailButton: {
    opacity: 0.65,
  },
  detailButtonText: {
    color: "#2158E8",
    fontSize: 13,
    fontWeight: "900",
  },
  selectPlaceButton: {
    flex: 1,
    height: 44,
    borderRadius: 13,
    backgroundColor: "#2158E8",
    borderWidth: 1,
    borderColor: "#2158E8",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2158E8",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  selectPlaceButtonActive: {
    backgroundColor: "#2158E8",
    borderColor: "#2158E8",
    shadowOpacity: 0.18,
    elevation: 4,
  },
  selectPlaceButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
  selectPlaceButtonTextActive: {
    color: "#FFFFFF",
  },
  reviewLoadingPanel: {
    minHeight: 150,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    marginBottom: 12,
  },
  reviewLoadingText: {
    marginTop: 12,
    color: "#617087",
    fontSize: 15,
    fontWeight: "900",
  },
  reviewLoadingTitle: {
    marginTop: 16,
    color: "#475569",
    fontSize: 24,
    fontWeight: "900",
  },
  reviewLoadingDescription: {
    marginTop: 10,
    color: "#94A3B8",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 32,
  },
  reviewLoadingCancelButton: {
    marginTop: 14,
    minWidth: 116,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  reviewLoadingCancelText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "900",
  },
  reviewProgressTrack: {
    width: "78%",
    height: 5,
    borderRadius: 999,
    backgroundColor: "#E2E8F0",
    marginTop: 24,
    overflow: "hidden",
  },
  reviewProgressFill: {
    width: "74%",
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#2158E8",
  },
});
