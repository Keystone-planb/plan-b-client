import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";

type Props = {
  navigation: any;
  route?: {
    params?: {
      tripName?: string;
      startDate?: string;
      endDate?: string;
      location?: string;
      selectedPlace?: {
        id: string;
        name: string;
        time?: string;
        day?: number;
      };
    };
  };
};

type DayOption = {
  id: number;
  label: string;
};

type MemoItem = {
  id: string;
  text: string;
};

const DAY_OPTIONS: DayOption[] = [
  { id: 1, label: "Day 1" },
  { id: 2, label: "Day 2" },
  { id: 3, label: "Day 3" },
];

const DEFAULT_MEMOS: MemoItem[] = [
  { id: "1", text: "내일 매점 까먹지 말기" },
  { id: "2", text: "내일 매점 까먹지 말기" },
  { id: "3", text: "내일 매점 까먹지 말기" },
];

const DAY_PLACE_INFO: Record<
  number,
  {
    placeName: string;
    placeTime: string;
    emptyText: string;
  }
> = {
  1: {
    placeName: "강릉역",
    placeTime: "10:00",
    emptyText: "Day 1 장소를 추가해주세요",
  },
  2: {
    placeName: "장소를 추가해주세요",
    placeTime: "시간을 설정해주세요",
    emptyText: "Day 2 장소를 추가해주세요",
  },
  3: {
    placeName: "장소를 추가해주세요",
    placeTime: "시간을 설정해주세요",
    emptyText: "Day 3 장소를 추가해주세요",
  },
};

