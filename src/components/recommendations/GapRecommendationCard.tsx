import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Image,
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
import { trackEvent, AMP } from "../../utils/amplitude";
import { getPlaceCategoryIcon } from "../../utils/placeCategoryIcon";

type AllowedGapPlanPair = {
  beforePlanId?: number | string | null;
  afterPlanId?: number | string | null;
};

const EMPTY_ALLOWED_PLAN_PAIRS: AllowedGapPlanPair[] = [];

// 일정이 바뀌면(대안 교체 등) 갭도 달라지므로, 캐시를 영구 보관하지 않고 짧은 TTL을 둔다.
const TRIP_GAPS_CACHE_TTL_MS = 20000;
const tripGapsCache = new Map<string, { data: TripScheduleGap[]; time: number }>();
const tripGapsPromiseCache = new Map<string, Promise<TripScheduleGap[]>>();

const getCachedTripGaps = async (tripId: number | string) => {
  const cacheKey = String(tripId);

  const cached = tripGapsCache.get(cacheKey);
  if (cached && Date.now() - cached.time < TRIP_GAPS_CACHE_TTL_MS) {
    return cached.data;
  }

  const pending = tripGapsPromiseCache.get(cacheKey);
  if (pending) return pending;

  const promise = getTripGaps(tripId)
    .then((gaps) => {
      tripGapsCache.set(cacheKey, { data: gaps, time: Date.now() });
      return gaps;
    })
    .finally(() => {
      tripGapsPromiseCache.delete(cacheKey);
    });

  tripGapsPromiseCache.set(cacheKey, promise);

  return promise;
};


export const clearTripGapCache = (
  tripId?: number | string | null,
) => {
  if (!tripId) return;

  const key = String(tripId);

  tripGapsCache.delete(key);
  tripGapsPromiseCache.delete(key);
};


type Props = {
  tripId?: number | string | null;
  allowedPlanPairs?: AllowedGapPlanPair[];

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

// 서버 gaps 응답을 그대로 사용
// 프론트에서 추가 필터링하지 않음

export default function GapRecommendationCard({
  tripId,
  allowedPlanPairs = EMPTY_ALLOWED_PLAN_PAIRS,

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
  const selectedPlaceIdRef = useRef<number | string | null>(null);

  // 갭 추천 보고 선택 안 하고 이탈할 때 측정
  // useEffect cleanup: 컴포넌트 언마운트 시 선택 여부 확인
  useEffect(() => {
    return () => {
      if (
        receivedPlaceCountRef.current > 0 &&
        selectedPlaceIdRef.current === null
      ) {
        trackEvent(AMP.GAP_RECOMMENDATION_VIEWED, {
          trip_id: tripId ? String(tripId) : undefined,
          recommendation_count: receivedPlaceCountRef.current,
          selected: false, // 봤지만 선택 안 함
        });
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  useEffect(() => {
    let mounted = true;

    const applyGaps = (nextGaps: TripScheduleGap[]) => {
      if (!mounted) return;

      setGaps(nextGaps);
      setHasLoadedGaps(true);

      setSelectedGap(null);
      setExpandedGapKey(null);

      setPlaces([]);
      setSelectedPlaceId(null);
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
        applyGaps([]);
        return;
      }

      const serverGaps = await getCachedTripGaps(tripId);


      const currentScreenGaps = serverGaps.filter((gap) => {
        const gapKey = `${String(gap.beforePlanId)}-${String(gap.afterPlanId)}`;
        const usableMinutes = gap.availableMinutes ?? gap.gapMinutes;
        return allowedPairKeys.has(gapKey) && usableMinutes >= 60;
      });

      console.log("[GapRecommendationCard] gap debug", {
        tripId,
        allowedPairKeys: Array.from(allowedPairKeys),
        serverGaps,
        currentScreenGaps,
      });

      applyGaps(currentScreenGaps);
    };

    loadGaps().catch((error) => {
      console.log("[GapRecommendationCard] gap load failed:", error);

      applyGaps([]);
    });

    return () => {
      mounted = false;
    };
  }, [tripId, allowedPlanPairKey]);

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

          // gap_recommendation_viewed: 결과 로드 완료 시 (선택 여부는 이탈 시 확정)
          trackEvent(AMP.GAP_RECOMMENDATION_VIEWED, {
            trip_id: tripId ? String(tripId) : undefined,
            recommendation_count: receivedPlaceCountRef.current,
            selected: true, // 로드 성공, 선택은 별도 추적
          });
        },
        onWarning: (message: string) => {
          setStatus("done");
          setMessage(message || "조건에 맞는 추천 장소가 없습니다.");
        },
        onError: (error) => {
          console.log("[GapRecommendationCard] stream failed:", error);

          setStatus("error");
          // 서버가 보낸 error 이벤트 메시지(예: "이미 추천이 진행 중입니다")를 그대로 노출
          const serverMessage =
            error instanceof Error ? error.message : "";
          setMessage(
            serverMessage && !serverMessage.includes("완료되기 전에 종료")
              ? serverMessage
              : "추천 결과를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
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
    selectedPlaceIdRef.current = place.placeId ?? null; // 이탈 감지용

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
    // 추천 가능 시간이 60분 미만이라 추천할 구간이 없으면 카드를 표시하지 않는다.
    // (일정 사이 공백/이동 구간은 상위 컴포넌트에서 그대로 유지됨)
    return null;
  }

  return (
    <>
      <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleBox}>
          <View style={styles.iconCircle}>
            <Ionicons name="time-outline" size={20} color="#2563EB" />
          </View>

          <View style={styles.titleTextBox}>
            <View style={styles.planBBadge}>
              <Text style={styles.planBBadgeText}>Plan.B</Text>
            </View>
            <Text style={styles.title}>빈 시간 대안 추천</Text>
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
              <React.Fragment key={gapKey}>
                <View style={styles.gapItem}>
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
              </React.Fragment>
            );
          })}
        </View>
      : null}

      {places.length > 0 ?
        <View style={styles.placeList}>
          <View style={styles.placeListHeader}>
            <View>
              <Text style={styles.placeListTitle}>✨ 추천 결과 {places.length}개</Text>
              <Text style={styles.placeListSubtitle}>
                선택하면 일정에 추가할 수 있어요
              </Text>
            </View>
            <Ionicons name="chevron-up" size={16} color="#94A3B8" />
          </View>

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
                <View style={styles.placeIconCircle}>
                  <Image
                    source={getPlaceCategoryIcon(place.category)}
                    style={styles.placeCategoryIcon}
                  />
                </View>

                <View style={styles.placeTextBox}>
                  <Text style={styles.placeName} numberOfLines={1}>
                    {place.name}
                  </Text>

                  <Text style={styles.placeMeta} numberOfLines={1}>
                    {place.category || "추천 장소"}
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
    </>
  );
}

