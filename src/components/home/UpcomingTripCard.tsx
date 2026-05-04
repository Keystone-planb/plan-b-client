import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export type UpcomingTrip = {
  id: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  placeCount: number;
  thumbnailEmoji?: string;
};

type Props = {
  trip: UpcomingTrip;
  onPress?: () => void;
};

export default function UpcomingTripCard({ trip, onPress }: Props) {
  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.78}
      onPress={onPress}
    >
      <View style={styles.thumbnail}>
        <Text style={styles.thumbnailEmoji}>{trip.thumbnailEmoji ?? "🏝️"}</Text>
      </View>

      <View style={styles.textArea}>
        <Text style={styles.tripTitle} numberOfLines={1}>
          {trip.title}
        </Text>

        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={13} color="#8A9BB2" />
          <Text style={styles.metaText}>
            {trip.startDate} - {trip.endDate}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={13} color="#8A9BB2" />
          <Text style={styles.metaText}>
            {trip.location} · {trip.placeCount}개 장소
          </Text>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={22} color="#C4CEDB" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 113,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E3EAF3",
    paddingHorizontal: 17,
    paddingVertical: 17,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#E7EEF8",
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 3,
  },

  thumbnail: {
    width: 68,
    height: 68,
    borderRadius: 12,
    backgroundColor: "#DDF0FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },

  thumbnailEmoji: {
    fontSize: 34,
  },

  textArea: {
    flex: 1,
  },

  tripTitle: {
    color: "#111827",
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 8,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  metaText: {
    marginLeft: 6,
    color: "#6B7C92",
    fontSize: 12,
    fontWeight: "700",
  },
});
