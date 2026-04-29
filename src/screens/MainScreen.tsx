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

import CalendarSvg from "../assets/calendar.svg";
import RadialBackground from "../components/RadialBackground";
import { getMe } from "../../api/users/me";
import { getSchedules, SavedSchedule } from "../../api/schedules/storage";

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

      console.log("[메인 일정 목록]", savedSchedules);

      setSchedules(savedSchedules);
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

    return (
      <View style={styles.scheduleList}>
        {schedules.map((schedule) => (
          <TouchableOpacity
            key={schedule.id}
            style={styles.scheduleCard}
            activeOpacity={0.85}
          >
            <View style={styles.scheduleThumbnail}>
              <Text style={styles.scheduleEmoji}>🏝️</Text>
            </View>

            <View style={styles.scheduleInfo}>
              <Text style={styles.scheduleTitle} numberOfLines={1}>
                {schedule.tripName}
              </Text>

              <Text style={styles.scheduleMeta} numberOfLines={1}>
                {formatDate(schedule.startDate)} -{" "}
                {formatDate(schedule.endDate)}
              </Text>

              <Text style={styles.scheduleMeta} numberOfLines={1}>
                {schedule.location || "지역 미정"}
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
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.logoText}>Plan.B</Text>
          <Text style={styles.subLogoText}>더 스마트한 여행의 시작</Text>
        </View>

        <View style={styles.contentArea}>
          <View style={styles.iconArea}>
            <View style={styles.backgroundLayer}>
              <RadialBackground />
            </View>

            <View style={styles.iconWrapper}>
              <CalendarSvg width={100} height={100} />
            </View>
          </View>

          <View style={styles.textGroup}>
            {renderScheduleSection()}

            <View style={styles.userInfoBox}>{renderUserSection()}</View>
          </View>

          <View style={styles.bottomActionGroup}>
            <TouchableOpacity
              style={styles.addButton}
              activeOpacity={0.85}
              onPress={() => navigation.navigate("AddSchedule")}
            >
              <Text style={styles.addButtonText}>일정 추가하기</Text>
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
    paddingBottom: 150,
    alignItems: "center",
    justifyContent: "center",
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
});
