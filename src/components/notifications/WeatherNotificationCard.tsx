import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { WeatherNotification } from "../../types/notification";

type Props = {
  notification: WeatherNotification;
  onPressRecommend?: (notification: WeatherNotification) => void;
  onDismiss?: (notification: WeatherNotification) => void;
};

const getTextValue = (
  source: unknown,
  keys: string[],
  fallback = "",
) => {
  if (!source || typeof source !== "object") {
    return fallback;
  }

  const objectSource = source as Record<string, unknown>;

  for (const key of keys) {
    const value = objectSource[key];

    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value).trim();
    }
  }

  return fallback;
};

const getNumberValue = (source: unknown, keys: string[]) => {
  if (!source || typeof source !== "object") {
    return undefined;
  }

  const objectSource = source as Record<string, unknown>;

  for (const key of keys) {
    const value = objectSource[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value.replace("%", "").replace("mm", "").trim());

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return undefined;
};

const formatTimeRange = (notification: WeatherNotification) => {
  const startTime = getTextValue(notification, [
    "visitTime",
    "startTime",
    "time",
  ]);

  const endTime = getTextValue(notification, ["endTime"]);

  if (startTime && endTime) {
    return `${startTime} - ${endTime}`;
  }

  if (startTime) {
    return startTime;
  }

  return "시간 정보 없음";
};

const getWeatherSummary = (notification: WeatherNotification) => {
  const timeRange = formatTimeRange(notification);

  const probability = getNumberValue(notification, [
    "precipitationProbability",
    "rainProbability",
    "pop",
  ]);

  const rainAmount = getNumberValue(notification, [
    "precipitationAmount",
    "rainAmount",
    "expectedRainfall",
    "rainfall",
  ]);

  const probabilityText =
    typeof probability === "number" ? `강수 확률 ${Math.round(probability)}%` : "";

  const rainAmountText =
    typeof rainAmount === "number" ? `예상 강수량 ${rainAmount}mm` : "";

  const detailText = [probabilityText, rainAmountText].filter(Boolean).join(" · ");

  if (detailText) {
    return `${timeRange}  ${detailText}`;
  }

  return (
    getTextValue(notification, ["message"]) ||
    `${timeRange}  날씨 변동이 예상됩니다.`
  );
};

export default function WeatherNotificationCard({
  notification,
  onPressRecommend,
  onDismiss,
}: Props) {
  const placeName = getTextValue(notification, ["placeName", "name"], "현재 일정");
  const address = getTextValue(
    notification,
    ["address", "placeAddress", "location"],
    "장소 정보 없음",
  );
  const timeRange = formatTimeRange(notification);
  const weatherSummary = getWeatherSummary(notification);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerTitleBox}>
          <View style={styles.iconBadge}>
            <Ionicons name="rainy-outline" size={15} color="#2563EB" />
          </View>
          <Text style={styles.headerTitle}>날씨 정보</Text>
        </View>

        <TouchableOpacity
          onPress={() => onDismiss?.(notification)}
          activeOpacity={0.75}
          hitSlop={10}
          style={styles.closeButton}
        >
          <Ionicons name="close" size={16} color="#A7B0C0" />
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      <Text style={styles.sectionLabel}>영향받는 일정</Text>

      <View style={styles.scheduleBox}>
        <View style={styles.scheduleInfo}>
          <Text style={styles.placeName}>{placeName}</Text>
          <Text style={styles.address}>{address}</Text>

          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={13} color="#94A3B8" />
            <Text style={styles.timeText}>{timeRange}</Text>
          </View>
        </View>

        <View style={styles.reserveBadge}>
          <Ionicons name="ticket-outline" size={11} color="#FFFFFF" />
          <Text style={styles.reserveBadgeText}>예약</Text>
        </View>
      </View>

      <View style={styles.weatherSummaryBox}>
        <Text style={styles.weatherSummaryText}>{weatherSummary}</Text>
      </View>

      <TouchableOpacity
        style={styles.recommendButton}
        activeOpacity={0.85}
        onPress={() => onPressRecommend?.(notification)}
      >
        <Text style={styles.recommendButtonText}>대안 추천받기</Text>
        <Ionicons name="chevron-forward" size={17} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingTop: 15,
    paddingBottom: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E6ECF5",
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerTitleBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  iconBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#273449",
  },

  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  divider: {
    height: 1,
    backgroundColor: "#E8EDF5",
    marginTop: 12,
    marginBottom: 15,
  },

  sectionLabel: {
    marginBottom: 10,
    fontSize: 12,
    fontWeight: "900",
    color: "#4B5563",
  },

  scheduleBox: {
    minHeight: 82,
    borderRadius: 15,
    backgroundColor: "#F6F8FC",
    paddingHorizontal: 16,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  scheduleInfo: {
    flex: 1,
    paddingRight: 12,
  },

  placeName: {
    fontSize: 15,
    fontWeight: "900",
    color: "#263247",
  },

  address: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "700",
    color: "#8A97A8",
    lineHeight: 17,
  },

  timeRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  timeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#7B8798",
  },

  reserveBadge: {
    minWidth: 50,
    height: 24,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: "#2563EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },

  reserveBadgeText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  weatherSummaryBox: {
    marginTop: 12,
    borderRadius: 14,
    backgroundColor: "#F4F6FA",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  weatherSummaryText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "800",
    color: "#2F3B4F",
    textAlign: "center",
  },

  recommendButton: {
    marginTop: 12,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#2457F5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },

  recommendButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
});
