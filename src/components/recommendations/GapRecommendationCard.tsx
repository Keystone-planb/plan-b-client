import React, { useEffect, useMemo, useRef, useState } from "react";
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

type AllowedGapPlanPair = {
  beforePlanId?: number | string | null;
  afterPlanId?: number | string | null;
};

const EMPTY_ALLOWED_PLAN_PAIRS: AllowedGapPlanPair[] = [];

const tripGapsCache = new Map<string, TripScheduleGap[]>();
const tripGapsPromiseCache = new Map<string, Promise<TripScheduleGap[]>>();

const getCachedTripGaps = async (tripId: number | string) => {
  const cacheKey = String(tripId);

  const cached = tripGapsCache.get(cacheKey);
  if (cached) return cached;

  const pending = tripGapsPromiseCache.get(cacheKey);
  if (pending) return pending;

  const promise = getTripGaps(tripId)
    .then((gaps) => {
      tripGapsCache.set(cacheKey, gaps);
      return gaps;
    })
    .finally(() => {
      tripGapsPromiseCache.delete(cacheKey);
    });

  tripGapsPromiseCache.set(cacheKey, promise);

  return promise;
};

type Props = {
  tripId?: number | string | null;
  allowedPlanPairs?: AllowedGapPlanPair[];
  fallbackGaps?: TripScheduleGap[];
  onSelectPlace?: (place: RecommendedPlace, gap: TripScheduleGap) => void;
};

type Status = "idle" | "loading" | "done" | "error";

type GapTransportMode = "WALK" | "TRANSIT" | "CAR";

const GAP_TRANSPORT_OPTIONS: {
  mode: GapTransportMode;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    mode: "WALK",
    label: "도보",
    icon: "walk-outline",
  },
  {
    mode: "TRANSIT",
    label: "대중교통",
    icon: "bus-outline",
  },
  {
    mode: "CAR",
    label: "자동차",
    icon: "car-outline",
  },
];

const getGapTransportLabel = (mode?: string | null) => {
  switch (mode) {
    case "WALK":
      return "도보";
    case "CAR":
      return "자동차";
    case "TRANSIT":
    default:
      return "대중교통";
  }
};

const getSafeGapTransportMode = (mode?: string | null): GapTransportMode => {
  if (mode === "WALK" || mode === "TRANSIT" || mode === "CAR") {
    return mode;
  }

  return "TRANSIT";
};

const isValidGap = (gap: TripScheduleGap) => {
  return (
    gap.availableMinutes > 0 &&
    gap.gapMinutes >= 30 &&
    gap.gapMinutes > gap.estimatedTravelMinutes
  );
};

