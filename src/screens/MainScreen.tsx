import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import CalendarSvg from "../assets/calendar.svg";
import RadialBackground from "../components/RadialBackground";

import { getMe } from "../../api/users/me";
import { requestLogout } from "../../api/auth/logout";
import { getSchedules, SavedSchedule } from "../../api/schedules/storage";

import { loadLatestPlanASchedule } from "../api/schedules/planAStorage";
import { TravelSchedule } from "../types/schedule";

type Props = {
  navigation: any;
};

type UserInfo = {
  id: number;
  email: string;
  nickname: string;
} | null;

type MainSchedule = {
  id: string;
  tripName: string;
  startDate: string;
  endDate: string;
  location: string;
  source: "planA" | "legacy";
};

const formatDate = (value: string) => {
  if (!value) return "";
  return value.replace(/-/g, ".");
};

const convertPlanAScheduleToMainSchedule = (
  schedule: TravelSchedule,
): MainSchedule => {
  return {
    id: schedule.id,
    tripName: schedule.tripName,
    startDate: schedule.startDate,
    endDate: schedule.endDate,
    location: schedule.location,
    source: "planA",
  };
};

const convertSavedScheduleToMainSchedule = (
  schedule: SavedSchedule,
): MainSchedule => {
  return {
    id: schedule.id,
    tripName: schedule.tripName,
    startDate: schedule.startDate,
    endDate: schedule.endDate,
    location: schedule.location,
    source: "legacy",
  };
};

const mergeSchedules = ({
  latestPlanASchedule,
  savedSchedules,
}: {
  latestPlanASchedule: TravelSchedule | null;
  savedSchedules: SavedSchedule[];
}) => {
  const planASchedules =
    latestPlanASchedule ?
      [convertPlanAScheduleToMainSchedule(latestPlanASchedule)]
    : [];

  const legacySchedules = savedSchedules.map(
    convertSavedScheduleToMainSchedule,
  );

  const mergedSchedules = [...planASchedules, ...legacySchedules];

  return mergedSchedules.filter(
    (schedule, index, array) =>
      array.findIndex((item) => item.id === schedule.id) === index,
  );
};

