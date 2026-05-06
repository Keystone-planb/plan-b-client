import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import PlanAPlaceCard from "../components/planA/PlanAPlaceCard";
import PlanAEmptyPlaceCard from "../components/planA/PlanAEmptyPlaceCard";
import PlanAScheduleInfoEditor from "../components/planA/PlanAScheduleInfoEditor";

import { DayOption, PlaceItem, SelectedPlaceParam } from "../types/planA";
import { usePlanAPlaces } from "../hooks/usePlanAPlaces";
import RecommendationStreamCard from "../components/recommendations/RecommendationStreamCard";
import GapRecommendationCard from "../components/recommendations/GapRecommendationCard";

type Props = {
  navigation: any;
  route?: {
    params?: {
      scheduleId?: string;
      tripName?: string;
      startDate?: string;
      endDate?: string;
      location?: string;
      selectedPlace?: SelectedPlaceParam;
      tripId?: number | string;
    };
  };
};

const DAY_OPTIONS: DayOption[] = [
  { id: 1, label: "Day 1" },
  { id: 2, label: "Day 2" },
  { id: 3, label: "Day 3" },
];

export default function PlanAScreen({ navigation, route }: Props) {
  const [selectedDay, setSelectedDay] = useState(1);

  const scheduleId = route?.params?.scheduleId;
  const tripName = route?.params?.tripName ?? "신나는 강릉 여행";
  const startDate = route?.params?.startDate ?? "2026.04.21";
  const endDate = route?.params?.endDate ?? "04.23";
  const location = route?.params?.location ?? "";
  const selectedPlace = route?.params?.selectedPlace;

  const {
    schedule,
    updateScheduleInfo,

    saving,
    saveError,
    saveSuccessMessage,
    handleSaveSchedule,

    loadingSchedule,
    loadError,

    currentPlaces,

    memoDrafts,

    editingMemo,
    editingMemoText,
    setEditingMemoText,

    editingPlaceId,
    editingPlaceName,
    setEditingPlaceName,
    editingPlaceTime,
    setEditingPlaceTime,

    resetEditingState,

    handleStartEditPlace,
    handleCancelEditPlace,
    handleSaveEditPlace,
    handleDeletePlace,

    handleChangeMemoDraft,
    handleAddMemo,
    handleClearMemo,

    handleStartEditMemo,
    handleCancelEditMemo,
    handleSaveEditMemo,
    handleDeleteMemo,
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
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate("MainTabs");
  };

  const handleChangeDay = (dayId: number) => {
    setSelectedDay(dayId);
    resetEditingState();
  };

  const renderPlaceCard = (place: PlaceItem, index: number) => {
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

        <RecommendationStreamCard />

        <GapRecommendationCard
          tripId={(schedule as any).serverTripId ?? route?.params?.tripId}
        />

          <View style={styles.headerSection}>
            <View style={styles.headerRow}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBack}
                activeOpacity={0.8}
              >
                <Ionicons name="chevron-back" size={22} color="#64748B" />
              </TouchableOpacity>

              <Text style={styles.logoText}>Plan.A</Text>

              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                activeOpacity={0.85}
                onPress={handleSaveSchedule}
                disabled={saving}
              >
                {saving ?
                  <ActivityIndicator size="small" color="#2158E8" />
                : <Text style={styles.saveButtonText}>저장</Text>}
              </TouchableOpacity>
            </View>

            <PlanAScheduleInfoEditor
              tripName={schedule.tripName}
              startDate={schedule.startDate}
              endDate={schedule.endDate}
              location={schedule.location}
              onSave={updateScheduleInfo}
            />

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
              currentPlaces.map((place, index) => renderPlaceCard(place, index))
            : <PlanAEmptyPlaceCard
                selectedDay={selectedDay}

              />
            }

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

});
