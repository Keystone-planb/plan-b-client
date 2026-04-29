import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CommonActions } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { requestLogout } from "../../api/auth/logout";

type Props = {
  navigation: any;
};

export default function ProfileScreen({ navigation }: Props) {
  const [logoutLoading, setLogoutLoading] = useState(false);

  const handlePressProfile = () => {
    navigation.navigate("ProfileEdit");
  };

  const resetToLogin = () => {
    navigation.getParent()?.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "Login" }],
      }),
    );
  };

  const clearLocalTokens = async () => {
    await AsyncStorage.multiRemove([
      "access_token",
      "refresh_token",
      "user_id",
      "nickname",
    ]);
  };

  const handleLogout = async () => {
    if (logoutLoading) return;

    try {
      setLogoutLoading(true);

      const result = await requestLogout();
      await clearLocalTokens();

      Alert.alert("로그아웃", result.message ?? "로그아웃되었습니다.", [
        {
          text: "확인",
          onPress: resetToLogin,
        },
      ]);
    } catch (error) {
      console.log("로그아웃 실패:", error);

      await clearLocalTokens();

      Alert.alert("로그아웃", "로그아웃 처리되었습니다.", [
        {
          text: "확인",
          onPress: resetToLogin,
        },
      ]);
    } finally {
      setLogoutLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.logo}>Plan.B</Text>

        <TouchableOpacity
          style={styles.profileCard}
          activeOpacity={0.85}
          onPress={handlePressProfile}
        >
          <View style={styles.avatar}>
            <Ionicons name="person-outline" size={27} color="#FFFFFF" />
          </View>

          <View style={styles.profileTextBox}>
            <Text style={styles.nickname}>김플랜</Text>
            <Text style={styles.email}>traveler@planb.com</Text>
          </View>

          <Ionicons name="chevron-forward" size={18} color="#C7D0DE" />
        </TouchableOpacity>

        <View style={styles.settingCard}>
          <Text style={styles.sectionTitle}>설정</Text>

          <TouchableOpacity style={styles.menuRow} activeOpacity={0.8}>
            <View style={styles.menuLeft}>
              <Ionicons
                name="notifications-outline"
                size={17}
                color="#9AA6B8"
              />
              <Text style={styles.menuText}>알림</Text>
            </View>

            <Ionicons name="chevron-forward" size={18} color="#C7D0DE" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.logoutButton, logoutLoading && styles.disabledButton]}
          activeOpacity={0.85}
          onPress={handleLogout}
          disabled={logoutLoading}
        >
          {logoutLoading ?
            <ActivityIndicator size="small" color="#8FA0B7" />
          : <>
              <Ionicons name="log-out-outline" size={17} color="#8FA0B7" />
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
    paddingHorizontal: 28,
    paddingTop: 18,
    paddingBottom: 130,
  },
  logo: {
    marginTop: 20,
    marginBottom: 28,
    textAlign: "center",
    fontSize: 31,
    fontWeight: "900",
    color: "#202938",
  },
  profileCard: {
    height: 72,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
  },
  avatar: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: "#273142",
  },
  profileTextBox: {
    flex: 1,
    marginLeft: 14,
  },
  nickname: {
    fontSize: 15,
    fontWeight: "800",
    color: "#202938",
  },
  email: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: "500",
    color: "#4B5563",
  },
  settingCard: {
    marginTop: 14,
    paddingTop: 14,
    paddingHorizontal: 15,
    paddingBottom: 4,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
  },
  sectionTitle: {
    marginBottom: 8,
    fontSize: 12,
    fontWeight: "800",
    color: "#202938",
  },
  menuRow: {
    height: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuText: {
    marginLeft: 12,
    fontSize: 13,
    fontWeight: "600",
    color: "#202938",
  },
  logoutButton: {
    height: 48,
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#DDE6F2",
    backgroundColor: "#FFFFFF",
  },

  logoutText: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: "700",
    color: "#8FA0B7",
  },
  disabledButton: {
    opacity: 0.65,
  },
});
