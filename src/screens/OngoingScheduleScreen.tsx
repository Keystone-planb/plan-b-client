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
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import OngoingPlaceCard from "../components/ongoing/OngoingPlaceCard";
import OngoingTimelineMarker from "../components/ongoing/OngoingTimelineMarker";
import OngoingGapRecommendationSection from "../components/ongoing/OngoingGapRecommendationSection";
import OngoingEmptyDayCard from "../components/ongoing/OngoingEmptyDayCard";
import OngoingDayTabs from "../components/ongoing/OngoingDayTabs";
import OngoingHeader from "../components/ongoing/OngoingHeader";
import OngoingMapSection from "../components/ongoing/OngoingMapSection";
import OngoingMemoList from "../components/ongoing/OngoingMemoList";
import styles from "../styles/ongoingScheduleStyles";
import useOngoingPlaces from "../hooks/ongoing/useOngoingPlaces";
import type { TripScheduleGap } from "../types/gapRecommendation";
import { getPlaceDetail } from "../../api/places/place";
import {
  deletePlanPlace,
  getTripDetail,
  updatePlanSchedule,
} from "../../api/schedules/server";

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

type TimeDraft = {
  visitTime: string;
  endTime: string;
};

type TimePickerTarget = "visitTime" | "endTime";

type EditingTimePlace = {
  placeKey: string;
  placeName?: string;
  visitTime: string;
  endTime: string;
} | null;

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