export default function GapRecommendationCard({
  tripId,
  allowedPlanPairs = EMPTY_ALLOWED_PLAN_PAIRS,
  fallbackGaps = [],
  onSelectPlace,
}: Props) {
  const [gaps, setGaps] = useState<TripScheduleGap[]>([]);
  const [selectedGap, setSelectedGap] = useState<TripScheduleGap | null>(null);
  const [places, setPlaces] = useState<RecommendedPlace[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<
    number | string | null
  >(null);
  const [selectedTransportMode, setSelectedTransportMode] =
    useState<GapTransportMode>("TRANSIT");
  const [expandedGapKey, setExpandedGapKey] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [hasLoadedGaps, setHasLoadedGaps] = useState(false);
  const [message, setMessage] = useState(
    "일정 사이에 비는 시간을 활용할 장소를 추천받아보세요.",
  );

  const requestLockRef = useRef(false);
  const receivedPlaceCountRef = useRef(0);

  const isLoading = status === "loading";

  const allowedPairKeys = useMemo(() => {
    return new Set(
      allowedPlanPairs
        .filter((pair) => pair.beforePlanId && pair.afterPlanId)
        .map(
          (pair) => `${String(pair.beforePlanId)}-${String(pair.afterPlanId)}`,
        ),
    );
  }, [allowedPlanPairs]);

  const allowedPlanPairKey = useMemo(() => {
    return Array.from(allowedPairKeys).join("|");
  }, [allowedPairKeys]);

  const fallbackGapKey = useMemo(() => {
    return fallbackGaps
      .map(
        (gap) =>
          `${String(gap.beforePlanId)}-${String(gap.afterPlanId)}-${String(gap.day ?? "")}`,
      )
      .join("|");
  }, [fallbackGaps]);

  useEffect(() => {
    let mounted = true;

    const applyGaps = (nextGaps: TripScheduleGap[]) => {
      if (!mounted) return;

      setGaps(nextGaps);
      setHasLoadedGaps(true);
      setSelectedGap(null);
      setPlaces([]);
      setSelectedPlaceId(null);
      setExpandedGapKey(null);
      setStatus("idle");

      if (nextGaps.length === 0) {
        setMessage("현재 추천 가능한 빈 시간이 없습니다.");
        return;
      }

      setMessage(
        "비는 시간을 선택하면 이동수단 기준으로 주변 장소를 추천해드려요.",
      );
    };

    const loadGaps = async () => {
      if (!tripId) {
        applyGaps([]);
        return;
      }

      if (allowedPairKeys.size === 0) {
        console.log("[GapRecommendationCard] no allowed current screen pairs");
        applyGaps([]);
        return;
      }

      const serverGaps = await getCachedTripGaps(tripId);

      const fallbackGapByPairKey = new Map(
        fallbackGaps.map((gap) => [
          `${String(gap.beforePlanId)}-${String(gap.afterPlanId)}`,
          gap,
        ]),
      );

      const normalizedServerGaps = serverGaps.map((gap) => {
        const gapKey = `${String(gap.beforePlanId)}-${String(gap.afterPlanId)}`;
        const fallbackGap = fallbackGapByPairKey.get(gapKey);

        return {
          ...gap,
          day: gap.day ?? fallbackGap?.day,
        };
      });

      const currentScreenGaps = normalizedServerGaps.filter((gap) => {
        const gapKey = `${String(gap.beforePlanId)}-${String(gap.afterPlanId)}`;

        return allowedPairKeys.has(gapKey) && isValidGap(gap);
      });
      const currentFallbackGaps = fallbackGaps.filter((gap) => {
        const gapKey = `${String(gap.beforePlanId)}-${String(gap.afterPlanId)}`;

        return allowedPairKeys.has(gapKey) && isValidGap(gap);
      });

      applyGaps(
        currentScreenGaps.length > 0 ? currentScreenGaps : currentFallbackGaps,
      );
    };

    loadGaps().catch((error) => {
      console.log("[GapRecommendationCard] gap load failed:", error);

      const currentFallbackGaps = fallbackGaps.filter((gap) => {
        const gapKey = `${String(gap.beforePlanId)}-${String(gap.afterPlanId)}`;

        return allowedPairKeys.has(gapKey) && isValidGap(gap);
      });

      applyGaps(currentFallbackGaps);
    });

    return () => {
      mounted = false;
    };
  }, [tripId, allowedPlanPairKey, fallbackGapKey]);

  const handleRecommend = async (gap: TripScheduleGap) => {
    if (isLoading || requestLockRef.current) return;

    requestLockRef.current = true;
    receivedPlaceCountRef.current = 0;

    setSelectedGap(gap);
    setPlaces([]);
    setStatus("loading");
    setMessage("빈 시간에 들를 수 있는 장소를 분석 중입니다...");

    const safeTransportMode = getSafeGapTransportMode(
      selectedTransportMode || gap.transportMode,
    );

    const payload: GapRecommendationRequest = {
      beforePlanId: gap.beforePlanId,
      afterPlanId: gap.afterPlanId,
      transportMode: safeTransportMode,
      radiusMinute: Math.max(gap.availableMinutes ?? 0, 30),
    };

    if (!tripId) {
      setStatus("error");
      setMessage("서버 일정 정보를 불러온 뒤 빈 시간 추천을 사용할 수 있어요.");
      return;
    }

    try {
      await streamGapRecommendations(tripId, payload, {
        onProgress: (nextMessage) => {
          setMessage(nextMessage);
        },
        onPlace: (place) => {
          receivedPlaceCountRef.current += 1;

          setPlaces((prev) => {
            const exists = prev.some(
              (item) => String(item.placeId) === String(place.placeId),
            );

            if (exists) return prev;

            return [...prev, place];
          });
        },
        onDone: () => {
          if (receivedPlaceCountRef.current === 0) {
            setStatus("done");
            setMessage("조건에 맞는 추천 장소가 없습니다.");
            return;
          }

          setStatus("done");
          setMessage(
            "추천 장소를 불러왔습니다. 원하는 장소를 Plan.A에 추가해보세요.",
          );
        },
        onWarning: (message: string) => {
          setStatus("done");
          setMessage(message || "조건에 맞는 추천 장소가 없습니다.");
        },
        onError: (error) => {
          console.log("[GapRecommendationCard] stream failed:", error);

          setStatus("error");
          setMessage(
            "추천 결과를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
          );
        },
      });
    } finally {
      requestLockRef.current = false;
    }
  };

  const handleSelectPlace = (place: RecommendedPlace) => {
    if (!selectedGap) {
      setStatus("error");
      setMessage("빈 시간을 먼저 선택해주세요.");
      return;
    }

    setSelectedPlaceId(place.placeId);

    console.log("[GapRecommendation] selected place:", {
      placeId: place?.placeId,
      googlePlaceId: place?.googlePlaceId,
      name: place?.name,
      gapDay: selectedGap.day,
      beforePlanId: selectedGap.beforePlanId,
      afterPlanId: selectedGap.afterPlanId,
    });

    setMessage(`${place.name}을(를) 일정에 추가하는 중입니다.`);

    onSelectPlace?.(place, selectedGap);
  };

  const shouldHideCard =
    hasLoadedGaps &&
    gaps.length === 0 &&
    places.length === 0 &&
    status !== "loading" &&
    status !== "error";

  if (shouldHideCard) {
    return null;
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleBox}>
          <View style={styles.iconCircle}>
            <Ionicons name="time-outline" size={20} color="#2563EB" />
          </View>

          <View>
            <Text style={styles.title}>빈 시간 장소 추천</Text>
            <Text style={styles.subTitle}>
              일정 사이 60분 이상 남는 시간 기준
            </Text>
          </View>
        </View>

        {isLoading ?
          <ActivityIndicator color="#2563EB" />
        : null}
      </View>

      {status === "loading" || status === "error" ?
        <Text style={styles.message}>{message}</Text>
      : null}

      {gaps.length > 0 ?
        <View style={styles.gapList}>
          {gaps.map((gap) => {
            const gapKey = `${gap.beforePlanId}-${gap.afterPlanId}`;
            const isExpanded = expandedGapKey === gapKey;

            return (
              <View key={gapKey} style={styles.gapItem}>
                <TouchableOpacity
                  style={[
                    styles.gapButton,
                    isExpanded && styles.expandedGapButton,
                  ]}
                  activeOpacity={0.85}
                  onPress={() =>
                    setExpandedGapKey((prev) =>
                      prev === gapKey ? null : gapKey,
                    )
                  }
                  disabled={isLoading}
                >
                  <View style={styles.gapTextBox}>
                    <Text style={styles.gapTitle}>
                      {gap.beforePlanTitle} → {gap.afterPlanTitle}
                    </Text>

                    <Text style={styles.gapMeta}>
                      총 공백 {gap.gapMinutes}분 · 추천 가능{" "}
                      {gap.availableMinutes ?? gap.gapMinutes}분
                    </Text>
                  </View>

                  <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={18}
                    color="#94A3B8"
                  />
                </TouchableOpacity>

                {isExpanded ?
                  <View style={styles.expandedGapPanel}>
                    <View style={styles.transportSelector}>
                      {GAP_TRANSPORT_OPTIONS.map((option) => {
                        const selected = selectedTransportMode === option.mode;

                        return (
                          <TouchableOpacity
                            key={option.mode}
                            style={[
                              styles.transportButton,
                              selected && styles.transportButtonActive,
                            ]}
                            activeOpacity={0.85}
                            onPress={() =>
                              setSelectedTransportMode(option.mode)
                            }
                            disabled={isLoading}
                          >
                            <Ionicons
                              name={option.icon}
                              size={14}
                              color={selected ? "#FFFFFF" : "#2158E8"}
                            />

                            <Text
                              style={[
                                styles.transportButtonText,
                                selected && styles.transportButtonTextActive,
                              ]}
                            >
                              {option.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.recommendButton,
                        isLoading && styles.recommendButtonDisabled,
                      ]}
                      activeOpacity={0.85}
                      onPress={() => handleRecommend(gap)}
                      disabled={isLoading}
                    >
                      {isLoading ?
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      : <>
                          <Text style={styles.recommendButtonText}>
                            대안찾기
                          </Text>
                          <Ionicons
                            name="chevron-forward"
                            size={17}
                            color="#FFFFFF"
                          />
                        </>
                      }
                    </TouchableOpacity>
                  </View>
                : null}
              </View>
            );
          })}
        </View>
      : null}

      {places.length > 0 ?
        <View style={styles.placeList}>
          {places.map((place) => {
            const isSelectedPlace =
              String(selectedPlaceId) === String(place.placeId);

            return (
              <TouchableOpacity
                key={String(place.placeId)}
                style={[
                  styles.placeButton,
                  isSelectedPlace && styles.selectedPlaceButton,
                ]}
                activeOpacity={0.85}
                onPress={() => handleSelectPlace(place)}
              >
                <View style={styles.placeTextBox}>
                  <Text style={styles.placeName} numberOfLines={1}>
                    {place.name}
                  </Text>

                  <Text style={styles.placeMeta} numberOfLines={1}>
                    {place.category || place.address || "추천 장소"}
                  </Text>
                </View>

                <Text style={styles.placeActionText}>
                  {isSelectedPlace ? "선택됨" : "이 장소 선택"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    marginTop: 8,
    marginHorizontal: 0,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignSelf: "stretch",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#1C2534",
    fontSize: 14,
    fontWeight: "900",
  },
  subTitle: {
    marginTop: 2,
    color: "#64748B",
    fontSize: 11,
    fontWeight: "700",
  },
  message: {
    marginTop: 10,
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
  },
  transportSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 0,
  },

  transportButton: {
    minHeight: 28,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D6E2F5",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },

  transportButtonActive: {
    backgroundColor: "#2158E8",
    borderColor: "#2158E8",
  },

  transportButtonText: {
    color: "#2158E8",
    fontSize: 11,
    fontWeight: "800",
  },

  transportButtonTextActive: {
    color: "#FFFFFF",
  },

  gapList: {
    marginTop: 10,
    gap: 8,
  },

  gapItem: {
    borderRadius: 14,
    overflow: "hidden",
  },
  gapButton: {
    minHeight: 54,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  expandedGapButton: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomColor: "#EEF2F7",
  },
  selectedGap: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  gapTextBox: {
    flex: 1,
  },
  gapTitle: {
    color: "#1C2534",
    fontSize: 12,
    fontWeight: "900",
    lineHeight: 17,
  },
  selectedGapText: {
    color: "#FFFFFF",
  },
  gapMeta: {
    marginTop: 3,
    color: "#64748B",
    fontSize: 11,
    fontWeight: "800",
  },
  selectedGapSubText: {
    color: "#DBEAFE",
  },
  gapActionBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  gapActionText: {
    color: "#2563EB",
    fontSize: 12,
    fontWeight: "900",
  },

  expandedGapPanel: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },

  recommendButton: {
    marginTop: 10,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#2158E8",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 4,
  },

  recommendButtonDisabled: {
    opacity: 0.6,
  },

  recommendButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
  selectedGapActionText: {
    color: "#FFFFFF",
  },
  placeList: {
    marginTop: 16,
    gap: 10,
  },
  placeButton: {
    minHeight: 72,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DCE5F2",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  selectedPlaceButton: {
    backgroundColor: "#EFF6FF",
    borderColor: "#2563EB",
  },
  placeTextBox: {
    flex: 1,
  },
  placeName: {
    color: "#1C2534",
    fontSize: 15,
    fontWeight: "900",
  },
  placeMeta: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
  },
  placeActionText: {
    color: "#2563EB",
    fontSize: 13,
    fontWeight: "900",
  },
});
