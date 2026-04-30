import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import CalendarSvg from "../assets/calendar.svg";
import RadialBackground from "../components/RadialBackground";
import { getMe } from "../../api/users/me";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { requestLogout } from "../../api/auth/logout";

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
  const [logoutLoading, setLogoutLoading] = useState(false);

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

  const moveToLoginAfterLogout = async () => {
    await AsyncStorage.multiRemove([
      "access_token",
      "refresh_token",
      "user_id",
      "nickname",
    ]);

    navigation.reset({
      index: 0,
      routes: [{ name: "Login" }],
    });
  };

  const handleLogout = async () => {
    if (logoutLoading) return;

    try {
      setLogoutLoading(true);

      const result = await requestLogout();

      console.log("로그아웃 성공:", result);
    } catch (error: unknown) {
      console.log(
        "로그아웃 실패, 로컬 토큰 삭제 후 로그인 화면으로 이동:",
        error,
      );
    } finally {
      setLogoutLoading(false);
      await moveToLoginAfterLogout();
    }
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
            <Text style={styles.mainText}>등록된 일정이 없습니다</Text>
            <Text style={styles.subText}>새로운 여행 일정을 추가해보세요</Text>

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