export default function MainScreen({ navigation }: Props) {
  const [user, setUser] = useState<UserInfo>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [schedules, setSchedules] = useState<MainSchedule[]>([]);

  const hasSchedules = schedules.length > 0;

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

  useFocusEffect(
    useCallback(() => {
      const loadSchedules = async () => {
        try {
          setLoadingSchedules(true);

          const [savedSchedules, latestPlanASchedule] = await Promise.all([
            getSchedules(),
            loadLatestPlanASchedule(),
          ]);

          console.log("[Main latest PlanA schedule]", latestPlanASchedule);

          const nextSchedules = mergeSchedules({
            latestPlanASchedule,
            savedSchedules,
          });

          setSchedules(nextSchedules);
        } catch (error) {
          console.log("일정 목록 불러오기 실패:", error);
          setSchedules([]);
        } finally {
          setLoadingSchedules(false);
        }
      };

      loadSchedules();
    }, []),
  );

  const handleLogout = async () => {
    if (logoutLoading) return;

    try {
      setLogoutLoading(true);

      const result = await requestLogout();

      Alert.alert("로그아웃", result.message, [
        {
          text: "확인",
          onPress: () => navigation.replace("Login"),
        },
      ]);
    } catch (error: unknown) {
      console.log("로그아웃 실패:", error);

      const message =
        error instanceof Error ? error.message : "로그아웃 처리되었습니다.";

      Alert.alert("로그아웃", message, [
        {
          text: "확인",
          onPress: () => navigation.replace("Login"),
        },
      ]);
    } finally {
      setLogoutLoading(false);
    }
  };

  const handlePressSchedule = (schedule: MainSchedule) => {
    navigation.navigate("PlanA", {
      scheduleId: schedule.source === "planA" ? schedule.id : undefined,
      tripName: schedule.tripName,
      startDate: schedule.startDate,
      endDate: schedule.endDate,
      location: schedule.location,
    });
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

  const renderScheduleList = () => {
    if (loadingSchedules) {
      return (
        <View style={styles.scheduleLoadingBox}>
          <ActivityIndicator color="#2158E8" size="small" />
          <Text style={styles.scheduleLoadingText}>
            저장된 일정을 불러오는 중...
          </Text>
        </View>
      );
    }

    if (!hasSchedules) {
      return null;
    }

    return (
      <View style={styles.scheduleList}>
        {schedules.map((schedule) => (
          <TouchableOpacity
            key={`${schedule.source}-${schedule.id}`}
            style={styles.scheduleCard}
            activeOpacity={0.85}
            onPress={() => handlePressSchedule(schedule)}
          >
            <View style={styles.scheduleCardHeader}>
              <View style={styles.scheduleTitleBox}>
                <Text style={styles.scheduleTitle} numberOfLines={1}>
                  {schedule.tripName}
                </Text>

                <Text style={styles.scheduleLocation} numberOfLines={1}>
                  {schedule.location || "지역 미정"}
                </Text>
              </View>

              <View style={styles.scheduleBadge}>
                <Text style={styles.scheduleBadgeText}>
                  {schedule.source === "planA" ? "Plan.A" : "일정"}
                </Text>
              </View>
            </View>

            <View style={styles.scheduleDateRow}>
              <Ionicons name="calendar-outline" size={15} color="#64748B" />

              <Text style={styles.schedulePeriod}>
                {formatDate(schedule.startDate)} -{" "}
                {formatDate(schedule.endDate)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.scrollContent,
          hasSchedules && styles.scrollContentWithSchedules,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.logoText}>Plan.B</Text>
          <Text style={styles.subLogoText}>더 스마트한 여행의 시작</Text>
        </View>

        <View style={styles.contentArea}>
          {!hasSchedules && !loadingSchedules ?
            <View style={styles.iconArea}>
              <View style={styles.backgroundLayer}>
                <RadialBackground />
              </View>

              <View style={styles.iconWrapper}>
                <CalendarSvg width={100} height={100} />
              </View>
            </View>
          : null}

          <View style={styles.textGroup}>
            <Text style={styles.mainText}>
              {hasSchedules ? "나의 여행 일정" : "등록된 일정이 없습니다"}
            </Text>

            <Text style={styles.subText}>
              {hasSchedules ?
                "저장된 여행 일정을 확인해보세요"
              : "새로운 여행 일정을 추가해보세요"}
            </Text>

            <View style={styles.userInfoBox}>{renderUserSection()}</View>

            {renderScheduleList()}
          </View>

          <View style={styles.bottomActionGroup}>
            <TouchableOpacity
              style={styles.addButton}
              activeOpacity={0.85}
              onPress={() => navigation.navigate("AddSchedule")}
            >
              <Text style={styles.addButtonText}>일정 추가하기</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.planXButton}
              activeOpacity={0.85}
              onPress={() => navigation.navigate("PlanX")}
            >
              <Ionicons name="albums-outline" size={16} color="#2158E8" />
              <Text style={styles.planXButtonText}>Plan.X 보기</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.logoutButton,
                logoutLoading && styles.disabledButton,
              ]}
              onPress={handleLogout}
              activeOpacity={0.85}
              disabled={logoutLoading}
            >
              {logoutLoading ?
                <ActivityIndicator color="#2158E8" size="small" />
              : <>
                  <Ionicons name="log-out-outline" size={16} color="#2158E8" />
                  <Text style={styles.logoutButtonText}>로그아웃</Text>
                </>
              }
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
    paddingBottom: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  scrollContentWithSchedules: {
    justifyContent: "flex-start",
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
    marginTop: 4,
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

  scheduleLoadingBox: {
    width: "100%",
    minHeight: 46,
    marginTop: 18,
    borderRadius: 14,
    backgroundColor: "#EAF3FF",
    borderWidth: 1,
    borderColor: "#DCEBFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  scheduleLoadingText: {
    color: "#2158E8",
    fontSize: 13,
    fontWeight: "800",
  },

  scheduleList: {
    width: "100%",
    marginTop: 18,
    gap: 12,
  },

  scheduleCard: {
    width: "100%",
    padding: 18,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#1E293B",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },

  scheduleCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },

  scheduleTitleBox: {
    flex: 1,
  },

  scheduleTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1E293B",
  },

  scheduleLocation: {
    marginTop: 5,
    fontSize: 14,
    fontWeight: "800",
    color: "#2158E8",
  },

  scheduleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#EAF3FF",
  },

  scheduleBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#2158E8",
  },

  scheduleDateRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  schedulePeriod: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
  },

  bottomActionGroup: {
    width: "100%",
    alignItems: "center",
    gap: 12,
    marginTop: 26,
  },

  addButton: {
    width: "45%",
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

  planXButton: {
    minWidth: 132,
    height: 46,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: "#F8FBFF",
    borderWidth: 1,
    borderColor: "#DCE7F7",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  planXButtonText: {
    color: "#2158E8",
    fontSize: 14,
    fontWeight: "700",
  },

  logoutButton: {
    minWidth: 132,
    height: 46,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DCE7F7",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  logoutButtonText: {
    color: "#2158E8",
    fontSize: 14,
    fontWeight: "700",
  },

  disabledButton: {
    opacity: 0.7,
  },
});
