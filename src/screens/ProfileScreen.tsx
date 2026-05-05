import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";

import { getMe, MeResponse } from "../../api/users/me";
import { requestLogout } from "../../api/auth/logout";

type Props = {
  navigation: any;
};

export default function ProfileScreen({ navigation }: Props) {
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

    try {
      setLogoutLoading(true);

      await requestLogout();
    } catch (error) {
      console.log("로그아웃 요청 실패:", error);

      /**
       * requestLogout 내부에서 서버 요청 실패 여부와 관계없이
       * 로컬 토큰은 정리하도록 되어 있으므로,
       * 여기서는 Login 이동을 계속 진행한다.
       */
    } finally {
      setLogoutLoading(false);

      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    }
  };

  const confirmLogout = () => {
    Alert.alert("로그아웃", "정말 로그아웃하시겠어요?", [
      {
        text: "취소",
        style: "cancel",
      },
      {
        text: "로그아웃",
        style: "destructive",
        onPress: handleLogout,
      },
    ]);
  };

  const nickname = me?.nickname || "여행자";
  const email = me?.email || "이메일 정보를 불러오지 못했어요";
  const provider = me?.provider ? String(me.provider).toLowerCase() : "local";

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.logo}>Profile</Text>

        <View style={styles.card}>
          {loading ?
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#2158E8" />
              <Text style={styles.loadingText}>프로필을 불러오는 중...</Text>
            </View>
          : <>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {nickname.slice(0, 1).toUpperCase()}
                </Text>
              </View>

              <Text style={styles.nickname}>{nickname}</Text>
              <Text style={styles.email}>{email}</Text>

              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>로그인 방식</Text>
                <Text style={styles.infoValue}>{provider}</Text>
              </View>
            </>
          }
        </View>

        <TouchableOpacity
          style={[styles.logoutButton, logoutLoading && styles.disabledButton]}
          activeOpacity={0.85}
          onPress={confirmLogout}
          disabled={logoutLoading}
        >
          {logoutLoading ?
            <ActivityIndicator size="small" color="#FFFFFF" />
          : <Text style={styles.logoutButtonText}>로그아웃</Text>}
        </TouchableOpacity>

        <Text style={styles.notice}>
          프로필 상세 편집 기능은 추후 구현 예정입니다.
        </Text>
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
    paddingHorizontal: 24,
    paddingTop: 34,
    paddingBottom: 120,
  },

  logo: {
    color: "#202938",
    fontSize: 36,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 36,
  },

  card: {
    minHeight: 260,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E3EAF3",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 30,
    shadowColor: "#E7EEF8",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 4,
  },

  loadingBox: {
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 10,
    color: "#7A8BA3",
    fontSize: 13,
    fontWeight: "600",
  },

  avatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "#E9F3FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  avatarText: {
    color: "#2158E8",
    fontSize: 30,
    fontWeight: "900",
  },

  nickname: {
    color: "#202938",
    fontSize: 22,
    fontWeight: "900",
  },

  email: {
    marginTop: 7,
    color: "#7A8BA3",
    fontSize: 14,
    fontWeight: "600",
  },

  infoBox: {
    width: "100%",
    marginTop: 28,
    borderRadius: 16,
    backgroundColor: "#F7F9FC",
    paddingHorizontal: 18,
    paddingVertical: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  infoLabel: {
    color: "#7A8BA3",
    fontSize: 13,
    fontWeight: "700",
  },

  infoValue: {
    color: "#202938",
    fontSize: 13,
    fontWeight: "900",
  },

  logoutButton: {
    height: 54,
    borderRadius: 16,
    backgroundColor: "#273142",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },

  disabledButton: {
    opacity: 0.7,
  },

  logoutButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  notice: {
    marginTop: 18,
    color: "#8FA0B7",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
});
