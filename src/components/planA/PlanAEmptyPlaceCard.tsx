import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  selectedDay: number;
  onPress: () => void;
};

export default function PlanAEmptyPlaceCard({ selectedDay, onPress }: Props) {
  return (
    <View style={styles.timelineRow}>
      <View style={styles.timelineLeft}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>1</Text>
        </View>

        <View style={styles.shortTimelineLine} />
      </View>

      <TouchableOpacity
        style={styles.emptyPlaceCardLarge}
        activeOpacity={0.85}
        onPress={onPress}
      >
        <Text style={styles.emptyPlaceTitle}>장소를 추가해주세요</Text>

        <Text style={styles.emptyPlaceSubText}>
          Day {selectedDay}에 방문할 장소를 등록해보세요.
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  timelineRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
  },

  timelineLeft: {
    width: 30,
    alignItems: "center",
    marginRight: 14,
  },

  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#2158E8",
    alignItems: "center",
    justifyContent: "center",
  },

  stepBadgeText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  shortTimelineLine: {
    width: 2,
    minHeight: 56,
    marginTop: 4,
    backgroundColor: "#DCEBFF",
  },

  emptyPlaceCardLarge: {
    flex: 1,
    minHeight: 86,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E1E7EF",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    justifyContent: "center",
  },

  emptyPlaceTitle: {
    color: "#252D3C",
    fontSize: 15,
    fontWeight: "900",
  },

  emptyPlaceSubText: {
    marginTop: 7,
    color: "#8C9BB1",
    fontSize: 12,
    fontWeight: "600",
  },
});
