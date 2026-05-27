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

const TRANSPORT_OPTIONS: Array<{
  key: TransportMode;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  {
    key: "WALK",
    label: "도보",
    icon: "walk-outline",
  },
  {
    key: "TRANSIT",
    label: "대중교통",
    icon: "train-outline",
  },
  {
    key: "CAR",
    label: "자동차",
    icon: "car-outline",
  },
];

const getTransportOption = (mode?: TransportMode) => {
  return (
    TRANSPORT_OPTIONS.find((option) => option.key === mode) ??
    TRANSPORT_OPTIONS[0]
  );
};

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

const getTripDayCount = (startDate?: string, endDate?: string) => {
  if (!startDate || !endDate) return 1;

  const start = new Date(startDate.replace(/\./g, "-"));
  const end = new Date(endDate.replace(/\./g, "-"));

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 1;
  }

  const diffMs = end.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;

  return Math.max(diffDays, 1);
};

const normalizeOngoingMemos = (memos?: any[]) => {
  if (!Array.isArray(memos)) return [];

  return memos
    .map((memo) => ({
      ...memo,
      id: String(memo?.id ?? memo?.memoId ?? `memo-${Date.now()}`),
      text: String(memo?.text ?? memo?.content ?? memo?.memo ?? "").trim(),
    }))
    .filter((memo) => memo.text.length > 0);
};

const makeDisplayDaysByDateRange = (
  startDate?: string,
  endDate?: string,
): ScheduleDay[] => {
  const dayCount = getTripDayCount(startDate, endDate);

  return Array.from({ length: dayCount }, (_, index) => ({
    day: index + 1,
    places: [],
  }));
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
      selectedDay?: number;
      selectedDayIndex?: number;
      refreshPlanAAt?: number;
      successToastMessage?: string;
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

const normalizeDateOnlyText = (value?: string | null) => {
  const normalized = String(value ?? "")
    .trim()
    .replace(/\./g, "-");

  const match = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!match) return "";

  return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
};

