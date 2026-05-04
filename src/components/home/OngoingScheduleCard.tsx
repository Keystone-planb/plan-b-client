import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export type OngoingSchedule = {
  id: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
};

type Props = {
  schedule: OngoingSchedule;
  onPress?: () => void;
};

export default function OngoingScheduleCard({ schedule, onPress }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>진행중인 일정</Text>

      <TouchableOpacity
        style={styles.contentRow}
        activeOpacity={0.78}
        onPress={onPress}
      >
        <View style={styles.pinCircle}>
          <Text style={styles.pinEmoji}>📌</Text>
        </View>

        <View style={styles.textArea}>
          <Text style={styles.tripTitle} numberOfLines={1}>
            {schedule.title}
          </Text>

          <Text style={styles.locationText} numberOfLines={1}>
            {schedule.location}
          </Text>

          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={14} color="#8A9BB2" />
            <Text style={styles.dateText}>
              {schedule.startDate} - {schedule.endDate}
            </Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={22} color="#C4CEDB" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 165,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#B8DBFF",
    paddingHorizontal: 21,
    paddingTop: 21,
    paddingBottom: 22,
    shadowColor: "#85C3FF",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.42,
    shadowRadius: 10,
    elevation: 5,
  },

  sectionTitle: {
    color: "#111827",
    fontSize: 19,
    fontWeight: "900",
    marginBottom: 25,
  },

  contentRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  pinCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F1F4F8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  pinEmoji: {
    fontSize: 16,
  },

  textArea: {
    flex: 1,
  },

  tripTitle: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 3,
  },

  locationText: {
    color: "#8A9BB2",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 10,
  },

  dateRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  dateText: {
    marginLeft: 7,
    color: "#6B7C92",
    fontSize: 13,
    fontWeight: "700",
  },
});
