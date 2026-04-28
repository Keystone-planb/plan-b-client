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

import {
  DayOption,
  MemoItem,
  PlaceItem,
  PlacesByDay,
  SelectedPlaceParam,
} from "../types/planA";

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

const DEFAULT_PLACES_BY_DAY: PlacesByDay = {
  1: [
    {
      id: "place-1",
      name: "강릉역",
      time: "10:00",
      memos: [
        { id: "memo-1", text: "내일 매점 까먹지 말기" },
        { id: "memo-2", text: "강릉역 근처 맛집 확인하기" },
        { id: "memo-3", text: "카페 예약 시간 확인하기" },
      ],
    },
  ],
  2: [],
  3: [],
};

export default function PlanAScreen({ navigation, route }: Props) {
  const [selectedDay, setSelectedDay] = useState(1);
  const [placesByDay, setPlacesByDay] = useState<PlacesByDay>(
    DEFAULT_PLACES_BY_DAY,
  );

  const [memoDrafts, setMemoDrafts] = useState<Record<string, string>>({});

  const [editingMemo, setEditingMemo] = useState<{
    placeId: string;
    memoId: string;
  } | null>(null);
  const [editingMemoText, setEditingMemoText] = useState("");

  const [editingPlaceId, setEditingPlaceId] = useState<string | null>(null);
  const [editingPlaceName, setEditingPlaceName] = useState("");
  const [editingPlaceTime, setEditingPlaceTime] = useState("");

  const tripName = route?.params?.tripName ?? "신나는 강릉 여행";
  const startDate = route?.params?.startDate ?? "2026.04.21";
  const endDate = route?.params?.endDate ?? "04.23";
  const selectedPlace = route?.params?.selectedPlace;

  const currentPlaces = placesByDay[selectedDay] ?? [];
  const isEditingMemo = Boolean(editingMemo);

  useEffect(() => {
    if (!selectedPlace?.id || !selectedPlace.name) return;

    const targetDay = selectedPlace.day ?? 1;

    setSelectedDay(targetDay);

    setPlacesByDay((prev) => {
      const targetPlaces = prev[targetDay] ?? [];
      const alreadyExists = targetPlaces.some(
        (place) => place.id === selectedPlace.id,
      );

      if (alreadyExists) {
        return {
          ...prev,
          [targetDay]: targetPlaces.map((place) =>
            place.id === selectedPlace.id ?
              {
                ...place,
                name: selectedPlace.name,
                time: selectedPlace.time ?? place.time,
              }
            : place,
          ),
        };
      }

      return {
        ...prev,
        [targetDay]: [
          ...targetPlaces,
          {
            id: selectedPlace.id,
            name: selectedPlace.name,
            time: selectedPlace.time ?? "10:00",
            memos: [],
          },
        ],
      };
    });
  }, [
    selectedPlace?.id,
    selectedPlace?.name,
    selectedPlace?.time,
    selectedPlace?.day,
  ]);

  const handleBack = () => {
    navigation.goBack();
  };

  const resetEditingState = () => {
    setEditingMemo(null);
    setEditingMemoText("");
    setEditingPlaceId(null);
    setEditingPlaceName("");
    setEditingPlaceTime("");
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

  const handleStartEditPlace = (place: PlaceItem) => {
    if (isEditingMemo) return;

    setEditingPlaceId(place.id);
    setEditingPlaceName(place.name);
    setEditingPlaceTime(place.time);
  };

  const handleCancelEditPlace = () => {
    setEditingPlaceId(null);
    setEditingPlaceName("");
    setEditingPlaceTime("");
  };

  const handleSaveEditPlace = () => {
    const trimmedName = editingPlaceName.trim();
    const trimmedTime = editingPlaceTime.trim();

    if (!editingPlaceId || !trimmedName) return;

    setPlacesByDay((prev) => ({
      ...prev,
      [selectedDay]: (prev[selectedDay] ?? []).map((place) =>
        place.id === editingPlaceId ?
          {
            ...place,
            name: trimmedName,
            time: trimmedTime || "시간 미정",
          }
        : place,
      ),
    }));

    handleCancelEditPlace();
  };

  const handleDeletePlace = (placeId: string) => {
    setPlacesByDay((prev) => ({
      ...prev,
      [selectedDay]: (prev[selectedDay] ?? []).filter(
        (place) => place.id !== placeId,
      ),
    }));

    setMemoDrafts((prev) => {
      const next = { ...prev };
      delete next[placeId];
      return next;
    });

    if (editingPlaceId === placeId) {
      handleCancelEditPlace();
    }

    if (editingMemo?.placeId === placeId) {
      setEditingMemo(null);
      setEditingMemoText("");
    }
  };

  const handleChangeMemoDraft = (placeId: string, value: string) => {
    setMemoDrafts((prev) => ({
      ...prev,
      [placeId]: value,
    }));
  };

  const handleAddMemo = (placeId: string) => {
    const trimmedMemo = memoDrafts[placeId]?.trim();

    if (!trimmedMemo) return;

    setPlacesByDay((prev) => ({
      ...prev,
      [selectedDay]: (prev[selectedDay] ?? []).map((place) =>
        place.id === placeId ?
          {
            ...place,
            memos: [
              ...place.memos,
              {
                id: `${Date.now()}`,
                text: trimmedMemo,
              },
            ],
          }
        : place,
      ),
    }));

    setMemoDrafts((prev) => ({
      ...prev,
      [placeId]: "",
    }));
  };

  const handleClearMemo = (placeId: string) => {
    setMemoDrafts((prev) => ({
      ...prev,
      [placeId]: "",
    }));
  };

  const handleStartEditMemo = (placeId: string, item: MemoItem) => {
    setEditingPlaceId(null);
    setEditingPlaceName("");
    setEditingPlaceTime("");
    setEditingMemo({
      placeId,
      memoId: item.id,
    });
    setEditingMemoText(item.text);
  };

  const handleCancelEditMemo = () => {
    setEditingMemo(null);
    setEditingMemoText("");
  };

  const handleSaveEditMemo = () => {
    const trimmedText = editingMemoText.trim();

    if (!editingMemo || !trimmedText) return;

    setPlacesByDay((prev) => ({
      ...prev,
      [selectedDay]: (prev[selectedDay] ?? []).map((place) =>
        place.id === editingMemo.placeId ?
          {
            ...place,
            memos: place.memos.map((memo) =>
              memo.id === editingMemo.memoId ?
                {
                  ...memo,
                  text: trimmedText,
                }
              : memo,
            ),
          }
        : place,
      ),
    }));

    handleCancelEditMemo();
  };

  const handleDeleteMemo = (placeId: string, memoId: string) => {
    setPlacesByDay((prev) => ({
      ...prev,
      [selectedDay]: (prev[selectedDay] ?? []).map((place) =>
        place.id === placeId ?
          {
            ...place,
            memos: place.memos.filter((memo) => memo.id !== memoId),
          }
        : place,
      ),
    }));

    if (editingMemo?.placeId === placeId && editingMemo.memoId === memoId) {
      handleCancelEditMemo();
    }
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

  const renderEmptyPlace = () => {
    return (
      <View style={styles.timelineRow}>
        <View style={styles.timelineLeft}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>1</Text>
          </View>

          <View style={styles.shortTimelineLine} />
        </View>

        <TouchableOpacity
          style={styles.emptyPlaceCardLarge}
          activeOpacity={0.85}
          onPress={handleAddPlace}
        >
          <Text style={styles.emptyPlaceTitle}>장소를 추가해주세요</Text>
          <Text style={styles.emptyPlaceSubText}>
            Day {selectedDay}에 방문할 장소를 등록해보세요.
          </Text>
        </TouchableOpacity>
      </View>
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
            : renderEmptyPlace()}
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

  timelineRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
  },

  timelineLeft: {
    width: 30,
    alignItems: "center",
    marginRight: 14,
  },

  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#2158E8",
    alignItems: "center",
    justifyContent: "center",
  },

  stepBadgeText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  shortTimelineLine: {
    width: 2,
    minHeight: 56,
    marginTop: 4,
    backgroundColor: "#DCEBFF",
  },

  emptyPlaceCardLarge: {
    flex: 1,
    minHeight: 86,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E1E7EF",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    justifyContent: "center",
  },

  emptyPlaceTitle: {
    color: "#252D3C",
    fontSize: 15,
    fontWeight: "900",
  },

  emptyPlaceSubText: {
    marginTop: 7,
    color: "#8C9BB1",
    fontSize: 12,
    fontWeight: "600",
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
