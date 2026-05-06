import React, { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { streamRecommendations } from "../../../api/recommendations/stream";
import type { RecommendedPlace } from "../../types/recommendation";

type StreamStatus = "idle" | "loading" | "done" | "error";

export default function RecommendationStreamCard() {
  const [status, setStatus] = useState<StreamStatus>("idle");
  const [message, setMessage] = useState("날씨나 일정 상황에 맞는 대안 장소를 추천받아보세요.");
  const [places, setPlaces] = useState<RecommendedPlace[]>([]);

  const isLoading = status === "loading";

  const handleStartRecommend = async () => {
    if (isLoading) return;

    setStatus("loading");
    setPlaces([]);
    setMessage("AI가 주변 장소를 분석 중입니다...");

    await streamRecommendations(
      {
        userId: 1,
        tripId: 1,
        limit: 5,
        reason: "WEATHER_ALTERNATIVE",
      },
      {
        onProgress: (nextMessage) => {
          setMessage(nextMessage);
        },
        onPlace: (place) => {
          setPlaces((prev) => {
            const exists = prev.some(
              (item) => String(item.placeId) === String(place.placeId),
            );

            if (exists) return prev;

            return [...prev, place];
          });
        },
        onDone: () => {
          setStatus("done");
          setMessage("대안 장소 추천이 완료되었습니다.");
        },
        onError: () => {
          setStatus("error");
          setMessage("서버 연결이 불안정해 mock 추천 결과를 표시합니다.");
        },
      },
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleBox}>
          <View style={styles.iconCircle}>
            <Ionicons name="sparkles-outline" size={20} color="#2563EB" />
          </View>

          <View>
            <Text style={styles.title}>AI 대안 추천</Text>
            <Text style={styles.subTitle}>날씨·일정 상황 기반 추천</Text>
          </View>
        </View>

        {isLoading ? <ActivityIndicator color="#2563EB" /> : null}
      </View>

      <Text style={styles.message}>{message}</Text>

      <TouchableOpacity
        style={[styles.button, isLoading && styles.disabledButton]}
        activeOpacity={0.85}
        onPress={handleStartRecommend}
        disabled={isLoading}
      >
        <Ionicons
          name={isLoading ? "hourglass-outline" : "sparkles"}
          size={16}
          color="#FFFFFF"
        />
        <Text style={styles.buttonText}>
          {isLoading ? "추천 분석 중..." : "대안 장소 추천받기"}
        </Text>
      </TouchableOpacity>

      {places.length > 0 ? (
        <View style={styles.placeList}>
          {places.map((place) => (
            <View key={String(place.placeId)} style={styles.placeCard}>
              <View style={styles.placeHeader}>
                <Text style={styles.placeName}>{place.name}</Text>

                {place.rating ? (
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={12} color="#F59E0B" />
                    <Text style={styles.ratingText}>{place.rating}</Text>
                  </View>
                ) : null}
              </View>

              {place.category ? (
                <Text style={styles.category}>{place.category}</Text>
              ) : null}

              {place.address ? (
                <Text style={styles.address}>{place.address}</Text>
              ) : null}

              {place.reason ? (
                <Text style={styles.reason}>{place.reason}</Text>
              ) : null}

              <TouchableOpacity
                style={styles.selectButton}
                activeOpacity={0.85}
              >
                <Text style={styles.selectButtonText}>이 장소로 대체</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#DBEAFE",
    shadowColor: "#2563EB",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  titleBox: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  title: {
    fontSize: 16,
    fontWeight: "900",
    color: "#1E293B",
  },

  subTitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },

  message: {
    marginTop: 14,
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
    lineHeight: 21,
  },

  button: {
    marginTop: 14,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#2563EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  disabledButton: {
    opacity: 0.7,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  placeList: {
    marginTop: 16,
    gap: 12,
  },

  placeCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  placeHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },

  placeName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "900",
    color: "#1E293B",
    lineHeight: 20,
  },

  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFBEB",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 3,
  },

  ratingText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#B45309",
  },

  category: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "800",
    color: "#2563EB",
  },

  address: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: "500",
    color: "#64748B",
    lineHeight: 18,
  },

  reason: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
    lineHeight: 19,
  },

  selectButton: {
    marginTop: 12,
    alignSelf: "flex-start",
    backgroundColor: "#E9F3FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },

  selectButtonText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#2563EB",
  },
});
