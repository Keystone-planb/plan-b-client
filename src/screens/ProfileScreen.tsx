import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import { getMe, MeResponse } from "../../api/users/me";
import { requestLogout } from "../../api/auth/logout";
import { getPreferenceSummary } from "../../api/preferences/preferences";
import type { PreferenceSummary } from "../types/preference";

type Props = {
  navigation: any;
};

export default function ProfileScreen({ navigation }: Props) {

  const [preferenceSummary, setPreferenceSummary] =
    useState<PreferenceSummary | null>(null);

  useEffect(() => {
    const loadPreferenceSummary = async () => {
      const summary = await getPreferenceSummary(1);
      setPreferenceSummary(summary);
    };

    loadPreferenceSummary();
  }, []);

  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const loadMe = useCallback(async () => {
    try {
      setLoading(true);

      const result = await getMe();
      setMe(result);
    } catch (error) {
      console.log("프로필 유저 정보 조회 실패:", error);
      setMe(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMe();
    }, [loadMe]),
  );

  const handleLogout = async () => {
    if (logoutLoading) {
      return;
    }

    console.log("[Profile] 로그아웃 버튼 클릭");

    try {
      setLogoutLoading(true);

      console.log("[Profile] requestLogout 시작");
      await requestLogout();
      console.log("[Profile] requestLogout 완료");
    } catch (error) {
      console.log("[Profile] 로그아웃 요청 실패:", error);
    } finally {
      setLogoutLoading(false);

      console.log("[Profile] Login 화면으로 이동");

      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    }
  };

  const nickname = me?.nickname || "김플랜";
  const email = me?.email || "traveler@planb.com";

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        {preferenceSummary ? (
          <View style={styles.preferenceCard}>
            <Text style={styles.preferenceTitle}>선호 여행 스타일</Text>
            <Text style={styles.preferenceDescription}>
              {preferenceSummary.summary ||
                "아직 충분한 취향 데이터가 없어요. 장소를 선택하면 더 정확해져요."}
            </Text>

            {preferenceSummary.keywords?.length ? (
              <View style={styles.preferenceKeywordRow}>
                {preferenceSummary.keywords.slice(0, 3).map((keyword) => (
                  <View key={keyword} style={styles.preferenceKeyword}>
                    <Text style={styles.preferenceKeywordText}>{keyword}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        <Text style={styles.logo}>Plan.B</Text>

        <TouchableOpacity
          style={styles.profileCard}
          activeOpacity={0.8}
          onPress={() => navigation.navigate("ProfileEdit")}
          disabled={loading}
        >
          <View style={styles.avatar}>
            <Ionicons name="person-outline" size={31} color="#FFFFFF" />
          </View>

          <View style={styles.profileTextBox}>
            {loading ?
              <>
                <ActivityIndicator size="small" color="#2158E8" />
                <Text style={styles.loadingText}>프로필 불러오는 중...</Text>
              </>
            : <>
                <Text style={styles.nickname}>{nickname}</Text>
                <Text style={styles.email}>{email}</Text>
              </>
            }
          </View>

          <Ionicons name="chevron-forward" size={22} color="#B8C4D5" />
        </TouchableOpacity>

        <View style={styles.settingCard}>
          <Text style={styles.sectionTitle}>설정</Text>

          <TouchableOpacity style={styles.settingRow} activeOpacity={0.8}>
            <View style={styles.settingLeft}>
              <Ionicons
                name="notifications-outline"
                size={22}
                color="#8CA0BC"
              />
              <Text style={styles.settingText}>알림</Text>
            </View>

            <Ionicons name="chevron-forward" size={22} color="#B8C4D5" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.logoutButton, logoutLoading && styles.disabledButton]}
          activeOpacity={0.8}
          onPress={handleLogout}
          disabled={logoutLoading}
        >
          {logoutLoading ?
            <ActivityIndicator size="small" color="#8CA0BC" />
          : <>
              <Ionicons name="log-out-outline" size={22} color="#8CA0BC" />
              <Text style={styles.logoutText}>로그아웃</Text>
            </>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  preferenceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },

  preferenceTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#1E293B",
    marginBottom: 8,
  },

  preferenceDescription: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
    lineHeight: 20,
  },

  preferenceKeywordRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },

  preferenceKeyword: {
    backgroundColor: "#E9F3FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  preferenceKeywordText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#2563EB",
  },


  safeArea: {
    flex: 1,
    backgroundColor: "#F7F9FC",
  },

  container: {
    flex: 1,
    paddingHorizontal: 21,
    paddingTop: 30,
    paddingBottom: 120,
  },

  logo: {
    color: "#202938",
    fontSize: 40,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: -1.1,
    marginBottom: 35,
  },

  profileCard: {
    minHeight: 100,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#E7EEF8",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.32,
    shadowRadius: 12,
    elevation: 2,
  },

  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#273142",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },

  profileTextBox: {
    flex: 1,
    justifyContent: "center",
  },

  nickname: {
    color: "#202938",
    fontSize: 21,
    fontWeight: "900",
    marginBottom: 4,
  },

  email: {
    color: "#5F6E83",
    fontSize: 14,
    fontWeight: "500",
  },

  loadingText: {
    marginTop: 6,
    color: "#8FA0B7",
    fontSize: 12,
    fontWeight: "600",
  },

  settingCard: {
    marginTop: 20,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 6,
    shadowColor: "#E7EEF8",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 2,
  },

  sectionTitle: {
    color: "#202938",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 18,
  },

  settingRow: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  settingText: {
    color: "#202938",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 16,
  },

  logoutButton: {
    height: 60,
    marginTop: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DDE6F2",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  disabledButton: {
    opacity: 0.65,
  },

  logoutText: {
    color: "#8CA0BC",
    fontSize: 15,
    fontWeight: "800",
    marginLeft: 8,
  },
});
