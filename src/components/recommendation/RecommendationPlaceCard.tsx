import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Variant = "normal" | "alternative";

type Props = {
  variant?: Variant;
  badgeText: string;
  timeText: string;
  placeName: string;
  address?: string;
  originalPlaceName?: string;
  showTimeEdit?: boolean;
  onPressTimeEdit?: () => void;
};

export default function RecommendationPlaceCard({
  variant = "normal",
  badgeText,
  timeText,
  placeName,
  address,
  originalPlaceName,
  showTimeEdit = false,
  onPressTimeEdit,
}: Props) {
  const isAlternative = variant === "alternative";

  return (
    <View style={[styles.card, isAlternative && styles.alternativeCard]}>
      <View style={styles.topRow}>
        <View style={styles.metaLeft}>
          <View style={isAlternative ? styles.alternativeBadge : styles.badge}>
            <Text style={isAlternative ? styles.alternativeBadgeText : styles.badgeText}>
              {badgeText}
            </Text>
          </View>

          <View style={styles.timeRow}>
            <Ionicons
              name="time-outline"
              size={15}
              color={isAlternative ? "#94A3B8" : "#64748B"}
            />

            <Text style={[styles.timeText, isAlternative && styles.alternativeTimeText]}>
              {timeText}
            </Text>
          </View>
        </View>

        {showTimeEdit ? (
          <TouchableOpacity
            style={styles.timeEditButton}
            activeOpacity={0.8}
            onPress={onPressTimeEdit}
          >
            <Ionicons name="time-outline" size={13} color="#2158E8" />
            <Text style={styles.timeEditText} numberOfLines={1}>
              시간 변경
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <Text style={isAlternative ? styles.alternativePlaceText : styles.placeText}>
        {placeName}
      </Text>

      {address ? (
        <View style={styles.addressRow}>
          <Ionicons name="location" size={13} color="#94A3B8" />
          <Text style={styles.addressText} numberOfLines={1}>
            {address}
          </Text>
        </View>
      ) : null}

      {originalPlaceName ? (
        <View style={styles.originalReferenceRow}>
          <Ionicons name="information-circle-outline" size={13} color="#64748B" />
          <Text style={styles.originalReferenceText}>
            기존 일정: {originalPlaceName}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 102,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#DCE5F2",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 13,
    paddingVertical: 12,
    justifyContent: "center",
    minWidth: 0,
  },

  alternativeCard: {
    minHeight: 138,
    borderColor: "#8CB5FF",
    backgroundColor: "#F8FBFF",
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 8,
    minWidth: 0,
  },

  metaLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
    minWidth: 0,
  },

  badge: {
    alignSelf: "flex-start",
    height: 23,
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 9,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  badgeText: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "900",
  },

  alternativeBadge: {
    height: 24,
    borderRadius: 999,
    backgroundColor: "#2158E8",
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  alternativeBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },

  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 1,
    minWidth: 0,
  },

  timeText: {
    flexShrink: 1,
    minWidth: 0,
    color: "#1C2534",
    fontSize: 14,
    fontWeight: "900",
  },

  alternativeTimeText: {
    color: "#94A3B8",
  },

  placeText: {
    minWidth: 0,
    color: "#111827",
    fontSize: 16,
    fontWeight: "900",
  },

  alternativePlaceText: {
    minWidth: 0,
    color: "#2158E8",
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 8,
  },

  addressRow: {
    marginTop: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    minWidth: 0,
  },

  addressText: {
    flex: 1,
    color: "#64748B",
    fontSize: 12,
    fontWeight: "800",
  },

  originalReferenceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
    minWidth: 0,
  },

  originalReferenceText: {
    flex: 1,
    color: "#64748B",
    fontSize: 11,
    fontWeight: "800",
  },

  timeEditButton: {
    height: 28,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#BFD7FF",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    zIndex: 10,
    elevation: 10,
    flexShrink: 0,
  },

  timeEditText: {
    flexShrink: 1,
    color: "#2158E8",
    fontSize: 11,
    fontWeight: "900",
  },
});
