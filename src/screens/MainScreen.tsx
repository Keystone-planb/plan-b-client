import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import RadialBackground from "../components/RadialBackground";

type Props = {
  navigation: any;
  route?: {
    params?: {
      refreshSchedules?: boolean;
      savedScheduleId?: string;
    };
  };
};

type StoredSchedule = {
  id?: string;
  scheduleId?: string;
  tripName?: string;
  title?: string;
  name?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  transportMode?: "WALK" | "TRANSIT" | "CAR";
  transportLabel?: string;
  days?: unknown[];
  updatedAt?: string;
  createdAt?: string;
};

const PLAN_A_STORAGE_PREFIX = "plan_a_schedule:";

const formatDisplayDate = (value?: string) => {
  if (!value) return "";
  return value.replace(/-/g, ".");
};

const getScheduleId = (schedule: StoredSchedule) => {
  return schedule.scheduleId || schedule.id || "";
};

const getScheduleTitle = (schedule: StoredSchedule) => {
  return (
    schedule.tripName || schedule.title || schedule.name || "이름 없는 여행"
  );
};

const getScheduleDate = (schedule: StoredSchedule) => {
  const startDate = formatDisplayDate(schedule.startDate);
  const endDate = formatDisplayDate(schedule.endDate);

  if (startDate && endDate) {
    return `${startDate} - ${endDate}`;
  }

  if (startDate) return startDate;
  if (endDate) return endDate;

  return "날짜 미정";
};

const getScheduleLocation = (schedule: StoredSchedule) => {
  return schedule.location || "장소 미정";
};

const getCurrentDayLabel = (schedule?: StoredSchedule) => {
  if (!schedule?.days || !Array.isArray(schedule.days)) {
    return "Day 1";
  }

  return "Day 1";
};

