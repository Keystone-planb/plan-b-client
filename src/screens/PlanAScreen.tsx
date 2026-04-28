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
import PlanAPlaceCard from "../components/planA/PlanAPlaceCard";
import PlanAEmptyPlaceCard from "../components/planA/PlanAEmptyPlaceCard";

import { DayOption, PlaceItem, SelectedPlaceParam } from "../types/planA";
import { usePlanAPlaces } from "../hooks/usePlanAPlaces";

type Props = {
  navigation: any;
  route?: {
    params?: {
      tripName?: string;
      startDate?: string;
      endDate?: string;
      location?: string;
      selectedPlace?: SelectedPlaceParam;
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

  const tripName = route?.params?.tripName ?? "신나는 강릉 여행";
  const startDate = route?.params?.startDate ?? "2026.04.21";
  const endDate = route?.params?.endDate ?? "04.23";
  const selectedPlace = route?.params?.selectedPlace;

  const {
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
    navigation.navigate("AddPlace", {
      day: selectedDay,
      tripName,
      startDate,
      endDate,
      location: route?.params?.location,
    });
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

              <View style={styles.headerPlaceholder} />
            </View>

            <View style={styles.tripInfoBox}>
              <Text style={styles.tripTitle}>{tripName}</Text>
              <Text style={styles.tripPeriod}>
                {startDate} - {endDate}
              </Text>
            </View>

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

  headerPlaceholder: {
    width: 34,
    height: 34,
  },

  logoText: {
    color: "#1C2534",
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -1,
  },

  tripInfoBox: {
    marginTop: 4,
  },

  tripTitle: {
    color: "#252D3C",
    fontSize: 18,
    fontWeight: "900",
  },

  tripPeriod: {
    marginTop: 6,
    color: "#8C9BB1",
    fontSize: 12,
    fontWeight: "600",
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
});
