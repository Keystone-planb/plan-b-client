import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  getTripTransportMode,
  updateTripTransportMode,
} from "../../../api/schedules/transportMode";
import type { TransportMode } from "../../types/recommendation";

type Props = {
  tripId?: number | string | null;
};

const TRANSPORT_MODE_OPTIONS: Array<{
  label: string;
  value: TransportMode;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
}> = [
  {
    label: "도보",
    value: "WALK",
    icon: "walk-outline",
    description: "가까운 장소 중심",
  },
  {
    label: "대중교통",
    value: "TRANSIT",
    icon: "bus-outline",
    description: "지하철·버스 기준",
  },
  {
    label: "차량",
    value: "CAR",
    icon: "car-outline",
    description: "차량 이동 기준",
  },
];

export default function TransportModeSelector({ tripId }: Props) {
  const [selectedMode, setSelectedMode] = useState<TransportMode>("WALK");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(
    "추천 장소 계산에 사용할 기본 이동수단을 선택해 주세요.",
  );

  useEffect(() => {
    const loadTransportMode = async () => {
      if (!tripId) {
        setSelectedMode("WALK");
        return;
      }

      const mode = await getTripTransportMode(tripId);
      setSelectedMode(mode ?? "WALK");
    };

    loadTransportMode();
  }, [tripId]);

  const handleSelectMode = async (mode: TransportMode) => {
    if (loading) return;

    setSelectedMode(mode);

    if (!tripId) {
      setMessage("아직 서버 여행 ID가 없어 화면에서만 이동수단을 적용했습니다.");
      return;
    }

    try {
      setLoading(true);
      await updateTripTransportMode(tripId, mode);
      setMessage("기본 이동수단이 저장되었습니다.");
    } catch (error) {
      console.log("[TransportModeSelector] update ignored:", error);
      setMessage("서버 연결이 불안정해 화면에서만 이동수단을 적용했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>기본 이동수단</Text>
          <Text style={styles.subtitle}>
            대안 추천과 틈새 추천에 사용돼요.
          </Text>
        </View>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>{selectedMode}</Text>
        </View>
      </View>

      <View style={styles.optionRow}>
        {TRANSPORT_MODE_OPTIONS.map((option) => {
          const isSelected = selectedMode === option.value;

          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.optionButton, isSelected && styles.selectedButton]}
              activeOpacity={0.85}
              onPress={() => handleSelectMode(option.value)}
              disabled={loading}
            >
              <Ionicons
                name={option.icon}
                size={20}
                color={isSelected ? "#FFFFFF" : "#2563EB"}
              />

              <Text
                style={[
                  styles.optionLabel,
                  isSelected && styles.selectedOptionLabel,
                ]}
              >
                {option.label}
              </Text>

              <Text
                style={[
                  styles.optionDescription,
                  isSelected && styles.selectedOptionDescription,
                ]}
              >
                {option.description}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#1E293B",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },

  title: {
    fontSize: 16,
    fontWeight: "900",
    color: "#1E293B",
  },

  subtitle: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },

  badge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  badgeText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#2563EB",
  },

  optionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },

  optionButton: {
    flex: 1,
    minHeight: 82,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#DBEAFE",
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 10,
  },

  selectedButton: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },

  optionLabel: {
    marginTop: 5,
    fontSize: 13,
    fontWeight: "900",
    color: "#2563EB",
  },

  selectedOptionLabel: {
    color: "#FFFFFF",
  },

  optionDescription: {
    marginTop: 3,
    fontSize: 10,
    fontWeight: "600",
    color: "#64748B",
    textAlign: "center",
  },

  selectedOptionDescription: {
    color: "#DBEAFE",
  },

  message: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    lineHeight: 18,
  },
});
