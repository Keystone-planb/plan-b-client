import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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

const DAY_OPTIONS: DayOption[] = [
  { id: 1, label: "Day 1" },
  { id: 2, label: "Day 2" },
  { id: 3, label: "Day 3" },
];

const formatDisplayDate = (value: string) => {
  if (!value) return "";
  return value.replace(/-/g, ".");
};

export default function PlanAScreen({ navigation, route }: Props) {
  const [selectedDay, setSelectedDay] = useState(1);
  const [isEditMode, setIsEditMode] = useState(false);

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
    handleChangeEditingPlaceName,
    handleChangeEditingPlaceTime,
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

  const handleChangeDay = (dayId: number) => {
    setSelectedDay(dayId);
    resetEditingState();
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

          <View style={styles.simpleTimeRow}>
            <Ionicons name="time-outline" size={16} color="#94A3B8" />
            <Text style={styles.simplePlaceTime}>
              {place.time || "시간을 설정해주세요"}
            </Text>
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
        editingPlaceTime={editingPlaceTime}
        onStartEditPlace={handleStartEditPlace}
        onCancelEditPlace={handleCancelEditPlace}
        onSaveEditPlace={handleSaveEditPlace}
        onDeletePlace={handleDeletePlace}
        onChangeEditingPlaceName={handleChangeEditingPlaceName}
        onChangeEditingPlaceTime={handleChangeEditingPlaceTime}
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
            <View style={styles.headerRow}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBack}
                activeOpacity={0.8}
              >
                <Ionicons name="chevron-back" size={24} color="#64748B" />
              </TouchableOpacity>

              <Text style={styles.logoText}>Plan.A</Text>

              <View style={styles.headerSpacer} />
            </View>

            <View style={styles.scheduleSummary}>
              <Text style={styles.planTitle}>{schedule.tripName}</Text>
              <Text style={styles.planDate}>
                {formatDisplayDate(schedule.startDate)} -{" "}
                {formatDisplayDate(schedule.endDate)}
              </Text>
              <Text style={styles.planTransport}>
                이동수단 · {transportLabel}
              </Text>
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

            <PlanADayTabs
              days={DAY_OPTIONS}
              selectedDay={selectedDay}
              onChangeDay={handleChangeDay}
            />
          </View>

          <PlanAMapPreview />

          <View style={styles.sheet}>
            <View style={styles.sheetHandleWrapper}>
              <View style={styles.sheetHandle} />
            </View>

            {currentPlaces.length > 0 ?
              <View style={styles.editModeHeader}>
                <Text style={styles.editModeTitle}>
                  {isEditMode ? "일정 수정" : "오늘의 일정"}
                </Text>

                <TouchableOpacity
                  style={[
                    styles.editModeButton,
                    isEditMode && styles.editModeButtonActive,
                  ]}
                  activeOpacity={0.85}
                  onPress={() => {
                    resetEditingState();
                    setIsEditMode((prev) => !prev);
                  }}
                >
                  <Ionicons
                    name={isEditMode ? "checkmark" : "create-outline"}
                    size={14}
                    color={isEditMode ? "#FFFFFF" : "#2158E8"}
                  />
                  <Text
                    style={[
                      styles.editModeButtonText,
                      isEditMode && styles.editModeButtonTextActive,
                    ]}
                  >
                    {isEditMode ? "완료" : "수정"}
                  </Text>
                </TouchableOpacity>
              </View>
            : null}

            {currentPlaces.length > 0 ?
              currentPlaces.map((place, index) =>
                isEditMode ?
                  renderEditablePlaceCard(place, index)
                : renderPlaceCard(place, index),
              )
            : <PlanAEmptyPlaceCard
                selectedDay={selectedDay}
                onPress={handleAddPlace}
              />
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
    backgroundColor: "#F7F9FB",
  },

  container: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    backgroundColor: "#F7F9FB",
  },

  headerSection: {
    backgroundColor: "#FFFFFF",
    paddingTop: 8,
    paddingHorizontal: 24,
    paddingBottom: 14,
  },

  headerRow: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backButton: {
    width: 34,
    height: 34,
    alignItems: "flex-start",
    justifyContent: "center",
  },

  headerSpacer: {
    width: 34,
    height: 34,
  },

  scheduleSummary: {
    marginTop: 16,
    marginBottom: 20,
  },

  planTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1C2534",
    marginBottom: 8,
  },

  planDate: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8C9BB1",
  },

  planTransport: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "700",
    color: "#2158E8",
  },

  logoText: {
    color: "#1C2534",
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -1,
  },

  saveButton: {
    minWidth: 48,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 17,
    backgroundColor: "#EAF3FF",
    alignItems: "center",
    justifyContent: "center",
  },

  saveButtonDisabled: {
    opacity: 0.6,
  },

  saveButtonText: {
    color: "#2158E8",
    fontSize: 13,
    fontWeight: "900",
  },

  saveFeedbackBox: {
    marginTop: 10,
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
    marginBottom: 24,
  },

  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#D6DFEA",
  },

  addPlaceButton: {
    marginTop: 4,
    marginLeft: 44,
    minHeight: 44,
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
    fontSize: 14,
    fontWeight: "900",
  },
  simplePlaceRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "stretch",
    marginBottom: 14,
  },

  timelineColumn: {
    width: 34,
    alignItems: "center",
    marginRight: 12,
  },

  timelineDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    shadowColor: "#2563EB",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  timelineLine: {
    flex: 1,
    width: 2,
    marginTop: 8,
    borderRadius: 999,
    backgroundColor: "#DDE7F2",
  },

  timelineDotText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  simplePlaceCard: {
    flex: 1,
    minHeight: 88,
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

  editModeHeader: {
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  editModeTitle: {
    color: "#1E293B",
    fontSize: 15,
    fontWeight: "900",
  },

  editModeButton: {
    height: 32,
    borderRadius: 10,
    backgroundColor: "#EAF3FF",
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },

  editModeButtonActive: {
    backgroundColor: "#2158E8",
  },

  editModeButtonText: {
    color: "#2158E8",
    fontSize: 12,
    fontWeight: "900",
  },

  editModeButtonTextActive: {
    color: "#FFFFFF",
  },

});
