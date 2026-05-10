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
    <View style={styles.card}>
      <View style={styles.thumbnail}>
        <Text style={styles.thumbnailEmoji}>{trip.emoji ?? "🏝️"}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.textBox}>
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
              style={[
                styles.deleteButton,
                deleting && styles.deleteButtonDisabled,
              ]}
              activeOpacity={0.85}
              disabled={deleting}
              onPress={() => onDelete(trip)}
            >
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.detailButton}
          activeOpacity={0.85}
          onPress={() => onPress?.(trip)}
        >
          <Text style={styles.detailButtonText}>상세 보기</Text>
          <Ionicons name="chevron-forward" size={14} color="#2158E8" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E1E7EF",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000000",
    shadowOpacity: 0.06,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowRadius: 8,
    elevation: 2,
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
  },

  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  textBox: {
    flex: 1,
    paddingRight: 10,
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
    marginLeft: 5,
    color: "#627187",
    fontSize: 12,
    fontWeight: "600",
  },

  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
  },

  deleteButtonDisabled: {
    opacity: 0.55,
  },

  detailButton: {
    alignSelf: "flex-start",
    marginTop: 12,
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#EFF6FF",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  detailButtonText: {
    color: "#2158E8",
    fontSize: 12,
    fontWeight: "900",
  },
});
