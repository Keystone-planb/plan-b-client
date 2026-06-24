import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  placeId: string | number;
  todayText?: string;
  fullText?: string;
  isExpanded: boolean;
  onToggle: () => void;
};

export default function RecommendationOpeningHours({
  todayText,
  fullText,
  isExpanded,
  onToggle,
}: Props) {
  if (!todayText) return null;

  return (
    <>
      <View style={styles.hoursDivider} />

      <TouchableOpacity
        style={styles.hoursInfoRow}
        activeOpacity={0.82}
        onPress={onToggle}
      >
        <View style={styles.hoursStatusDot} />

        <Text style={styles.hoursStatusText} numberOfLines={1}>
          {todayText}
        </Text>

        <Ionicons
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={18}
          color="#64748B"
          style={styles.hoursChevron}
        />
      </TouchableOpacity>

      {isExpanded && fullText ? (
        <View style={styles.fullHoursBox}>
          <Text style={styles.fullHoursTitle}>전체 영업시간</Text>

          {fullText
            .split("\n")
            .filter(Boolean)
            .map((row) => {
              const [day, ...timeParts] = row.split(":");
              const time = timeParts.join(":").trim();
              const todayLabel = new Date().toLocaleDateString("ko-KR", {
                weekday: "long",
              });
              const isToday = day.trim() === todayLabel;

              return (
                <View key={row} style={styles.fullHoursRow}>
                  <Text
                    style={[
                      styles.fullHoursDay,
                      isToday && styles.todayFullHoursText,
                    ]}
                  >
                    {day.trim()}
                  </Text>

                  <Text
                    style={[
                      styles.fullHoursTime,
                      isToday && styles.todayFullHoursText,
                    ]}
                  >
                    {time}
                  </Text>
                </View>
              );
            })}
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  hoursDivider: {
    height: 1,
    backgroundColor: "#CBD5E1",
    marginTop: 16,
    marginBottom: 14,
  },

  hoursInfoRow: {
    marginTop: 0,
    marginBottom: 2,
    paddingHorizontal: 0,
    flexDirection: "row",
    alignItems: "center",
  },

  hoursStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#34C759",
    marginRight: 8,
  },

  hoursStatusText: {
    color: "#16A34A",
    fontSize: 16,
    fontWeight: "900",
    flex: 1,
  },

  hoursChevron: {
    marginLeft: "auto",
  },

  fullHoursBox: {
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#DCE5F2",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },

  fullHoursTitle: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 6,
  },

  fullHoursRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 2,
  },

  fullHoursDay: {
    width: 62,
    color: "#64748B",
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 22,
  },

  fullHoursTime: {
    flex: 1,
    color: "#64748B",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 22,
  },

  todayFullHoursText: {
    color: "#2158E8",
    fontWeight: "900",
  },
});
