import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
} from "react-native";

type Props = {
  isSelected: boolean;
  isSubmitting: boolean;
  isWeatherRecommendation: boolean;
  defaultLabel?: string;
  onPress: () => void;
};

export default function RecommendationSelectButton({
  isSelected,
  isSubmitting,
  isWeatherRecommendation,
  defaultLabel,
  onPress,
}: Props) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.selectButton,
        isSelected && styles.selectedButton,
        pressed && !isSubmitting && !isSelected && styles.pressedButton,
      ]}
      android_ripple={{
        color: "rgba(255, 255, 255, 0.16)",
        borderless: false,
      }}
      disabled={isSubmitting || isSelected}
      onPress={onPress}
      hitSlop={Platform.OS === "android" ? 8 : undefined}
      pressRetentionOffset={12}
    >
      {isSubmitting ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <Text style={[styles.selectButtonText, isSelected && styles.selectedButtonText]}>
          {isSelected
            ? "선택 완료"
            : isWeatherRecommendation
              ? "이 장소로 대체"
              : defaultLabel ?? "일정에 추가"}
        </Text>
      )}
    </Pressable>
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

  pressedButton: {
    opacity: 0.88,
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
