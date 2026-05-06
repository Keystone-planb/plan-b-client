import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  getTripGaps,
  streamGapRecommendations,
} from "../../../api/recommendations/gaps";
import type {
  GapRecommendationRequest,
  TripScheduleGap,
} from "../../types/gapRecommendation";
import type { RecommendedPlace } from "../../types/recommendation";

type Props = {
  tripId?: number | string | null;
};

type Status = "idle" | "loading" | "done" | "error";

export default function GapRecommendationCard({ tripId }: Props) {
  const [gaps, setGaps] = useState<TripScheduleGap[]>([]);
  const [selectedGap, setSelectedGap] = useState<TripScheduleGap | null>(null);
  const [places, setPlaces] = useState<RecommendedPlace[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<number | string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState(
    "일정 사이에 비는 시간을 찾아 추천 장소를 받아보세요.",
  );

  const isLoading = status === "loading";

  useEffect(() => {
    const loadGaps = async () => {
      if (!tripId || String(tripId) === "mock-trip") {
        const mockGaps: TripScheduleGap[] = [
          {
            beforePlanId: 101,
            afterPlanId: 102,
            beforePlanTitle: "투썸플레이스 부평역점",
            afterPlanTitle: "스타벅스 부평역점",
            beforePlanEndTime: "14:00",
            afterPlanStartTime: "15:00",
            beforePlaceLat: 37.4895,
            beforePlaceLng: 126.7245,
            afterPlaceLat: 37.4903,
            afterPlaceLng: 126.7251,
            availableMinutes: 45,
            gapMinutes: 60,
            transportMode: "WALK",
          },
        ];

        setGaps(mockGaps);
        setMessage("서버 여행 ID가 없어 mock 틈새 시간을 표시합니다.");
        return;
      }

      const nextGaps = await getTripGaps(tripId);
      setGaps(nextGaps);

      if (nextGaps.length === 0) {
        setMessage("현재 60분 이상 비는 시간이 없습니다.");
      } else {
        setMessage("비는 시간을 선택하면 주변 장소를 추천해드려요.");
      }
    };

    loadGaps();
  }, [tripId]);

  const handleRecommend = async (gap: TripScheduleGap) => {
    if (isLoading) return;

    setSelectedGap(gap);
    setPlaces([]);
    setStatus("loading");
    setMessage("빈 시간에 들를 수 있는 장소를 분석 중입니다...");

    const payload: GapRecommendationRequest = {
      beforePlanId: gap.beforePlanId,
      afterPlanId: gap.afterPlanId,
      transportMode: gap.transportMode,
      radiusMinute: gap.availableMinutes,
    };

    await streamGapRecommendations(tripId ?? "mock-trip", payload, {
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
        setMessage("틈새 시간 추천이 완료되었습니다.");
      },
      onError: () => {
        setStatus("error");
        setMessage("서버 연결이 불안정해 mock 틈새 추천을 표시합니다.");
      },
    });
  };

  const handleSelectPlace = (place: RecommendedPlace) => {
    setSelectedPlaceId(place.placeId);
    setMessage(`${place.name}을(를) 틈새 추천 장소로 임시 반영했습니다.`);
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleBox}>
          <View style={styles.iconCircle}>
            <Ionicons name="time-outline" size={20} color="#2563EB" />
          </View>

          <View>
            <Text style={styles.title}>틈새 시간 추천</Text>
            <Text style={styles.subTitle}>60분 이상 비는 일정 기반 추천</Text>
          </View>
        </View>

        {isLoading ? <ActivityIndicator color="#2563EB" /> : null}
      </View>

      <Text style={styles.message}>{message}</Text>

      {gaps.length > 0 ? (
        <View style={styles.gapList}>
          {gaps.map((gap) => {
            const gapKey = `${gap.beforePlanId}-${gap.afterPlanId}`;
            const isSelected =
              selectedGap?.beforePlanId === gap.beforePlanId &&
              selectedGap?.afterPlanId === gap.afterPlanId;

            return (
              <TouchableOpacity
                key={gapKey}
                style={[styles.gapButton, isSelected && styles.selectedGap]}
                activeOpacity={0.85}
                onPress={() => handleRecommend(gap)}
                disabled={isLoading}
              >
                <View style={styles.gapTextBox}>
                  <Text
                    style={[
                      styles.gapTitle,
                      isSelected && styles.selectedGapText,
                    ]}
                  >
                    {gap.beforePlanTitle} → {gap.afterPlanTitle}
                  </Text>
                  <Text
                    style={[
                      styles.gapMeta,
                      isSelected && styles.selectedGapSubText,
                    ]}
                  >
                    사용 가능 {gap.availableMinutes}분 · {gap.transportMode}
                  </Text>
                </View>

                <View style={styles.gapActionBox}>
                  <Text
                    style={[
                      styles.gapActionText,
                      isSelected && styles.selectedGapActionText,
                    ]}
                  >
                    추천 받기
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color="#1D4ED8"
                  />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}

      {places.length > 0 ? (
        <View style={styles.placeList}>
          {places.map((place) => {
            const isSelectedPlace =
              String(selectedPlaceId) === String(place.placeId);

            return (
            <View
              key={String(place.placeId)}
              style={[styles.placeCard, isSelectedPlace && styles.selectedPlaceCard]}
            >
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

              {isSelectedPlace ? (
                <View style={styles.selectedBadge}>
                  <Text style={styles.selectedBadgeText}>선택 완료</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[
                  styles.selectButton,
                  isSelectedPlace && styles.selectedSelectButton,
                ]}
                activeOpacity={0.85}
                onPress={() => handleSelectPlace(place)}
              >
                <Text
                  style={[
                    styles.selectButtonText,
                    isSelectedPlace && styles.selectedSelectButtonText,
                  ]}
                >
                  {isSelectedPlace ? "선택 완료" : "이 장소 추가하기"}
                </Text>
              </TouchableOpacity>
            </View>
            );
          })}
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
    shadowOpacity: 0.1,
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
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
    lineHeight: 20,
  },

  gapList: {
    marginTop: 14,
    gap: 10,
  },

  gapButton: {
    minHeight: 68,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  selectedGap: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },

  gapActionBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },

  gapActionText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#1D4ED8",
  },

  selectedGapActionText: {
    color: "#1D4ED8",
  },

  gapTextBox: {
    flex: 1,
    marginRight: 8,
  },

  gapTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: "#1E293B",
  },

  gapMeta: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
  },

  selectedGapText: {
    color: "#FFFFFF",
  },

  selectedGapSubText: {
    color: "#DBEAFE",
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

  selectedPlaceCard: {
    borderColor: "#2563EB",
    backgroundColor: "#EFF6FF",
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

  selectedBadge: {
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: "#2563EB",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },

  selectedBadgeText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  selectButton: {
    marginTop: 12,
    alignSelf: "flex-start",
    backgroundColor: "#E9F3FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },

  selectedSelectButton: {
    backgroundColor: "#2563EB",
  },

  selectButtonText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#2563EB",
  },

  selectedSelectButtonText: {
    color: "#FFFFFF",
  },
});