const styles = StyleSheet.create({
  emptyCard: {
    width: "100%",
    minHeight: 60,
    marginTop: 0,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    justifyContent: "flex-start",
    zIndex: 30,
    elevation: 2,
  },

  emptyCardIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#EEF4FF",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyCardTextGroup: {
    flex: 1,
    minWidth: 0,
  },

  emptyCardTitle: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "900",
    color: "#1E293B",
  },

  emptyCardSubText: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700",
    color: "#64748B",
  },

  card: {
    width: "100%",
    marginTop: 0,
    marginHorizontal: 0,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignSelf: "stretch",
    marginBottom: 8,
    zIndex: 1,
    elevation: 0,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  iconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  titleTextBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 1,
  },

  planBBadge: {
    minHeight: 20,
    borderRadius: 999,
    backgroundColor: "#2158E8",
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  planBBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },

  title: {
    color: "#1C2534",
    fontSize: 13,
    fontWeight: "900",
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
    gap: 5,
    marginTop: 7,
    paddingHorizontal: 0,
    marginBottom: 8,
  },

  transportButton: {
    minHeight: 30,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D6E2F5",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 4,
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
    marginTop: 4,
    gap: 4,
  },

  gapItem: {
    borderRadius: 14,
    overflow: "hidden",
  },
  gapButton: {
    minHeight: 34,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 10,
    paddingVertical: 6,
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
    fontSize: 11,
    fontWeight: "900",
    lineHeight: 15,
  },
  selectedGapText: {
    color: "#FFFFFF",
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
    paddingHorizontal: 0,
    paddingTop: 8,
    paddingBottom: 0,
    backgroundColor: "#FFFFFF",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },

  recommendButton: {
    marginTop: 8,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#2158E8",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 4,
    minHeight: 36,
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
    marginTop: 12,
    padding: 10,
    borderRadius: 16,
    backgroundColor: "#F8FAFF",
    borderWidth: 1,
    borderColor: "#DCE8FF",
    gap: 8,
  },

  placeListHeader: {
    minHeight: 34,
    paddingHorizontal: 2,
    paddingBottom: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  placeListTitle: {
    color: "#2158E8",
    fontSize: 14,
    fontWeight: "900",
  },

  placeListSubtitle: {
    marginTop: 3,
    color: "#64748B",
    fontSize: 11,
    fontWeight: "700",
  },
  placeButton: {
    minHeight: 64,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DCE5F2",
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  selectedPlaceButton: {
    backgroundColor: "#EFF6FF",
    borderColor: "#2563EB",
  },
  placeIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#F1F6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  placeCategoryIcon: {
    width: 34,
    height: 34,
    resizeMode: "contain",
  },

  placeTextBox: {
    flex: 1,
  },
  placeName: {
    color: "#1C2534",
    fontSize: 14,
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
    fontSize: 12,
    fontWeight: "900",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#EFF6FF",
    overflow: "hidden",
  },
});
