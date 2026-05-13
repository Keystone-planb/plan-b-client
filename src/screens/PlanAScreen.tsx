import React, { useEffect, useState } from "react";
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
      selectedPlace?: SelectedPlaceParam;
      selectedPlaces?: SelectedPlacesParam;
      gapSelectedPlace?: {
        id?: string;
        day?: number;
        placeId?: string;
        googlePlaceId?: string;
        name?: string;
        address?: string;
        category?: string;
        latitude?: number;
        longitude?: number;
      };
      refreshPlanAAt?: number;
  day?: number;
  selectedDay?: number;
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

const parseTripDate = (value?: string) => {
  if (!value) return null;

  const normalized = value.trim().replace(/[./]/g, "-");
  const matched = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);

  if (!matched) return null;

  const year = Number(matched[1]);
  const month = Number(matched[2]);
  const day = Number(matched[3]);

  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
};

const getTripDayCount = (startDate?: string, endDate?: string) => {
  const start = parseTripDate(startDate);
  const end = parseTripDate(endDate);

  if (!start || !end) return 1;

  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const diffDays = Math.floor(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );

  return Math.max(diffDays + 1, 1);
};


const getCurrentTripDay = (startDate?: string, endDate?: string) => {
  const dayCount = getTripDayCount(startDate, endDate);
  const start = parseTripDate(startDate);
  const today = new Date();

  if (!start) return 1;

  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffDays = Math.floor(
    (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays < 0) return 1;
  if (diffDays >= dayCount) return dayCount;

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

  const initialSelectedDay = Number(route?.params?.selectedDay ?? route?.params?.day ?? 1);
  const [isEditMode, setIsEditMode] = useState(false);
  const [timePickerPlace, setTimePickerPlace] = useState<PlaceItem | null>(
    null,
  );
  const [timePickerTarget, setTimePickerTarget] =
    useState<TimePickerTarget>("visitTime");
  const [timePickerHour, setTimePickerHour] = useState(12);
  const [timePickerMinute, setTimePickerMinute] = useState(0);
  const [timePickerErrorMessage, setTimePickerErrorMessage] = useState("");

  const scheduleId = route?.params?.scheduleId;
  const tripId = route?.params?.tripId ?? route?.params?.serverTripId;
  const serverTripId = route?.params?.serverTripId ?? route?.params?.tripId;
  const tripName = route?.params?.tripName ?? "신나는 강릉 여행";
  const startDate = route?.params?.startDate ?? "2026.04.21";
  const endDate = route?.params?.endDate ?? "2026.04.23";
  const location = route?.params?.location ?? "";

  const dayOptions = makeDayOptions(startDate, endDate);
  const maxDay = dayOptions.length;

  const [selectedDay, setSelectedDay] = useState(
    Math.min(Math.max(initialSelectedDay, 1), maxDay),
  );

  const resolvedTripId = tripId ?? serverTripId;
  const routeTransportMode = route?.params?.transportMode ?? "WALK";

  const [transportMode, setTransportMode] =
    useState<TransportMode>(routeTransportMode);
  const [transportLabel, setTransportLabel] = useState(
    route?.params?.transportLabel ?? getTransportLabel(routeTransportMode),
  );

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
        day: gapSelectedPlace.day ?? selectedDay,
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
      }
    : undefined;


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
    reloadKey: route?.params?.refreshPlanAAt,
  });

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

    setSelectedDay(
      Math.min(Math.max(Number(firstSelectedDay), 1), maxDay),
    );
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
  ) => {
    const { moveToMainAfterSave = false } = options;

    const missingTimePlaceNames = getMissingTimePlaceNames(schedule);

    if (missingTimePlaceNames.length > 0) {
      Alert.alert(
        "시간 입력 필요",
        `방문 시작/종료 시간이 없는 장소가 있습니다.\n\n${missingTimePlaceNames
          .slice(0, 3)
          .join("\n")}${missingTimePlaceNames.length > 3 ? "\n..." : ""}`,
      );

      return;
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
          return;
        }

        browserWindow.alert?.(
          "중간 저장이 완료되었습니다. 현재 Plan.A 화면에 저장되었습니다.",
        );
        return;
      }

      if (moveToMainAfterSave) {
        Alert.alert("일정 저장 완료", "저장 후 홈으로 이동합니다.", [
          {
            text: "확인",
            onPress: () => moveToMain(savedSchedule),
          },
        ]);

        return;
      }

      Alert.alert("중간 저장 완료", "현재 Plan.A 화면에 저장되었습니다.");
    } catch (error) {
      console.log("[PlanA] 저장 실패:", error);

      Alert.alert(
        "저장 실패",
        "일정을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.",
      );
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
    if (!value) {
      return {
        hour: 12,
        minute: 0,
      };
    }

    const matched = String(value).match(/(\d{1,2}):(\d{2})/);

    if (!matched) {
      return {
        hour: 12,
        minute: 0,
      };
    }

    const hour = Number(matched[1]);
    const minute = Number(matched[2]);

    return {
      hour: Number.isNaN(hour) ? 12 : Math.min(Math.max(hour, 0), 23),
      minute: Number.isNaN(minute) ? 0 : Math.min(Math.max(minute, 0), 59),
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

    if (
      nextVisitTime &&
      nextEndTime &&
      nextVisitTime >= nextEndTime
    ) {
      setTimePickerErrorMessage("종료 시간이 시작 시간보다 빨라요!");

      return;
    }

    handleUpdatePlaceTime(timePickerPlace.id, nextVisitTime, nextEndTime);
    closeTimePicker();
  };

  const handleAddPlace = () => {
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
    });
  };

  const renderPlaceCard = (place: PlaceItem, index: number) => {
    const displayTime = getPlaceDisplayTime(place);
    const visitTime = getPlaceVisitTime(place);
    const endTime = getPlaceEndTime(place);

    return (
      <View key={place.id} style={styles.simplePlaceRow}>
        <View style={styles.timelineColumn}>
          <View style={styles.timelineCircle} />
        </View>

        <View style={styles.simplePlaceCard}>
          <View style={styles.placeNumberBadge}>
            <Text style={styles.placeNumberBadgeText}>{index + 1}</Text>
          </View>

          <View style={styles.simplePlaceContent}>
            <View style={styles.simplePlaceHeader}>
              <Text style={styles.simplePlaceTitle} numberOfLines={1}>
                {place.name}
              </Text>
            </View>

            <View style={styles.simpleTimeRow}>
              <Ionicons name="time-outline" size={16} color="#94A3B8" />

              <Text style={styles.simplePlaceTime}>
                {displayTime || "시간을 설정해주세요"}
              </Text>
            </View>

            <View style={styles.timeActionRow}>
              <TouchableOpacity
                style={styles.simpleTimeAction}
                activeOpacity={0.75}
                onPress={() => openTimePicker(place, "visitTime")}
              >
                <Ionicons name="time-outline" size={14} color="#64748B" />
                <Text style={styles.simpleTimeActionText}>시간변경</Text>
              </TouchableOpacity>
            </View>

            {place.memos?.length > 0 ?
              <View style={styles.simpleMemoPreviewBox}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={14}
                  color="#94A3B8"
                />

                <Text style={styles.simpleMemoPreviewText} numberOfLines={2}>
                  {place.memos
                    .slice(0, 2)
                    .map((memo) => memo.text)
                    .filter(Boolean)
                    .join(" · ")}
                </Text>
              </View>
            : null}
          </View>
        </View>
      </View>
    );
  };

  const renderEditablePlaceCard = (place: PlaceItem, index: number) => {
    return (
      <PlanAPlaceCard
        key={place.id}
        place={place}
        index={index}
        memoDraft={memoDrafts[place.id] ?? ""}
        editingMemo={editingMemo}
        editingMemoText={editingMemoText}
        editingPlaceId={editingPlaceId}
        editingPlaceName={editingPlaceName}
        editingPlaceVisitTime={editingPlaceVisitTime}
        editingPlaceEndTime={editingPlaceEndTime}
        onStartEditPlace={handleStartEditPlace}
        onCancelEditPlace={handleCancelEditPlace}
        onSaveEditPlace={handleSaveEditPlace}
        onDeletePlace={handleDeletePlace}
        onChangeEditingPlaceName={setEditingPlaceName}
        onChangeEditingPlaceVisitTime={setEditingPlaceVisitTime}
        onChangeEditingPlaceEndTime={setEditingPlaceEndTime}
        onChangeMemoDraft={handleChangeMemoDraft}
        onAddMemo={handleAddMemo}
        onClearMemo={handleClearMemo}
        onStartEditMemo={handleStartEditMemo}
        onCancelEditMemo={handleCancelEditMemo}
        onSaveEditMemo={handleSaveEditMemo}
        onDeleteMemo={handleDeleteMemo}
        onChangeEditingMemoText={setEditingMemoText}
      />
    );
  };

  const timePickerPreviewText = `${padTimeUnit(
    timePickerHour,
  )}:${padTimeUnit(timePickerMinute)}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
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

                <View style={styles.transportButtonRow}>
                  {(["WALK", "TRANSIT", "CAR"] as TransportMode[]).map(
                    (mode) => {
                      const active = transportMode === mode;

                      return (
                        <TouchableOpacity
                          key={mode}
                          style={[
                            styles.transportButton,
                            active && styles.transportButtonActive,
                          ]}
                          activeOpacity={0.85}
                          onPress={() => handleChangeTransportMode(mode)}
                        >
                          <Text
                            style={[
                              styles.planTransport,
                              active && styles.planTransportActive,
                            ]}
                          >
                            {getTransportLabel(mode)}
                          </Text>
                        </TouchableOpacity>
                      );
                    },
                  )}
                </View>
              </View>

              <View style={styles.headerActionRow}>
                <TouchableOpacity
                  style={[
                    styles.editModeButton,
                    isEditMode && styles.editModeButtonActive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => {
                    resetEditingState();
                    setIsEditMode((prev) => !prev);
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
                    {isEditMode ? "편집 완료" : "일정 편집"}
                  </Text>
                </TouchableOpacity>
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
                days={dayOptions}
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
              <View style={styles.roadmapList}>
                <View pointerEvents="none" style={styles.roadmapLine} />

                {sortPlacesByTime(currentPlaces).map((place, index) =>
                  isEditMode ?
                    renderEditablePlaceCard(place, index)
                  : renderPlaceCard(place, index),
                )}
              </View>
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

            <TouchableOpacity
              style={styles.addPlaceButton}
              activeOpacity={0.85}
              onPress={handleAddPlace}
            >
              <Ionicons name="add-circle-outline" size={18} color="#2158E8" />
              <Text style={styles.addPlaceButtonText}>장소 추가</Text>
            </TouchableOpacity>

            <View style={styles.saveButtonRow}>
              <TouchableOpacity
                style={[
                  styles.secondarySaveButton,
                  (loadingSchedule || saving) &&
                    styles.bottomSaveButtonDisabled,
                ]}
                activeOpacity={0.85}
                onPress={() => handleSavePlanA({ moveToMainAfterSave: false })}
                disabled={loadingSchedule || saving}
              >
                <Ionicons name="save-outline" size={17} color="#2158E8" />
                <Text style={styles.secondarySaveButtonText}>
                  {saving ? "저장 중..." : "현재 변경 저장"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.primarySaveButton,
                  (loadingSchedule || saving) &&
                    styles.bottomSaveButtonDisabled,
                ]}
                activeOpacity={0.85}
                onPress={() => handleSavePlanA({ moveToMainAfterSave: true })}
                disabled={loadingSchedule || saving}
              >
                <Ionicons name="home-outline" size={17} color="#FFFFFF" />
                <Text style={styles.primarySaveButtonText}>
                  {saving ? "저장 중..." : "저장하고 홈으로"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <View
          pointerEvents="box-none"
          style={[
            styles.bottomTabOuter,
            {
              bottom: Platform.OS === "ios" ? Math.max(insets.bottom, 16) : 18,
            },
          ]}
        >
          <View style={styles.bottomTabContainer}>
            {BOTTOM_TABS.map((tabName) => {
              const focused = tabName === "Home";
              const iconName = getBottomTabIconName(tabName, focused);

              return (
                <TouchableOpacity
                  key={tabName}
                  accessibilityRole="button"
                  accessibilityState={focused ? { selected: true } : {}}
                  activeOpacity={0.75}
                  onPress={() => handleBottomTabPress(tabName)}
                  style={styles.bottomTabButton}
                >
                  <Ionicons
                    name={iconName}
                    size={34}
                    color={focused ? "#2B3445" : "#C8D1DF"}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
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

            <View style={styles.timeRangePreviewRow}>
              <View
                style={[
                  styles.timeRangePreviewBox,
                  timePickerTarget === "visitTime" &&
                    styles.timeRangePreviewBoxActive,
                ]}
              >
                <Text style={styles.timeRangePreviewLabel}>시작 시간</Text>
                <Text style={styles.timeRangePreviewText}>
                  {timePickerTarget === "visitTime" ?
                    timePickerPreviewText
                  : timePickerPlace ?
                    getPlaceVisitTime(timePickerPlace) || "--:--"
                  : "--:--"}
                </Text>
              </View>

              <View
                style={[
                  styles.timeRangePreviewBox,
                  timePickerTarget === "endTime" &&
                    styles.timeRangePreviewBoxActive,
                ]}
              >
                <Text style={styles.timeRangePreviewLabel}>종료 시간</Text>
                <Text style={styles.timeRangePreviewText}>
                  {timePickerTarget === "endTime" ?
                    timePickerPreviewText
                  : timePickerPlace ?
                    getPlaceEndTime(timePickerPlace) || "--:--"
                  : "--:--"}
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

            {timePickerErrorMessage ?
              <Text style={styles.timePickerErrorText}>
                {timePickerErrorMessage}
              </Text>
            : null}

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
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 6,
  },

  secondarySaveButtonText: {
    color: "#2158E8",
    fontSize: 13,
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
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },

  primarySaveButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  screen: { flex: 1, backgroundColor: "#F7F9FB", position: "relative" },
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: "#F7F9FB",
    paddingBottom: 130,
  },
  headerSection: {
    backgroundColor: "#FFFFFF",
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
    minHeight: 34,
    borderRadius: 999,
    backgroundColor: "#EEF5FF",
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
    minHeight: 100,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  placeNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  placeNumberBadgeText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
  simplePlaceContent: { flex: 1 },
  simplePlaceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  simplePlaceTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "900",
    color: "#1E293B",
  },
  simpleTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 9,
  },
  simplePlaceTime: {
    flex: 1,
    fontSize: 14,
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
  timeRangePreviewRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
    marginBottom: 14,
  },

  timeRangePreviewBox: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: "center",
  },

  timeRangePreviewBoxActive: {
    borderColor: "#2158E8",
    backgroundColor: "#EEF5FF",
  },

  timeRangePreviewLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "800",
    color: "#64748B",
    marginBottom: 6,
  },

  timeRangePreviewText: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "900",
    color: "#111827",
  },

  timePickerPreview: {
    minHeight: 68,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  timePickerPreviewLabel: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "900",
    marginBottom: 2,
  },
  timePickerErrorText: {
    marginTop: 14,
    marginBottom: -2,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800",
    color: "#EF4444",
    textAlign: "center",
  },

  timePickerPreviewText: {
    color: "#111827",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0.4,
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
});
