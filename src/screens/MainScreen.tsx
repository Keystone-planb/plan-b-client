import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import CalendarSvg from "../assets/calendar.svg";
import RadialBackground from "../components/RadialBackground";
import { getMe } from "../../api/users/me";
import {
  deleteSchedule,
  getSchedules,
  SavedSchedule,
} from "../../api/schedules/storage";
import { loadLatestPlanASchedule } from "../api/schedules/planAStorage";

type Props = {
  navigation: any;
};

type UserInfo = {
  id: number;
  email: string;
  nickname: string;
} | null;

export default function MainScreen({ navigation }: Props) {
  const [user, setUser] = useState<UserInfo>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [schedules, setSchedules] = useState<SavedSchedule[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        setLoadingUser(true);

        const result = await getMe();
        setUser(result);
      } catch (error: unknown) {
        console.log("내 정보 조회 실패:", error);

        const message =
          error instanceof Error ?
            error.message
          : "내 정보 조회에 실패했습니다.";

        Alert.alert("오류", message);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchMe();
  }, []);

  const loadSchedules = async () => {
    try {
      setLoadingSchedules(true);

      const savedSchedules = await getSchedules();
      const latestPlanASchedule = await loadLatestPlanASchedule();

      const latestPlanACard: SavedSchedule | null =
        latestPlanASchedule ?
          {
            id: latestPlanASchedule.id,
            tripName: latestPlanASchedule.tripName,
            startDate: latestPlanASchedule.startDate,
            endDate: latestPlanASchedule.endDate,
            location: latestPlanASchedule.location,
            createdAt:
              latestPlanASchedule.updatedAt ||
              latestPlanASchedule.createdAt ||
              new Date().toISOString(),
          }
        : null;

      const mergedSchedules =
        latestPlanACard ?
          [
            latestPlanACard,
            ...savedSchedules.filter(
              (schedule) => schedule.id !== latestPlanACard.id,
            ),
          ]
        : savedSchedules;

      console.log("[메인 일정 목록]", {
        savedSchedules,
        latestPlanASchedule,
        mergedSchedules,
      });

      setSchedules(mergedSchedules);
    } catch (error) {
      console.log("메인 일정 목록 불러오기 실패:", error);
      setSchedules([]);
    } finally {
      setLoadingSchedules(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadSchedules();
    }, []),
  );

  const formatDate = (value: string) => {
    if (!value) return "";
    return value.replace(/-/g, ".");
  };

  const handleOpenSchedule = (schedule: SavedSchedule) => {
    navigation.navigate("PlanA", {
      scheduleId: schedule.id,
      tripName: schedule.tripName,
      startDate: schedule.startDate,
      endDate: schedule.endDate,
      location: schedule.location,
    });
  };

  const handleDeleteSchedule = (schedule: SavedSchedule) => {
    Alert.alert("일정 삭제", `"${schedule.tripName}" 일정을 삭제할까요?`, [
      {
        text: "취소",
        style: "cancel",
      },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            const nextSchedules = await deleteSchedule(schedule.id);

            console.log("[일정 삭제 완료]", {
              deletedScheduleId: schedule.id,
              nextSchedules,
            });

            setSchedules(nextSchedules);
          } catch (error) {
            console.log("[일정 삭제 실패]", error);
            Alert.alert("삭제 실패", "일정을 삭제하지 못했습니다.");
          }
        },
      },
    ]);
  };

  const renderUserSection = () => {
    if (loadingUser) {
      return <Text style={styles.userText}>사용자 정보를 불러오는 중...</Text>;
    }

    if (user) {
      return (
        <>
          <Text style={styles.userText}>{user.nickname}님, 반가워요</Text>
          <Text style={styles.userSubText}>{user.email}</Text>
        </>
      );
    }

    return (
      <Text style={styles.userText}>사용자 정보를 불러오지 못했습니다.</Text>
    );
  };

  const renderScheduleSection = () => {
    if (loadingSchedules) {
      return (
        <View style={styles.scheduleEmptyBox}>
          <Text style={styles.mainText}>일정을 불러오는 중...</Text>
        </View>
      );
    }

    if (schedules.length === 0) {
      return (
        <View style={styles.scheduleEmptyBox}>
          <Text style={styles.mainText}>등록된 일정이 없습니다</Text>
          <Text style={styles.subText}>새로운 여행 일정을 추가해보세요</Text>
        </View>
      );
    }

    const ongoingSchedule = schedules[0];
    const nextSchedule = schedules[1];

    return (
      <View style={styles.planSection}>
        <View style={styles.todayInfoPill}>
          <Text style={styles.todayInfoText}>☀️ 23°</Text>
          <Text style={styles.todayInfoDivider}>|</Text>
          <Text style={styles.todayInfoText}>📅 2026.04.30</Text>
          <Text style={styles.todayInfoDivider}>|</Text>
          <Text style={styles.todayInfoText}>🗺️ Day 1</Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>진행중인 일정</Text>

          <TouchableOpacity
            style={styles.ongoingCard}
            activeOpacity={0.85}
            onPress={() => handleOpenSchedule(ongoingSchedule)}
          >
            <View style={styles.pinCircle}>
              <Text style={styles.pinEmoji}>📌</Text>
            </View>

            <View style={styles.tripCardInfo}>
              <Text style={styles.tripTitle} numberOfLines={1}>
                {ongoingSchedule.tripName || "신나는 여행"}
              </Text>

              <Text style={styles.tripLocation} numberOfLines={1}>
                {ongoingSchedule.location || "지역 미정"}
              </Text>

              <View style={styles.tripDateRow}>
                <Ionicons name="calendar-outline" size={13} color="#9BAAC0" />
                <Text style={styles.tripDateText} numberOfLines={1}>
                  {formatDate(ongoingSchedule.startDate)} -{" "}
                  {formatDate(ongoingSchedule.endDate)}
                </Text>
              </View>
            </View>

            <Ionicons name="chevron-forward" size={20} color="#C5CFDC" />
          </TouchableOpacity>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>다음 여행</Text>

          {nextSchedule ?
            <TouchableOpacity
              style={styles.nextTripCard}
              activeOpacity={0.85}
              onPress={() => handleOpenSchedule(nextSchedule)}
            >
              <View style={styles.nextTripThumbnail}>
                <Text style={styles.nextTripEmoji}>🏝️</Text>
              </View>

              <View style={styles.tripCardInfo}>
                <Text style={styles.tripTitle} numberOfLines={1}>
                  {nextSchedule.tripName || "다음 여행"}
                </Text>

                <View style={styles.tripDateRow}>
                  <Ionicons name="calendar-outline" size={13} color="#9BAAC0" />
                  <Text style={styles.tripDateText} numberOfLines={1}>
                    {formatDate(nextSchedule.startDate)} -{" "}
                    {formatDate(nextSchedule.endDate)}
                  </Text>
                </View>

                <View style={styles.tripDateRow}>
                  <Ionicons name="location-outline" size={13} color="#9BAAC0" />
                  <Text style={styles.tripDateText} numberOfLines={1}>
                    {nextSchedule.location || "지역 미정"}
                  </Text>
                </View>
              </View>

              <Ionicons name="chevron-forward" size={20} color="#C5CFDC" />
            </TouchableOpacity>
          : <View style={styles.nextTripEmptyBox}>
              <Text style={styles.nextTripEmptyText}>
                다음 여행을 추가해보세요
              </Text>
            </View>
          }
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.logoText}>Plan.B</Text>
          <Text style={styles.subLogoText}>더 스마트한 여행의 시작</Text>
        </View>

        <View style={styles.contentArea}>
          <View style={styles.textGroup}>
            {renderScheduleSection()}
          </View>

          <View style={styles.bottomActionGroup}>
            <TouchableOpacity
              style={styles.addButton}
              activeOpacity={0.85}
              onPress={() => navigation.navigate("AddSchedule")}
            >
              <Text style={styles.addButtonText}>새 일정 추가하기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7F9FB",
  },

  container: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 110,
    alignItems: "center",
  },

  header: {
    alignItems: "center",
    marginBottom: 28,
  },

  logoText: {
    fontSize: 52,
    fontWeight: "900",
    color: "#1E293B",
    letterSpacing: -1.5,
  },

  subLogoText: {
    fontSize: 15,
    color: "#64748B",
    marginTop: 4,
  },

  contentArea: {
    width: "100%",
    maxWidth: 380,
    alignItems: "center",
  },

  iconArea: {
    width: 260,
    height: 260,
    marginBottom: 8,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },

  backgroundLayer: {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: "center",
    alignItems: "center",
  },

  iconWrapper: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
    elevation: 2,
    transform: [{ translateY: -18 }],
  },

  textGroup: {
    width: "100%",
    alignItems: "center",
    marginTop: 12,
  },

  mainText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#252D3C",
    marginBottom: 8,
    textAlign: "center",
  },

  subText: {
    fontSize: 15,
    color: "#8C9BB1",
    textAlign: "center",
    lineHeight: 22,
  },

  scheduleEmptyBox: {
    width: "100%",
    alignItems: "center",
  },

  scheduleList: {
    width: "100%",
    gap: 12,
  },

  scheduleCard: {
    minHeight: 82,
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2EAF4",
  },

  scheduleThumbnail: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#DDF0FF",
  },

  scheduleEmoji: {
    fontSize: 28,
  },

  scheduleInfo: {
    flex: 1,
    marginLeft: 14,
  },

  scheduleTitle: {
    marginBottom: 6,
    fontSize: 15,
    fontWeight: "800",
    color: "#202938",
  },

  scheduleMeta: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "600",
    color: "#8FA0B7",
  },

  deleteButton: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
  },

  deleteButtonText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#8FA0B7",
  },

  userInfoBox: {
    width: "100%",
    marginTop: 22,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: "#F8FBFF",
    borderWidth: 1,
    borderColor: "#E6EEF9",
    alignItems: "center",
  },

  userText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
    textAlign: "center",
  },

  userSubText: {
    marginTop: 6,
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
  },

  bottomActionGroup: {
    width: "100%",
    alignItems: "center",
    marginTop: 26,
  },

  addButton: {
    width: "100%",
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
    backgroundColor: "#2158E8",
    shadowColor: "#2158E8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },

  addButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  planSection: {
    width: "100%",
    gap: 16,
  },

  todayInfoPill: {
    width: "100%",
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#EEF3FA",
    gap: 8,
  },

  todayInfoText: {
    color: "#1E293B",
    fontSize: 13,
    fontWeight: "800",
  },

  todayInfoDivider: {
    color: "#D8E0EB",
    fontSize: 12,
    fontWeight: "900",
  },

  sectionCard: {
    width: "100%",
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "#E6EEF9",
  },

  sectionTitle: {
    color: "#1E293B",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 14,
  },

  ongoingCard: {
    minHeight: 88,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#BBDDFF",
    shadowColor: "#60A5FA",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 4,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },

  pinCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  pinEmoji: {
    fontSize: 16,
  },

  tripCardInfo: {
    flex: 1,
  },

  tripTitle: {
    color: "#1E293B",
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 4,
  },

  tripLocation: {
    color: "#8FA0B7",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 5,
  },

  tripDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },

  tripDateText: {
    color: "#8FA0B7",
    fontSize: 11,
    fontWeight: "700",
  },

  nextTripCard: {
    minHeight: 78,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
  },

  nextTripThumbnail: {
    width: 56,
    height: 56,
    borderRadius: 13,
    backgroundColor: "#DDF0FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  nextTripEmoji: {
    fontSize: 30,
  },

  nextTripEmptyBox: {
    height: 56,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },

  nextTripEmptyText: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "800",
  },

});
