import React, { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

type TransportMode = "WALK" | "TRANSIT" | "CAR";

type TodayPlace = {
  id?: string | number;
  name?: string;
  address?: string;
  time?: string;
  latitude?: number;
  longitude?: number;
};

type ScheduleGap = {
  id: string;
  beforePlanId?: string | number;
  afterPlanId?: string | number;
  title: string;
  subtitle: string;
};

type Props = {
  navigation: any;
  route?: {
    params?: {
      scheduleId?: string;
      tripName?: string;
      startDate?: string;
      endDate?: string;
      location?: string;
      transportMode?: TransportMode;
      transportLabel?: string;
      places?: TodayPlace[];
    };
  };
};

const DAY_TABS = ["Day 1", "Day 2", "Day 3"];

const MOCK_TODAY_PLACES: TodayPlace[] = [
  {
    id: "today-1",
    name: "강릉역",
    address: "강원도 강릉시",
    time: "10:00",
  },
  {
    id: "today-2",
    name: "강릉역",
    address: "강원도 강릉시",
    time: "10:00",
  },
  {
    id: "today-3",
    name: "강릉역",
    address: "강원도 강릉시",
    time: "10:00",
  },
];

const MOCK_MEMOS = [
  "내릴 때 짐 까먹지 말기",
  "내릴 때 짐 까먹지 말기",
  "내릴 때 짐 까먹지 말기",
];

const MOCK_SCHEDULE_GAPS: ScheduleGap[] = [
  {
    id: "gap-1",
    beforePlanId: "today-2",
    afterPlanId: "today-3",
    title: "일정 사이에 텀이 생겼어요",
    subtitle: "틈새 대안찾기",
  },
];

function GapRecommendationCard({
  gap,
  onPress,
}: {
  gap: ScheduleGap;
  onPress: (gap: ScheduleGap) => void;
}) {
  return (
    <TouchableOpacity
      style={styles.gapCard}
      activeOpacity={0.82}
      onPress={() => onPress(gap)}
    >
      <View style={styles.gapTextBox}>
        <Text style={styles.gapTitle}>{gap.title}</Text>
        <Text style={styles.gapSubtitle}>{gap.subtitle}</Text>
      </View>

      <Ionicons name="chevron-forward" size={22} color="#C4CBD6" />
    </TouchableOpacity>
  );
}

export default function OngoingScheduleScreen({ navigation, route }: Props) {
  const params = route?.params ?? {};

  const {
    scheduleId,
    tripName = "신나는 강릉여행",
    startDate,
    endDate,
    location = "강원도 강릉시",
    transportMode = "WALK",
    transportLabel = "도보",
  } = params;

  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  const places = useMemo(() => {
    if (params.places && params.places.length > 0) {
      return params.places;
    }

    return MOCK_TODAY_PLACES;
  }, [params.places]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleEdit = () => {
    navigation.navigate("PlanA", {
      scheduleId,
      tripName,
      startDate,
      endDate,
      location,
      transportMode,
      transportLabel,
    });
  };

  const handleAlternative = (place: TodayPlace) => {
    navigation.navigate("AlternativeSettings", {
      scheduleId,
      tripName,
      startDate,
      endDate,
      location,
      transportMode,
      transportLabel,
      targetPlace: place,
    });
  };

  const handleGapAlternative = (gap: ScheduleGap) => {
    navigation.navigate("AlternativeSettings", {
      scheduleId,
      tripName,
      startDate,
      endDate,
      location,
      transportMode,
      transportLabel,
      recommendationType: "GAP",
      beforePlanId: gap.beforePlanId,
      afterPlanId: gap.afterPlanId,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.75}
            onPress={handleBack}
          >
            <Ionicons name="chevron-back" size={24} color="#64748B" />
          </TouchableOpacity>

          <Text style={styles.logoText}>Plan.B</Text>

          <View style={styles.headerRightSpace} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.dayTabs}>
            {DAY_TABS.map((day, index) => {
              const selected = selectedDayIndex === index;

              return (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayTab, selected && styles.dayTabActive]}
                  activeOpacity={0.85}
                  onPress={() => setSelectedDayIndex(index)}
                >
                  <Text
                    style={[
                      styles.dayTabText,
                      selected && styles.dayTabTextActive,
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.mapSection}>
            <View style={styles.mapFake}>
              <View style={styles.mapRoadDiagonalOne} />
              <View style={styles.mapRoadDiagonalTwo} />
              <View style={styles.mapRoadHorizontalOne} />
              <View style={styles.mapRoadHorizontalTwo} />

              <Text style={[styles.mapLabel, styles.mapLabelOne]}>교동</Text>
              <Text style={[styles.mapLabel, styles.mapLabelTwo]}>MBC</Text>
              <Text style={[styles.mapLabel, styles.mapLabelThree]}>
                강릉해양경찰서
              </Text>
              <Text style={[styles.mapLabel, styles.mapLabelFour]}>
                교통하늘채{"\n"}스카이파크
              </Text>

              <View style={styles.mapMarkerMain}>
                <Ionicons name="train-outline" size={16} color="#FFFFFF" />
              </View>

              <View style={styles.mapMarkerSmallOne}>
                <Ionicons name="shield-outline" size={15} color="#FFFFFF" />
              </View>

              <TouchableOpacity
                style={styles.mapExpandButton}
                activeOpacity={0.8}
              >
                <Ionicons name="expand-outline" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.todayHeader}>
            <Text style={styles.todayTitle}>오늘 일정</Text>

            <TouchableOpacity activeOpacity={0.75} onPress={handleEdit}>
              <Text style={styles.editText}>수정</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.timelineList}>
            {places.map((place, index) => {
              const focused = index === 0;
              const gapAfterThisPlace =
                index === 1 ? MOCK_SCHEDULE_GAPS[0] : undefined;

              return (
                <React.Fragment
                  key={`${String(place.id || place.name)}-${index}`}
                >
                  <View
                    style={[
                      styles.todayCard,
                      focused && styles.todayCardActive,
                    ]}
                  >
                    <View style={styles.numberCircle}>
                      <Text style={styles.numberText}>{index + 1}</Text>
                    </View>

                    <View style={styles.placeInfo}>
                      <Text style={styles.placeName} numberOfLines={1}>
                        {place.name || "강릉역"}
                      </Text>

                      <Text style={styles.placeAddress} numberOfLines={1}>
                        {place.address || location}
                      </Text>

                      <View style={styles.timeRow}>
                        <Ionicons
                          name="time-outline"
                          size={15}
                          color="#94A3B8"
                        />
                        <Text style={styles.timeText}>
                          {place.time || "10:00"}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.alternativeButton}
                      activeOpacity={0.85}
                      onPress={() => handleAlternative(place)}
                    >
                      <Text style={styles.alternativeButtonText}>대안찾기</Text>
                      <Ionicons
                        name="chevron-forward"
                        size={14}
                        color="#FFFFFF"
                      />
                    </TouchableOpacity>
                  </View>

                  {gapAfterThisPlace ?
                    <GapRecommendationCard
                      gap={gapAfterThisPlace}
                      onPress={handleGapAlternative}
                    />
                  : null}
                </React.Fragment>
              );
            })}

            <View style={styles.memoList}>
              {MOCK_MEMOS.map((memo, index) => (
                <View key={`${memo}-${index}`} style={styles.memoCard}>
                  <Ionicons name="reader-outline" size={17} color="#64748B" />
                  <Text style={styles.memoText}>{memo}</Text>
                </View>
              ))}
            </View>
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
    backgroundColor: "#FFFFFF",
  },

  header: {
    height: 76,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },

  backButton: {
    width: 36,
    height: 36,
    alignItems: "flex-start",
    justifyContent: "center",
  },

  logoText: {
    flex: 1,
    color: "#1C2534",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.8,
    textAlign: "center",
  },

  headerRightSpace: {
    width: 36,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 36,
  },

  dayTabs: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 18,
  },

  dayTab: {
    height: 48,
    minWidth: 82,
    borderRadius: 24,
    backgroundColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },

  dayTabActive: {
    backgroundColor: "#2158E8",
    shadowColor: "#2158E8",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },

  dayTabText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },

  dayTabTextActive: {
    color: "#FFFFFF",
  },

  mapSection: {
    height: 220,
    backgroundColor: "#EDF3F9",
    overflow: "hidden",
  },

  mapFake: {
    flex: 1,
    backgroundColor: "#F5F6F7",
    position: "relative",
  },

  mapRoadDiagonalOne: {
    position: "absolute",
    width: 380,
    height: 26,
    left: 38,
    top: 104,
    backgroundColor: "#DEE3EA",
    transform: [{ rotate: "-31deg" }],
    borderRadius: 20,
  },

  mapRoadDiagonalTwo: {
    position: "absolute",
    width: 370,
    height: 20,
    left: 6,
    top: 154,
    backgroundColor: "#E7EBF0",
    transform: [{ rotate: "-18deg" }],
    borderRadius: 20,
  },

  mapRoadHorizontalOne: {
    position: "absolute",
    width: 520,
    height: 16,
    left: -20,
    top: 58,
    backgroundColor: "#E0E5EB",
    borderRadius: 16,
  },

  mapRoadHorizontalTwo: {
    position: "absolute",
    width: 520,
    height: 15,
    left: -40,
    top: 190,
    backgroundColor: "#E0E5EB",
    borderRadius: 16,
  },

  mapLabel: {
    position: "absolute",
    color: "#667085",
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 22,
  },

  mapLabelOne: {
    left: 36,
    top: 126,
  },

  mapLabelTwo: {
    right: 120,
    top: 26,
  },

  mapLabelThree: {
    right: 18,
    top: 86,
    width: 118,
  },

  mapLabelFour: {
    left: 184,
    top: 58,
    width: 110,
    textAlign: "center",
  },

  mapMarkerMain: {
    position: "absolute",
    left: 218,
    top: 158,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#7D92BD",
    borderWidth: 3,
    borderColor: "#D4DEEF",
    alignItems: "center",
    justifyContent: "center",
  },

  mapMarkerSmallOne: {
    position: "absolute",
    right: 98,
    top: 122,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#91A4CC",
    borderWidth: 3,
    borderColor: "#D4DEEF",
    alignItems: "center",
    justifyContent: "center",
  },

  mapExpandButton: {
    position: "absolute",
    right: 16,
    top: 14,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  todayHeader: {
    paddingHorizontal: 30,
    paddingTop: 26,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  todayTitle: {
    color: "#000000",
    fontSize: 25,
    fontWeight: "900",
    letterSpacing: -0.6,
  },

  editText: {
    color: "#2158E8",
    fontSize: 17,
    fontWeight: "800",
  },

  timelineList: {
    paddingHorizontal: 24,
    gap: 14,
  },

  todayCard: {
    minHeight: 98,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
  },

  todayCardActive: {
    borderWidth: 1.5,
    borderColor: "#2158E8",
    backgroundColor: "#FFFFFF",
  },

  numberCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 18,
  },

  numberText: {
    color: "#2158E8",
    fontSize: 17,
    fontWeight: "900",
  },

  placeInfo: {
    flex: 1,
    paddingRight: 10,
  },

  placeName: {
    color: "#1F2937",
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: -0.4,
    marginBottom: 5,
  },

  placeAddress: {
    color: "#64748B",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 7,
  },

  timeRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  timeText: {
    color: "#64748B",
    fontSize: 15,
    fontWeight: "700",
    marginLeft: 5,
  },

  alternativeButton: {
    height: 44,
    borderRadius: 14,
    backgroundColor: "#2158E8",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2158E8",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 4,
  },

  alternativeButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    marginRight: 3,
  },

  gapCard: {
    minHeight: 78,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#DDE5F0",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  gapTextBox: {
    flex: 1,
  },

  gapTitle: {
    color: "#64748B",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: -0.3,
    marginBottom: 6,
  },

  gapSubtitle: {
    color: "#64748B",
    fontSize: 15,
    fontWeight: "800",
  },

  memoList: {
    marginTop: 4,
    paddingLeft: 92,
    gap: 9,
  },

  memoCard: {
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DDE5F0",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  memoText: {
    color: "#1F2937",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 8,
  },
});
