// src/screens/OngoingScheduleScreen.tsx

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import GapRecommendationCard from "../components/recommendations/GapRecommendationCard";
import PlanAMapPreview from "../components/planA/PlanAMapPreview";
import type { TripScheduleGap } from "../types/gapRecommendation";
import { getPlaceDetail } from "../../api/places/place";
import { getTripDetail } from "../../api/schedules/server";

type TransportMode = "WALK" | "TRANSIT" | "CAR";

type ScheduleMemo = {
  id: string;
  text: string;
  createdAt?: string;
  updatedAt?: string;
};

type TodayPlace = {
  id?: string | number;

  // 서버에서 생성된 여행 장소 ID
  tripPlaceId?: number | string;
  serverTripPlaceId?: number | string;

  // 외부 장소 ID
  placeId?: string;
  googlePlaceId?: string;

  name?: string;
  address?: string;
  time?: string;
  visitTime?: string;
  endTime?: string;
  latitude?: number;
  longitude?: number;
  category?: string;
  order?: number;
  memos?: ScheduleMemo[];
};

type ScheduleDay = {
  day: number;
  places: TodayPlace[];
};

type Props = {
  navigation: any;
  route?: {
    params?: {
      scheduleId?: string;
      tripId?: number | string;
      serverTripId?: number | string;
      tripName?: string;
      startDate?: string;
      endDate?: string;
      location?: string;
      transportMode?: TransportMode;
      transportLabel?: string;
      places?: TodayPlace[];
      days?: ScheduleDay[];
    };
  };
};

const toNumberOrNull = (value: unknown) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const getNestedValue = (source: Record<string, any>, path: string) => {
  return path.split(".").reduce<any>((acc, key) => acc?.[key], source);
};

const pickNumberByPaths = (source: Record<string, any>, paths: string[]) => {
  for (const path of paths) {
    const parsed = toNumberOrNull(getNestedValue(source, path));

    if (parsed !== null) return parsed;
  }

  return null;
};

