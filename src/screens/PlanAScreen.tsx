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

import { DayOption, PlaceItem, SelectedPlaceParam } from "../types/planA";
import { usePlanAPlaces } from "../hooks/usePlanAPlaces";

type Props = {
  navigation: any;
  route?: {
    params?: {
      scheduleId?: string;
      tripName?: string;
      startDate?: string;
      endDate?: string;
      location?: string;
      transportMode?: "WALK" | "TRANSIT" | "CAR";
      transportLabel?: string;
      selectedPlace?: SelectedPlaceParam;
    };
  };
};

type BottomTabName = "PlanX" | "Home" | "Profile";
type IconName = keyof typeof Ionicons.glyphMap;

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
  const [timePickerHour, setTimePickerHour] = useState(12);
  const [timePickerMinute, setTimePickerMinute] = useState(0);
  const [timePickerPeriod, setTimePickerPeriod] = useState<"AM" | "PM">("AM");

  const scheduleId = route?.params?.scheduleId;
  const tripName = route?.params?.tripName ?? "신나는 강릉 여행";
  const startDate = route?.params?.startDate ?? "2026.04.21";
  const endDate = route?.params?.endDate ?? "04.23";
  const location = route?.params?.location ?? "";
  const transportMode = route?.params?.transportMode ?? "WALK";
  const transportLabel = route?.params?.transportLabel ?? "도보";
  const selectedPlace = route?.params?.selectedPlace;

  const {
    schedule,
    saveError,
    saveSuccessMessage,
    loadingSchedule,
    loadError,
    currentPlaces,

    memoDrafts,
    editingPlaceId,
    editingPlaceName,
    editingPlaceTime,
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
    setEditingPlaceTime,
    handleUpdatePlaceTime,
    handleStartEditMemo,
    handleCancelEditMemo,
    handleSaveEditMemo,
    handleDeleteMemo,

    resetEditingState,
  } = usePlanAPlaces({
    selectedDay,
    selectedPlace,
    tripName,
    startDate,
    endDate,
    location,
    scheduleId,
  });

  useEffect(() => {
    if (!selectedPlace?.day) return;

    setSelectedDay(selectedPlace.day);
  }, [selectedPlace?.day]);

  const handleBack = () => {
    navigation.goBack();
  };

  const moveToMain = () => {
    navigation.reset({
      index: 0,
      routes: [
        {
          name: "Main",
          params: {
            refreshSchedules: true,
            savedScheduleId: schedule.id,
          },
        },
      ],
    });
  };

  const handleSavePlanA = () => {
    resetEditingState();

    console.log("[PlanA] 저장 완료 후 Main으로 이동", {
      scheduleId: schedule.id,
      tripName: schedule.tripName,
    });

    if (Platform.OS === "web") {
      const browserWindow = globalThis as typeof globalThis & {
        alert?: (message?: string) => void;
      };

      if (typeof browserWindow.alert === "function") {
        browserWindow.alert("일정이 저장되었습니다.");
      }

      moveToMain();
      return;
    }

    Alert.alert("저장 완료", "일정이 저장되었습니다.", [
      {
        text: "확인",
        onPress: moveToMain,
      },
    ]);
  };

  const handleBottomTabPress = (tabName: BottomTabName) => {
    if (tabName === "Home") {
      moveToMain();
      return;
    }

    navigation.navigate("Main", {
      screen: tabName,
    });
  };

  const handleChangeDay = (dayId: number) => {
    setSelectedDay(dayId);
    resetEditingState();
  };

  const padTimeUnit = (value: number) => {
    return String(value).padStart(2, "0");
  };

  const parseTimeForPicker = (value?: string) => {
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

  const openTimePicker = (place: PlaceItem) => {
    const parsed = parseTimeForPicker(place.time);

    setTimePickerPlace(place);
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

  const handleSaveTimePicker = () => {
    if (!timePickerPlace) return;

    const nextTime = `${padTimeUnit(timePickerHour)}:${padTimeUnit(
      timePickerMinute,
    )} ${timePickerPeriod}`;

    handleUpdatePlaceTime(timePickerPlace.id, nextTime);
    closeTimePicker();
  };

  const handleAddPlace = () => {
    navigation.navigate("AddScheduleLocation", {
      day: selectedDay,
      selectedDay,
      scheduleId: schedule.id,
      tripName: schedule.tripName,
      startDate: schedule.startDate,
      endDate: schedule.endDate,
      location: schedule.location,
      transportMode,
      transportLabel,
    });
  };

  const renderPlaceCard = (place: PlaceItem, index: number) => {
    return (
      <View key={place.id} style={styles.simplePlaceRow}>
        <View style={styles.timelineColumn}>
          <View style={styles.timelineDot}>
            <Text style={styles.timelineDotText}>{index + 1}</Text>
          </View>

          <View style={styles.timelineLine} />
        </View>

        <View style={styles.simplePlaceCard}>
          <View style={styles.simplePlaceHeader}>
            <Text style={styles.simplePlaceTitle} numberOfLines={1}>
              {place.name}
            </Text>

            <View style={styles.placeOrderBadge}>
              <Text style={styles.placeOrderBadgeText}>Day {selectedDay}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.simpleTimeRow}
            activeOpacity={0.75}
            onPress={() => openTimePicker(place)}
          >
            <Ionicons name="time-outline" size={16} color="#94A3B8" />
            <Text style={styles.simplePlaceTime}>
              {place.time || "시간을 설정해주세요"}
            </Text>

            <View style={styles.simpleTimeAction}>
              <Text style={styles.simpleTimeActionText}>
                {place.time ? "변경" : "설정"}
              </Text>
            </View>
          </TouchableOpacity>
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
        editingPlaceTime={editingPlaceTime}
        onStartEditPlace={handleStartEditPlace}
        onCancelEditPlace={handleCancelEditPlace}
        onSaveEditPlace={handleSaveEditPlace}
        onDeletePlace={handleDeletePlace}
        onChangeEditingPlaceName={setEditingPlaceName}
        onChangeEditingPlaceTime={setEditingPlaceTime}
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
                  style={styles.headerIconButton}
                  activeOpacity={0.8}
                  onPress={handleSavePlanA}
                  disabled={loadingSchedule}
                >
                  <Ionicons name="download-outline" size={22} color="#2158E8" />
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

          <PlanAMapPreview />

          <View style={styles.sheet}>
            <View style={styles.sheetHandleWrapper}>
              <View style={styles.sheetHandle} />
            </View>

            {currentPlaces.length > 0 ?
              currentPlaces.map((place, index) =>
                isEditMode ?
                  renderEditablePlaceCard(place, index)
                : renderPlaceCard(place, index),
              )
            : <View style={styles.emptyScheduleRow}>
                <View style={styles.timelineColumn}>
                  <View style={styles.timelineEmptyDot} />
                  <View style={styles.timelineLine} />
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

            <View style={styles.timePickerPreview}>
              <Text style={styles.timePickerPreviewText}>
                {padTimeUnit(timePickerHour)}:{padTimeUnit(timePickerMinute)}{" "}
                {timePickerPeriod}
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
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  screen: {
    flex: 1,
    backgroundColor: "#F7F9FB",
    position: "relative",
  },

  container: {
    flex: 1,
  },

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

  headerInfo: {
    flex: 1,
    paddingLeft: 6,
    paddingRight: 8,
  },

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

  planTransport: {
    color: "#627187",
    fontSize: 15,
    fontWeight: "700",
  },

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

  saveErrorBox: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },

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

  sheetHandleWrapper: {
    alignItems: "center",
    marginBottom: 20,
  },

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

  emptyScheduleContent: {
    flex: 1,
    paddingRight: 0,
  },

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
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowRadius: 10,
    elevation: 4,
  },

  addPlaceButtonText: {
    color: "#2158E8",
    fontSize: 15,
    fontWeight: "900",
  },

  simplePlaceRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "stretch",
    marginBottom: 14,
    paddingHorizontal: 0,
  },

  timelineColumn: {
    width: 34,
    alignItems: "center",
    marginRight: 10,
  },

  timelineDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    shadowColor: "#2563EB",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  timelineEmptyDot: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    borderWidth: 4,
    borderColor: "#2563EB",
    backgroundColor: "#FFFFFF",
    marginTop: 20,
  },

  timelineLine: {
    flex: 1,
    width: 2,
    marginTop: 4,
    borderRadius: 999,
    backgroundColor: "#2563EB",
  },

  timelineDotText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },

  simplePlaceCard: {
    flex: 1,
    minHeight: 88,
    marginRight: 0,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingVertical: 16,
    justifyContent: "center",
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },

  simplePlaceHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 10,
  },

  simplePlaceTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "900",
    color: "#1E293B",
  },

  placeOrderBadge: {
    borderRadius: 999,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  placeOrderBadgeText: {
    color: "#2563EB",
    fontSize: 11,
    fontWeight: "900",
  },

  simpleTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  simplePlaceTime: {
    fontSize: 14,
    fontWeight: "700",
    color: "#94A3B8",
  },

  simpleTimeAction: {
    marginLeft: 8,
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 4,
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
    shadowOffset: {
      width: 0,
      height: 8,
    },
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
    shadowOffset: {
      width: 0,
      height: 12,
    },
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

  timeModalTitle: {
    color: "#1E293B",
    fontSize: 20,
    fontWeight: "900",
  },

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
    marginBottom: 16,
  },

  timePickerPreview: {
    height: 46,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
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

  timePickerColumn: {
    alignItems: "center",
    gap: 8,
  },

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

  timePickerValueText: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "900",
  },

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

  timePickerPeriodText: {
    color: "#2158E8",
    fontSize: 16,
    fontWeight: "900",
  },

  timeModalButtonRow: {
    flexDirection: "row",
    gap: 10,
  },

  timeModalCancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },

  timeModalCancelText: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "900",
  },

  timeModalSaveButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#2158E8",
    alignItems: "center",
    justifyContent: "center",
  },

  timeModalSaveText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
});
