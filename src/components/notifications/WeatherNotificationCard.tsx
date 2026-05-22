import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { WeatherNotification } from "../../types/notification";

type Props = {
  notification: WeatherNotification;
  onPressRecommend?: (notification: WeatherNotification) => void;
  onDismiss?: (notification: WeatherNotification) => void;
  currentIndex?: number;
  totalCount?: number;
  onChangeIndex?: (index: number) => void;
  onPrev?: () => void;
  onNext?: () => void;
};

const getTextValue = (source: unknown, keys: string[], fallback = "") => {
  if (!source || typeof source !== "object") return fallback;

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
  if (!source || typeof source !== "object") return undefined;

  const objectSource = source as Record<string, unknown>;

  for (const key of keys) {
    const value = objectSource[key];

    if (typeof value === "number" && Number.isFinite(value)) return value;

    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value.replace("%", "").replace("mm", "").trim());
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return undefined;
};

const getWeatherTypeLabel = (notification: WeatherNotification) => {
  const type = getTextValue(notification, ["weatherType", "type"]).toUpperCase();

  if (type.includes("RAIN")) return "비 예보";
  if (type.includes("SNOW")) return "눈 예보";
  if (type.includes("HEAT")) return "폭염";
  if (type.includes("COLD")) return "한파";
  if (type.includes("WIND")) return "강풍";
  if (type.includes("STORM")) return "악천후";

  return "날씨";
};

const getWeatherIconName = (notification: WeatherNotification) => {
  const type = getTextValue(notification, ["weatherType", "type"]).toUpperCase();

  if (type.includes("RAIN")) return "rainy-outline";
  if (type.includes("SNOW")) return "snow-outline";
  if (type.includes("HEAT")) return "sunny-outline";
  if (type.includes("COLD")) return "snow-outline";
  if (type.includes("WIND")) return "leaf-outline";
  if (type.includes("STORM")) return "thunderstorm-outline";

  return "cloud-outline";
};

const getPlaceNameFromBody = (body?: string) => {
  if (!body) return "";
  const match = body.match(/^(.+?)\s*방문 시간/);
  return match?.[1]?.trim() ?? "";
};

const formatTimeRange = (notification: WeatherNotification) => {
  const startTime = getTextValue(notification, [
    "visitTime",
    "startTime",
    "time",
    "visitStartTime",
    "plannedStartTime",
    "scheduleStartTime",
    "affectedStartTime",
    "beforePlanEndTime",
  ]);
  const endTime = getTextValue(notification, [
    "endTime",
    "visitEndTime",
    "plannedEndTime",
    "scheduleEndTime",
    "affectedEndTime",
    "afterPlanStartTime",
  ]);

  if (startTime && endTime) return `${startTime} - ${endTime}`;
  if (startTime) return startTime;

  return "시간 정보 없음";
};

const getDayLabel = (notification: WeatherNotification) => {
  const rawDay = getTextValue(notification, ["day", "tripDay", "scheduleDay"]);
  if (!rawDay) return "";
  if (rawDay.toLowerCase().startsWith("day")) return rawDay;
  return `Day${rawDay}`;
};

