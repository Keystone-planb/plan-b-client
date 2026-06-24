import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export type RecommendationTransportMode = "WALK" | "TRANSIT" | "CAR";

const OPTIONS = [
  { key: "WALK", label: "도보", icon: "walk" },
  { key: "TRANSIT", label: "대중교통", icon: "bus" },
  { key: "CAR", label: "자동차", icon: "car" },
] as const;

type Props = {
  value: RecommendationTransportMode;
  moveTimeText?: string;
  isAlternative?: boolean;
  onChange: (mode: RecommendationTransportMode) => void;
};

export default function RecommendationTransportCard({
  value,
  moveTimeText,
  isAlternative = false,
  onChange,
}: Props) {
  const selected = OPTIONS.find((option) => option.key === value) ?? OPTIONS[0];

  return (
    <View style={[styles.panel, isAlternative && styles.panelActive]}>
      <View style={styles.row}>
        {OPTIONS.map((option) => {
          const isActive = option.key === value;

          return (
            <TouchableOpacity
              key={option.key}
              style={[styles.chip, isActive && styles.chipActive]}
              activeOpacity={0.82}
              onPress={() => onChange(option.key)}
            >
              <Ionicons
                name={option.icon as any}
                size={15}
                color={isActive ? "#2158E8" : "#1C2534"}
              />

              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {moveTimeText ? (
        <View style={styles.moveTimeRow}>
          <Ionicons name={selected.icon as any} size={15} color="#2158E8" />
          <Text style={styles.moveTimeText}>
            예상 이동시간 <Text style={styles.moveTimeValue}>{moveTimeText}</Text>
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  panelActive: {
    borderColor: "#D7E6FF",
    backgroundColor: "#F8FBFF",
  },

  row: {
    flexDirection: "row",
    gap: 8,
  },

  chip: {
    flex: 1,
    height: 32,
    minHeight: 32,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 6,
  },

  chipActive: {
    borderColor: "#2158E8",
    backgroundColor: "#F8FBFF",
  },

  chipText: {
    color: "#1C2534",
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center",
  },

  chipTextActive: {
    color: "#2158E8",
  },

  moveTimeRow: {
    marginTop: 7,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  moveTimeText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "800",
  },

  moveTimeValue: {
    color: "#2158E8",
    fontWeight: "900",
  },
});
