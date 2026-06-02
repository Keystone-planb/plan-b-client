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
};

export default function SearchResultCard({
  place,
  isPreview,
  isSelected,
  isDetailLoading,
  isReviewLoading,
  onDetailPress,
  onSelectPress,
}: Props) {
  return (
    <View
      style={[
        styles.placeCard,
        isReviewLoading && styles.reviewLoadingPlaceCard,
        isSelected && styles.selectedPlaceCard,
      ]}
    >
      <Text style={styles.placeName}>{place.name}</Text>

      <Text style={styles.placeAddress}>{place.address}</Text>

      {!isPreview && typeof place.rating === "number" && (
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={13} color="#FACC15" />
          <Text style={styles.ratingText}>
            {place.rating.toFixed(1)}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.detailButton,
          isPreview && styles.disabledDetailButton,
        ]}
        activeOpacity={0.8}
        disabled={isPreview || isReviewLoading}
        onPress={onDetailPress}
      >
        {isReviewLoading ? (
          <ActivityIndicator size="small" color="#6F7F95" />
        ) : (
          <>
            <Text style={styles.detailButtonText}>
              상세 정보 보기
            </Text>
            <Ionicons
              name="eye-outline"
              size={15}
              color="#6F7F95"
            />
          </>
        )}
      </TouchableOpacity>

      {!isPreview && (
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
      )}

      {isReviewLoading && (
        <View style={styles.reviewLoadingPanel}>
          <ActivityIndicator size="large" color="#2158E8" />

          <Text style={styles.reviewLoadingText}>
            리뷰 불러오는 중...
          </Text>

          <View style={styles.reviewProgressTrack}>
            <View style={styles.reviewProgressFill} />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  placeCard: {
    minHeight: 178,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DCE5F1",
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 20,
    marginBottom: 16,
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
  placeName: {
    color: "#111827",
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 8,
  },
  placeAddress: {
    color: "#8A9BB2",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 14,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  ratingText: {
    marginLeft: 5,
    color: "#111827",
    fontSize: 13,
    fontWeight: "800",
  },
  detailButton: {
    height: 38,
    borderRadius: 12,
    backgroundColor: "#F1F4F8",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  disabledDetailButton: {
    opacity: 0.65,
  },
  detailButtonText: {
    color: "#6F7F95",
    fontSize: 13,
    fontWeight: "800",
    marginRight: 5,
  },
  selectPlaceButton: {
    height: 42,
    borderRadius: 13,
    backgroundColor: "#ECF5FF",
    borderWidth: 1,
    borderColor: "#D7E9FF",
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
    color: "#2158E8",
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
