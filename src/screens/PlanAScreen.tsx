import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
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
import PlanATimePickerModal from "../components/planA/PlanATimePickerModal";
import PlanAHeaderSection from "../components/planA/PlanAHeaderSection";
import PlanAViewPlaceCardRow from "../components/planA/PlanAViewPlaceCardRow";
import PlanAEditPlaceCardRow from "../components/planA/PlanAEditPlaceCardRow";

import {
  DayOption,
  PlaceItem,
  SelectedPlaceParam,
  SelectedPlacesParam,
} from "../types/planA";
import { TravelSchedule } from "../types/schedule";
import { usePlanAPlaces } from "../hooks/usePlanAPlaces";
import {
  addOneHourToDisplayTime,
  formatPickerTimeValue,
  formatTripDateRange,
  getBottomTabIconName,
  getCurrentTripDay,
  getMissingTimePlaceNames,
  getPlaceDisplayTime,
  getPlaceEndTime,
  getPlaceVisitTime,
  getTransportLabel,
  isValidVisitTimeRange,
  makeDayOptions,
  parsePickerTimeValue,
  pickCoordinate,
  sortPlacesByTime,
} from "../utils/planA/planAScreenUtils";

import {
  getTripTransportMode,
  updateTripTransportMode,
} from "../../api/schedules/transportMode";
import { dismissNotification } from "../../api/notifications/notifications";
import {
  updatePlanSchedule,
} from "../../api/schedules/server";

type TransportMode = "WALK" | "TRANSIT" | "CAR";

type BottomTabName = "PlanX" | "Home" | "Profile";

type TimePickerTarget =
  | "visitTime"
  | "endTime"
  | "transportStartTime"
  | "transportEndTime";