export default function MainScreen({ navigation }: Props) {
  const [schedules, setSchedules] = useState<StoredSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSchedules = async () => {
    try {
      setLoading(true);

      const keys = await AsyncStorage.getAllKeys();
      const planAKeys = keys.filter((key) =>
        key.startsWith(PLAN_A_STORAGE_PREFIX),
      );

      if (planAKeys.length === 0) {
        setSchedules([]);
        return;
      }

      const entries = await AsyncStorage.multiGet(planAKeys);

      const loadedSchedules = entries
        .map(([, value]) => {
          if (!value) return null;

          try {
            return JSON.parse(value) as StoredSchedule;
          } catch (error) {
            console.log("[Main] 일정 파싱 실패:", error);
            return null;
          }
        })
        .filter((item): item is StoredSchedule => Boolean(item))
        .sort((a, b) => {
          const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
          const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();

          return bTime - aTime;
        });

      setSchedules(loadedSchedules);
    } catch (error) {
      console.log("[Main] 일정 불러오기 실패:", error);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadSchedules();
    }, []),
  );

  const handleAddSchedule = () => {
    navigation.navigate("AddSchedule");
  };

  const handleOpenSchedule = (schedule: StoredSchedule) => {
    navigation.navigate("OngoingSchedule", {
      scheduleId: getScheduleId(schedule),
      tripName: getScheduleTitle(schedule),
      startDate: schedule.startDate,
      endDate: schedule.endDate,
      location: schedule.location,
      transportMode: schedule.transportMode,
      transportLabel: schedule.transportLabel,
    });
  };

  const renderEmptyState = () => {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.radialLayer} pointerEvents="none">
          <RadialBackground />
        </View>

        <View style={styles.foregroundContent}>
          <View style={styles.emptyIconCircle}>
            <View style={styles.calendarIcon}>
              <View style={styles.calendarTopBar}>
                <View style={styles.calendarRing} />
                <View style={styles.calendarRing} />
              </View>

              <View style={styles.calendarBody}>
                <View style={styles.calendarDateBlock} />
              </View>
            </View>
          </View>

          <Text style={styles.emptyTitle}>등록된 일정이 없습니다</Text>

          <Text style={styles.emptyDescription}>
            새로운 여행 일정을 추가해보세요
          </Text>

          <TouchableOpacity
            style={styles.addButton}
            activeOpacity={0.85}
            onPress={handleAddSchedule}
          >
            <Text style={styles.addButtonText}>일정 추가하기</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderHomeContent = () => {
    const currentSchedule = schedules[0];

    return (
      <ScrollView
        style={styles.scheduleList}
        contentContainerStyle={styles.homeContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.todayInfoPill}>
          <View style={styles.todayInfoItem}>
            <Text style={styles.todayEmoji}>☀️</Text>
            <Text style={styles.todayInfoText}>23°</Text>
          </View>

          <View style={styles.todayDivider} />

          <View style={styles.todayInfoItem}>
            <Text style={styles.todayEmoji}>📅</Text>
            <Text style={styles.todayInfoText}>
              {formatDisplayDate(currentSchedule.startDate) || "2026.04.30"}
            </Text>
          </View>

          <View style={styles.todayDivider} />

          <View style={styles.todayInfoItem}>
            <Text style={styles.todayEmoji}>🗺️</Text>
            <Text style={styles.todayInfoText}>
              {getCurrentDayLabel(currentSchedule)}
            </Text>
          </View>
        </View>

        <View style={styles.ongoingSection}>
          <Text style={styles.homeSectionTitle}>진행중인 일정</Text>

          <TouchableOpacity
            style={styles.ongoingCard}
            activeOpacity={0.86}
            onPress={() => handleOpenSchedule(currentSchedule)}
          >
            <View style={styles.pinIconCircle}>
              <Text style={styles.pinEmoji}>📌</Text>
            </View>

            <View style={styles.ongoingInfo}>
              <Text style={styles.ongoingTitle} numberOfLines={1}>
                {getScheduleTitle(currentSchedule)}
              </Text>

              <Text style={styles.ongoingLocation} numberOfLines={1}>
                {getScheduleLocation(currentSchedule)}
              </Text>

              <View style={styles.ongoingDateRow}>
                <Ionicons name="calendar-outline" size={17} color="#94A3B8" />
                <Text style={styles.ongoingDateText}>
                  {getScheduleDate(currentSchedule)}
                </Text>
              </View>
            </View>

            <Ionicons name="chevron-forward" size={26} color="#CBD5E1" />
          </TouchableOpacity>
        </View>

        <View style={styles.nextTripSection}>
          <Text style={styles.homeSectionTitle}>다음 여행</Text>

          <TouchableOpacity
            style={styles.nextTripCard}
            activeOpacity={0.86}
            onPress={handleAddSchedule}
          >
            <View style={styles.nextTripThumb}>
              <Text style={styles.nextTripEmoji}>🏝️</Text>
            </View>

            <View style={styles.nextTripInfo}>
              <Text style={styles.nextTripTitle}>제주도 힐링여행</Text>

              <View style={styles.nextTripMetaRow}>
                <Ionicons name="calendar-outline" size={15} color="#94A3B8" />
                <Text style={styles.nextTripMetaText}>
                  2027.03.15 - 2027.03.18
                </Text>
              </View>

              <View style={styles.nextTripMetaRow}>
                <Ionicons name="location-outline" size={15} color="#94A3B8" />
                <Text style={styles.nextTripMetaText}>제주 · 8개 장소</Text>
              </View>
            </View>

            <Ionicons name="chevron-forward" size={24} color="#CBD5E1" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.logoText}>Plan.B</Text>
        </View>

        {loading ?
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2158E8" />
          </View>
        : schedules.length === 0 ?
          renderEmptyState()
        : renderHomeContent()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7F9FB",
  },

  screen: {
    flex: 1,
    backgroundColor: "#F7F9FB",
  },

  header: {
    alignItems: "center",
    paddingTop: 44,
    paddingBottom: 36,
  },

  logoText: {
    color: "#1C2534",
    fontSize: 42,
    fontWeight: "900",
    letterSpacing: -1.4,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 110,
  },

  scheduleList: {
    flex: 1,
  },

  homeContent: {
    paddingHorizontal: 24,
    paddingBottom: 140,
  },

  todayInfoPill: {
    minHeight: 64,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 2,
  },

  todayInfoItem: {
    flexDirection: "row",
    alignItems: "center",
  },

  todayEmoji: {
    fontSize: 18,
    marginRight: 7,
  },

  todayInfoText: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "900",
  },

  todayDivider: {
    width: 1,
    height: 22,
    backgroundColor: "#E5EAF1",
    marginHorizontal: 14,
  },

  ongoingSection: {
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#B9DCFF",
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 22,
    marginBottom: 28,
    shadowColor: "#74B8FF",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 5,
  },

  homeSectionTitle: {
    color: "#000000",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.5,
    marginBottom: 26,
  },

  ongoingCard: {
    minHeight: 84,
    flexDirection: "row",
    alignItems: "center",
  },

  pinIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F5F7FA",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 18,
  },

  pinEmoji: {
    fontSize: 24,
  },

  ongoingInfo: {
    flex: 1,
  },

  ongoingTitle: {
    color: "#1C2534",
    fontSize: 19,
    fontWeight: "900",
    marginBottom: 6,
  },

  ongoingLocation: {
    color: "#8A9BB2",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 9,
  },

  ongoingDateRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  ongoingDateText: {
    color: "#8A9BB2",
    fontSize: 15,
    fontWeight: "700",
    marginLeft: 8,
  },

  nextTripSection: {
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 22,
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 2,
  },

  nextTripCard: {
    minHeight: 92,
    flexDirection: "row",
    alignItems: "center",
  },

  nextTripThumb: {
    width: 82,
    height: 82,
    borderRadius: 14,
    backgroundColor: "#CDE8FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 18,
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },

  nextTripEmoji: {
    fontSize: 42,
  },

  nextTripInfo: {
    flex: 1,
  },

  nextTripTitle: {
    color: "#1C2534",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 11,
  },

  nextTripMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },

  nextTripMetaText: {
    color: "#8A9BB2",
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 6,
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingBottom: 130,
    position: "relative",
    overflow: "hidden",
  },

  radialLayer: {
    position: "absolute",
    top: "51%",
    marginTop: -175,
    width: 350,
    height: 350,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.32,
    zIndex: 0,
    elevation: 0,
  },

  foregroundContent: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 48,
    zIndex: 10,
    elevation: 10,
  },

  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#D7E9FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    zIndex: 11,
    elevation: 11,
  },

  calendarIcon: {
    width: 38,
    height: 38,
    borderRadius: 8,
    borderWidth: 4,
    borderColor: "#2158E8",
    backgroundColor: "#D7E9FF",
    overflow: "hidden",
  },

  calendarTopBar: {
    height: 11,
    backgroundColor: "#2158E8",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 7,
    position: "relative",
  },

  calendarRing: {
    width: 4,
    height: 11,
    borderRadius: 2,
    backgroundColor: "#2158E8",
    marginTop: -7,
  },

  calendarBody: {
    flex: 1,
    backgroundColor: "#D7E9FF",
    alignItems: "center",
    justifyContent: "center",
  },

  calendarDateBlock: {
    width: 12,
    height: 10,
    borderRadius: 2,
    backgroundColor: "#2158E8",
    opacity: 0.95,
  },

  emptyTitle: {
    color: "#1C2534",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 12,
    zIndex: 11,
    elevation: 11,
  },

  emptyDescription: {
    color: "#9AA8BA",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 30,
    zIndex: 11,
    elevation: 11,
  },

  addButton: {
    minWidth: 164,
    height: 56,
    paddingHorizontal: 28,
    borderRadius: 14,
    backgroundColor: "#2158E8",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2158E8",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 12,
    zIndex: 12,
  },

  addButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
  },
});
