import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
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
      transportMode?: "WALK" | "TRANSIT" | "CAR";
      transportLabel?: string;

      /**
       * 기존 단일 장소 추가 호환용
       */
      selectedPlace?: SelectedPlaceParam;

      /**
       * AddScheduleLocation에서 여러 장소를 한 번에 선택했을 때 사용
       */
      selectedPlaces?: SelectedPlacesParam;
    };
  };
};

type BottomTabName = "PlanX" | "Home" | "Profile";
type IconName = keyof typeof Ionicons.glyphMap;
type TimePickerTarget = "visitTime" | "endTime";

const DAY_OPTIONS: DayOption[] = [
  { id: 1, label: "Day 1" },
  { id: 2, label: "Day 2" },
  { id: 3, label: "Day 3" },
];

const BOTTOM_TABS: BottomTabName[] = ["PlanX", "Home", "Profile"];

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

const getBottomTabIconName = (
  tabName: BottomTabName,
  focused: boolean,
): IconName => {
  if (tabName === "PlanX") {
    return focused ? "time" : "time-outline";
  }

  if (tabName === "Home") {
    return focused ? "home" : "home-outline";
  }

  return focused ? "person" : "person-outline";
};

export default function PlanAScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();

  const [selectedDay, setSelectedDay] = useState(1);
  const [isEditMode, setIsEditMode] = useState(false);
  const [timePickerPlace, setTimePickerPlace] = useState<PlaceItem | null>(
    null,
  );
  const [timePickerTarget, setTimePickerTarget] =
    useState<TimePickerTarget>("visitTime");
  const [timePickerHour, setTimePickerHour] = useState(12);
  const [timePickerMinute, setTimePickerMinute] = useState(0);
  const [timePickerPeriod, setTimePickerPeriod] = useState<"AM" | "PM">("AM");

  const scheduleId = route?.params?.scheduleId;
  const tripId = route?.params?.tripId ?? route?.params?.serverTripId;
  const serverTripId = route?.params?.serverTripId ?? route?.params?.tripId;
  const tripName = route?.params?.tripName ?? "신나는 강릉 여행";
  const startDate = route?.params?.startDate ?? "2026.04.21";
  const endDate = route?.params?.endDate ?? "04.23";
  const location = route?.params?.location ?? "";
  const transportMode = route?.params?.transportMode ?? "WALK";
  const transportLabel = route?.params?.transportLabel ?? "도보";
  const selectedPlace = route?.params?.selectedPlace;
  const selectedPlaces = route?.params?.selectedPlaces;

  const resolvedTripId = tripId ?? serverTripId;

  const {
    schedule,
    saveError,
    saveSuccessMessage,
    saving,
    handleSaveSchedule,
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
    tripName,
    startDate,
    endDate,
    location,
    scheduleId,
  });

  useEffect(() => {
    const firstSelectedDay = selectedPlaces?.[0]?.day ?? selectedPlace?.day;

    if (!firstSelectedDay) return;

    setSelectedDay(firstSelectedDay);
  }, [selectedPlace?.day, selectedPlaces]);

  const handleBack = () => {
    navigation.goBack();
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

  const handleSavePlanA = async () => {
    resetEditingState();

    try {
      const savedSchedule = await handleSaveSchedule();

      console.log("[PlanA] 저장 완료 후 Main으로 이동", {
        scheduleId: savedSchedule.id,
        tripId: savedSchedule.serverTripId,
        tripName: savedSchedule.tripName,
      });

      if (Platform.OS === "web") {
        const browserWindow = globalThis as typeof globalThis & {
          alert?: (message?: string) => void;
        };

        if (typeof browserWindow.alert === "function") {
          browserWindow.alert("일정이 저장되었습니다.");
        }

        moveToMain(savedSchedule);
        return;
      }

      Alert.alert("저장 완료", "일정이 저장되었습니다.", [
        {
          text: "확인",
          onPress: () => moveToMain(savedSchedule),
        },
      ]);
    } catch (error) {
      console.log("[PlanA] 저장 후 이동 실패:", error);

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
    const normalized = value?.trim();
    const match = normalized?.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

    if (!match) {
      return {
        hour: 12,
        minute: 0,
        period: "AM" as const,
      };
    }

    const rawHour = Number(match[1]);
    const rawMinute = Number(match[2]);
    const period = match[3].toUpperCase() === "PM" ? "PM" : "AM";

    return {
      hour: Math.min(Math.max(rawHour, 1), 12),
      minute: Math.min(Math.max(rawMinute, 0), 55),
      period: period as "AM" | "PM",
    };
  };

  const getTimeValueForTarget = (
    place: PlaceItem,
    target: TimePickerTarget,
  ) => {
    if (target === "visitTime") {
      return getPlaceVisitTime(place);
    }

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
    setTimePickerPeriod(parsed.period);
  };

  const closeTimePicker = () => {
    setTimePickerPlace(null);
  };

  const increaseHour = () => {
    setTimePickerHour((prev) => (prev >= 12 ? 1 : prev + 1));
  };

  const decreaseHour = () => {
    setTimePickerHour((prev) => (prev <= 1 ? 12 : prev - 1));
  };

  const increaseMinute = () => {
    setTimePickerMinute((prev) => (prev >= 55 ? 0 : prev + 5));
  };

  const decreaseMinute = () => {
    setTimePickerMinute((prev) => (prev <= 0 ? 55 : prev - 5));
  };

  const toggleTimePeriod = () => {
    setTimePickerPeriod((prev) => (prev === "AM" ? "PM" : "AM"));
  };

  const handleSwitchTimeTarget = (target: TimePickerTarget) => {
    if (!timePickerPlace) {
      setTimePickerTarget(target);
      return;
    }

    const currentPickerValue = `${padTimeUnit(timePickerHour)}:${padTimeUnit(
      timePickerMinute,
    )} ${timePickerPeriod}`;

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
    setTimePickerPeriod(parsed.period);
  };

  const handleSaveTimePicker = () => {
    if (!timePickerPlace) return;

    const selectedTime = `${padTimeUnit(timePickerHour)}:${padTimeUnit(
      timePickerMinute,
    )} ${timePickerPeriod}`;

    const currentVisitTime = getPlaceVisitTime(timePickerPlace);
    const currentEndTime = getPlaceEndTime(timePickerPlace);

    const nextVisitTime =
      timePickerTarget === "visitTime" ? selectedTime : currentVisitTime;
    const nextEndTime =
      timePickerTarget === "endTime" ? selectedTime : currentEndTime;

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
                <Text style={styles.simpleTimeActionText}>
                  {visitTime ? "시작 변경" : "시작 설정"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.simpleTimeAction}
                activeOpacity={0.75}
                onPress={() => openTimePicker(place, "endTime")}
              >
                <Text style={styles.simpleTimeActionText}>
                  {endTime ? "종료 변경" : "종료 설정"}
                </Text>
              </TouchableOpacity>
            </View>
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

  const timePickerPreviewText = `${padTimeUnit(timePickerHour)}:${padTimeUnit(
    timePickerMinute,
  )} ${timePickerPeriod}`;

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
                <Text style={styles.planTitle} numberOfLines={1}>
                  {schedule.tripName}
                </Text>

                <Text style={styles.planDate}>
                  {formatDisplayDate(schedule.startDate)} -{" "}
                  {formatDisplayDate(schedule.endDate)}
                </Text>

                <Text style={styles.planTransport}>{transportLabel}</Text>
              </View>

              <View style={styles.headerActionRow}>
                <TouchableOpacity
                  style={styles.headerIconButton}
                  activeOpacity={0.8}
                  onPress={() => {
                    resetEditingState();
                    setIsEditMode((prev) => !prev);
                  }}
                >
                  <Ionicons
                    name={isEditMode ? "checkmark" : "create-outline"}
                    size={22}
                    color="#2158E8"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.headerIconButton,
                    (loadingSchedule || saving) && styles.headerIconDisabled,
                  ]}
                  activeOpacity={0.8}
                  onPress={handleSavePlanA}
                  disabled={loadingSchedule || saving}
                >
                  <Ionicons
                    name="download-outline"
                    size={22}
                    color={loadingSchedule || saving ? "#94A3B8" : "#2158E8"}
                  />
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
                days={DAY_OPTIONS}
                selectedDay={selectedDay}
                onChangeDay={handleChangeDay}
              />
            </View>
          </View>

          <PlanAMapPreview places={currentPlaces} />

          <View style={styles.sheet}>
            <View style={styles.sheetHandleWrapper}>
              <View style={styles.sheetHandle} />
            </View>

            {currentPlaces.length > 0 ?
              <View style={styles.roadmapList}>
                <View pointerEvents="none" style={styles.roadmapLine} />

                {currentPlaces.map((place, index) =>
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
              <Text style={styles.addPlaceButtonText}>장소 추가</Text>
            </TouchableOpacity>
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

            <View style={styles.timePickerPreview}>
              <Text style={styles.timePickerPreviewLabel}>
                {timePickerTarget === "visitTime" ? "시작" : "종료"}
              </Text>

              <Text style={styles.timePickerPreviewText}>
                {timePickerPreviewText}
              </Text>
            </View>

            <View style={styles.timePickerControls}>
              <View style={styles.timePickerColumn}>
                <TouchableOpacity
                  style={styles.timePickerArrow}
                  activeOpacity={0.75}
                  onPress={increaseHour}
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
                  onPress={decreaseHour}
                >
                  <Ionicons name="chevron-down" size={22} color="#64748B" />
                </TouchableOpacity>
              </View>

              <Text style={styles.timePickerColon}>:</Text>

              <View style={styles.timePickerColumn}>
                <TouchableOpacity
                  style={styles.timePickerArrow}
                  activeOpacity={0.75}
                  onPress={increaseMinute}
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
                  onPress={decreaseMinute}
                >
                  <Ionicons name="chevron-down" size={22} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={styles.timePickerColumn}>
                <TouchableOpacity
                  style={styles.timePickerArrow}
                  activeOpacity={0.75}
                  onPress={toggleTimePeriod}
                >
                  <Ionicons name="chevron-up" size={22} color="#64748B" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.timePickerPeriodBox}
                  activeOpacity={0.8}
                  onPress={toggleTimePeriod}
                >
                  <Text style={styles.timePickerPeriodText}>
                    {timePickerPeriod}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.timePickerArrow}
                  activeOpacity={0.75}
                  onPress={toggleTimePeriod}
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
    paddingHorizontal: 0,
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
  planDate: {
    color: "#627187",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 6,
  },
  planTransport: { color: "#627187", fontSize: 15, fontWeight: "700" },
  headerActionRow: {
    width: 82,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 12,
    paddingRight: 0,
    paddingTop: 6,
  },
  headerIconButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  headerIconDisabled: {
    opacity: 0.55,
  },
  saveFeedbackBox: {
    marginHorizontal: 0,
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
    paddingLeft: 0,
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
    paddingHorizontal: 0,
  },
  emptyScheduleContent: { flex: 1, paddingRight: 0 },
  addPlaceButton: {
    marginTop: 10,
    marginLeft: 43,
    marginRight: 0,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: "#ECF5FF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2158E8",
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4,
  },
  addPlaceButtonText: { color: "#2158E8", fontSize: 15, fontWeight: "900" },

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
    paddingHorizontal: 0,
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
    marginRight: 0,
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
  simplePlaceContent: {
    flex: 1,
  },
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
  simpleTimeAction: {
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 9,
    paddingVertical: 5,
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
  timeTargetTabActive: {
    backgroundColor: "#2158E8",
  },
  timeTargetTabText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "900",
  },
  timeTargetTabTextActive: {
    color: "#FFFFFF",
  },
  timePickerPreview: {
    height: 52,
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
  timePickerPeriodBox: {
    width: 58,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    alignItems: "center",
    justifyContent: "center",
  },
  timePickerPeriodText: { color: "#2158E8", fontSize: 16, fontWeight: "900" },
  timeModalButtonRow: { flexDirection: "row", gap: 10 },
  timeModalCancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  timeModalCancelText: { color: "#64748B", fontSize: 14, fontWeight: "900" },
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