const getSortTimeValue = (time?: string | null) => {
  if (!time) return Number.MAX_SAFE_INTEGER;

  const normalized = time.trim();
  const match = normalized.match(/(?:T|\b)(\d{1,2}):(\d{2})\s*(AM|PM)?/i);

  if (!match) return Number.MAX_SAFE_INTEGER;

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const period = match[3]?.toUpperCase();

  if (period === "PM" && hour < 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;

  return hour * 60 + minute;
};

const normalizeDisplayTime = (time?: string | null) => {
  const normalized = time?.trim();

  if (!normalized) return "";

  const match = normalized.match(/(?:T|\b)(\d{1,2}):(\d{2})/);

  if (!match) return normalized;

  return `${match[1].padStart(2, "0")}:${match[2]}`;
};

const getTimeRangeEndText = (time?: string | null) => {
  const normalized = time?.trim();

  if (!normalized) return null;

  const [, end] = normalized.split(/\s*-\s*/);

  return end?.trim() || null;
};

const getPlaceDisplayTime = (place: TodayPlace) => {
  const visitTime = normalizeDisplayTime(place.visitTime);
  const endTime = normalizeDisplayTime(place.endTime);

  if (visitTime && endTime) return `${visitTime} - ${endTime}`;
  if (visitTime) return visitTime;
  if (endTime) return endTime;

  return normalizeDisplayTime(place.time) || "시간 미정";
};

const getPlaceStartTimeValueForGap = (place: TodayPlace) => {
  return getSortTimeValue(place.visitTime ?? place.time);
};

const getPlaceEndTimeValueForGap = (place: TodayPlace) => {
  return getSortTimeValue(
    place.endTime ??
      getTimeRangeEndText(place.time) ??
      place.visitTime ??
      place.time,
  );
};

const sortPlacesByTime = <
  T extends { time?: string | null; visitTime?: string | null; order?: number },
>(
  places: T[],
) => {
  return [...places].sort((a, b) => {
    const aTime = getSortTimeValue(a.visitTime ?? a.time);
    const bTime = getSortTimeValue(b.visitTime ?? b.time);

    if (aTime !== bTime) return aTime - bTime;

    return (a.order ?? 0) - (b.order ?? 0);
  });
};

const isValidServerPlanId = (value?: string | number) => {
  if (value === undefined || value === null) return false;

  const text = String(value).trim();

  if (!text) return false;

  // Google Place ID는 서버 planId가 아니므로 차단
  if (text.startsWith("ChIJ")) return false;

  return Number.isFinite(Number(text));
};

export default function OngoingScheduleScreen({ navigation, route }: Props) {
  const params = route?.params ?? {};

  const {
    scheduleId,
    tripId,
    serverTripId,
    tripName = "신나는 여행",
    startDate,
    endDate,
    location = "장소 미정",
    transportMode = "WALK",
    transportLabel = "도보",
    days = [],
  } = params;

  const resolvedTripId =
    tripId ??
    serverTripId ??
    (scheduleId && Number.isFinite(Number(scheduleId)) ?
      scheduleId
    : undefined);

  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [serverDays, setServerDays] = useState<ScheduleDay[]>([]);
  useFocusEffect(
    useCallback(() => {
      const loadTripDetail = async () => {
        if (!resolvedTripId) return;

        try {
          const detail = await getTripDetail(resolvedTripId);

          const itineraries =
            Array.isArray(detail?.itineraries) ? detail.itineraries : [];

          const mappedDays: ScheduleDay[] = itineraries.map(
            (itinerary: any, index: number) => ({
              day: itinerary.day ?? index + 1,
              places: Array.isArray(itinerary.places) ? itinerary.places : [],
            }),
          );

          setServerDays(mappedDays);
        } catch (error) {
          // 상세 재조회 실패 시 기존 route params 기반 화면을 유지한다.
        }
      };

      loadTripDetail();
    }, [resolvedTripId]),
  );

  const currentDay = useMemo(() => {
    const dayNumber = selectedDayIndex + 1;
    const serverDay = serverDays.find((day) => day.day === dayNumber);
    const localDay = days.find((day) => day.day === dayNumber);

    if (!serverDay) {
      return localDay;
    }

    const mergedPlaces = [...(serverDay.places ?? [])];

    (localDay?.places ?? []).forEach((localPlace) => {
      const exists = mergedPlaces.some((serverPlace) => {
        const sameTripPlaceId =
          Boolean(localPlace.tripPlaceId) &&
          String(localPlace.tripPlaceId) === String(serverPlace.tripPlaceId);

        const sameServerTripPlaceId =
          Boolean(localPlace.serverTripPlaceId) &&
          String(localPlace.serverTripPlaceId) ===
            String(serverPlace.serverTripPlaceId ?? serverPlace.tripPlaceId);

        const sameGooglePlaceId =
          Boolean(localPlace.placeId) &&
          (String(localPlace.placeId) === String(serverPlace.placeId) ||
            String(localPlace.placeId) === String(serverPlace.googlePlaceId));

        const sameName =
          Boolean(localPlace.name) &&
          String(localPlace.name) === String(serverPlace.name);

        return (
          sameTripPlaceId ||
          sameServerTripPlaceId ||
          sameGooglePlaceId ||
          sameName
        );
      });

      if (!exists) {
        mergedPlaces.push(localPlace);
      }
    });

    return {
      ...serverDay,
      places: mergedPlaces,
    };
  }, [days, serverDays, selectedDayIndex]);

  const places = useMemo(() => {
    if (currentDay?.places?.length) {
      return sortPlacesByTime(currentDay.places);
    }

    if (params.places && params.places.length > 0) {
      return sortPlacesByTime(params.places);
    }

    return [];
  }, [currentDay?.places, params.places]);

  const mapPlaces = useMemo(() => {
    return places.map((place) => {
      const rawPlace = place as TodayPlace & Record<string, any>;

      const latitude =
        pickNumberByPaths(rawPlace, [
          "latitude",
          "lat",
          "y",
          "mapY",
          "location.latitude",
          "location.lat",
          "coordinate.latitude",
          "coordinate.lat",
          "geometry.location.lat",
        ]) ?? place.latitude;

      const longitude =
        pickNumberByPaths(rawPlace, [
          "longitude",
          "lng",
          "lon",
          "x",
          "mapX",
          "location.longitude",
          "location.lng",
          "location.lon",
          "coordinate.longitude",
          "coordinate.lng",
          "coordinate.lon",
          "geometry.location.lng",
        ]) ?? place.longitude;

      return {
        ...place,
        latitude,
        longitude,
      };
    });
  }, [places]);

  const [resolvedMapPlaces, setResolvedMapPlaces] = useState(mapPlaces);

  useEffect(() => {
    let cancelled = false;

    const resolveMapPlaces = async () => {
      const nextPlaces = await Promise.all(
        mapPlaces.map(async (place) => {
          const hasValidCoordinate =
            typeof place.latitude === "number" &&
            Number.isFinite(place.latitude) &&
            typeof place.longitude === "number" &&
            Number.isFinite(place.longitude);

          if (hasValidCoordinate) {
            return place;
          }

          const googlePlaceId =
            place.googlePlaceId ?? place.placeId ?? place.id;

          if (!googlePlaceId) {
            return place;
          }

          try {
            const detail = (await getPlaceDetail(String(googlePlaceId))) as {
              latitude?: number;
              lat?: number;
              longitude?: number;
              lng?: number;
              location?: {
                latitude?: number;
                lat?: number;
                longitude?: number;
                lng?: number;
              };
            };

            const latitude =
              detail.latitude ??
              detail.lat ??
              detail.location?.latitude ??
              detail.location?.lat;

            const longitude =
              detail.longitude ??
              detail.lng ??
              detail.location?.longitude ??
              detail.location?.lng;

            return {
              ...place,
              latitude,
              longitude,
            };
          } catch (error) {
            return place;
          }
        }),
      );

      if (!cancelled) {
        setResolvedMapPlaces(nextPlaces);
      }
    };

    resolveMapPlaces();

    return () => {
      cancelled = true;
    };
  }, [mapPlaces]);

  const currentDayFallbackGaps = useMemo<TripScheduleGap[]>(() => {
    return places
      .slice(0, -1)
      .map((place, index) => {
        const nextPlace = places[index + 1];

        const beforePlanId =
          place.serverTripPlaceId ?? place.tripPlaceId ?? place.id;
        const afterPlanId =
          nextPlace?.serverTripPlaceId ??
          nextPlace?.tripPlaceId ??
          nextPlace?.id;

        if (
          !isValidServerPlanId(beforePlanId) ||
          !isValidServerPlanId(afterPlanId)
        ) {
          return null;
        }

        const currentEnd = getPlaceEndTimeValueForGap(place);
        const nextStart = getPlaceStartTimeValueForGap(nextPlace);

        if (
          currentEnd === Number.MAX_SAFE_INTEGER ||
          nextStart === Number.MAX_SAFE_INTEGER
        ) {
          return null;
        }

        const gapMinutes = nextStart - currentEnd;

        if (gapMinutes < 30) {
          return null;
        }

        return {
          day: selectedDayIndex + 1,
          beforePlanId,
          afterPlanId,
          beforePlanTitle: place.name ?? "이전 장소",
          afterPlanTitle: nextPlace?.name ?? "다음 장소",
          gapMinutes,
          availableMinutes: gapMinutes,
          estimatedTravelMinutes: 0,
          transportMode,
        };
      })
      .filter(Boolean) as TripScheduleGap[];
  }, [places, transportMode]);

  const hasPlaces = places.length > 0;

  const handleBack = () => {
    navigation.goBack();
  };

  const handleEdit = () => {
    navigation.navigate("PlanA", {
      scheduleId,
      tripId: resolvedTripId,
      serverTripId: resolvedTripId,
      tripName,
      startDate,
      endDate,
      location,
      transportMode,
      transportLabel,
      day: selectedDayIndex + 1,
      selectedDay: selectedDayIndex + 1,
    });
  };

  const handleAlternative = (place: TodayPlace) => {
    const matchedResolvedPlace = resolvedMapPlaces.find((item) => {
      const candidates = [
        item.serverTripPlaceId,
        item.tripPlaceId,
        item.id,
        item.placeId,
        item.googlePlaceId,
      ].map((value) => String(value ?? ""));

      return [
        place.serverTripPlaceId,
        place.tripPlaceId,
        place.id,
        place.placeId,
        place.googlePlaceId,
      ]
        .map((value) => String(value ?? ""))
        .some((value) => value && candidates.includes(value));
    });

    const targetPlaceForAlternative = {
      ...place,
      ...matchedResolvedPlace,
      latitude: matchedResolvedPlace?.latitude ?? place.latitude,
      longitude: matchedResolvedPlace?.longitude ?? place.longitude,
    };

    const serverPlanId =
      targetPlaceForAlternative.serverTripPlaceId ??
      targetPlaceForAlternative.tripPlaceId ??
      targetPlaceForAlternative.id;

    if (!isValidServerPlanId(serverPlanId)) {
      Alert.alert(
        "AI 대안 추천 불가",
        "이 일정은 서버 장소 ID가 없는 이전 로컬 일정입니다. 새 일정으로 장소를 다시 추가한 뒤 AI 추천을 시도해주세요.",
      );
      return;
    }

    navigation.navigate("AlternativeSettings", {
      scheduleId,
      tripId: resolvedTripId,
      serverTripId: resolvedTripId,
      tripName,
      startDate,
      endDate,
      location,
      transportMode,
      transportLabel,
      currentPlanId: serverPlanId,
      tripPlaceId: serverPlanId,
      serverTripPlaceId: serverPlanId,
      targetPlace: {
        id: targetPlaceForAlternative.id,

        // 서버 장소 ID
        tripPlaceId: serverPlanId,
        serverTripPlaceId: serverPlanId,

        // Google Place ID
        placeId:
          targetPlaceForAlternative.placeId ??
          targetPlaceForAlternative.googlePlaceId ??
          String(targetPlaceForAlternative.id ?? ""),
        googlePlaceId:
          targetPlaceForAlternative.googlePlaceId ??
          targetPlaceForAlternative.placeId ??
          String(targetPlaceForAlternative.id ?? ""),

        name: targetPlaceForAlternative.name,
        address: targetPlaceForAlternative.address,
        time: targetPlaceForAlternative.time,
        latitude: targetPlaceForAlternative.latitude,
        longitude: targetPlaceForAlternative.longitude,
        category: targetPlaceForAlternative.category,
      },
    });
  };

  const displayDays = serverDays.length > 0 ? serverDays : days;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.75}
            onPress={handleBack}
          >
            <Ionicons name="chevron-back" size={24} color="#64748B" />
          </TouchableOpacity>

          <Text style={styles.logoText}>Plan.B</Text>

          <View style={styles.headerRightSpace} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.dayTabs}>
            {displayDays.map((day, index) => {
              const selected = selectedDayIndex === index;

              return (
                <TouchableOpacity
                  key={`day-${day.day}`}
                  style={[styles.dayTab, selected && styles.dayTabActive]}
                  activeOpacity={0.85}
                  onPress={() => setSelectedDayIndex(index)}
                >
                  <Text
                    style={[
                      styles.dayTabText,
                      selected && styles.dayTabTextActive,
                    ]}
                  >
                    Day {day.day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.mapSection}>
            <PlanAMapPreview places={resolvedMapPlaces} />
          </View>

          <View style={styles.todayHeader}>
            <Text style={styles.todayTitle}>오늘 일정</Text>

            <TouchableOpacity activeOpacity={0.75} onPress={handleEdit}>
              <Text style={styles.editText}>수정</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.timelineList}>
            <View style={styles.timelineLine} />
            {!hasPlaces ?
              <View style={styles.emptyDayCard}>
                <Ionicons name="calendar-outline" size={28} color="#94A3B8" />
                <Text style={styles.emptyDayTitle}>
                  이 Day에는 저장된 장소가 없어요
                </Text>
                <Text style={styles.emptyDayDescription}>
                  수정 버튼을 눌러 장소를 추가해보세요.
                </Text>
              </View>
            : null}

            {places.map((place, index) => {
              const focused = index === 0;
              const nextPlaceForGap = places[index + 1];
              const gapBeforePlanId =
                place.serverTripPlaceId ?? place.tripPlaceId ?? place.id;
              const gapAfterPlanId =
                nextPlaceForGap?.serverTripPlaceId ??
                nextPlaceForGap?.tripPlaceId ??
                nextPlaceForGap?.id;

              const currentGapPlanPairs =
                (
                  nextPlaceForGap &&
                  isValidServerPlanId(gapBeforePlanId) &&
                  isValidServerPlanId(gapAfterPlanId)
                ) ?
                  [
                    {
                      beforePlanId: gapBeforePlanId,
                      afterPlanId: gapAfterPlanId,
                    },
                  ]
                : [];

              const currentPairFallbackGaps = currentDayFallbackGaps.filter(
                (gap) =>
                  String(gap.beforePlanId) === String(gapBeforePlanId) &&
                  String(gap.afterPlanId) === String(gapAfterPlanId),
              );
              const hasServerPlanId = isValidServerPlanId(
                place.serverTripPlaceId ?? place.tripPlaceId ?? place.id,
              );

              return (
                <React.Fragment
                  key={`${String(place.tripPlaceId ?? place.id ?? place.name)}-${index}`}
                >
                  <View
                    style={[
                      styles.todayCard,
                      focused && styles.todayCardActive,
                    ]}
                  >
                    <View style={styles.numberCircle}>
                      <Text style={styles.numberText}>{index + 1}</Text>
                    </View>

                    <View style={styles.placeInfo}>
                      <Text style={styles.placeName} numberOfLines={1}>
                        {place.name || "이름 없는 장소"}
                      </Text>

                      <View style={styles.timeRow}>
                        <Ionicons
                          name="time-outline"
                          size={15}
                          color="#94A3B8"
                        />
                        <Text style={styles.timeText}>
                          {getPlaceDisplayTime(place)}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.alternativeButton,
                        !hasServerPlanId && styles.disabledAlternativeButton,
                      ]}
                      activeOpacity={0.85}
                      onPress={() => handleAlternative(place)}
                    >
                      <Text style={styles.alternativeButtonText}>대안찾기</Text>
                      <Ionicons
                        name="chevron-forward"
                        size={14}
                        color="#FFFFFF"
                      />
                    </TouchableOpacity>
                  </View>

                  {place.memos?.length ?
                    <View style={styles.memoList}>
                      {place.memos.map((memo) => (
                        <View key={memo.id} style={styles.memoCard}>
                          <Ionicons
                            name="reader-outline"
                            size={17}
                            color="#64748B"
                          />
                          <Text style={styles.memoText}>{memo.text}</Text>
                        </View>
                      ))}
                    </View>
                  : null}

                  {currentGapPlanPairs.length > 0 ?
                    <View style={styles.gapRecommendationSection}>
                      {resolvedTripId ?
                        <GapRecommendationCard
                          allowedPlanPairs={currentGapPlanPairs}
                          fallbackGaps={currentPairFallbackGaps}
                          onSelectPlace={(place, gap) => {
                            const recommendedPlaceId = String(place.placeId);
                            const recommendedGooglePlaceId =
                              place.googlePlaceId ? String(place.googlePlaceId)
                              : recommendedPlaceId.startsWith("ChIJ") ?
                                recommendedPlaceId
                              : undefined;
                            const targetDay = gap.day ?? selectedDayIndex + 1;

                            if (!recommendedGooglePlaceId) {
                              Alert.alert(
                                "장소 추가 실패",
                                "추천 장소의 Google Place ID가 없어 일정에 추가할 수 없습니다.",
                              );

                              return;
                            }

                            navigation.navigate("PlanA", {
                              scheduleId,
                              tripId: resolvedTripId,
                              serverTripId: resolvedTripId,
                              tripName,
                              startDate,
                              endDate,
                              location,
                              transportMode,
                              transportLabel,

                              gapSelectedPlace: {
                                day: targetDay,
                                id:
                                  recommendedGooglePlaceId ??
                                  `recommended-place-${recommendedPlaceId}`,
                                placeId: recommendedGooglePlaceId,
                                googlePlaceId: recommendedGooglePlaceId,

                                tripPlaceId: undefined,
                                serverTripPlaceId: undefined,

                                name: place.name,
                                address: place.address,
                                category: place.category,

                                latitude: place.latitude,
                                longitude: place.longitude,

                                time: "",
                              },
                            });
                          }}
                          tripId={resolvedTripId}
                        />
                      : null}
                    </View>
                  : null}
                </React.Fragment>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  header: {
    height: 76,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },

  backButton: {
    width: 36,
    height: 36,
    alignItems: "flex-start",
    justifyContent: "center",
  },

  logoText: {
    flex: 1,
    color: "#1C2534",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.8,
    textAlign: "center",
  },

  headerRightSpace: {
    width: 36,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 36,
  },

  dayTabs: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 18,
  },

  dayTab: {
    height: 48,
    minWidth: 82,
    borderRadius: 24,
    backgroundColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },

  dayTabActive: {
    backgroundColor: "#2158E8",
    shadowColor: "#2158E8",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },

  dayTabText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },

  dayTabTextActive: {
    color: "#FFFFFF",
  },

  mapSection: {
    height: 220,
    backgroundColor: "#EDF3F9",
    overflow: "hidden",
  },

  mapFake: {
    flex: 1,
    backgroundColor: "#F5F6F7",
    position: "relative",
  },

  mapRoadDiagonalOne: {
    position: "absolute",
    width: 380,
    height: 26,
    left: 38,
    top: 104,
    backgroundColor: "#DEE3EA",
    transform: [{ rotate: "-31deg" }],
    borderRadius: 20,
  },

  mapRoadDiagonalTwo: {
    position: "absolute",
    width: 370,
    height: 20,
    left: 6,
    top: 154,
    backgroundColor: "#E7EBF0",
    transform: [{ rotate: "-18deg" }],
    borderRadius: 20,
  },

  mapRoadHorizontalOne: {
    position: "absolute",
    width: 520,
    height: 16,
    left: -20,
    top: 58,
    backgroundColor: "#E0E5EB",
    borderRadius: 16,
  },

  mapRoadHorizontalTwo: {
    position: "absolute",
    width: 520,
    height: 15,
    left: -40,
    top: 190,
    backgroundColor: "#E0E5EB",
    borderRadius: 16,
  },

  mapLabel: {
    position: "absolute",
    color: "#667085",
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 22,
  },

  mapLabelOne: {
    left: 36,
    top: 126,
  },

  mapLabelTwo: {
    right: 120,
    top: 26,
  },

  mapLabelThree: {
    right: 18,
    top: 86,
    width: 118,
  },

  mapLabelFour: {
    left: 184,
    top: 58,
    width: 110,
    textAlign: "center",
  },

  mapMarkerMain: {
    position: "absolute",
    left: 218,
    top: 158,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#7D92BD",
    borderWidth: 3,
    borderColor: "#D4DEEF",
    alignItems: "center",
    justifyContent: "center",
  },

  mapMarkerSmallOne: {
    position: "absolute",
    right: 98,
    top: 122,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#91A4CC",
    borderWidth: 3,
    borderColor: "#D4DEEF",
    alignItems: "center",
    justifyContent: "center",
  },

  mapExpandButton: {
    position: "absolute",
    right: 16,
    top: 14,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  todayHeader: {
    paddingHorizontal: 30,
    paddingTop: 26,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  todayTitle: {
    color: "#000000",
    fontSize: 25,
    fontWeight: "900",
    letterSpacing: -0.6,
  },

  editText: {
    color: "#2158E8",
    fontSize: 17,
    fontWeight: "800",
  },

  timelineList: {
    paddingHorizontal: 24,
    gap: 14,
  },

  timelineLine: {
    position: "absolute",
    left: 42,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: "#2158E8",
    borderRadius: 999,
  },

  todayCard: {
    minHeight: 98,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
  },

  todayCardActive: {
    borderWidth: 1.5,
    borderColor: "#2158E8",
    backgroundColor: "#FFFFFF",
  },

  numberCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 18,
  },

  numberText: {
    color: "#2158E8",
    fontSize: 17,
    fontWeight: "900",
  },

  placeInfo: {
    flex: 1,
    paddingRight: 10,
  },

  placeName: {
    color: "#1F2937",
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: -0.4,
    marginBottom: 5,
  },

  placeAddress: {
    color: "#64748B",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 7,
  },

  timeRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  timeText: {
    color: "#64748B",
    fontSize: 15,
    fontWeight: "700",
    marginLeft: 5,
  },

  alternativeButton: {
    height: 44,
    borderRadius: 14,
    backgroundColor: "#2158E8",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2158E8",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 4,
  },

  disabledAlternativeButton: {
    opacity: 0.55,
  },

  alternativeButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    marginRight: 3,
  },

  memoList: {
    marginTop: -6,
    paddingLeft: 92,
    gap: 9,
  },

  memoCard: {
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DDE5F0",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  memoText: {
    color: "#1F2937",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 8,
  },

  emptyDayCard: {
    minHeight: 150,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DDE5F0",
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 24,
  },

  emptyDayTitle: {
    color: "#1F2937",
    fontSize: 17,
    fontWeight: "900",
    marginTop: 12,
    marginBottom: 7,
    textAlign: "center",
  },

  gapRecommendationSection: {
    marginTop: -4,
    marginBottom: 18,
  },

  emptyDayDescription: {
    color: "#94A3B8",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 20,
  },
});
