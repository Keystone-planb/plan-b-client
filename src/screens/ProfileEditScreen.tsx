import React, { useCallback, useState } from "react";
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

type Props = {
  navigation: any;
};

type ProfileRowProps = {
  label: string;
  value: string;
  onPress?: () => void;
};

function ProfileRow({ label, value, onPress }: ProfileRowProps) {
  return (
    <TouchableOpacity
      style={styles.infoRow}
      activeOpacity={0.75}
      onPress={onPress}
      disabled={!onPress}
    >
      <Text style={styles.infoLabel}>{label}</Text>

      <View style={styles.infoValueBox}>
        <Text style={styles.infoValue}>{value}</Text>
        <Ionicons name="chevron-forward" size={15} color="#C7D0DE" />
      </View>
    </TouchableOpacity>
  );
}

export default function ProfileEditScreen({ navigation }: Props) {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [storedNickname, setStoredNickname] = useState("");
  const [storedEmail, setStoredEmail] = useState("");
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    try {
      setLoading(true);

      const result = await getMe();
      console.log("[Profile getMe result]", result);
      setMe(result);
    } catch (error) {
      console.log("프로필 수정 화면 유저 정보 조회 실패:", error);
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

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate("MainTabs", {
      screen: "Profile",
    });
  };

  const nickname = me?.nickname || storedNickname || "사용자";
  const email = me?.email || storedEmail || "이메일 정보를 불러오는 중";
  const phoneNumber = "010-0000-0000";

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.75}
            onPress={handleBack}
          >
            <Ionicons name="chevron-back" size={23} color="#748195" />
          </TouchableOpacity>

          <Text style={styles.logo}>Plan.B</Text>

          <View style={styles.headerRightSpace} />
        </View>

        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Ionicons name="person-outline" size={35} color="#FFFFFF" />
          </View>

          <TouchableOpacity style={styles.addButton} activeOpacity={0.8}>
            <Ionicons name="add" size={13} color="#273142" />
          </TouchableOpacity>
        </View>

        {loading ?
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#2158E8" />
            <Text style={styles.loadingText}>프로필 정보를 불러오는 중...</Text>
          </View>
        : <View style={styles.infoSection}>
            <ProfileRow label="이름" value={nickname} />
            <ProfileRow label="이메일" value={email} />
            <ProfileRow label="휴대폰 번호" value={phoneNumber} />
          </View>
        }
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
    backgroundColor: "#F7F9FC",
    paddingHorizontal: 21,
    paddingTop: 3,
  },

  header: {
    height: 57,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backButton: {
    width: 32,
    height: 32,
    alignItems: "flex-start",
    justifyContent: "center",
  },

  logo: {
    color: "#202938",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -1,
  },

  headerRightSpace: {
    width: 32,
    height: 32,
  },

  avatarSection: {
    marginTop: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  avatar: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: "#273142",
    alignItems: "center",
    justifyContent: "center",
  },

  addButton: {
    position: "absolute",
    left: "50%",
    bottom: 0,
    marginLeft: 16,
    width: 19,
    height: 19,
    borderRadius: 9.5,
    backgroundColor: "#B8C3D3",
    borderWidth: 2,
    borderColor: "#F7F9FC",
    alignItems: "center",
    justifyContent: "center",
  },

  loadingBox: {
    marginTop: 54,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 10,
    color: "#8FA0B7",
    fontSize: 12,
    fontWeight: "600",
  },

  infoSection: {
    marginTop: 48,
  },

  infoRow: {
    height: 41,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  infoLabel: {
    color: "#202938",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: -0.2,
  },

  infoValueBox: {
    flexDirection: "row",
    alignItems: "center",
  },

  infoValue: {
    marginRight: 6,
    color: "#2F3A4A",
    fontSize: 10,
    fontWeight: "500",
    letterSpacing: -0.2,
  },
});