const getWeatherSummary = (notification: WeatherNotification) => {
  const probability = getNumberValue(notification, [
    "precipitationProb",
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

  return [probabilityText, rainAmountText].filter(Boolean).join(" · ");
};

export default function WeatherNotificationCard({
  notification,
  onPressRecommend,
  onDismiss,
  currentIndex = 0,
  totalCount = 1,
  onChangeIndex,
  onPrev,
  onNext,
}: Props) {
  const body = getTextValue(notification, ["body", "message"]);
  const placeName =
    getTextValue(notification, ["placeName", "name"]) ||
    getPlaceNameFromBody(body) ||
    "현재 일정";

  const address = getTextValue(
    notification,
    [
      "address",
      "placeAddress",
      "location",
      "placeLocation",
      "originalPlaceAddress",
    ],
    "",
  );

  const alternatives =
    notification.recommendedPlaces ?? notification.alternatives ?? [];

  const weatherTypeLabel = getWeatherTypeLabel(notification);
  const weatherIconName = getWeatherIconName(notification);
  const weatherSummary = getWeatherSummary(notification);
  const dayLabel = getDayLabel(notification);
  const safeTotalCount = Math.max(1, totalCount);
  const timeRange = formatTimeRange(notification);
  const hasTime = Boolean(timeRange);
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerTitleBox}>
          <Ionicons name="alert-circle-outline" size={14} color="#FF5A5F" />
          <Text style={styles.headerTitle}>날씨 정보</Text>
        </View>

        <TouchableOpacity
          onPress={() => onDismiss?.(notification)}
          activeOpacity={0.75}
          hitSlop={10}
          style={styles.closeButton}
        >
          <Ionicons name="close" size={15} color="#A7B0C0" />
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      <View style={styles.tripRow}>
        <Text style={styles.tripLabel}>현재 일정</Text>
        <Text style={styles.tripName} numberOfLines={1}>
          {getTextValue(notification, ["tripName", "scheduleName", "tripTitle"], "현재 여행")}
        </Text>
        {dayLabel ? <Text style={styles.dayText}>{dayLabel}</Text> : null}
      </View>

      <View style={styles.scheduleBox}>
        <View style={styles.scheduleInfo}>
          <Text style={styles.placeName} numberOfLines={1}>
            {placeName}
          </Text>
          {address ? (
            <Text style={styles.address} numberOfLines={1}>
              {address}
            </Text>
          ) : null}

          {hasTime ? (
            <View style={styles.timeRow}>
              <Ionicons name="time-outline" size={13} color="#94A3B8" />
              <Text style={styles.timeText}>{timeRange}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.weatherBadge}>
          <Ionicons name={weatherIconName as any} size={12} color="#FFFFFF" />
          <Text style={styles.weatherBadgeText}>{weatherTypeLabel}</Text>
        </View>
      </View>

      <View style={styles.weatherSummaryBox}>
        <Ionicons name="umbrella-outline" size={16} color="#64748B" />
        <Text style={styles.weatherSummaryText} numberOfLines={1}>
          {weatherSummary || `${weatherTypeLabel}가 예상돼요`}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.recommendButton}
        activeOpacity={0.85}
        onPress={() => onPressRecommend?.(notification)}
      >
        <Text style={styles.recommendButtonText}>대안 추천받기</Text>
        <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
      </TouchableOpacity>

      {safeTotalCount > 1 ? (
        <View style={styles.paginationRow}>
          {Array.from({ length: safeTotalCount }).map((_, index) => (
            <TouchableOpacity
              key={`weather-dot-${index}`}
              activeOpacity={0.75}
              onPress={() => onChangeIndex?.(index)}
              style={[
                styles.paginationDot,
                index === currentIndex && styles.activePaginationDot,
              ]}
            />
          ))}

        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
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
    gap: 5,
  },

  headerTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: "#273449",
  },

  closeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  divider: {
    height: 1,
    backgroundColor: "#E8EDF5",
    marginTop: 10,
    marginBottom: 9,
  },

  tripRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },

  tripLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: "#64748B",
  },

  tripName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "900",
    color: "#111827",
  },

  dayText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#111827",
  },

  scheduleBox: {
    minHeight: 74,
    borderRadius: 14,
    backgroundColor: "#F5F7FB",
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  scheduleInfo: {
    flex: 1,
    paddingRight: 10,
  },

  placeName: {
    fontSize: 13,
    fontWeight: "900",
    color: "#334155",
  },

  address: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
  },

  timeRow: {
    marginTop: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  timeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#94A3B8",
  },

  weatherBadge: {
    minWidth: 56,
    height: 25,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: "#4F63F6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },

  weatherBadgeText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  weatherSummaryBox: {
    marginTop: 10,
    minHeight: 38,
    borderRadius: 13,
    backgroundColor: "#F5F7FB",
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  weatherSummaryText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "900",
    color: "#334155",
  },

  recommendButton: {
    marginTop: 10,
    height: 43,
    borderRadius: 12,
    backgroundColor: "#4A5CF6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },

  recommendButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  paginationRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  pageArrowButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },

  paginationDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#D1D5DB",
  },

  activePaginationDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#111827",
  },
});