const normalizeEditableTimeInput = (value?: string | null) => {
  const normalized = value?.trim();

  if (!normalized) return "";

  const match = normalized.match(/^(\d{1,2}):(\d{2})$/);

  if (!match) return normalized;

  const hour = Math.min(23, Math.max(0, Number(match[1])));
  const minute = Math.min(59, Math.max(0, Number(match[2])));

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

const padTimeUnit = (value: number) => {
  return String(value).padStart(2, "0");
};

const parseTimeForPicker = (value?: string | null) => {
  const normalized = String(value ?? "").trim();
  const firstTime = normalized.split("-")[0]?.trim() ?? normalized;

  const match = firstTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);

  if (!match) {
    return {
      hour: 12,
      minute: 0,
    };
  }

  let hour = Number(match[1]);
  const minute = Math.min(Math.max(Number(match[2]), 0), 55);
  const period = match[3]?.toUpperCase();

  if (period === "PM" && hour < 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;

  return {
    hour: Math.min(Math.max(hour, 0), 23),
    minute,
  };
};

const addOneHourToDisplayTime = (value: string) => {
  const parsed = parseTimeForPicker(value);
  const nextHour = parsed.hour >= 23 ? 0 : parsed.hour + 1;

  return `${padTimeUnit(nextHour)}:${padTimeUnit(parsed.minute)}`;
};

const getEditablePlaceKey = (place: TodayPlace, index: number) => {
  return String(
    place.tripPlaceId ?? place.serverTripPlaceId ?? place.id ?? index,
  );
};

const getPlaceDisplayTime = (place: TodayPlace) => {
  const visitTime = normalizeDisplayTime(place.visitTime);
  const endTime = normalizeDisplayTime(place.endTime);

  if (visitTime && endTime) return `${visitTime} - ${endTime}`;
  if (visitTime) return visitTime;
  if (endTime) return endTime;

  return normalizeDisplayTime(place.time) || "시간 미정";
};

const normalizeMergeValue = (value?: string | number | null) => {
  return String(value ?? "")
    .trim()
    .toLowerCase();
};

const getPlaceMergeKeys = (place: TodayPlace) => {
  const keys = [
    place.tripPlaceId,
    place.serverTripPlaceId,
    place.placeId,
    place.googlePlaceId,
    place.id,
  ]
    .map(normalizeMergeValue)
    .filter(Boolean);

  const name = normalizeMergeValue(place.name);
  const address = normalizeMergeValue(place.address);
  const time = normalizeMergeValue(
    place.visitTime ?? place.time ?? place.endTime,
  );

  if (name && address) {
    keys.push(`name-address:${name}:${address}`);
  }

  if (name && time) {
    keys.push(`name-time:${name}:${time}`);
  }

  return Array.from(new Set(keys));
};

const hasSamePlaceForMerge = (a: TodayPlace, b: TodayPlace) => {
  const aKeys = getPlaceMergeKeys(a);
  const bKeys = new Set(getPlaceMergeKeys(b));

  return aKeys.some((key) => bKeys.has(key));
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

const isTripOngoingByDate = (startDate?: string, endDate?: string) => {
  if (!startDate || !endDate) {
    return false;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return false;
  }

  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  return start.getTime() <= today.getTime() && today.getTime() <= end.getTime();
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
  const [deletedPlaceKeysByDay, setDeletedPlaceKeysByDay] = useState<
    Record<number, string[]>
  >({});
  const [deletedPlaceRequestsByDay, setDeletedPlaceRequestsByDay] = useState<
    Record<
      number,
      Array<{
        placeKey: string;
        tripPlaceId: string | number;
        placeName?: string;
      }>
    >
  >({});
  const [editedPlacesByDay, setEditedPlacesByDay] = useState<
    Record<number, TodayPlace[]>
  >({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);

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
          console.log("[OngoingSchedule] getTripDetail 재조회 실패:", error);
        }
      };

      loadTripDetail();
    }, [resolvedTripId]),
  );


  const {
    currentDay,
    places,
    mapPlaces,
    currentDayFallbackGaps,
  } = useOngoingPlaces({
    days,
    serverDays,
    editedPlacesByDay,
    deletedPlaceKeysByDay,
    selectedDayIndex,
    paramsPlaces: params.places,
    hasSamePlaceForMerge,
    getPlaceStartTimeValueForGap,
    getPlaceEndTimeValueForGap,
  });

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

          if (hasValidCoordinate) return place;

          const googlePlaceId =
            place.googlePlaceId ?? place.placeId ?? place.id;

          if (!googlePlaceId) return place;

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

  const hasPlaces = places.length > 0;
  const isCurrentTripOngoing = isTripOngoingByDate(startDate, endDate);

  const handleBack = () => {
    navigation.goBack();
  };






  const getTimeValueForTarget = (
    place: EditingTimePlace,
    target: TimePickerTarget,
  ) => {
    if (!place) return "";

    if (target === "visitTime") {
      return place.visitTime || place.endTime || "";
    }

    return place.endTime || place.visitTime || "";
  };

  const handleAddPlace = () => {
    navigation.navigate("AddScheduleLocation", {
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
        scheduleId,
        tripId: resolvedTripId,
        serverTripId: resolvedTripId,
        day: selectedDayIndex + 1,
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
        <OngoingHeader styles={styles} onBack={handleBack} />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <OngoingDayTabs
            displayDays={displayDays}
            selectedDayIndex={selectedDayIndex}
            setSelectedDayIndex={setSelectedDayIndex}
            styles={styles}
          />

          <OngoingMapSection places={resolvedMapPlaces} styles={styles} />

          <View style={styles.todayHeader}>
            <Text style={styles.todayTitle}>
              {isCurrentTripOngoing ? "오늘 일정" : "예정 일정"}
            </Text>

            {isCurrentTripOngoing ?
              <TouchableOpacity disabled={isSavingEdit} onPress={handleEdit}>
                <Text
                  style={[
                    styles.editText,
                    isSavingEdit && styles.disabledEditText,
                  ]}
                >
                  {isSavingEdit ?
                    "저장 중..."
                  : "수정"}
                </Text>
              </TouchableOpacity>
            : null}
          </View>

          <View
            style={[
              styles.timelineList,
              !isCurrentTripOngoing && styles.futureTimelineList,
            ]}
          >
            <OngoingTimelineMarker
              hasPlaces={hasPlaces}
              placeCount={places.length}
              isCurrentTripOngoing={isCurrentTripOngoing}
              styles={styles}
            />

            {!hasPlaces ?
              <OngoingEmptyDayCard styles={styles} />
            : null}
            {places.map((place, index) => {
              const focused = isCurrentTripOngoing && index === 0;
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
              const placeKey = getEditablePlaceKey(place, index);
              const displayPlace = place;

              return (
                <React.Fragment key={`${placeKey}-${index}`}>
                  <OngoingPlaceCard
                    place={place}
                    index={index}
                    focused={focused}
                    isCurrentTripOngoing={isCurrentTripOngoing}
                    hasServerPlanId={hasServerPlanId}
                    displayPlace={displayPlace}
                    styles={styles}
                    getPlaceDisplayTime={getPlaceDisplayTime}
                    handleAlternative={handleAlternative}
                  />

                  <OngoingMemoList memos={place.memos} styles={styles} />
                  {isCurrentTripOngoing ?
                    <OngoingGapRecommendationSection
                      styles={styles}
                      navigation={navigation}
                      scheduleId={scheduleId}
                      resolvedTripId={resolvedTripId}
                      tripName={tripName}
                      startDate={startDate}
                      endDate={endDate}
                      location={location}
                      transportMode={transportMode}
                      transportLabel={transportLabel}
                      selectedDayIndex={selectedDayIndex}
                      currentGapPlanPairs={currentGapPlanPairs}
                      currentPairFallbackGaps={currentPairFallbackGaps}
                    />
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
