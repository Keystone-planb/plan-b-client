import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

export type PlanXTrip = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  location: string;
  placeCount: number;
  emoji?: string;
};

type Props = {
  trip: PlanXTrip;
  onPress?: (trip: PlanXTrip) => void;
  onDelete?: (trip: PlanXTrip) => void;
  deleting?: boolean;
};

function formatDate(date: string) {
  return date.replace(/-/g, ".");
}

export default function PlanXTripCard({
  trip,
  onPress,
  onDelete,
  deleting = false,
}: Props) {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.86}
      onPress={() => onPress?.(trip)}
    >
      <View style={styles.thumbnail}>
        <Text style={styles.thumbnailEmoji}>{trip.emoji ?? "🏝️"}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {trip.title}
        </Text>

        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={17} color="#627187" />
          <Text style={styles.infoText}>
            {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={17} color="#627187" />
          <Text style={styles.infoText} numberOfLines={1}>
            {trip.location} · {trip.placeCount}개 장소
          </Text>
        </View>
      </View>

      {onDelete ? (
        <TouchableOpacity
          style={[styles.deleteButton, deleting && styles.deleteButtonDisabled]}
          activeOpacity={0.85}
          disabled={deleting}
          onPress={(event) => {
            event.stopPropagation();
            onDelete(trip);
          }}
        >
          <Ionicons name="close" size={18} color="#EF4444" />
        </TouchableOpacity>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 142,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E1E7EF",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    paddingRight: 46,
    marginBottom: 16,
    shadowColor: "#000000",
    shadowOpacity: 0.06,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowRadius: 8,
    elevation: 2,
    position: "relative",
  },

  thumbnail: {
    width: 72,
    height: 82,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E1E7EF",
    backgroundColor: "#D5EBFC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  thumbnailEmoji: {
    fontSize: 38,
  },

  content: {
    flex: 1,
    minWidth: 0,
  },

  title: {
    color: "#252D3C",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 10,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },

  infoText: {
    flex: 1,
    marginLeft: 5,
    color: "#627187",
    fontSize: 12,
    fontWeight: "600",
  },

  deleteButton: {
    position: "absolute",
    right: 14,
    top: 14,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },

  deleteButtonDisabled: {
    opacity: 0.55,
  },
});
