import React, { useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import GapRecommendationCard from "../components/recommendations/GapRecommendationCard";

type TransportMode = "WALK" | "TRANSIT" | "CAR";

type ScheduleMemo = {
  id: string;
  text: string;
  createdAt?: string;
  updatedAt?: string;
};

type TodayPlace = {
  id?: string | number;

  // 서버에서 생성된 여행 장소 ID
  tripPlaceId?: number | string;
  serverTripPlaceId?: number | string;

  // 외부 장소 ID
  placeId?: string;
  googlePlaceId?: string;

  name?: string;
  address?: string;
  time?: string;
  latitude?: number;
  longitude?: number;
  category?: string;
  order?: number;
  memos?: ScheduleMemo[];
};

type ScheduleDay = {
  day: number;
  places: TodayPlace[];
};

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
      places?: TodayPlace[];
      days?: ScheduleDay[];
    };
  };
};

const DAY_TABS = ["Day 1", "Day 2", "Day 3"];

const isValidServerPlanId = (value?: string | number) => {
  if (value === undefined || value === null) return false;

  const text = String(value).trim();

  if (!text) return false;

  // Google Place ID는 서버 planId가 아니므로 차단
  if (text.startsWith("ChIJ")) return false;

  return Number.isFinite(Number(text));
};


export default function OngoingScheduleScreen({ navigation, route }: Props) {
  const params = route?.params ?? {};

  const {
    scheduleId,
    tripId,
    serverTripId,
    tripName = "신나는 여행",
    startDate,
    endDate,
    location = "장소 미정",
    transportMode = "WALK",
    transportLabel = "도보",
    days = [],
  } = params;

  const resolvedTripId =
    tripId ??
    serverTripId ??
    (scheduleId && Number.isFinite(Number(scheduleId)) ? scheduleId : undefined);

  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  const currentDay = useMemo(() => {
    const dayNumber = selectedDayIndex + 1;
    return days.find((day) => day.day === dayNumber);
  }, [days, selectedDayIndex]);

  const places = useMemo(() => {
    if (currentDay?.places?.length) {
      return [...currentDay.places].sort((a, b) => {
        const aOrder = a.order ?? 0;
        const bOrder = b.order ?? 0;
        return aOrder - bOrder;
      });
    }

    if (params.places && params.places.length > 0) {
      return params.places;
    }

    return [];
  }, [currentDay?.places, params.places]);

  const hasPlaces = places.length > 0;

  const handleBack = () => {
    navigation.goBack();
  };

  const handleEdit = () => {
    navigation.navigate("PlanA", {
      scheduleId,
      tripId: resolvedTripId,
      serverTripId: resolvedTripId,
      tripName,
      startDate,
      endDate,
      location,
      transportMode,
      transportLabel,
    });
  };

  const handleAlternative = (place: TodayPlace) => {
    const serverPlanId = place.serverTripPlaceId ?? place.tripPlaceId ?? place.id;

    console.log("[OngoingSchedule] 대안찾기 클릭:", {
      scheduleId,
      tripId,
      serverTripId,
      resolvedTripId,
      place,
      serverPlanId,
    });

    if (!isValidServerPlanId(serverPlanId)) {
      console.log("[OngoingSchedule] 잘못된 serverPlanId 차단:", {
        serverPlanId,
        place,
      });

      Alert.alert(
        "AI 대안 추천 불가",
        "이 일정은 서버 장소 ID가 없는 이전 로컬 일정입니다. 새 일정으로 장소를 다시 추가한 뒤 AI 추천을 시도해주세요.",
      );
      return;
    }

    navigation.navigate("AlternativeSettings", {
      scheduleId,
      tripId: resolvedTripId,
      serverTripId: resolvedTripId,
      tripName,
      startDate,
      endDate,
      location,
      transportMode,
      transportLabel,
      currentPlanId: serverPlanId,
      tripPlaceId: serverPlanId,
      serverTripPlaceId: serverPlanId,
      targetPlace: {
        id: place.id,

        // 서버 장소 ID
        tripPlaceId: serverPlanId,
        serverTripPlaceId: serverPlanId,

        // Google Place ID
        placeId: place.placeId ?? place.googlePlaceId ?? String(place.id ?? ""),
        googlePlaceId:
          place.googlePlaceId ?? place.placeId ?? String(place.id ?? ""),

        name: place.name,
        address: place.address,
        time: place.time,
        latitude: place.latitude,
        longitude: place.longitude,
        category: place.category,
      },
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
                <Ionicons name="location-outline" size={16} color="#FFFFFF" />
              </View>

              <View style={styles.mapMarkerSmallOne}>
                <Ionicons name="pin-outline" size={15} color="#FFFFFF" />
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
            {!hasPlaces ?
              <View style={styles.emptyDayCard}>
                <Ionicons name="calendar-outline" size={28} color="#94A3B8" />
                <Text style={styles.emptyDayTitle}>
                  이 Day에는 저장된 장소가 없어요
                </Text>
                <Text style={styles.emptyDayDescription}>
                  수정 버튼을 눌러 장소를 추가해보세요.
                </Text>
              </View>
            : null}

            {places.map((place, index) => {
              const focused = index === 0;
              const hasServerPlanId = Boolean(
                place.serverTripPlaceId ?? place.tripPlaceId,
              );

              return (
                <React.Fragment
                  key={`${String(place.tripPlaceId ?? place.id ?? place.name)}-${index}`}
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
                        {place.name || "이름 없는 장소"}
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
                          {place.time || "시간 미정"}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.alternativeButton,
                        !hasServerPlanId && styles.disabledAlternativeButton,
                      ]}
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

                  {place.memos?.length ?
                    <View style={styles.memoList}>
                      {place.memos.map((memo) => (
                        <View key={memo.id} style={styles.memoCard}>
                          <Ionicons
                            name="reader-outline"
                            size={17}
                            color="#64748B"
                          />
                          <Text style={styles.memoText}>{memo.text}</Text>
                        </View>
                      ))}
                    </View>
                  : null}

                  {index === 0 && places.length >= 2 ? (
                    <View style={styles.gapRecommendationSection}>
                      <GapRecommendationCard tripId={resolvedTripId} />
                    </View>
                  ) : null}
                </React.Fragment>
              );
            })}
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

  disabledAlternativeButton: {
    opacity: 0.55,
  },

  alternativeButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    marginRight: 3,
  },

  memoList: {
    marginTop: -6,
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

  emptyDayCard: {
    minHeight: 150,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DDE5F0",
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 24,
  },

  emptyDayTitle: {
    color: "#1F2937",
    fontSize: 17,
    fontWeight: "900",
    marginTop: 12,
    marginBottom: 7,
    textAlign: "center",
  },

  gapRecommendationSection: {
    marginTop: -4,
    marginBottom: 18,
  },

  emptyDayDescription: {
    color: "#94A3B8",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 20,
  },
});
