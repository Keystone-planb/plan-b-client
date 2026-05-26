import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";

import PlanADayTabs from "../components/planA/PlanADayTabs";
import PlanAMapPreview from "../components/planA/PlanAMapPreview";
import { getPlaceDetail } from "../../api/places/place";
import PlanAEmptyPlaceCard from "../components/planA/PlanAEmptyPlaceCard";
import PlanAPlaceCard from "../components/planA/PlanAPlaceCard";

import {
  DayOption,
  PlaceItem,
  SelectedPlaceParam,
  SelectedPlacesParam,
} from "../types/planA";
import { TravelSchedule } from "../types/schedule";
import { usePlanAPlaces } from "../hooks/usePlanAPlaces";

import {
  getTripTransportMode,
  updateTripTransportMode,
} from "../../api/schedules/transportMode";

type TransportMode = "WALK" | "TRANSIT" | "CAR";

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
      day?: number;
      selectedDay?: number;
      selectedPlace?: SelectedPlaceParam;
      selectedPlaces?: SelectedPlacesParam;
      isEditMode?: boolean;
      gapSelectedPlace?: {
        id?: string;
        placeId?: string;
        googlePlaceId?: string;
        name?: string;
        address?: string;
        category?: string;
        latitude?: number;
        longitude?: number;
      };
    };
  };
};

const toCoordinateNumber = (value: unknown) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const pickCoordinate = (source: Record<string, any>, keys: string[]) => {
  for (const key of keys) {
    const value = key
      .split(".")
      .reduce<any>((acc, part) => acc?.[part], source);
    const parsed = toCoordinateNumber(value);

    if (parsed !== null) return parsed;
  }

  return null;
};

type BottomTabName = "PlanX" | "Home" | "Profile";
type IconName = keyof typeof Ionicons.glyphMap;
type TimePickerTarget = "visitTime" | "endTime";

const DEFAULT_DAY_OPTIONS: DayOption[] = [
  { id: 1, label: "Day 1" },
  { id: 2, label: "Day 2" },
  { id: 3, label: "Day 3" },
];

const BOTTOM_TABS: BottomTabName[] = ["PlanX", "Home", "Profile"];

const EDIT_TRANSPORT_OPTIONS: Array<{
  key: TransportMode;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  { key: "WALK", label: "도보", icon: "walk-outline" },
  { key: "TRANSIT", label: "대중교통", icon: "train-outline" },
  { key: "CAR", label: "자동차", icon: "car-outline" },
];

const getTransportLabel = (mode: TransportMode) => {
  switch (mode) {
    case "TRANSIT":
      return "대중교통";
    case "CAR":
      return "자동차";
    case "WALK":
    default:
      return "도보";
  }
};

const getSortTimeValue = (time?: string | null) => {
  if (!time) return Number.MAX_SAFE_INTEGER;

  const normalized = time.trim();
  const match = normalized.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?/i);

  if (!match) return Number.MAX_SAFE_INTEGER;

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const period = match[3]?.toUpperCase();

  if (period === "PM" && hour < 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;

  return hour * 60 + minute;
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

const getTripDayCount = (startDate?: string, endDate?: string) => {
  if (!startDate || !endDate) return DEFAULT_DAY_OPTIONS.length;

  const start = new Date(startDate.replace(/\./g, "-"));
  const end = new Date(endDate.replace(/\./g, "-"));

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return DEFAULT_DAY_OPTIONS.length;
  }

  const diffMs = end.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;

  return Math.max(DEFAULT_DAY_OPTIONS.length, diffDays);
};

const getCurrentTripDay = (startDate?: string, endDate?: string) => {
  const dayCount = getTripDayCount(startDate, endDate);

  if (!startDate || !endDate) {
    return 1;
  }

  const start = new Date(startDate.replace(/\./g, "-"));
  const today = new Date();

  if (Number.isNaN(start.getTime())) {
    return 1;
  }

  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffDays = Math.floor(
    (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays < 0) {
    return 1;
  }

  if (diffDays >= dayCount) {
    return dayCount;
  }

  return diffDays + 1;
};

const makeDayOptions = (startDate?: string, endDate?: string): DayOption[] => {
  const dayCount = getTripDayCount(startDate, endDate);

  return Array.from({ length: dayCount }, (_, index) => ({
    id: index + 1,
    label: `Day ${index + 1}`,
  }));
};

const formatDisplayDate = (value: string) => {
  if (!value) return "";
  return value.replace(/-/g, ".");
};

const normalizeTimeText = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "";
};

const parseLegacyDisplayTime = (time?: string | null) => {
  const normalized = normalizeTimeText(time);

  if (!normalized || normalized === "시간 미정") {
    return {
      visitTime: "",
      endTime: "",
    };
  }

  const [start, end] = normalized.split(/\s*-\s*/);

  return {
    visitTime: normalizeTimeText(start),
    endTime: normalizeTimeText(end),
  };
};

const getPlaceVisitTime = (place: PlaceItem) => {
  return (
    normalizeTimeText(place.visitTime) ||
    parseLegacyDisplayTime(place.time).visitTime
  );
};

const getPlaceEndTime = (place: PlaceItem) => {
  return (
    normalizeTimeText(place.endTime) ||
    parseLegacyDisplayTime(place.time).endTime
  );
};

const getPlaceDisplayTime = (place: PlaceItem) => {
  const visitTime = getPlaceVisitTime(place);
  const endTime = getPlaceEndTime(place);

  if (visitTime && endTime) return `${visitTime} - ${endTime}`;
  if (visitTime) return visitTime;
  if (endTime) return endTime;
  if (place.time?.trim()) return place.time;

  return "";
};

const parsePickerTimeValue = (value: string) => {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

  if (!match) {
    return null;
  }

  return {
    hour: Number(match[1]),
    minute: Number(match[2]),
    period: match[3].toUpperCase() as "AM" | "PM",
  };
};

