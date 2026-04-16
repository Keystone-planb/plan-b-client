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

import CalendarIcon from "../components/CalendarIcon";
import RadialBackground from "../components/RadialBackground";
import { getMe } from "../../api/users/me";
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
      } catch (error: any) {
        console.log("내 정보 조회 실패:", error);
        Alert.alert("오류", error.message || "내 정보 조회에 실패했습니다.");
      } finally {
        setLoadingUser(false);
      }
    };

    fetchMe();
  }, []);

  const handleLogout = async () => {
    try {
      setLogoutLoading(true);
      const result = await requestLogout();

      Alert.alert("로그아웃", result.message, [
        {
          text: "확인",
          onPress: () => navigation.replace("Login"),
        },
      ]);
    } catch (error: any) {
      console.log("로그아웃 실패:", error);

      Alert.alert("로그아웃", error.message || "로그아웃 처리되었습니다.", [
        {
          text: "확인",
          onPress: () => navigation.replace("Login"),
        },
      ]);
    } finally {
      setLogoutLoading(false);
    }
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
          <Text style={styles.logoText}>Plan.A</Text>
          <Text style={styles.subLogoText}>더 스마트한 여행의 시작</Text>
        </View>

        <View style={styles.topRightActions}>
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
              <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.logoutButtonText}>로그아웃</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.emptyStateContainer}>
          <View style={styles.iconArea}>
            <RadialBackground />

            <View style={styles.iconWrapper}>
              <CalendarIcon size={120} />
            </View>

            <View style={styles.textGroup}>
              <Text style={styles.mainText}>등록된 일정이 없습니다</Text>
              <Text style={styles.subText}>
                새로운 여행 일정을 추가해보세요
              </Text>

              {loadingUser ?
                <Text style={styles.userText}>
                  사용자 정보를 불러오는 중...
                </Text>
              : user ?
                <>
                  <Text style={styles.userText}>
                    {user.nickname}님, 반가워요
                  </Text>
                  <Text style={styles.userSubText}>{user.email}</Text>
                </>
              : <Text style={styles.userText}>
                  사용자 정보를 불러오지 못했습니다.
                </Text>
              }
            </View>
          </View>

          <TouchableOpacity
            style={styles.addButton}
            activeOpacity={0.85}
            onPress={() => navigation.navigate("AddSchedule")}
          >
            <Text style={styles.addButtonText}>일정 추가하기</Text>
          </TouchableOpacity>
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
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 40,
  },

  header: {
    position: "absolute",
    top: 60,
    alignItems: "center",
  },

  topRightActions: {
    position: "absolute",
    top: 60,
    right: 24,
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

  emptyStateContainer: {
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 40,
  },

  iconArea: {
    width: 350,
    height: 300,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },

  iconWrapper: {
    justifyContent: "center",
    alignItems: "center",
    transform: [{ translateY: -10 }],
  },

  textGroup: {
    alignItems: "center",
    marginTop: 12,
  },

  mainText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#252D3C",
    marginBottom: 8,
  },

  subText: {
    fontSize: 15,
    color: "#8C9BB1",
    textAlign: "center",
    lineHeight: 22,
  },

  userText: {
    marginTop: 16,
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
  },

  userSubText: {
    marginTop: 6,
    fontSize: 13,
    color: "#64748B",
  },

  addButton: {
    width: "40%",
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 14,
    backgroundColor: "#2158E8",

    shadowColor: "#2158E8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },

  addButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  logoutButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#1E293B",
  },

  logoutButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  disabledButton: {
    opacity: 0.7,
  },
});