const EDIT_TRANSPORT_OPTIONS: Array<{
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
      dismissNotificationId?: string | number;
      returnScreen?: "OngoingSchedule" | "UpcomingSchedule";
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

export default function PlanAScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();

  const [selectedDay, setSelectedDay] = useState(1);
  const [isEditMode, setIsEditMode] = useState(
    route?.params?.isEditMode === true,
  );
  const [isSheetCollapsed, setIsSheetCollapsed] = useState(false);
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
    saving,
    handleSaveSchedule,
    handleUpdateTripName,
    loadingSchedule,
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
    // refreshPlanAAt가 바뀌면(예: 날씨 대안 교체 직후) draft 캐시를 건너뛰고 서버 최신본을 다시 불러온다.
    reloadKey: route?.params?.refreshPlanAAt,
  });

  const effectiveDayOptions = makeDayOptions(
    schedule.startDate,
    schedule.endDate,
  );

  const [resolvedMapPlaces, setResolvedMapPlaces] = useState(currentPlaces);

  useEffect(() => {
    console.log("[QA transport] screen=PlanA loaded schedule", {
      scheduleId: schedule.id,
      tripId: schedule.serverTripId ?? resolvedTripId,
      selectedDay,
      places: schedule.days.flatMap((day) =>
        day.places.map((place: any) => ({
          day: day.day,
          id: place.id,
          tripPlaceId: place.tripPlaceId,
          serverTripPlaceId: place.serverTripPlaceId,
          name: place.name,
          transportMode: place.transportMode,
        })),
      ),
    });

    const nextModesByPair: Record<string, TransportMode> = {};

    schedule.days.forEach((day) => {
      const sortedPlaces = sortPlacesByTime(day.places);

      sortedPlaces.slice(0, -1).forEach((place, index) => {
        const nextPlace = sortedPlaces[index + 1];
        const transportModeValue = (place as PlaceItem & {
          transportMode?: TransportMode | null;
        }).transportMode;

        if (
          !nextPlace ||
          !(
            transportModeValue === "WALK" ||
            transportModeValue === "TRANSIT" ||
            transportModeValue === "CAR"
          )
        ) {
          return;
        }

        const planPairKey = `${String(getPlacePlanId(place))}-${String(
          getPlacePlanId(nextPlace),
        )}`;
        const localPairKey = `${String(place.id)}-${String(
          nextPlace.id ?? index + 1,
        )}`;

        nextModesByPair[planPairKey] = transportModeValue;
        nextModesByPair[localPairKey] = transportModeValue;
      });
    });

    if (Object.keys(nextModesByPair).length === 0) return;

    setEditTransportModesByPair((prev) => ({
      ...nextModesByPair,
      ...prev,
    }));
  }, [schedule.days]);

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
            // 저장 없이 "수정 버튼을 누른 그 화면"으로 복귀한다.
            if (navigation.canGoBack()) {
              navigation.goBack();
              return;
            }

            // 스택에 이전 화면이 없으면 들어온 화면(returnScreen)으로 복귀, 없으면 Main.
            const returnScreen = route?.params?.returnScreen;
            const fallbackParams = {
              scheduleId,
              tripId: resolvedTripId,
              serverTripId: resolvedTripId,
              tripName,
              startDate,
              endDate,
              location,
              selectedDay,
              day: selectedDay,
            };

            if (
              returnScreen === "OngoingSchedule" ||
              returnScreen === "UpcomingSchedule"
            ) {
              navigation.reset({
                index: 0,
                routes: [{ name: returnScreen, params: fallbackParams }],
              });
              return;
            }

            navigation.reset({
              index: 0,
              routes: [{ name: "Main", params: { refreshSchedules: true } }],
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

  const getPlacePlanId = (place: PlaceItem) => {
    const source = place as PlaceItem & {
      serverTripPlaceId?: number | string;
      tripPlaceId?: number | string;
    };

    return source.serverTripPlaceId ?? source.tripPlaceId ?? source.id;
  };

  const getPairTransportMode = (place: PlaceItem, nextPlace: PlaceItem, index: number) => {
    const planPairKey = `${String(getPlacePlanId(place))}-${String(getPlacePlanId(nextPlace))}`;
    const localPairKey = `${String(place.id)}-${String(nextPlace.id ?? index + 1)}`;
    const serverMode = (place as PlaceItem & { transportMode?: TransportMode | null }).transportMode;

    return editTransportModesByPair[planPairKey] ??
      editTransportModesByPair[localPairKey] ??
      serverMode ??
      null;
  };

  const getMissingTransportPlaceNames = () => {
    const sortedPlaces = sortPlacesByTime(currentPlaces);

    return sortedPlaces
      .slice(0, -1)
      .map((place, index) => {
        const nextPlace = sortedPlaces[index + 1];
        if (!nextPlace) return null;

        if (getPairTransportMode(place, nextPlace, index)) {
          return null;
        }

        return `${place.name ?? "장소"} → ${nextPlace.name ?? "장소"}`;
      })
      .filter(Boolean) as string[];
  };

  const saveSegmentTransportModes = async () => {
    const sortedPlaces = sortPlacesByTime(currentPlaces);

    await Promise.all(
      sortedPlaces.slice(0, -1).map(async (place, index) => {
        const nextPlace = sortedPlaces[index + 1];
        if (!nextPlace) return;

        const transportMode = getPairTransportMode(place, nextPlace, index);
        if (!transportMode) return;

        const planId = getPlacePlanId(place);
        if (!planId) return;

        console.log("[PlanA 이동수단 저장 요청]", {
          planId,
          transportMode,
          from: place.name,
          to: nextPlace.name,
        });

        await updatePlanSchedule(planId, { transportMode });

        console.log("[PlanA 이동수단 저장 성공]", {
          planId,
          transportMode,
        });
      }),
    );
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

    const missingTransportPlaceNames = getMissingTransportPlaceNames();

    if (missingTransportPlaceNames.length > 0) {
      Alert.alert(
        "이동수단 선택 필요",
        `아래 구간의 이동수단이 선택되지 않았어요.\n\n${missingTransportPlaceNames
          .slice(0, 3)
          .map((name, index) => `${index + 1}. ${name}`)
          .join("\n")}${missingTransportPlaceNames.length > 3 ? "\n..." : ""}`,
      );

      return false;
    }

    resetEditingState();

    try {
      await saveSegmentTransportModes();

      const savedSchedule = await handleSaveSchedule();

      console.log("[PlanA] 저장 완료:", {
        scheduleId: savedSchedule.id,
        tripId: savedSchedule.serverTripId,
        tripName: savedSchedule.tripName,
        moveToMainAfterSave,
      });

      // 날씨 알림 "일정 조정"으로 진입한 경우, 저장(시간/장소 수정) 완료 시 해당 알림 삭제
      const dismissNotificationId = route?.params?.dismissNotificationId;
      if (dismissNotificationId) {
        try {
          await dismissNotification(dismissNotificationId);
          console.log("[PlanA] 날씨 알림 삭제 완료:", { dismissNotificationId });
        } catch (dismissError) {
          console.log("[PlanA] 날씨 알림 삭제 실패:", dismissError);
        }
      }

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

      const returnScreen = route?.params?.returnScreen ?? "OngoingSchedule";

      navigation.navigate(returnScreen, {
          scheduleId: savedSchedule.id,
          tripId: savedSchedule.serverTripId ?? route?.params?.tripId,
          serverTripId: savedSchedule.serverTripId ?? route?.params?.serverTripId,
          tripName: savedSchedule.tripName,
          startDate: savedSchedule.startDate,
          endDate: savedSchedule.endDate,
          location: savedSchedule.location,
          transportMode,
          transportLabel,
          selectedDay: selectedDay,
          refreshPlanAAt: Date.now(),
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
    const match = normalized.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);

    if (!match) {
      return {
        hour: 0,
        minute: 0,
        period: "AM" as const,
      };
    }

    let rawHour = Number(match[1]);
    const rawMinute = Number(match[2]);
    const period = match[3]?.toUpperCase();

    if (period === "PM" && rawHour < 12) {
      rawHour += 12;
    }

    if (period === "AM" && rawHour === 12) {
      rawHour = 0;
    }

    const hour =
      Number.isFinite(rawHour) ? Math.min(Math.max(rawHour, 0), 23) : 0;
    const minute =
      Number.isFinite(rawMinute) ? Math.min(Math.max(rawMinute, 0), 55) : 0;

    return {
      hour,
      minute,
      period: hour >= 12 ? ("PM" as const) : ("AM" as const),
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

    if (!isValidVisitTimeRange(nextVisitTime, nextEndTime)) {
      Alert.alert(
        "시간 설정 확인",
        "종료 시간은 시작 시간보다 늦어야 합니다.",
      );
      return;
    }

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
    const sortedPlaces = sortPlacesByTime(currentPlaces);
    const nextPlace = sortedPlaces[index + 1];
    const isLast = index >= sortedPlaces.length - 1;
    const selectedTransportMode =
      nextPlace ? getPairTransportMode(place, nextPlace, index) : null;

    return (
      <PlanAViewPlaceCardRow
        key={place.id}
        place={place}
        index={index}
        isLast={isLast}
        nextPlace={nextPlace}
        selectedTransportMode={selectedTransportMode}
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
    );
  };

  const renderEditablePlaceCard = (place: PlaceItem, index: number) => {
    const sortedPlaces = sortPlacesByTime(currentPlaces);
    const nextPlace = sortedPlaces[index + 1];
    const isLast = index >= sortedPlaces.length - 1;
    const pairKey = `${String(getPlacePlanId(place))}-${String(
      nextPlace ? getPlacePlanId(nextPlace) : index + 1,
    )}`;
    const selectedTransportMode =
      nextPlace ? getPairTransportMode(place, nextPlace, index) : null;

    return (
      <PlanAEditPlaceCardRow
        key={place.id}
        place={place}
        index={index}
        isLast={isLast}
        nextPlace={nextPlace}
        pairKey={pairKey}
        selectedTransportMode={selectedTransportMode}
        activeTransportPairKey={transportModalTarget?.pairKey}
        selectedEditTransportMode={editTransportModesByPair[pairKey]}
        transportOptions={EDIT_TRANSPORT_OPTIONS}
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
        onOpenTransportPicker={handleOpenEditTransportModal}
        onSelectTransportMode={handleSelectEditTransportMode}
        onConfirmTransportMode={handleConfirmEditTransportMode}
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
          ref={scrollViewRef}
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!isSheetCollapsed}
          bounces={false}
          scrollEventThrottle={16}
          onScroll={(event) => {
            scrollOffsetYRef.current = event.nativeEvent.contentOffset.y;
          }}
        >
          <PlanAHeaderSection
            schedule={schedule}
            isEditMode={isEditMode}
            saving={saving}
            days={effectiveDayOptions}
            selectedDay={selectedDay}
            onBack={handleBack}
            onUpdateTripName={handleUpdateTripName}
            onChangeDay={handleChangeDay}
            onSaveEdit={async () => {
              const saved = await handleSavePlanA({
                moveToMainAfterSave: false,
              });

              if (saved) {
                setIsEditMode(false);
                setIsEditPreviewMode(false);
              }
            }}
          />

          <PlanAMapPreview
            places={sortPlacesByTime(resolvedMapPlaces)}
            height={
              isSheetCollapsed ? 520
              : resolvedMapPlaces.length > 0 ? 220
              : 150
            }
            mapInteractive={isSheetCollapsed}
          />

          <View
            style={[
              styles.sheet,
              isSheetCollapsed && styles.sheetCollapsed,
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.sheetHandleWrapper}
              onPress={() => setIsSheetCollapsed((prev) => !prev)}
            >
              <Text style={styles.sheetToggleText}>
                {isSheetCollapsed ? "일정 펼치기" : "일정 접기"}
              </Text>

              <Ionicons
                name={isSheetCollapsed ? "chevron-up" : "chevron-down"}
                size={18}
                color="#94A3B8"
                style={styles.sheetChevron}
              />
            </TouchableOpacity>

            {currentPlaces.length > 0 ?
              <>
                <View
                  style={[
                    styles.scheduleSectionHeader,
                  ]}
                >
                  <Text style={styles.scheduleSectionTitle}>일정</Text>

                  {!isEditMode ?
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

                <View
                  style={styles.roadmapList}
                >
                {false ? <View pointerEvents="none" style={styles.roadmapLine} /> : null}

                {sortPlacesByTime(currentPlaces).map((place, index) =>
                  isEditMode ?
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

      <PlanATimePickerModal
        visible={Boolean(timePickerPlace)}
        place={timePickerPlace}
        target={timePickerTarget}
        previewText={timePickerPreviewText}
        hourText={padTimeUnit(timePickerHour)}
        minuteText={padTimeUnit(timePickerMinute)}
        onClose={closeTimePicker}
        onSwitchTarget={handleSwitchTimeTarget}
        onDecreaseHour={decreaseHour}
        onIncreaseHour={increaseHour}
        onDecreaseMinute={decreaseMinute}
        onIncreaseMinute={increaseMinute}
        onSave={handleSaveTimePicker}
      />
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
  headerIconButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },




  sheet: {
    minHeight: 430,
    marginTop: -1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 6,
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  sheetHandleWrapper: {
    alignSelf: "center",
    minWidth: 124,
    height: 34,
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: -4,
    marginBottom: 10,
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

  sheetCollapsed: {
    minHeight: 72,
    paddingBottom: 18,
  },

  sheetChevron: {
    marginTop: 0,
  },

  sheetToggleText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748B",
  },

  floatingToast: {
    position: "absolute",
    top: 110,
    left: 20,
    right: 20,
    zIndex: 9999,
    backgroundColor: "#EAFBF0",
    borderWidth: 1,
    borderColor: "#A7E8B8",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },

  floatingToastText: {
    color: "#17823B",
    fontSize: 16,
    fontWeight: "700",
  },

});