export default function PlanAScreen({ navigation, route }: Props) {
  const [selectedDay, setSelectedDay] = useState(1);
  const [memo, setMemo] = useState("");
  const [memos, setMemos] = useState<MemoItem[]>(DEFAULT_MEMOS);

  const tripName = route?.params?.tripName ?? "신나는 강릉 여행";
  const startDate = route?.params?.startDate ?? "2026.04.21";
  const endDate = route?.params?.endDate ?? "04.23";
  const selectedPlace = route?.params?.selectedPlace;

  const currentDayInfo = DAY_PLACE_INFO[selectedDay];

  const placeName =
    selectedPlace?.day === selectedDay && selectedPlace?.name ?
      selectedPlace.name
    : currentDayInfo.placeName;

  const placeTime =
    selectedPlace?.day === selectedDay && selectedPlace?.time ?
      selectedPlace.time
    : currentDayInfo.placeTime;

  const hasRealPlace = placeName !== "장소를 추가해주세요";
  const hasMemoText = memo.trim().length > 0;

  const handleBack = () => {
    navigation.goBack();
  };

  const handleChangeDay = (dayId: number) => {
    setSelectedDay(dayId);
    setMemo("");
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

  const handleAddMemo = () => {
    const trimmedMemo = memo.trim();

    if (!trimmedMemo) return;

    setMemos((prev) => [
      ...prev,
      {
        id: `${Date.now()}`,
        text: trimmedMemo,
      },
    ]);

    setMemo("");
  };

  const handleClearMemo = () => {
    setMemo("");
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

            <View style={styles.dayTabs}>
              {DAY_OPTIONS.map((day) => {
                const isSelected = selectedDay === day.id;

                return (
                  <TouchableOpacity
                    key={day.id}
                    style={[styles.dayTab, isSelected && styles.activeDayTab]}
                    activeOpacity={0.85}
                    onPress={() => handleChangeDay(day.id)}
                  >
                    <Text
                      style={[
                        styles.dayTabText,
                        isSelected && styles.activeDayTabText,
                      ]}
                    >
                      {day.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.mapArea}>
            <View style={styles.mapRoadHorizontal} />
            <View style={styles.mapRoadVertical} />
            <View style={styles.mapRoadDiagonal} />

            <View style={styles.mapGreenAreaOne}>
              <Text style={styles.mapAreaText}>강릉종합{"\n"}운동장</Text>
            </View>

            <View style={styles.mapGreenAreaTwo} />

            <Text style={[styles.mapPlaceLabel, styles.mapLabelOne]}>
              강릉세무서
            </Text>

            <Text style={[styles.mapPlaceLabel, styles.mapLabelTwo]}>
              하슬라중학교
            </Text>

            <Text style={[styles.mapPlaceLabel, styles.mapLabelThree]}>
              교2동
            </Text>

            <View style={[styles.mapPin, styles.mapPinOne]}>
              <Text style={styles.mapPinText}>1</Text>
            </View>

            <View style={[styles.mapPin, styles.mapPinTwo]}>
              <Text style={styles.mapPinText}>2</Text>
            </View>

            <View style={[styles.mapPin, styles.mapPinThree]}>
              <Text style={styles.mapPinText}>3</Text>
            </View>
          </View>

          <View style={styles.sheet}>
            <View style={styles.sheetHandleWrapper}>
              <View style={styles.sheetHandle} />
            </View>

            <View style={styles.timelineRow}>
              <View style={styles.timelineLeft}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>1</Text>
                </View>

                <View
                  style={[
                    styles.timelineLine,
                    !hasRealPlace && styles.shortTimelineLine,
                  ]}
                />
              </View>

              <View style={styles.placeCard}>
                <View style={styles.placeHeader}>
                  <View style={styles.placeTitleBox}>
                    <Text
                      style={[
                        styles.placeTitle,
                        !hasRealPlace && styles.emptyPlaceTitle,
                      ]}
                    >
                      {placeName}
                    </Text>

                    <Text
                      style={[
                        styles.placeTime,
                        !hasRealPlace && styles.emptyPlaceTime,
                      ]}
                    >
                      {placeTime}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.memoButton,
                      !hasRealPlace && styles.memoButtonDisabledState,
                    ]}
                    activeOpacity={0.85}
                    onPress={handleAddMemo}
                    disabled={!hasRealPlace}
                  >
                    <Text style={styles.memoButtonText}>메모추가</Text>
                  </TouchableOpacity>
                </View>

                {hasRealPlace ?
                  <View style={styles.memoList}>
                    {memos.map((item) => (
                      <View key={item.id} style={styles.memoItem}>
                        <Ionicons
                          name="document-text-outline"
                          size={14}
                          color="#8C9BB1"
                        />

                        <Text style={styles.memoItemText} numberOfLines={1}>
                          {item.text}
                        </Text>
                      </View>
                    ))}

                    <View style={styles.memoInputRow}>
                      <TextInput
                        value={memo}
                        onChangeText={setMemo}
                        placeholder="메모를 입력하세요"
                        placeholderTextColor="#8C9BB1"
                        style={styles.memoInput}
                      />

                      <TouchableOpacity
                        style={[
                          styles.memoConfirmButton,
                          hasMemoText && styles.memoConfirmButtonActive,
                          !hasMemoText && styles.memoButtonDisabled,
                        ]}
                        activeOpacity={0.85}
                        onPress={handleAddMemo}
                        disabled={!hasMemoText}
                      >
                        <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.memoCancelButton}
                        activeOpacity={0.85}
                        onPress={handleClearMemo}
                      >
                        <Ionicons name="close" size={18} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                : null}
              </View>
            </View>

            <TouchableOpacity
              style={styles.addPlaceButton}
              activeOpacity={0.85}
              onPress={handleAddPlace}
            >
              <Text style={styles.addPlaceButtonText}>
                {hasRealPlace ? "장소 추가" : currentDayInfo.emptyText}
              </Text>
            </TouchableOpacity>

            {hasRealPlace ?
              <View style={styles.nextTimelineRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>2</Text>
                </View>

                <View style={styles.emptyPlaceCard} />
              </View>
            : null}
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

  dayTabs: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    gap: 8,
  },

  dayTab: {
    minWidth: 56,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: "#F1F6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  activeDayTab: {
    backgroundColor: "#2158E8",
    shadowColor: "#2158E8",
    shadowOpacity: 0.24,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowRadius: 8,
    elevation: 4,
  },

  dayTabText: {
    color: "#8C9BB1",
    fontSize: 12,
    fontWeight: "800",
  },

  activeDayTabText: {
    color: "#FFFFFF",
  },

  mapArea: {
    height: 128,
    backgroundColor: "#EEF3F7",
    overflow: "hidden",
    position: "relative",
  },

  mapRoadHorizontal: {
    position: "absolute",
    left: -20,
    right: -20,
    top: 62,
    height: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#D8E0EA",
    transform: [{ rotate: "-4deg" }],
  },

  mapRoadVertical: {
    position: "absolute",
    top: -20,
    bottom: -20,
    left: 132,
    width: 18,
    backgroundColor: "#FFFFFF",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#D8E0EA",
    transform: [{ rotate: "12deg" }],
  },

  mapRoadDiagonal: {
    position: "absolute",
    left: 170,
    top: -12,
    width: 16,
    height: 180,
    backgroundColor: "#FFFFFF",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#D8E0EA",
    transform: [{ rotate: "48deg" }],
  },

  mapGreenAreaOne: {
    position: "absolute",
    left: 88,
    top: 28,
    width: 88,
    height: 58,
    borderRadius: 16,
    backgroundColor: "#BFE8C5",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },

  mapGreenAreaTwo: {
    position: "absolute",
    left: 18,
    top: 14,
    width: 58,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#CDEFD1",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },

  mapAreaText: {
    color: "#2B8A3E",
    fontSize: 10,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 14,
  },

  mapPlaceLabel: {
    position: "absolute",
    color: "#8C9BB1",
    fontSize: 11,
    fontWeight: "800",
  },

  mapLabelOne: {
    left: 84,
    top: 12,
  },

  mapLabelTwo: {
    right: 24,
    top: 55,
    color: "#4A8BEA",
  },

  mapLabelThree: {
    left: 154,
    bottom: 16,
  },

  mapPin: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#2158E8",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },

  mapPinOne: {
    right: 82,
    top: 52,
  },

  mapPinTwo: {
    right: 48,
    bottom: 12,
  },

  mapPinThree: {
    left: 76,
    top: 58,
  },

  mapPinText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
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

  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 204,
    marginTop: 4,
    backgroundColor: "#DCEBFF",
  },

  shortTimelineLine: {
    minHeight: 56,
  },

  placeCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E1E7EF",
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },

  placeHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },

  placeTitleBox: {
    flex: 1,
  },

  placeTitle: {
    color: "#252D3C",
    fontSize: 15,
    fontWeight: "900",
  },

  emptyPlaceTitle: {
    color: "#627187",
  },

  placeTime: {
    marginTop: 7,
    color: "#627187",
    fontSize: 12,
    fontWeight: "600",
  },

  emptyPlaceTime: {
    color: "#8C9BB1",
  },

  memoButton: {
    backgroundColor: "#8DBEFF",
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },

  memoButtonDisabledState: {
    backgroundColor: "#2158E8",
  },

  memoButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },

  memoList: {
    marginTop: 14,
    gap: 8,
  },

  memoItem: {
    minHeight: 34,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E1E7EF",
    backgroundColor: "#F8FBFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
  },

  memoItemText: {
    flex: 1,
    marginLeft: 6,
    color: "#627187",
    fontSize: 11,
    fontWeight: "600",
  },

  memoInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  memoInput: {
    flex: 1,
    height: 34,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#9FC8FF",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    fontSize: 11,
    color: "#1C2534",
  },

  memoConfirmButton: {
    width: 34,
    height: 34,
    borderRadius: 6,
    backgroundColor: "#8DBEFF",
    alignItems: "center",
    justifyContent: "center",
  },

  memoConfirmButtonActive: {
    backgroundColor: "#2158E8",
  },

  memoButtonDisabled: {
    opacity: 0.45,
  },

  memoCancelButton: {
    width: 34,
    height: 34,
    borderRadius: 6,
    backgroundColor: "#B8C4D4",
    alignItems: "center",
    justifyContent: "center",
  },

  addPlaceButton: {
    marginTop: 14,
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

  nextTimelineRow: {
    marginTop: 28,
    flexDirection: "row",
    alignItems: "center",
  },

  emptyPlaceCard: {
    flex: 1,
    height: 62,
    marginLeft: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E1E7EF",
    backgroundColor: "#FFFFFF",
  },
});
