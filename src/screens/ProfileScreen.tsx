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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { requestLogout } from "../../api/auth/logout";
import { getPreferenceSummary } from "../../api/preferences/preferences";
import type { PreferenceSummary } from "../types/preference";

type Props = {
  navigation: any;
};

export default function ProfileScreen({ navigation }: Props) {
  const [preferenceSummary, setPreferenceSummary] =
    useState<PreferenceSummary | null>(null);

  const [me, setMe] = useState<MeResponse | null>(null);
  const [storedNickname, setStoredNickname] = useState("");
  const [storedEmail, setStoredEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  useEffect(() => {
    const loadStoredProfile = async () => {
      const nickname =
        (await AsyncStorage.getItem("nickname")) ??
        (typeof window !== "undefined"
          ? window.localStorage.getItem("nickname")
          : null);

      const email =
        (await AsyncStorage.getItem("email")) ??
        (typeof window !== "undefined"
          ? window.localStorage.getItem("email")
          : null);

      setStoredNickname(nickname ?? "");
      setStoredEmail(email ?? "");
    };

    loadStoredProfile();

    const loadPreferenceSummary = async () => {
      try {
        const summary = await getPreferenceSummary(1);
        setPreferenceSummary(summary);
      } catch (error) {
        console.log("[Profile] 선호 여행 스타일 조회 실패:", error);
        setPreferenceSummary(null);
      }
    };

    loadPreferenceSummary();
  }, []);

  const loadMe = useCallback(async () => {
    try {
      setLoading(true);

      const result = await getMe();
      console.log("[Profile getMe result]", result);
      setMe(result);
    } catch (error) {
      console.log("[Profile] 프로필 유저 정보 조회 실패:", error);
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

  const handleOpenProfileEdit = () => {
    if (loading) {
      return;
    }

    navigation.navigate("ProfileEdit");
  };

  const handleLogout = async () => {
    if (logoutLoading) {
      return;
    }

    try {
      setLogoutLoading(true);
      await requestLogout();
    } catch (error) {
      console.log("[Profile] 로그아웃 요청 실패:", error);
    } finally {
      setLogoutLoading(false);

      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    }
  };

  const nickname = me?.nickname || storedNickname || "사용자";
  const email = me?.email || storedEmail || "이메일 정보를 불러오는 중";

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.logo}>Plan.B</Text>

        <TouchableOpacity
          style={styles.profileCard}
          activeOpacity={0.82}
          onPress={handleOpenProfileEdit}
          disabled={loading}
        >
          <View style={styles.avatar}>
            <Ionicons name="person-outline" size={30} color="#FFFFFF" />
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

        {preferenceSummary ?
          <View style={styles.preferenceCard}>
            <Text style={styles.preferenceTitle}>선호 여행 스타일</Text>

            <Text style={styles.preferenceDescription}>
              {preferenceSummary.summary ||
                "아직 충분한 취향 데이터가 없어요. 장소를 선택하면 더 정확해져요."}
            </Text>

            {preferenceSummary.keywords?.length ?
              <View style={styles.preferenceKeywordRow}>
                {preferenceSummary.keywords.slice(0, 3).map((keyword) => (
                  <View key={keyword} style={styles.preferenceKeyword}>
                    <Text style={styles.preferenceKeywordText}>{keyword}</Text>
                  </View>
                ))}
              </View>
            : null}
          </View>
        : null}

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
          activeOpacity={0.82}
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
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E6EDF7",
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

  preferenceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginTop: 18,
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

  settingCard: {
    marginTop: 18,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 6,
    borderWidth: 1,
    borderColor: "#E6EDF7",
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
    height: 58,
    marginTop: 18,
    borderRadius: 14,
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
