import React from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from "react-native";

type Props = {
  isSelected: boolean;
  isSubmitting: boolean;
  isWeatherRecommendation: boolean;
  onPress: () => void;
};

export default function RecommendationSelectButton({
  isSelected,
  isSubmitting,
  isWeatherRecommendation,
  onPress,
}: Props) {
  return (
    <TouchableOpacity
      style={[styles.selectButton, isSelected && styles.selectedButton]}
      activeOpacity={0.85}
      disabled={isSubmitting || isSelected}
      onPress={onPress}
    >
      {isSubmitting ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <Text style={[styles.selectButtonText, isSelected && styles.selectedButtonText]}>
          {isSelected
            ? "선택 완료"
            : isWeatherRecommendation
              ? "이 장소로 대체"
              : "일정에 추가"}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  selectButton: {
    marginTop: 16,
    minHeight: 58,
    borderRadius: 16,
    backgroundColor: "#2158E8",
    alignItems: "center",
    justifyContent: "center",
  },

  selectedButton: {
    backgroundColor: "#2158E8",
  },

  selectButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },

  selectedButtonText: {
    color: "#FFFFFF",
  },
});
