import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { WeatherNotification } from "../../types/notification";

type Props = {
  notification: WeatherNotification;
  onPressRecommend?: (notification: WeatherNotification) => void;
  onDismiss?: (notification: WeatherNotification) => void;
};

export default function WeatherNotificationCard({
  notification,
  onPressRecommend,
  onDismiss,
}: Props) {
  const placeName = notification.placeName ?? "현재 일정";

  return (
    <View style={styles.card}>
      <View style={styles.iconCircle}>
        <Ionicons name="rainy-outline" size={22} color="#2563EB" />
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>날씨 알림</Text>

          <TouchableOpacity
            onPress={() => onDismiss?.(notification)}
            activeOpacity={0.7}
            hitSlop={8}
          >
            <Ionicons name="close" size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        <Text style={styles.message}>
          {placeName} 주변에 날씨 변동이 있어요.
        </Text>

        <Text style={styles.description}>
          {notification.message ||
            "야외 일정 대신 실내 대안 장소를 추천받아보세요."}
        </Text>

        <TouchableOpacity
          style={styles.recommendButton}
          activeOpacity={0.85}
          onPress={() => onPressRecommend?.(notification)}
        >
          <Ionicons name="sparkles-outline" size={16} color="#FFFFFF" />
          <Text style={styles.recommendButtonText}>대안 추천 보기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#DBEAFE",
    shadowColor: "#2563EB",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
  },

  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  content: {
    flex: 1,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  title: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1E293B",
  },

  message: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: "700",
    color: "#2563EB",
    lineHeight: 20,
  },

  description: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "500",
    color: "#64748B",
    lineHeight: 19,
  },

  recommendButton: {
    marginTop: 12,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563EB",
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 999,
    gap: 6,
  },

  recommendButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
});