const getLocalDateOnlyText = (date = new Date()) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const getTodayTripDayIndex = (startDate?: string, endDate?: string) => {
  const startText = normalizeDateOnlyText(startDate);
  const endText = normalizeDateOnlyText(endDate);
  const todayText = getLocalDateOnlyText();

  if (!startText || !endText) return null;
  if (todayText < startText || todayText > endText) return null;

  const start = new Date(`${startText}T00:00:00`);
  const today = new Date(`${todayText}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(today.getTime())) {
    return null;
  }

  return Math.max(
    0,
    Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
  );
};

const getInitialSelectedDayIndex = (params: {
  startDate?: string;
  endDate?: string;
  selectedDay?: number;
  selectedDayIndex?: number;
}) => {
  if (
    typeof params.selectedDayIndex === "number" &&
    Number.isFinite(params.selectedDayIndex)
  ) {
    return Math.max(0, params.selectedDayIndex);
  }

  if (
    typeof params.selectedDay === "number" &&
    Number.isFinite(params.selectedDay)
  ) {
    return Math.max(0, params.selectedDay - 1);
  }

  return getTodayTripDayIndex(params.startDate, params.endDate) ?? 0;
};

const getMinutesFromTimeText = (value?: string | null) => {
  const normalized = String(value ?? "").trim();
  const firstTime = normalized.split("-")[0]?.trim() ?? normalized;
  const match = firstTime.match(/(?:T|\b)(\d{1,2}):(\d{2})\s*(AM|PM)?/i);

  if (!match) return null;

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const period = match[3]?.toUpperCase();

  if (period === "PM" && hour < 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;

  return hour * 60 + minute;
};

const isPlaceOngoingNow = (place: TodayPlace) => {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const startMinutes = getMinutesFromTimeText(place.visitTime ?? place.time);
  const endMinutes = getMinutesFromTimeText(
    place.endTime ?? getTimeRangeEndText(place.time),
  );

  if (startMinutes === null) return false;
  if (endMinutes === null) return currentMinutes >= startMinutes;

  return startMinutes <= currentMinutes && currentMinutes <= endMinutes;
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

  const initialSelectedDayIndex = getInitialSelectedDayIndex({
    startDate,
    endDate,
    selectedDay: params.selectedDay,
    selectedDayIndex: params.selectedDayIndex,
  });

  const [selectedDayIndex, setSelectedDayIndex] = useState(
    initialSelectedDayIndex,
  );

  const [isSheetCollapsed, setIsSheetCollapsed] = useState(false);
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
  const [transportModesByPair, setTransportModesByPair] = useState<
    Record<string, TransportMode>
  >({});
  const [transportPickerTarget, setTransportPickerTarget] = useState<{
    pairKey: string;
    beforePlaceName?: string;
    afterPlaceName?: string;
  } | null>(null);

  const scrollViewRef = useRef<ScrollView | null>(null);
  const focusedPlaceRef = useRef<View | null>(null);
  const hasAutoScrolledRef = useRef(false);

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

  const displayDays = useMemo(
    () => makeDisplayDaysByDateRange(startDate, endDate),
    [startDate, endDate],
  );

  useEffect(() => {
    if (displayDays.length === 0) return;

    const nextIndex = Math.min(
      Math.max(initialSelectedDayIndex, 0),
      Math.max(displayDays.length - 1, 0),
    );

    setSelectedDayIndex(nextIndex);
  }, [displayDays.length, initialSelectedDayIndex]);

  const normalizedRouteDays = useMemo<ScheduleDay[]>(() => {
    return displayDays.map((displayDay, index) => {
      const matchedDay =
        days.find((day) => Number(day.day) === Number(displayDay.day)) ??
        days[index];

      return {
        day: displayDay.day,
        places: Array.isArray(matchedDay?.places) ? matchedDay.places : [],
      };
    });
  }, [days, displayDays]);

  const normalizedServerDays = useMemo<ScheduleDay[]>(() => {
    return displayDays.map((displayDay) => {
      const matchedDay = serverDays.find(
        (day) => Number(day.day) === Number(displayDay.day),
      );

      return {
        day: displayDay.day,
        places: Array.isArray(matchedDay?.places) ? matchedDay.places : [],
      };
    });
  }, [serverDays, displayDays]);

  const { currentDay, places, mapPlaces, currentDayFallbackGaps } =
    useOngoingPlaces({
      days: normalizedRouteDays,
      serverDays: normalizedServerDays,
      editedPlacesByDay,
      deletedPlaceKeysByDay,
      selectedDayIndex,
      paramsPlaces: params.places,
      hasSamePlaceForMerge,
      getPlaceStartTimeValueForGap,
      getPlaceEndTimeValueForGap,
    });

  const [resolvedMapPlaces, setResolvedMapPlaces] = useState(mapPlaces);
  const [successToastMessage, setSuccessToastMessage] = useState("");

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

  useEffect(() => {
    const nextMessage = route?.params?.successToastMessage;

    if (!nextMessage) return;

    setSuccessToastMessage(String(nextMessage));

    const timer = setTimeout(() => {
      setSuccessToastMessage("");
    }, 1800);

    return () => clearTimeout(timer);
  }, [route?.params?.successToastMessage, route?.params?.refreshPlanAAt]);

  const hasPlaces = places.length > 0;
  const isCurrentTripOngoing = isTripOngoingByDate(startDate, endDate);
  const todayDayIndex = getTodayTripDayIndex(startDate, endDate);
  const isSelectedDayToday =
    isCurrentTripOngoing &&
    todayDayIndex !== null &&
    selectedDayIndex === todayDayIndex;

  const canEditSchedule = Boolean(resolvedTripId ?? scheduleId);

  useEffect(() => {
    if (!isSelectedDayToday) return;
    if (hasAutoScrolledRef.current) return;

    const timer = setTimeout(() => {
      focusedPlaceRef.current?.measureLayout(
        scrollViewRef.current as any,
        (_x, y) => {
          scrollViewRef.current?.scrollTo({
            y: Math.max(y - 120, 0),
            animated: true,
          });

          hasAutoScrolledRef.current = true;
        },
        () => {},
      );
    }, 500);

    return () => clearTimeout(timer);
  }, [isSelectedDayToday, selectedDayIndex, places.length]);

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

  const handleOpenTransportPicker = (params: {
    pairKey: string;
    beforePlaceName?: string;
    afterPlaceName?: string;
  }) => {
    setTransportPickerTarget((prev) =>
      prev?.pairKey === params.pairKey ? null : params,
    );
  };

  const handleSelectTransportMode = (mode: TransportMode) => {
    if (!transportPickerTarget?.pairKey) return;

    setTransportModesByPair((prev) => ({
      ...prev,
      [transportPickerTarget.pairKey]: mode,
    }));
  };

  const handleConfirmTransportMode = () => {
    setTransportPickerTarget(null);
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

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.screen}>
        <OngoingHeader styles={styles} onBack={handleBack} title={tripName} />

        {successToastMessage ?
          <View
            style={{
              marginHorizontal: 24,
              marginTop: 10,
              marginBottom: 4,
              paddingHorizontal: 14,
              paddingVertical: 11,
              borderRadius: 14,
              backgroundColor: "#ECFDF3",
              borderWidth: 1,
              borderColor: "#BBF7D0",
            }}
          >
            <Text
              style={{
                color: "#15803D",
                fontSize: 13,
                fontWeight: "800",
              }}
            >
              {successToastMessage}
            </Text>
          </View>
        : null}

        <ScrollView
          ref={scrollViewRef}
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

          <OngoingMapSection
            places={resolvedMapPlaces}
            styles={styles}
            collapsed={isSheetCollapsed}
            mapInteractive={isSheetCollapsed}
          />

          <View
            style={[
              localStyles.scheduleBottomSheet,
              isSheetCollapsed ?
                localStyles.scheduleBottomSheetCollapsed
              : localStyles.scheduleBottomSheetExpanded,
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.85}
              style={localStyles.sheetToggleButton}
              onPress={() => setIsSheetCollapsed((prev) => !prev)}
            >
              <Text style={localStyles.sheetToggleText}>
                {isSheetCollapsed ? "일정 펼치기" : "일정 접기"}
              </Text>

              <Ionicons
                name={isSheetCollapsed ? "chevron-up" : "chevron-down"}
                size={18}
                color="#94A3B8"
              />
            </TouchableOpacity>

            {!isSheetCollapsed ? (
              <>
                <View style={styles.todayHeader}>
            <Text style={styles.todayTitle}>
              {isSelectedDayToday ? "오늘 일정" : "일정"}
            </Text>

            {canEditSchedule ?
              <TouchableOpacity disabled={isSavingEdit} onPress={handleEdit}>
                <Text
                  style={[
                    styles.editText,
                    isSavingEdit && styles.disabledEditText,
                  ]}
                >
                  {isSavingEdit ? "저장 중..." : "수정"}
                </Text>
              </TouchableOpacity>
            : null}
          </View>

          <View style={styles.timelineList}>
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
              const focused = isSelectedDayToday && isPlaceOngoingNow(place);
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
                    ref={focused ? focusedPlaceRef : undefined}
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

                  {nextPlaceForGap ?
                    (() => {
                      const pairKey = `${String(gapBeforePlanId ?? placeKey)}-${String(
                        gapAfterPlanId ?? index + 1,
                      )}`;

                      const selectedTransportMode =
                        transportModesByPair[pairKey];
                      const selectedTransportOption = getTransportOption(
                        selectedTransportMode,
                      );

                      const currentEndMinutes =
                        getPlaceEndTimeValueForGap(place);
                      const nextStartMinutes =
                        getPlaceStartTimeValueForGap(nextPlaceForGap);

                      const hasMoveSlot =
                        Number.isFinite(currentEndMinutes) &&
                        Number.isFinite(nextStartMinutes) &&
                        nextStartMinutes > currentEndMinutes;

                      if (!hasMoveSlot) return null;

                      const isTransportExpanded =
                        transportPickerTarget?.pairKey === pairKey;

                      return (
                        <View style={localStyles.transportBetweenWrapper}>
                          <View style={localStyles.transportIconColumn}>
                            <Ionicons
                              name={selectedTransportOption.icon}
                              size={16}
                              color="#94A3B8"
                            />
                          </View>

                          <View style={localStyles.transportAxisColumn}>
                            <View style={localStyles.transportBlueLineCover} />
                            <View style={localStyles.transportDashedLine} />
                          </View>

                          <View style={localStyles.transportCardColumn}>
                            <View style={localStyles.transportAccordionCard}>
                              <TouchableOpacity
                                activeOpacity={0.85}
                                style={localStyles.transportAccordionHeader}
                                onPress={() =>
                                  handleOpenTransportPicker({
                                    pairKey,
                                    beforePlaceName: place.name,
                                    afterPlaceName: nextPlaceForGap.name,
                                  })
                                }
                              >
                                <View style={localStyles.transportAddTextGroup}>
                                  <Text style={localStyles.transportAddTitle}>
                                    {selectedTransportMode ?
                                      `${selectedTransportOption.label} 이동`
                                    : "이동수단 추가하기"}
                                  </Text>

                                  <Text
                                    style={localStyles.transportAddDescription}
                                  >
                                    {selectedTransportMode ?
                                      "장소 사이 이동수단이 설정되었어요"
                                    : "이동수단을 추가해주세요"}
                                  </Text>
                                </View>

                                <Ionicons
                                  name={
                                    isTransportExpanded ? "chevron-up" : (
                                      "chevron-down"
                                    )
                                  }
                                  size={18}
                                  color="#CBD5E1"
                                />
                              </TouchableOpacity>

                              {isTransportExpanded ?
                                <View
                                  style={localStyles.transportAccordionBody}
                                >
                                  <View
                                    style={localStyles.transportInlineOptionRow}
                                  >
                                    {TRANSPORT_OPTIONS.map((option) => {
                                      const selected =
                                        transportModesByPair[pairKey] ===
                                        option.key;

                                      return (
                                        <TouchableOpacity
                                          key={option.key}
                                          activeOpacity={0.85}
                                          style={[
                                            localStyles.transportInlineOptionButton,
                                            selected ?
                                              localStyles.transportInlineOptionButtonSelected
                                            : null,
                                          ]}
                                          onPress={() =>
                                            handleSelectTransportMode(
                                              option.key,
                                            )
                                          }
                                        >
                                          <Text
                                            style={[
                                              localStyles.transportInlineOptionText,
                                              selected ?
                                                localStyles.transportInlineOptionTextSelected
                                              : null,
                                            ]}
                                          >
                                            {option.label}
                                          </Text>
                                        </TouchableOpacity>
                                      );
                                    })}
                                  </View>

                                  <TouchableOpacity
                                    activeOpacity={0.85}
                                    style={
                                      localStyles.transportInlineConfirmButton
                                    }
                                    onPress={handleConfirmTransportMode}
                                  >
                                    <Text
                                      style={
                                        localStyles.transportInlineConfirmText
                                      }
                                    >
                                      확인
                                    </Text>
                                  </TouchableOpacity>
                                </View>
                              : null}
                            </View>
                          </View>
                        </View>
                      );
                    })()
                  : null}

                  {isSelectedDayToday ?
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
            </>
          ) : null}
          </View>

        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  mapLayerBody: {
    flex: 1,
  },

  mapLayer: {
    height: 620,
    position: "relative",
    backgroundColor: "#EDF3F9",
    overflow: "hidden",
  },

  scheduleBottomSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 430,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 10,
    paddingHorizontal: 24,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 10,
    overflow: "hidden",
  },

  scheduleBottomSheetExpanded: {
    transform: [{ translateY: 0 }],
  },

  scheduleBottomSheetCollapsed: {
    transform: [{ translateY: 340 }],
  },

  sheetToggleButton: {
    height: 42,
    borderRadius: 999,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 12,
  },

  sheetToggleText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748B",
  },

  sheetScroll: {
    flex: 1,
  },

  sheetScrollContent: {
    paddingBottom: 28,
  },

  transportBetweenWrapper: {
    flexDirection: "row",
    alignItems: "stretch",
    marginTop: 10,
    marginBottom: 16,
    zIndex: 5,
  },

  transportIconColumn: {
    width: 34,
    alignItems: "center",
    justifyContent: "center",
  },

  transportAxisColumn: {
    width: 18,
    alignItems: "center",
    position: "relative",
    marginLeft: -4,
    marginRight: 2,
  },

  transportBlueLineCover: {
    position: "absolute",
    top: -10,
    bottom: -10,
    width: 18,
    backgroundColor: "#FFFFFF",
    zIndex: 1,
  },

  transportDashedLine: {
    flex: 1,
    minHeight: 78,
    borderLeftWidth: 2,
    borderStyle: "dashed",
    borderColor: "#CBD5E1",
    zIndex: 2,
  },

  transportCardColumn: {
    flex: 1,
  },

  transportAccordionCard: {
    flex: 1,
    marginRight: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    overflow: "hidden",
  },

  transportAccordionHeader: {
    minHeight: 56,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  transportAddTextGroup: {
    flex: 1,
    paddingRight: 10,
  },

  transportAddTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#64748B",
  },

  transportAddDescription: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: "600",
    color: "#94A3B8",
  },

  transportAccordionBody: {
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingHorizontal: 10,
    paddingBottom: 10,
  },

  transportInlineOptionRow: {
    flexDirection: "row",
    gap: 8,
    paddingTop: 10,
  },

  transportInlineOptionButton: {
    flex: 1,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D9E2F2",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  transportInlineOptionButtonSelected: {
    borderColor: "#64748B",
    backgroundColor: "#64748B",
  },

  transportInlineOptionText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748B",
  },

  transportInlineOptionTextSelected: {
    color: "#FFFFFF",
  },

  transportInlineConfirmButton: {
    height: 38,
    borderRadius: 8,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },

  transportInlineConfirmText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#FFFFFF",
  },
});
