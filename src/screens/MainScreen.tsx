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
    navigation.navigate("PlanA", {
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

  const renderScheduleCard = (schedule: StoredSchedule) => {
    return (
      <TouchableOpacity
        key={getScheduleId(schedule)}
        style={styles.scheduleCard}
        activeOpacity={0.85}
        onPress={() => handleOpenSchedule(schedule)}
      >
        <View style={styles.scheduleCardIcon}>
          <Ionicons name="calendar-outline" size={22} color="#2158E8" />
        </View>

        <View style={styles.scheduleCardContent}>
          <Text style={styles.scheduleTitle} numberOfLines={1}>
            {getScheduleTitle(schedule)}
          </Text>

          <Text style={styles.scheduleDate} numberOfLines={1}>
            {getScheduleDate(schedule)}
          </Text>

          {schedule.location ?
            <Text style={styles.scheduleLocation} numberOfLines={1}>
              {schedule.location}
            </Text>
          : null}
        </View>

        <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
      </TouchableOpacity>
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
        : <ScrollView
            style={styles.scheduleList}
            contentContainerStyle={styles.scheduleListContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>진행 중인 일정</Text>

              <TouchableOpacity
                style={styles.smallAddButton}
                activeOpacity={0.85}
                onPress={handleAddSchedule}
              >
                <Ionicons name="add" size={16} color="#FFFFFF" />
                <Text style={styles.smallAddButtonText}>추가</Text>
              </TouchableOpacity>
            </View>

            {schedules.map(renderScheduleCard)}
          </ScrollView>
        }
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
    paddingTop: 18,
    paddingBottom: 12,
  },

  logoText: {
    color: "#1C2534",
    fontSize: 38,
    fontWeight: "900",
    letterSpacing: -1.2,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 110,
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

  /*
   * 여기 고치면 됨.
   * 원이 앞에 있는 것처럼 보이면 opacity를 더 낮춰.
   * 예: 0.42 → 0.32
   */
  radialLayer: {
    position: "absolute",
    top: "51%",
    marginTop: -175,
    width: 350,
    height: 350,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.42,
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

  scheduleList: {
    flex: 1,
  },

  scheduleListContent: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 130,
  },

  sectionHeader: {
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sectionTitle: {
    color: "#1C2534",
    fontSize: 22,
    fontWeight: "900",
  },

  smallAddButton: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#2158E8",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },

  smallAddButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  scheduleCard: {
    minHeight: 92,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E3EAF4",
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },

  scheduleCardIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#EAF3FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  scheduleCardContent: {
    flex: 1,
  },

  scheduleTitle: {
    color: "#1C2534",
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 6,
  },

  scheduleDate: {
    color: "#8C9BB1",
    fontSize: 13,
    fontWeight: "700",
  },

  scheduleLocation: {
    color: "#2158E8",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 5,
  },
});