const formatPickerTimeValue = (
  hour: number,
  minute: number,
  period: "AM" | "PM",
) => {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(
    2,
    "0",
  )} ${period}`;
};

const addOneHourToDisplayTime = (value: string) => {
  const parsed = parsePickerTimeValue(value);

  if (!parsed) {
    return "";
  }

  let nextHour = parsed.hour + 1;
  let nextPeriod = parsed.period;

  if (nextHour === 12) {
    nextPeriod = parsed.period === "AM" ? "PM" : "AM";
  }

  if (nextHour > 12) {
    nextHour = 1;
  }

  return formatPickerTimeValue(nextHour, parsed.minute, nextPeriod);
};

const getMissingTimePlaceNames = (schedule: TravelSchedule) => {
  return schedule.days
    .flatMap((day) => day.places)
    .filter((place) => {
      return !getPlaceVisitTime(place) || !getPlaceEndTime(place);
    })
    .map((place) => place.name)
    .filter(Boolean);
};

const getBottomTabIconName = (
  tabName: BottomTabName,
  focused: boolean,
): IconName => {
  if (tabName === "PlanX") return focused ? "time" : "time-outline";
  if (tabName === "Home") return focused ? "home" : "home-outline";
  return focused ? "person" : "person-outline";
};

export default function PlanAScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();

  const [selectedDay, setSelectedDay] = useState(1);
  const [isEditMode, setIsEditMode] = useState(
    route?.params?.isEditMode === true,
  );
  const [isEditPreviewMode, setIsEditPreviewMode] = useState(false);
  const scrollViewRef = useRef<ScrollView | null>(null);
  const scrollOffsetYRef = useRef(0);
  const shouldRestoreScrollRef = useRef(false);

  const [timePickerPlace, setTimePickerPlace] = useState<PlaceItem | null>(
    null,
  );
  const [timePickerTarget, setTimePickerTarget] =
    useState<TimePickerTarget>("visitTime");
  const [timePickerHour, setTimePickerHour] = useState(12);
  const [timePickerMinute, setTimePickerMinute] = useState(0);

  const scheduleId = route?.params?.scheduleId;
  const tripId = route?.params?.tripId ?? route?.params?.serverTripId;
  const serverTripId = route?.params?.serverTripId ?? route?.params?.tripId;
  const tripName = route?.params?.tripName ?? "신나는 강릉 여행";
  const startDate = route?.params?.startDate ?? "2026.04.21";
  const endDate = route?.params?.endDate ?? "2026.04.23";
  const location = route?.params?.location ?? "";

  const resolvedTripId = tripId ?? serverTripId;
  const routeSelectedDay =
    typeof route?.params?.selectedDay === "number" ? route.params.selectedDay
    : typeof route?.params?.day === "number" ? route.params.day
    : undefined;

  const routeTransportMode = route?.params?.transportMode ?? "WALK";

  const [transportMode, setTransportMode] =
    useState<TransportMode>(routeTransportMode);
  const [transportLabel, setTransportLabel] = useState(
    route?.params?.transportLabel ?? getTransportLabel(routeTransportMode),
  );
  const [editTransportModesByPair, setEditTransportModesByPair] = useState<
    Record<string, TransportMode>
  >({});
  const [transportModalTarget, setTransportModalTarget] = useState<{
    pairKey: string;
    beforePlaceName?: string;
    afterPlaceName?: string;
  } | null>(null);

  const handleOpenEditTransportModal = (params: {
    pairKey: string;
    beforePlaceName?: string;
    afterPlaceName?: string;
  }) => {
    setTransportModalTarget((prev) =>
      prev?.pairKey === params.pairKey ? null : params,
    );
  };

  const handleSelectEditTransportMode = (mode: TransportMode) => {
    if (!transportModalTarget?.pairKey) return;

    setEditTransportModesByPair((prev) => ({
      ...prev,
      [transportModalTarget.pairKey]: mode,
    }));
  };

  const handleConfirmEditTransportMode = () => {
    setTransportModalTarget(null);
  };

  const handleChangeTransportMode = async (nextMode: TransportMode) => {
    try {
      if (!resolvedTripId) {
        Alert.alert("이동수단 변경 실패", "tripId가 없습니다.");
        return;
      }

      await updateTripTransportMode(Number(resolvedTripId), nextMode);

      setTransportMode(nextMode);
      setTransportLabel(getTransportLabel(nextMode));

      Alert.alert(
        "이동수단 변경 완료",
        `${getTransportLabel(nextMode)}로 변경되었습니다.`,
      );
    } catch (error) {
      console.log("[transport-mode/patch] failed:", error);
      Alert.alert("이동수단 변경 실패", "잠시 후 다시 시도해주세요.");
    }
  };

  const selectedPlace = route?.params?.selectedPlace;
  const selectedPlaces = route?.params?.selectedPlaces;
  const gapSelectedPlace = route?.params?.gapSelectedPlace;

  const normalizedGapSelectedPlace: SelectedPlaceParam | undefined =
    gapSelectedPlace?.id && gapSelectedPlace?.name ?
      {
        id: String(gapSelectedPlace.id),
        placeId:
          gapSelectedPlace.placeId ?
            String(gapSelectedPlace.placeId)
          : undefined,
        googlePlaceId:
          gapSelectedPlace.googlePlaceId ?
            String(gapSelectedPlace.googlePlaceId)
          : undefined,
        name: gapSelectedPlace.name,
        address: gapSelectedPlace.address,
        category: gapSelectedPlace.category,
        latitude: gapSelectedPlace.latitude,
        longitude: gapSelectedPlace.longitude,
        time: "",
        day: selectedDay,
      }
    : undefined;

  const dayOptions = makeDayOptions(startDate, endDate);

  const {
    schedule,
    saveError,
    saveSuccessMessage,
    saving,
    handleSaveSchedule,
    handleUpdateTripName,
    loadingSchedule,
    loadError,
    currentPlaces,

    memoDrafts,
    editingPlaceId,
    editingPlaceName,
    editingPlaceVisitTime,
    editingPlaceEndTime,
    editingMemo,
    editingMemoText,

    setEditingMemoText,
    handleChangeMemoDraft,
    handleAddMemo,
    handleClearMemo,
    handleStartEditPlace,
    handleCancelEditPlace,
    handleSaveEditPlace,
    handleDeletePlace,
    setEditingPlaceName,
    setEditingPlaceVisitTime,
    setEditingPlaceEndTime,
    handleUpdatePlaceTime,
    handleStartEditMemo,
    handleCancelEditMemo,
    handleSaveEditMemo,
    handleDeleteMemo,

    resetEditingState,
  } = usePlanAPlaces({
    selectedDay,
    selectedPlace,
    selectedPlaces,
    gapSelectedPlace: normalizedGapSelectedPlace,
    tripName,
    startDate,
    endDate,
    location,
    scheduleId,
    serverTripId: resolvedTripId,
  });

  const effectiveDayOptions = makeDayOptions(
    schedule.startDate,
    schedule.endDate,
  );

  const [resolvedMapPlaces, setResolvedMapPlaces] = useState(currentPlaces);

  useEffect(() => {
    let mounted = true;

    const resolveMapCoordinates = async () => {
      const nextPlaces = await Promise.all(
        currentPlaces.map(async (place) => {
          const rawPlace = place as PlaceItem & Record<string, any>;

          const existingLatitude = pickCoordinate(rawPlace, [
            "latitude",
            "lat",
            "y",
            "mapY",
            "location.latitude",
            "location.lat",
            "coordinate.latitude",
            "coordinate.lat",
          ]);

          const existingLongitude = pickCoordinate(rawPlace, [
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
          ]);

          if (existingLatitude !== null && existingLongitude !== null) {
            return {
              ...place,
              latitude: existingLatitude,
              longitude: existingLongitude,
            };
          }

          const placeId = rawPlace.googlePlaceId ?? rawPlace.placeId;

          if (!placeId) return place;

          try {
            const detail = await getPlaceDetail(placeId);

            return {
              ...place,
              latitude:
                pickCoordinate(detail as Record<string, any>, [
                  "latitude",
                  "lat",
                  "y",
                  "mapY",
                  "location.latitude",
                  "location.lat",
                  "geometry.location.lat",
                  "coordinate.latitude",
                  "coordinate.lat",
                ]) ?? place.latitude,
              longitude:
                pickCoordinate(detail as Record<string, any>, [
                  "longitude",
                  "lng",
                  "lon",
                  "x",
                  "mapX",
                  "location.longitude",
                  "location.lng",
                  "geometry.location.lng",
                  "coordinate.longitude",
                  "coordinate.lng",
                ]) ?? place.longitude,
            };
          } catch {
            return place;
          }
        }),
      );

      if (mounted) {
        setResolvedMapPlaces(nextPlaces);
      }
    };

    resolveMapCoordinates();

    return () => {
      mounted = false;
    };
  }, [currentPlaces]);

  useEffect(() => {
    const firstSelectedDay = selectedPlaces?.[0]?.day ?? selectedPlace?.day;

    if (!firstSelectedDay) return;

    const currentTripDay = getCurrentTripDay(startDate, endDate);
    setSelectedDay(currentTripDay);
  }, [selectedPlace?.day, selectedPlaces]);

  useEffect(() => {
    const loadTransportMode = async () => {
      if (!resolvedTripId) return;

      try {
        const serverMode = await getTripTransportMode(Number(resolvedTripId));

        if (
          serverMode === "WALK" ||
          serverMode === "TRANSIT" ||
          serverMode === "CAR"
        ) {
          setTransportMode(serverMode);
          setTransportLabel(getTransportLabel(serverMode));
        }
      } catch (error) {
        console.log("[PlanA] transport mode load failed:", error);
      }
    };

    loadTransportMode();
  }, [resolvedTripId]);

  const handleBack = () => {
    Alert.alert(
      "저장하지 않고 나갈까요?",
      "저장하지 않은 변경사항은 사라질 수 있습니다.",
      [
        {
          text: "취소",
          style: "cancel",
        },
        {
          text: "나가기",
          style: "destructive",
          onPress: () => {
            navigation.reset({
              index: 0,
              routes: [
                {
                  name: "Main",
                  params: {
                    refreshSchedules: true,
                  },
                },
              ],
            });
          },
        },
      ],
    );
  };

  const moveToMain = (savedSchedule: TravelSchedule = schedule) => {
    const nextTripId =
      savedSchedule.serverTripId ?? resolvedTripId ?? serverTripId ?? tripId;

    navigation.reset({
      index: 0,
      routes: [
        {
          name: "Main",
          params: {
            refreshSchedules: true,
            refreshMainAt: Date.now(),
            savedScheduleId: savedSchedule.id,
            tripId: nextTripId,
            serverTripId: nextTripId,
          },
        },
      ],
    });
  };

  const handleSavePlanA = async (
    options: { moveToMainAfterSave?: boolean } = {},
  ): Promise<boolean> => {
    const { moveToMainAfterSave = false } = options;

    const missingTimePlaceNames = getMissingTimePlaceNames(schedule);

    if (missingTimePlaceNames.length > 0) {
      Alert.alert(
        "시간 입력 필요",
        `방문 시작/종료 시간이 없는 장소가 있습니다.\n\n${missingTimePlaceNames
          .slice(0, 3)
          .join("\n")}${missingTimePlaceNames.length > 3 ? "\n..." : ""}`,
      );

      return false;
    }

    resetEditingState();

    try {
      const savedSchedule = await handleSaveSchedule();

      console.log("[PlanA] 저장 완료:", {
        scheduleId: savedSchedule.id,
        tripId: savedSchedule.serverTripId,
        tripName: savedSchedule.tripName,
        moveToMainAfterSave,
      });

      if (Platform.OS === "web") {
        const browserWindow = globalThis as typeof globalThis & {
          alert?: (message?: string) => void;
        };

        if (moveToMainAfterSave) {
          browserWindow.alert?.(
            "일정 저장이 완료되었습니다. 홈으로 이동합니다.",
          );
          moveToMain(savedSchedule);
          return true;
        }

        browserWindow.alert?.(
          "변경사항이 저장되었습니다.",
        );

        setTimeout(() => {
          navigation.goBack();
        }, 900);

        return true;
      }

      if (moveToMainAfterSave) {
        Alert.alert("일정 저장 완료", "저장 후 홈으로 이동합니다.", [
          {
            text: "확인",
            onPress: () => moveToMain(savedSchedule),
          },
        ]);

        return true;
      }

      navigation.navigate("OngoingSchedule", {
          scheduleId: savedSchedule.id,
          tripId: savedSchedule.serverTripId ?? route?.params?.tripId,
          serverTripId: savedSchedule.serverTripId ?? route?.params?.serverTripId,
          tripName: savedSchedule.tripName,
          startDate: savedSchedule.startDate,
          endDate: savedSchedule.endDate,
          location: savedSchedule.location,
          transportMode: route?.params?.transportMode,
          transportLabel: route?.params?.transportLabel,
          selectedDay: selectedDay,
          refreshPlanAAt: Date.now(),
          successToastMessage: "변경사항이 저장되었습니다.",
        });

        return true;
    } catch (error) {
      console.log("[PlanA] 저장 실패:", error);

      Alert.alert(
        "저장 실패",
        "일정을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.",
      );

      return false;
    }
  };

  const handleBottomTabPress = (tabName: BottomTabName) => {
    if (tabName === "Home") {
      moveToMain(schedule);
      return;
    }

    navigation.navigate("Main", {
      screen: tabName,
      params: {
        tripId: resolvedTripId,
        serverTripId: resolvedTripId,
      },
    });
  };

  const handleChangeDay = (dayId: number) => {
    setSelectedDay(dayId);
    resetEditingState();
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
        period: "AM" as const,
      };
    }

    let rawHour = Number(match[1]);
    const rawMinute = Number(match[2]);
    const explicitPeriod = match[3]?.toUpperCase() as "AM" | "PM" | undefined;

    if (explicitPeriod) {
      return {
        hour: Math.min(Math.max(rawHour, 1), 12),
        minute: Math.min(Math.max(rawMinute, 0), 55),
        period: explicitPeriod,
      };
    }

    if (rawHour === 0) {
      return {
        hour: 12,
        minute: Math.min(Math.max(rawMinute, 0), 55),
        period: "AM" as const,
      };
    }

    if (rawHour === 12) {
      return {
        hour: 12,
        minute: Math.min(Math.max(rawMinute, 0), 55),
        period: "PM" as const,
      };
    }

    if (rawHour > 12) {
      return {
        hour: Math.min(Math.max(rawHour - 12, 1), 12),
        minute: Math.min(Math.max(rawMinute, 0), 55),
        period: "PM" as const,
      };
    }

    return {
      hour: Math.min(Math.max(rawHour, 1), 12),
      minute: Math.min(Math.max(rawMinute, 0), 55),
      period: "AM" as const,
    };
  };

  const getTimeValueForTarget = (
    place: PlaceItem,
    target: TimePickerTarget,
  ) => {
    if (target === "visitTime") return getPlaceVisitTime(place);
    return getPlaceEndTime(place);
  };

  const openTimePicker = (
    place: PlaceItem,
    target: TimePickerTarget = "visitTime",
  ) => {
    const parsed = parseTimeForPicker(getTimeValueForTarget(place, target));

    setTimePickerPlace(place);
    setTimePickerTarget(target);
    setTimePickerHour(parsed.hour);
    setTimePickerMinute(parsed.minute);
  };

  const closeTimePicker = () => {
    setTimePickerPlace(null);
  };

  const increaseHour = () => {
    setTimePickerHour((prev) => (prev >= 23 ? 0 : prev + 1));
  };

  const decreaseHour = () => {
    setTimePickerHour((prev) => (prev <= 0 ? 23 : prev - 1));
  };

  const increaseMinute = () => {
    setTimePickerMinute((prev) => {
      if (prev >= 55) {
        increaseHour();
        return 0;
      }

      return prev + 5;
    });
  };

  const decreaseMinute = () => {
    setTimePickerMinute((prev) => {
      if (prev <= 0) {
        decreaseHour();
        return 55;
      }

      return prev - 5;
    });
  };

  const handleSwitchTimeTarget = (target: TimePickerTarget) => {
    if (!timePickerPlace) {
      setTimePickerTarget(target);
      return;
    }

    const currentPickerValue = `${padTimeUnit(timePickerHour)}:${padTimeUnit(
      timePickerMinute,
    )}`;

    const currentVisitTime = getPlaceVisitTime(timePickerPlace);
    const currentEndTime = getPlaceEndTime(timePickerPlace);

    const nextVisitTime =
      timePickerTarget === "visitTime" ? currentPickerValue : currentVisitTime;
    const nextEndTime =
      timePickerTarget === "endTime" ? currentPickerValue : currentEndTime;

    const temporaryPlace: PlaceItem = {
      ...timePickerPlace,
      visitTime: nextVisitTime || null,
      endTime: nextEndTime || null,
      time:
        nextVisitTime && nextEndTime ?
          `${nextVisitTime} - ${nextEndTime}`
        : nextVisitTime || nextEndTime || "",
    };

    const parsed = parseTimeForPicker(
      getTimeValueForTarget(temporaryPlace, target),
    );

    setTimePickerPlace(temporaryPlace);
    setTimePickerTarget(target);
    setTimePickerHour(parsed.hour);
    setTimePickerMinute(parsed.minute);
  };

  const handleSaveTimePicker = () => {
    if (!timePickerPlace) return;

    const selectedTime = `${padTimeUnit(
      timePickerHour,
    )}:${padTimeUnit(timePickerMinute)}`;

    const currentVisitTime = getPlaceVisitTime(timePickerPlace);
    const currentEndTime = getPlaceEndTime(timePickerPlace);

    const nextVisitTime =
      timePickerTarget === "visitTime" ? selectedTime : currentVisitTime;
    const nextEndTime =
      timePickerTarget === "endTime" ? selectedTime
      : currentEndTime ? currentEndTime
      : timePickerTarget === "visitTime" ? addOneHourToDisplayTime(selectedTime)
      : currentEndTime;

    handleUpdatePlaceTime(timePickerPlace.id, nextVisitTime, nextEndTime);
    closeTimePicker();
  };

  useEffect(() => {
    if (typeof routeSelectedDay !== "number") return;

    setSelectedDay(routeSelectedDay);
  }, [routeSelectedDay]);

  const handleAddPlace = () => {
    shouldRestoreScrollRef.current = true;

    navigation.navigate("AddScheduleLocation", {
      day: selectedDay,
      selectedDay,
      scheduleId: schedule.id,
      tripId: schedule.serverTripId ?? resolvedTripId,
      serverTripId: schedule.serverTripId ?? resolvedTripId,
      tripName: schedule.tripName,
      startDate: schedule.startDate,
      endDate: schedule.endDate,
      location: schedule.location,
      transportMode,
      transportLabel,
      existingPlaces: currentPlaces,
      returnScreen: "PlanAEdit",
      isEditMode: true,
    });
  };

  const renderPlaceCard = (place: PlaceItem, index: number) => {
    const displayTime = getPlaceDisplayTime(place);
    const sortedPlaces = sortPlacesByTime(currentPlaces);
    const nextPlace = sortedPlaces[index + 1];
    const isLast = index >= sortedPlaces.length - 1;
    const pairKey = `${String(place.id)}-${String(nextPlace?.id ?? index + 1)}`;
    const selectedTransportMode = editTransportModesByPair[pairKey];
    const selectedTransportLabel =
      selectedTransportMode ? getTransportLabel(selectedTransportMode) : null;

    return (
      <View key={place.id} style={styles.viewTimelineGroup}>
        <View style={styles.viewPlaceRow}>
          <View style={styles.viewSidebarColumn}>
            <View style={styles.viewBlueDot} />
            {!isLast ? <View style={styles.viewBlueLine} /> : null}
          </View>

          <View style={styles.viewPlaceCardContent}>
            <PlanAPlaceCard
              place={place}
              index={index}
              memoDraft={memoDrafts[place.id] ?? ""}
              editingMemo={editingMemo}
              editingMemoText={editingMemoText}
              onDeletePlace={handleDeletePlace}
              onQuickEditTime={(place) => openTimePicker(place, "visitTime")}
              onChangeMemoDraft={handleChangeMemoDraft}
              onAddMemo={handleAddMemo}
              onClearMemo={handleClearMemo}
              onStartEditMemo={handleStartEditMemo}
              onCancelEditMemo={handleCancelEditMemo}
              onSaveEditMemo={handleSaveEditMemo}
              onDeleteMemo={handleDeleteMemo}
              onChangeEditingMemoText={setEditingMemoText}
            />
          </View>
        </View>

        {!isLast ?
          <View style={styles.viewTransportRow}>
            <View style={styles.viewTransportIconColumn}>
              <Ionicons
                name={
                  selectedTransportMode === "TRANSIT" ? "train-outline"
                  : selectedTransportMode === "CAR" ? "car-outline"
                  : "walk-outline"
                }
                size={15}
                color="#94A3B8"
              />
            </View>

            <View style={styles.viewTransportAxisColumn}>
              <View style={styles.viewTransportLineCover} />
              <View style={styles.viewTransportDashedLine} />
            </View>

            <View style={styles.viewTransportCard}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.viewTransportHeader}
                onPress={() =>
                  handleOpenEditTransportModal({
                    pairKey,
                    beforePlaceName: place.name,
                    afterPlaceName: nextPlace?.name,
                  })
                }
              >
                <View style={styles.viewTransportTextGroup}>
                  <Text style={styles.viewTransportTitle}>
                    {selectedTransportLabel ?
                      `${selectedTransportLabel}로 이동`
                    : "이동수단 추가하기"}
                  </Text>

                  <Text style={styles.viewTransportDescription}>
                    {selectedTransportLabel ?
                      `${place.visitTime ?? ""} - ${nextPlace?.visitTime ?? ""}`
                    : "팀 이동수단을 추가해주세요"}
                  </Text>
                </View>

                <Ionicons
                  name={
                    transportModalTarget?.pairKey === pairKey ?
                      "chevron-up"
                    : "chevron-down"
                  }
                  size={17}
                  color="#CBD5E1"
                />
              </TouchableOpacity>

              {transportModalTarget?.pairKey === pairKey ?
                <View style={styles.viewTransportPickerBody}>
                  <View style={styles.viewTransportOptionRow}>
                    {EDIT_TRANSPORT_OPTIONS.map((option) => {
                      const selected =
                        editTransportModesByPair[pairKey] === option.key;

                      return (
                        <TouchableOpacity
                          key={option.key}
                          activeOpacity={0.85}
                          style={[
                            styles.viewTransportOptionButton,
                            selected ?
                              styles.viewTransportOptionButtonActive
                            : null,
                          ]}
                          onPress={() =>
                            handleSelectEditTransportMode(option.key)
                          }
                        >
                          <Text
                            style={[
                              styles.viewTransportOptionText,
                              selected ?
                                styles.viewTransportOptionTextActive
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
                    style={styles.viewTransportConfirmButton}
                    onPress={handleConfirmEditTransportMode}
                  >
                    <Text style={styles.viewTransportConfirmText}>확인</Text>
                  </TouchableOpacity>
                </View>
              : null}
            </View>
          </View>
        : null}
      </View>
    );
  };

  const renderEditablePlaceCard = (place: PlaceItem, index: number) => {
    const sortedPlaces = sortPlacesByTime(currentPlaces);
    const nextPlace = sortedPlaces[index + 1];
    const isLast = index >= sortedPlaces.length - 1;
    const pairKey = `${String(place.id)}-${String(nextPlace?.id ?? index + 1)}`;
    const selectedTransportMode = editTransportModesByPair[pairKey];
    const selectedTransportLabel =
      selectedTransportMode ? getTransportLabel(selectedTransportMode) : null;

    return (
      <View key={place.id} style={styles.editTimelineGroup}>
        <View style={styles.editPlaceRow}>
          <View style={styles.editSidebarColumn}>
            <View style={styles.editBlueDot} />
            {!isLast ? <View style={styles.editBlueLine} /> : null}
          </View>

          <View style={styles.editPlaceCardContent}>
            <PlanAPlaceCard
              place={place}
              index={index}
              memoDraft={memoDrafts[place.id] ?? ""}
              editingMemo={editingMemo}
              editingMemoText={editingMemoText}
              onDeletePlace={handleDeletePlace}
              onQuickEditTime={(place) => openTimePicker(place, "visitTime")}
              onChangeMemoDraft={handleChangeMemoDraft}
              onAddMemo={handleAddMemo}
              onClearMemo={handleClearMemo}
              onStartEditMemo={handleStartEditMemo}
              onCancelEditMemo={handleCancelEditMemo}
              onSaveEditMemo={handleSaveEditMemo}
              onDeleteMemo={handleDeleteMemo}
              onChangeEditingMemoText={setEditingMemoText}
            />
          </View>
        </View>

        {!isLast ?
          <View style={styles.editTransportRow}>
            <View style={styles.editTransportIconColumn}>
              <Ionicons
                name={
                  selectedTransportMode === "TRANSIT" ? "train-outline"
                  : selectedTransportMode === "CAR" ? "car-outline"
                  : "walk-outline"
                }
                size={15}
                color="#94A3B8"
              />
            </View>

            <View style={styles.editTransportAxisColumn}>
              <View style={styles.editTransportLineCover} />
              <View style={styles.editTransportDashedLine} />
            </View>

            <View style={styles.editTransportCard}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.editTransportHeader}
                onPress={() =>
                  handleOpenEditTransportModal({
                    pairKey,
                    beforePlaceName: place.name,
                    afterPlaceName: nextPlace?.name,
                  })
                }
              >
                <View style={styles.editTransportTextGroup}>
                  <Text style={styles.editTransportTitle}>
                    {selectedTransportLabel ?
                      `${selectedTransportLabel}로 이동`
                    : "이동수단을 선택해주세요"}
                  </Text>

                  <Text style={styles.editTransportDescription}>
                    {selectedTransportLabel ?
                      `${place.visitTime ?? ""} - ${nextPlace?.visitTime ?? ""}`
                    : "장소와 장소 사이 이동수단 설정"}
                  </Text>
                </View>

                <Ionicons
                  name={
                    transportModalTarget?.pairKey === pairKey ?
                      "chevron-up"
                    : "chevron-down"
                  }
                  size={17}
                  color="#CBD5E1"
                />
              </TouchableOpacity>

              {transportModalTarget?.pairKey === pairKey ?
                <View style={styles.editTransportPickerBody}>
                  <View style={styles.editTransportOptionRow}>
                    {EDIT_TRANSPORT_OPTIONS.map((option) => {
                      const selected =
                        editTransportModesByPair[pairKey] === option.key;

                      return (
                        <TouchableOpacity
                          key={option.key}
                          activeOpacity={0.85}
                          style={[
                            styles.editTransportOptionButton,
                            selected ?
                              styles.editTransportOptionButtonActive
                            : null,
                          ]}
                          onPress={() =>
                            handleSelectEditTransportMode(option.key)
                          }
                        >
                          <Text
                            style={[
                              styles.editTransportOptionText,
                              selected ?
                                styles.editTransportOptionTextActive
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
                    style={styles.editTransportConfirmButton}
                    onPress={handleConfirmEditTransportMode}
                  >
                    <Text style={styles.editTransportConfirmText}>확인</Text>
                  </TouchableOpacity>
                </View>
              : null}
            </View>
          </View>
        : null}
      </View>
    );
  };

  const timePickerPreviewText = `${padTimeUnit(
    timePickerHour,
  )}:${padTimeUnit(timePickerMinute)}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
          scrollEventThrottle={16}
          onScroll={(event) => {
            scrollOffsetYRef.current = event.nativeEvent.contentOffset.y;
          }}
        >
          <View style={styles.headerSection}>
            <View style={styles.topHeaderRow}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBack}
                activeOpacity={0.8}
              >
                <Ionicons name="chevron-back" size={26} color="#64748B" />
              </TouchableOpacity>

              <View style={styles.headerInfo}>
                {isEditMode ?
                  <TextInput
                    style={styles.planTitleInput}
                    value={schedule.tripName}
                    onChangeText={handleUpdateTripName}
                    placeholder="일정 제목을 입력해주세요"
                    placeholderTextColor="#94A3B8"
                    maxLength={30}
                    returnKeyType="done"
                  />
                : <Text style={styles.planTitle} numberOfLines={1}>
                    {schedule.tripName}
                  </Text>
                }

                <Text style={styles.planDate}>
                  {formatDisplayDate(schedule.startDate)} -{" "}
                  {formatDisplayDate(schedule.endDate)}
                </Text>
