import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  useNavigation,
  useRoute,
} from "@react-navigation/native";

import {
  getTripGaps,
} from "../../../api/recommendations/gaps";
import type {
  TripScheduleGap,
} from "../../types/gapRecommendation";
import { getPlanBPlaceDisplay } from "../common/PlanBPlaceName";

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
  selectedDay?: number;
  allowedPlanPairs?: AllowedGapPlanPair[];
  onVisibilityChange?: (
    visible: boolean,
  ) => void;
};


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
  selectedDay,
  allowedPlanPairs = EMPTY_ALLOWED_PLAN_PAIRS,
  onVisibilityChange,
}: Props) {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [gaps, setGaps] =
    useState<TripScheduleGap[]>([]);

  const [
    selectedTransportMode,
    setSelectedTransportMode,
  ] = useState<GapTransportMode | null>(
    null,
  );

  const [
    expandedGapKey,
    setExpandedGapKey,
  ] = useState<string | null>(null);

  const [
    hasLoadedGaps,
    setHasLoadedGaps,
  ] = useState(false);


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

      onVisibilityChange?.(
        nextGaps.length > 0,
      );

      setExpandedGapKey(null);


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

  const handleRecommend = (
    gap: TripScheduleGap,
  ) => {
    if (!tripId) {
      return;
    }

    const safeTransportMode =
      getSafeGapTransportMode(
        selectedTransportMode ??
          gap.transportMode,
      );

    const routeParams =
      route.params ?? {};

    const targetDay =
      selectedDay ??
      gap.day ??
      routeParams.selectedDay ??
      routeParams.day;

    const returnScreen =
      route.name === "UpcomingSchedule"
        ? "UpcomingSchedule"
        : "OngoingSchedule";

    navigation.navigate(
      "AlternativeLoading",
      {
        scheduleId:
          routeParams.scheduleId ??
          String(tripId),

        tripId,
        serverTripId:
          routeParams.serverTripId ??
          tripId,

        tripName:
          routeParams.tripName,
        startDate:
          routeParams.startDate,
        endDate:
          routeParams.endDate,
        location:
          routeParams.location,

        recommendationType: "GAP",

        beforePlanId:
          gap.beforePlanId,
        beforePlanTitle:
          gap.beforePlanTitle,
        beforePlanEndTime:
          gap.beforePlanEndTime,

        afterPlanId:
          gap.afterPlanId,
        afterPlanTitle:
          gap.afterPlanTitle,
        afterPlanStartTime:
          gap.afterPlanStartTime,

        availableMinutes:
          gap.availableMinutes,
        gapMinutes:
          gap.gapMinutes,

        transportMode:
          safeTransportMode,
        transportLabel:
          getGapTransportLabel(
            safeTransportMode,
          ),

        selectedDay: targetDay,
        day: targetDay,

        returnScreen,
      },
    );
  };

  const shouldHideCard =
    hasLoadedGaps &&
    gaps.length === 0;

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

            <Text style={styles.title}>빈 시간 대안 추천</Text>
          </View>
        </View>
      </View>

      {gaps.length > 0 ?
        <View style={styles.gapList}>
          {gaps.map((gap) => {
            const gapKey = `${gap.beforePlanId}-${gap.afterPlanId}`;
            const isExpanded = expandedGapKey === gapKey;

            const beforePlaceDisplay =
              getPlanBPlaceDisplay(
                gap.beforePlanTitle,
              );

            const afterPlaceDisplay =
              getPlanBPlaceDisplay(
                gap.afterPlanTitle,
              );

            return (
              <React.Fragment key={gapKey}>
                <View
                  style={[
                    styles.gapItem,
                    isExpanded &&
                      styles.gapItemExpanded,
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.gapButton,
                      isExpanded &&
                        styles.expandedGapButton,
                    ]}
                    activeOpacity={0.85}
                    onPress={() => {
                      setExpandedGapKey((prev) =>
                        prev === gapKey
                          ? null
                          : gapKey,
                      );

                      setSelectedTransportMode(
                        getSafeGapTransportMode(
                          gap.transportMode,
                        ),
                      );
                    }}
                  >
                    <View style={styles.gapTextBox}>
                      <View style={styles.gapTitleRow}>
                        <View style={styles.gapPlacePart}>
                          <View style={styles.previousPlaceBadge}>
                            <Text
                              style={
                                styles.previousPlaceBadgeText
                              }
                            >
                              이전장소
                            </Text>
                          </View>

                          <Text
                            style={styles.gapTitle}
                            numberOfLines={2}
                            ellipsizeMode="tail"
                            lineBreakStrategyIOS="hangul-word"
                            android_hyphenationFrequency="none"
                          >
                            {beforePlaceDisplay.displayName}
                          </Text>
                        </View>

                        <Ionicons
                          name="arrow-forward"
                          size={23}
                          color="#2158E8"
                          style={styles.gapArrow}
                        />

                        <View style={styles.gapPlacePart}>
                          <View style={styles.gapPlanBBadge}>
                            <Text
                              style={
                                styles.gapPlanBBadgeText
                              }
                            >
                              틈새추천
                            </Text>
                          </View>

                          <Text
                            style={[
                              styles.gapTitle,
                              styles.gapAlternativeTitle,
                            ]}
                            numberOfLines={2}
                            ellipsizeMode="tail"
                            lineBreakStrategyIOS="hangul-word"
                            android_hyphenationFrequency="none"
                          >
                            {afterPlaceDisplay.displayName}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <Ionicons
                      name={
                        isExpanded
                          ? "chevron-up"
                          : "chevron-down"
                      }
                      size={20}
                      color="#64748B"
                    />
                  </TouchableOpacity>

                  {isExpanded ? (
                    <View style={styles.transportSelector}>
                      {GAP_TRANSPORT_OPTIONS.map((option) => {
                        const selected =
                          selectedTransportMode ===
                          option.mode;

                        return (
                          <TouchableOpacity
                            key={option.mode}
                            style={[
                              styles.transportButton,
                              selected &&
                                styles.transportButtonActive,
                            ]}
                            activeOpacity={0.85}
                            onPress={() =>
                              setSelectedTransportMode(
                                option.mode,
                              )
                            }
                                  >
                            <Ionicons
                              name={option.icon}
                              size={14}
                              color={
                                selected
                                  ? "#FFFFFF"
                                  : "#2158E8"
                              }
                            />

                            <Text
                              style={[
                                styles.transportButtonText,
                                selected &&
                                  styles.transportButtonTextActive,
                              ]}
                            >
                              {option.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ) : null}

                  {isExpanded ? (
                    <TouchableOpacity
                      style={styles.recommendButton}
                      activeOpacity={0.85}
                      onPress={() =>
                        handleRecommend(gap)
                      }
                      >
                      <Text
                        style={
                          styles.recommendButtonText
                        }
                      >
                        대안찾기
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </React.Fragment>
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
    backgroundColor: "#F7FAFF",
    borderWidth: 1,
    borderColor: "#D7E6FF",
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
    backgroundColor: "#EDF5FF",
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
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 0,
    marginBottom: 0,
    paddingHorizontal: 0,
  },

  transportButton: {
    flex: 1,
    minHeight: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D7E6FF",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 4,
    paddingVertical: 3,
  },

  transportButtonActive: {
    backgroundColor: "#2158E8",
    borderColor: "#2158E8",
  },

  transportButtonText: {
    color: "#2158E8",
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 14,
  },

  transportButtonTextActive: {
    color: "#FFFFFF",
  },

  gapList: {
    marginTop: 4,
    gap: 4,
  },

  gapItem: {
    width: "100%",
    backgroundColor: "transparent",
    borderWidth: 0,
    borderRadius: 0,
    padding: 0,
    gap: 8,
    overflow: "visible",
  },
  gapButton: {
    width: "100%",
    minHeight: 82,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D7E6FF",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  expandedGapButton: {
    borderRadius: 14,
  },
  selectedGap: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  gapTextBox: {
    flex: 1,
  },
  gapTitleRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  gapPlacePart: {
    flex: 1,
    minWidth: 0,
    alignItems: "flex-start",
    justifyContent: "flex-start",
    gap: 5,
  },

  gapAlternativeNameColumn: {
    width: "100%",
    minWidth: 0,
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 4,
  },

  previousPlaceBadge: {
    minHeight: 24,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#9FC7FF",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 9,
    alignItems: "center",
    justifyContent: "center",
  },

  previousPlaceBadgeText: {
    color: "#2158E8",
    fontSize: 10,
    fontWeight: "900",
  },

  gapPlanBBadge: {
    minHeight: 24,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#9FC7FF",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 9,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  gapPlanBBadgeText: {
    color: "#2158E8",
    fontSize: 10,
    fontWeight: "900",
  },

  gapAlternativeTitle: {
    width: "100%",
    minWidth: 0,
    flexShrink: 1,
    color: "#172033",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 18,
    letterSpacing: -0.25,
  },

  gapArrow: {
    flexShrink: 0,
    color: "#64748B",
    fontSize: 12,
    fontWeight: "900",
  },

  gapTitle: {
    width: "100%",
    color: "#172033",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 18,
    letterSpacing: -0.25,
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
    width: "100%",
    minHeight: 46,
    marginTop: 0,
    borderRadius: 12,
    backgroundColor: "#2158E8",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 5,
  },

  recommendButtonDisabled: {
    opacity: 0.6,
  },

  recommendButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
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
    lineHeight: 19,
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

  gapItemExpanded: {
    paddingTop: 0,
    paddingBottom: 0,
  },

});
