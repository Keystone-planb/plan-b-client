import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

type Props = {
  selectedDay?: number;
  day?: number;
};

export default function OngoingEmptyDayCard({ selectedDay, day }: Props) {
  const displayDay = selectedDay ?? day ?? 1;

  return (
    <View style={styles.emptyStateCard}>
      <View style={styles.illustrationCircle}>
        <Ionicons name="calendar-outline" size={34} color="#8DB7FF" />
      </View>

      <Text style={styles.emptyTitle}>아직 일정이 없어요</Text>

      <Text style={styles.emptyDescription}>
        Day {displayDay}에 방문할 장소를 추가해보세요.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyStateCard: {
    width: "100%",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#DCE6F3",
    backgroundColor: "#F8FBFF",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
    alignItems: "center",
  },
  illustrationCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#EEF5FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyTitle: {
    color: "#111827",
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 7,
    textAlign: "center",
  },
  emptyDescription: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 20,
  },
});