</View>

              <View style={styles.headerActionRow}>
                {isEditPreviewMode || isEditMode ?
                  <TouchableOpacity
                    style={[
                      styles.editModeButton,
                      isEditMode && styles.editModeButtonActive,
                    ]}
                    activeOpacity={0.8}
                    onPress={async () => {
                      if (isEditPreviewMode && !isEditMode) {
                        resetEditingState();
                        setIsEditMode(true);
                        return;
                      }

                      const saved = await handleSavePlanA({
                        moveToMainAfterSave: false,
                      });

                      if (saved) {
                        setIsEditMode(false);
                        setIsEditPreviewMode(false);
                      }
                    }}
                  >
                    <Ionicons
                      name={isEditMode ? "checkmark" : "create-outline"}
                      size={15}
                      color={isEditMode ? "#FFFFFF" : "#2158E8"}
                    />

                    <Text
                      style={[
                        styles.editModeButtonText,
                        isEditMode && styles.editModeButtonTextActive,
                      ]}
                    >
                      {isEditMode ? "완료" : "편집"}
                    </Text>
                  </TouchableOpacity>
                : null}
              </View>
            </View>

            {saveSuccessMessage ?
              <View style={styles.saveFeedbackBox}>
                <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
                <Text style={styles.saveSuccessText}>{saveSuccessMessage}</Text>
              </View>
            : null}

            {saveError ?
              <View style={[styles.saveFeedbackBox, styles.saveErrorBox]}>
                <Ionicons name="alert-circle" size={14} color="#EF4444" />
                <Text style={styles.saveErrorText}>{saveError}</Text>
              </View>
            : null}

            {loadingSchedule ?
              <View style={styles.saveFeedbackBox}>
                <Ionicons
                  name="cloud-download-outline"
                  size={14}
                  color="#2158E8"
                />
                <Text style={styles.loadingText}>
                  저장된 일정을 불러오는 중...
                </Text>
              </View>
            : null}

            {saving ?
              <View style={styles.saveFeedbackBox}>
                <Ionicons name="sync-outline" size={14} color="#2158E8" />
                <Text style={styles.loadingText}>일정을 저장하는 중...</Text>
              </View>
            : null}

            {loadError ?
              <View style={[styles.saveFeedbackBox, styles.saveErrorBox]}>
                <Ionicons name="alert-circle" size={14} color="#EF4444" />
                <Text style={styles.saveErrorText}>{loadError}</Text>
              </View>
            : null}

            <View style={styles.dayTabsWrapper}>
              <PlanADayTabs
                days={effectiveDayOptions}
                selectedDay={selectedDay}
                onChangeDay={handleChangeDay}
              />
            </View>
          </View>

          <PlanAMapPreview places={sortPlacesByTime(resolvedMapPlaces)} />

          <View style={styles.sheet}>
            <View style={styles.sheetHandleWrapper}>
              <View style={styles.sheetHandle} />
            </View>

            {currentPlaces.length > 0 ?
              <>
                <View style={styles.scheduleSectionHeader}>
                  <Text style={styles.scheduleSectionTitle}>일정</Text>

                  {!isEditPreviewMode && !isEditMode ?
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        resetEditingState();
                        setIsEditPreviewMode(true);
                      }}
                    >
                      <Text style={styles.scheduleEditText}>수정</Text>
                    </TouchableOpacity>
                  : null}
                </View>

                <View style={styles.roadmapList}>
                {false ? <View pointerEvents="none" style={styles.roadmapLine} /> : null}

                {sortPlacesByTime(currentPlaces).map((place, index) =>
                  isEditPreviewMode || isEditMode ?
                    renderEditablePlaceCard(place, index)
                  : renderPlaceCard(place, index),
                )}
                </View>
              </>
            : <View style={styles.emptyScheduleRow}>
                <View style={styles.timelineColumn}>
                  <View style={styles.timelineCircle} />
                </View>

                <View style={styles.emptyScheduleContent}>
                  <PlanAEmptyPlaceCard
                    selectedDay={selectedDay}
                    onPress={handleAddPlace}
                  />
                </View>
              </View>
            }

            {isEditMode ?
              <TouchableOpacity
                style={[
                  styles.addPlaceButton,
                  (loadingSchedule || saving) &&
                    styles.bottomSaveButtonDisabled,
                ]}
                activeOpacity={0.85}
                onPress={handleAddPlace}
                disabled={loadingSchedule || saving}
              >
                <Ionicons name="add-circle-outline" size={18} color="#2158E8" />
                <Text style={styles.addPlaceButtonText}>장소 추가</Text>
              </TouchableOpacity>
            : null}
          </View>
        </ScrollView>

      </View>



      <Modal
        visible={Boolean(timePickerPlace)}
        transparent
        animationType="fade"
        onRequestClose={closeTimePicker}
      >
        <View style={styles.timeModalBackdrop}>
          <View style={styles.timeModalCard}>
            <View style={styles.timeModalHeader}>
              <Text style={styles.timeModalTitle}>방문 시간 설정</Text>

              <TouchableOpacity
                style={styles.timeModalCloseButton}
                activeOpacity={0.75}
                onPress={closeTimePicker}
              >
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.timeModalPlaceName} numberOfLines={1}>
              {timePickerPlace?.name ?? "장소"}
            </Text>

            <View style={styles.timeTargetTabs}>
              <TouchableOpacity
                style={[
                  styles.timeTargetTab,
                  timePickerTarget === "visitTime" &&
                    styles.timeTargetTabActive,
                ]}
                activeOpacity={0.8}
                onPress={() => handleSwitchTimeTarget("visitTime")}
              >
                <Text
                  style={[
                    styles.timeTargetTabText,
                    timePickerTarget === "visitTime" &&
                      styles.timeTargetTabTextActive,
                  ]}
                >
                  시작 시간
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.timeTargetTab,
                  timePickerTarget === "endTime" && styles.timeTargetTabActive,
                ]}
                activeOpacity={0.8}
                onPress={() => handleSwitchTimeTarget("endTime")}
              >
                <Text
                  style={[
                    styles.timeTargetTabText,
                    timePickerTarget === "endTime" &&
                      styles.timeTargetTabTextActive,
                  ]}
                >
                  종료 시간
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.timePickerPreview}>
              <View
                style={[
                  styles.timePickerSummaryCard,
                  timePickerTarget === "visitTime" &&
                    styles.timePickerSummaryCardActive,
                ]}
              >
                <Text
                  style={[
                    styles.timePickerSummaryLabel,
                    timePickerTarget === "visitTime" &&
                      styles.timePickerSummaryLabelActive,
                  ]}
                >
                  시작 시간
                </Text>

                <Text
                  style={[
                    styles.timePickerSummaryValue,
                    timePickerTarget === "visitTime" &&
                      styles.timePickerSummaryValueActive,
                  ]}
                >
                  {timePickerTarget === "visitTime"
                    ? timePickerPreviewText
                    : timePickerPlace
                      ? getPlaceVisitTime(timePickerPlace)
                      : "00:00"}
                </Text>
              </View>

              <View
                style={[
                  styles.timePickerSummaryCard,
                  timePickerTarget === "endTime" &&
                    styles.timePickerSummaryCardActive,
                ]}
              >
                <Text
                  style={[
                    styles.timePickerSummaryLabel,
                    timePickerTarget === "endTime" &&
                      styles.timePickerSummaryLabelActive,
                  ]}
                >
                  종료 시간
                </Text>

                <Text
                  style={[
                    styles.timePickerSummaryValue,
                    timePickerTarget === "endTime" &&
                      styles.timePickerSummaryValueActive,
                  ]}
                >
                  {timePickerTarget === "endTime"
                    ? timePickerPreviewText
                    : timePickerPlace
                      ? getPlaceEndTime(timePickerPlace)
                      : "00:00"}
                </Text>
              </View>
            </View>

            <View style={styles.timePickerControls}>
              <View style={styles.timePickerColumn}>
                <TouchableOpacity
                  style={styles.timePickerArrow}
                  activeOpacity={0.75}
                  onPress={() => setTimePickerHour((prev) => (prev <= 0 ? 23 : prev - 1))}
                >
                  <Ionicons name="chevron-up" size={22} color="#64748B" />
                </TouchableOpacity>

                <View style={styles.timePickerValueBox}>
                  <Text style={styles.timePickerValueText}>
                    {padTimeUnit(timePickerHour)}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.timePickerArrow}
                  activeOpacity={0.75}
                  onPress={() => setTimePickerHour((prev) => (prev >= 23 ? 0 : prev + 1))}
                >
                  <Ionicons name="chevron-down" size={22} color="#64748B" />
                </TouchableOpacity>
              </View>

              <Text style={styles.timePickerColon}>:</Text>

              <View style={styles.timePickerColumn}>
                <TouchableOpacity
                  style={styles.timePickerArrow}
                  activeOpacity={0.75}
                  onPress={() => setTimePickerMinute((prev) => (prev <= 0 ? 55 : prev - 5))}
                >
                  <Ionicons name="chevron-up" size={22} color="#64748B" />
                </TouchableOpacity>

                <View style={styles.timePickerValueBox}>
                  <Text style={styles.timePickerValueText}>
                    {padTimeUnit(timePickerMinute)}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.timePickerArrow}
                  activeOpacity={0.75}
                  onPress={() => setTimePickerMinute((prev) => (prev >= 55 ? 0 : prev + 5))}
                >
                  <Ionicons name="chevron-down" size={22} color="#64748B" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.timeModalButtonRow}>
              <TouchableOpacity
                style={styles.timeModalCancelButton}
                activeOpacity={0.85}
                onPress={closeTimePicker}
              >
                <Text style={styles.timeModalCancelText}>취소</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.timeModalSaveButton}
                activeOpacity={0.85}
                onPress={handleSaveTimePicker}
              >
                <Text style={styles.timeModalSaveText}>저장</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  saveButtonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    marginLeft: 43,
  },

  secondarySaveButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: "#F8FBFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 6,
  },

  secondarySaveButtonText: {
    color: "#2158E8",
    fontSize: 14,
    fontWeight: "900",
  },

  primarySaveButton: {
    flex: 1.15,
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: "#2158E8",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    shadowColor: "#2158E8",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },

  primarySaveButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },

  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  screen: { flex: 1, backgroundColor: "#F4F7FC", position: "relative" },
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: "#F4F7FC",
    paddingBottom: 130,
  },
  headerSection: {
    backgroundColor: "#F8FBFF",
    paddingTop: 26,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  topHeaderRow: {
    minHeight: 86,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  backButton: {
    width: 32,
    height: 40,
    alignItems: "flex-start",
    justifyContent: "center",
    marginTop: 2,
  },
  headerInfo: { flex: 1, paddingLeft: 6, paddingRight: 8 },
  planTitle: {
    color: "#1C2534",
    fontSize: 25,
    fontWeight: "900",
    letterSpacing: -0.7,
    marginBottom: 7,
  },
  planTitleInput: {
    minHeight: 38,
    color: "#1C2534",
    fontSize: 25,
    fontWeight: "900",
    letterSpacing: -0.7,
    marginBottom: 7,
    paddingVertical: 0,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#CFE3FF",
  },
  planDate: {
    color: "#627187",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
  },
  transportButtonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },
  transportButton: {
    minHeight: 30,
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  transportButtonActive: {
    backgroundColor: "#2158E8",
    borderColor: "#2158E8",
  },
  planTransport: {
    color: "#627187",
    fontSize: 13,
    fontWeight: "800",
  },
  planTransportActive: {
    color: "#FFFFFF",
  },
  headerActionRow: {
    minWidth: 92,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingTop: 6,
  },
  headerIconButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },

  editModeButton: {
    minHeight: 38,
    borderRadius: 999,
    backgroundColor: "#E7F0FF",
    borderWidth: 1,
    borderColor: "#CFE3FF",
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },

  editModeButtonActive: {
    backgroundColor: "#2158E8",
    borderColor: "#2158E8",
  },

  editModeButtonText: {
    color: "#2158E8",
    fontSize: 12,
    fontWeight: "900",
  },

  editModeButtonTextActive: {
    color: "#FFFFFF",
  },
  headerIconDisabled: { opacity: 0.55 },
  saveFeedbackBox: {
    marginTop: 8,
    minHeight: 32,
    borderRadius: 10,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  saveErrorBox: { backgroundColor: "#FEF2F2", borderColor: "#FECACA" },
  saveSuccessText: {
    flex: 1,
    color: "#16A34A",
    fontSize: 12,
    fontWeight: "800",
  },
  saveErrorText: {
    flex: 1,
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "800",
  },
  loadingText: {
    flex: 1,
    color: "#2158E8",
    fontSize: 12,
    fontWeight: "800",
  },
  dayTabsWrapper: {
    width: "100%",
    alignItems: "flex-start",
    justifyContent: "center",
    marginTop: 18,
  },
  sheet: {
    minHeight: 430,
    marginTop: -1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 14,
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  sheetHandleWrapper: { alignItems: "center", marginBottom: 20 },
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#D6DFEA",
  },
  emptyScheduleRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "stretch",
  },
  emptyScheduleContent: { flex: 1 },
  addPlaceButton: {
    marginTop: 10,
    marginLeft: 43,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: "#ECF5FF",
    borderWidth: 1,
    borderColor: "#CFE3FF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  addPlaceButtonText: {
    color: "#2158E8",
    fontSize: 14,
    fontWeight: "900",
  },
  bottomSaveButton: {
    marginTop: 14,
    marginLeft: 43,
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: "#2158E8",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    shadowColor: "#2158E8",
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4,
  },
  bottomSaveButtonDisabled: { opacity: 0.55 },
  bottomSaveButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
  roadmapList: {
    position: "relative",
    width: "100%",
  },
  roadmapLine: {
    position: "absolute",
    left: 16,
    top: 22,
    bottom: 26,
    width: 2,
    borderRadius: 999,
    backgroundColor: "#2563EB",
  },
  simplePlaceRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    position: "relative",
    zIndex: 1,
  },
  timelineColumn: {
    width: 34,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  timelineCircle: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    borderWidth: 4,
    borderColor: "#2563EB",
    backgroundColor: "#FFFFFF",
    zIndex: 2,
  },
  simplePlaceCard: {
    flex: 1,
    minHeight: 74,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: "center",
    shadowColor: "#0F172A",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  simplePlaceContent: {
    flex: 1,
    minWidth: 0,
  },
  simplePlaceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  simplePlaceTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "900",
    color: "#1E293B",
  },
  simpleTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 0,
  },
  simplePlaceTime: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: "#94A3B8",
  },

  timeActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  simpleMemoPreviewBox: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },

  simpleMemoPreviewText: {
    flex: 1,
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
  },

  simpleTimeAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  simpleTimeActionText: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "900",
  },
  bottomTabOuter: {
    position: "absolute",
    left: 24,
    right: 24,
    alignItems: "center",
    zIndex: 999,
    elevation: 999,
  },
  bottomTabContainer: {
    width: "100%",
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    borderRadius: 29,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE6F2",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
  },
  bottomTabButton: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  timeModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  timeModalCard: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 18,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 24,
  },
  timeModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  timeModalTitle: { color: "#1E293B", fontSize: 20, fontWeight: "900" },
  timeModalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  timeModalPlaceName: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 14,
  },
  timeTargetTabs: {
    height: 42,
    borderRadius: 13,
    backgroundColor: "#F1F5F9",
    padding: 4,
    flexDirection: "row",
    marginBottom: 14,
  },
  timeTargetTab: {
    flex: 1,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  timeTargetTabActive: { backgroundColor: "#2158E8" },
  timeTargetTabText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "900",
  },
  timeTargetTabTextActive: { color: "#FFFFFF" },
  timePickerPreview: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },

  timePickerSummaryCard: {
    flex: 1,
    minHeight: 72,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: "center",
  },

  timePickerSummaryCardActive: {
    backgroundColor: "#EEF4FF",
    borderColor: "#2158E8",
  },

  timePickerSummaryLabel: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 6,
  },

  timePickerSummaryLabelActive: {
    color: "#2158E8",
  },

  timePickerSummaryValue: {
    color: "#111827",
    fontSize: 24,
    fontWeight: "900",
  },

  timePickerSummaryValueActive: {
    color: "#2158E8",
  },
  timePickerControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 20,
  },
  timePickerColumn: { alignItems: "center", gap: 8 },
  timePickerArrow: {
    width: 54,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  timePickerValueBox: {
    width: 54,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },
  timePickerValueText: { color: "#111827", fontSize: 18, fontWeight: "900" },
  timePickerColon: {
    color: "#64748B",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 2,
  },
  timeModalCancelText: { color: "#64748B", fontSize: 14, fontWeight: "900" },
  timeModalButtonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },

  timeModalCancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },

  timeModalSaveButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#2158E8",
    alignItems: "center",
    justifyContent: "center",
  },
  timeModalSaveText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" },

  editTimelineGroup: {
    width: "100%",
    position: "relative",
    zIndex: 2,
  },

  editPlaceRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
  },

  editSidebarColumn: {
    width: 34,
    alignItems: "center",
    position: "relative",
    marginRight: 10,
  },

  editBlueDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: "#2563EB",
    backgroundColor: "#FFFFFF",
    marginTop: 18,
    zIndex: 3,
  },


  editBlueLine: {
    width: 2,
    flex: 1,
    minHeight: 96,
    backgroundColor: "#2563EB",
    marginTop: 4,
  },

  editPlaceCardContent: {
    flex: 1,
    minWidth: 0,
    paddingRight: 2,
  },

  editTransportRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "stretch",
    marginTop: -2,
    marginBottom: 18,
  },

  editTransportIconColumn: {
    width: 34,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  editTransportAxisColumn: {
    width: 34,
    alignItems: "center",
    position: "relative",
    marginLeft: -44,
    marginRight: 10,
  },

  editTransportLineCover: {
    position: "absolute",
    top: -10,
    bottom: -10,
    width: 18,
    backgroundColor: "#FFFFFF",
    zIndex: 1,
  },

  editTransportDashedLine: {
    flex: 1,
    minHeight: 70,
    borderLeftWidth: 2,
    borderStyle: "dashed",
    borderColor: "#CBD5E1",
    zIndex: 2,
  },

  editTransportCard: {
    flex: 1,
    minHeight: 72,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    overflow: "hidden",
  },

  editTransportTextGroup: {
    flex: 1,
    paddingRight: 10,
  },

  editTransportTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#64748B",
  },

  editTransportDescription: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: "600",
    color: "#94A3B8",
  },

  transportModeModalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },

  transportModeModalDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.35)",
  },

  transportModeModalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 28,
  },

  transportModeModalHandle: {
    alignSelf: "center",
    width: 42,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#CBD5E1",
    marginBottom: 18,
  },

  transportModeModalTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111827",
  },

  transportModeModalDescription: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "600",
    color: "#94A3B8",
  },

  transportModeOptionRow: {
    marginTop: 18,
    gap: 10,
  },

  transportModeOptionButton: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  transportModeOptionButtonActive: {
    borderColor: "#2563EB",
    backgroundColor: "#2563EB",
  },

  transportModeOptionText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "800",
    color: "#475569",
  },

  transportModeOptionTextActive: {
    color: "#FFFFFF",
  },

  transportModeModalCancelButton: {
    height: 50,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },

  transportModeModalCancelText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#475569",
  },

  editTransportHeader: {
    minHeight: 58,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  editTransportPickerBody: {
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingHorizontal: 10,
    paddingBottom: 10,
  },

  editTransportOptionRow: {
    flexDirection: "row",
    gap: 8,
    paddingTop: 10,
  },

  editTransportOptionButton: {
    flex: 1,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D9E2F2",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  editTransportOptionButtonActive: {
    borderColor: "#64748B",
    backgroundColor: "#64748B",
  },

  editTransportOptionText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748B",
  },

  editTransportOptionTextActive: {
    color: "#FFFFFF",
  },

  editTransportConfirmButton: {
    height: 38,
    borderRadius: 8,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },

  editTransportConfirmText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  viewTimelineGroup: {
    width: "100%",
    position: "relative",
    zIndex: 2,
  },

  viewPlaceRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
  },

  viewSidebarColumn: {
    width: 34,
    alignItems: "center",
    position: "relative",
    marginRight: 10,
  },

  viewBlueDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: "#2563EB",
    backgroundColor: "#FFFFFF",
    marginTop: 31,
    zIndex: 3,
  },

  viewBlueLine: {
    width: 2,
    flex: 1,
    minHeight: 72,
    backgroundColor: "#2563EB",
    marginTop: 4,
  },

  viewPlaceCardContent: {
    flex: 1,
    minWidth: 0,
    paddingRight: 2,
  },

  viewTransportRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "stretch",
    marginTop: -2,
    marginBottom: 14,
    position: "relative",
  },

  viewTransportIconColumn: {
    position: "absolute",
    left: -10,
    top: 0,
    bottom: 0,
    width: 34,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 4,
  },

  viewTransportAxisColumn: {
    width: 34,
    alignItems: "center",
    position: "relative",
    marginRight: 10,
  },

  viewTransportLineCover: {
    position: "absolute",
    top: -10,
    bottom: -10,
    width: 18,
    backgroundColor: "#FFFFFF",
    zIndex: 1,
  },

  viewTransportDashedLine: {
    flex: 1,
    minHeight: 54,
    borderLeftWidth: 2,
    borderStyle: "dashed",
    borderColor: "#CBD5E1",
    zIndex: 2,
  },

  viewTransportCard: {
    flex: 1,
    minHeight: 58,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    overflow: "hidden",
  },

  viewTransportTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#64748B",
  },

  viewTransportDescription: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: "600",
    color: "#94A3B8",
  },

  viewTransportHeader: {
    minHeight: 58,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  viewTransportTextGroup: {
    flex: 1,
    paddingRight: 10,
  },

  viewTransportPickerBody: {
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingHorizontal: 10,
    paddingBottom: 10,
  },

  viewTransportOptionRow: {
    flexDirection: "row",
    gap: 8,
    paddingTop: 10,
  },

  viewTransportOptionButton: {
    flex: 1,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D9E2F2",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  viewTransportOptionButtonActive: {
    borderColor: "#64748B",
    backgroundColor: "#64748B",
  },

  viewTransportOptionText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748B",
  },

  viewTransportOptionTextActive: {
    color: "#FFFFFF",
  },

  viewTransportConfirmButton: {
    height: 38,
    borderRadius: 8,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },

  viewTransportConfirmText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#FFFFFF",
  },



  scheduleSectionHeader: {
    marginBottom: 14,
    paddingHorizontal: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  scheduleSectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#111827",
  },

  scheduleEditText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#2563EB",
  },
});
