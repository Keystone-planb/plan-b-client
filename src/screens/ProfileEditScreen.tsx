import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { getMe, MeResponse } from "../../api/users/me";
import { updateMyProfile } from "../../api/users/profile";

type Props = {
  navigation: any;
};

const setWebStorageItem = (key: string, value: string) => {
  if (
    typeof window === "undefined" ||
    !window.localStorage ||
    typeof window.localStorage.setItem !== "function"
  ) {
    return;
  }

  window.localStorage.setItem(key, value);
};

export default function ProfileEditScreen({ navigation }: Props) {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [storedNickname, setStoredNickname] = useState("");
  const [storedEmail, setStoredEmail] = useState("");

  const [nicknameDraft, setNicknameDraft] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadStoredProfile = useCallback(async () => {
    const nickname =
      (await AsyncStorage.getItem("nickname")) ??
      (typeof window !== "undefined" && window.localStorage
        ? window.localStorage.getItem("nickname")
        : null);

    const email =
      (await AsyncStorage.getItem("email")) ??
      (typeof window !== "undefined" && window.localStorage
        ? window.localStorage.getItem("email")
        : null);

    setStoredNickname(nickname ?? "");
    setStoredEmail(email ?? "");

    if (!me?.nickname && nickname) {
      setNicknameDraft(nickname);
    }
  }, [me?.nickname]);

  const loadMe = useCallback(async () => {
    try {
      setLoading(true);

      const result = await getMe();
      console.log("[ProfileEdit] getMe success:", { hasEmail: Boolean(result?.email), hasNickname: Boolean(result?.nickname), provider: result?.provider });

      setMe(result);
      setNicknameDraft(result.nickname ?? "");
    } catch (error) {
      console.log("프로필 수정 화면 유저 정보 조회 실패:", error);
      setMe(null);

      if (storedNickname) {
        setNicknameDraft(storedNickname);
      }
    } finally {
      setLoading(false);
    }
  }, [storedNickname]);

  useEffect(() => {
    loadStoredProfile();
  }, [loadStoredProfile]);

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

  const email = me?.email || storedEmail || "이메일 정보를 불러오는 중";
  const originalNickname = me?.nickname || storedNickname || "";
  const trimmedNickname = nicknameDraft.trim();

  const isNicknameChanged =
    trimmedNickname.length > 0 && trimmedNickname !== originalNickname;

  const wantsPasswordChange =
    currentPassword.trim().length > 0 || newPassword.trim().length > 0;

  const canSubmit = useMemo(() => {
    if (saving || loading) {
      return false;
    }

    if (isNicknameChanged) {
      return true;
    }

    if (currentPassword.trim().length > 0 && newPassword.trim().length > 0) {
      return true;
    }

    return false;
  }, [currentPassword, isNicknameChanged, loading, newPassword, saving]);

  const handleSave = async () => {
    if (saving) {
      return;
    }

    if (!isNicknameChanged && !wantsPasswordChange) {
      Alert.alert("변경할 정보가 없습니다.", "수정할 닉네임이나 비밀번호를 입력해주세요.");
      return;
    }

    if (wantsPasswordChange) {
      if (!currentPassword.trim() || !newPassword.trim()) {
        Alert.alert(
          "비밀번호 입력 필요",
          "비밀번호를 변경하려면 현재 비밀번호와 새 비밀번호를 모두 입력해주세요.",
        );
        return;
      }

      if (currentPassword === newPassword) {
        Alert.alert(
          "비밀번호 확인",
          "새 비밀번호는 현재 비밀번호와 다르게 입력해주세요.",
        );
        return;
      }
    }

    try {
      setSaving(true);

      const request = {
        ...(isNicknameChanged ? { nickname: trimmedNickname } : {}),
        ...(wantsPasswordChange ?
          {
            currentPassword,
            newPassword,
          }
        : {}),
      };

      console.log("[ProfileEdit updateMyProfile request]", {
        hasNickname: Boolean(request.nickname),
        hasCurrentPassword: Boolean(request.currentPassword),
        hasNewPassword: Boolean(request.newPassword),
      });

      const response = await updateMyProfile(request);

      await AsyncStorage.setItem("nickname", response.nickname);
      setWebStorageItem("nickname", response.nickname);

      if (response.email) {
        await AsyncStorage.setItem("email", response.email);
        setWebStorageItem("email", response.email);
      }

      setMe({
        ...(me ?? {}),
        email: response.email,
        nickname: response.nickname,
      } as MeResponse);

      setStoredNickname(response.nickname);
      setStoredEmail(response.email);
      setNicknameDraft(response.nickname);
      setCurrentPassword("");
      setNewPassword("");

      Alert.alert(
        "프로필 수정 완료",
        response.message || "프로필 정보가 성공적으로 수정되었습니다.",
        [
          {
            text: "확인",
            onPress: handleBack,
          },
        ],
      );
    } catch (error) {
      Alert.alert(
        "프로필 수정 실패",
        error instanceof Error ?
          error.message
        : "프로필 정보를 수정하지 못했습니다.",
      );
    } finally {
      setSaving(false);
    }
  };

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

          <TouchableOpacity
            style={[styles.saveHeaderButton, !canSubmit && styles.disabledButton]}
            activeOpacity={0.8}
            onPress={handleSave}
            disabled={!canSubmit}
          >
            {saving ?
              <ActivityIndicator size="small" color="#2158E8" />
            : <Text style={styles.saveHeaderButtonText}>저장</Text>
            }
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              <Ionicons name="person-outline" size={35} color="#FFFFFF" />
            </View>
          </View>

          {loading ?
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#2158E8" />
              <Text style={styles.loadingText}>프로필 정보를 불러오는 중...</Text>
            </View>
          : <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>기본 정보</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>닉네임</Text>
                  <TextInput
                    style={styles.input}
                    value={nicknameDraft}
                    onChangeText={setNicknameDraft}
                    placeholder="닉네임을 입력해주세요"
                    placeholderTextColor="#A9B6C8"
                    maxLength={20}
                    autoCapitalize="none"
                    returnKeyType="done"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>이메일</Text>
                  <View style={[styles.input, styles.readOnlyInput]}>
                    <Text style={styles.readOnlyText}>{email}</Text>
                  </View>
                  <Text style={styles.helperText}>
                    이메일은 현재 화면에서 수정할 수 없습니다.
                  </Text>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>비밀번호 변경</Text>

                <Text style={styles.sectionDescription}>
                  비밀번호를 변경하지 않으려면 아래 항목은 비워두세요.
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>현재 비밀번호</Text>
                  <TextInput
                    style={styles.input}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder="현재 비밀번호"
                    placeholderTextColor="#A9B6C8"
                    secureTextEntry
                    autoCapitalize="none"
                    returnKeyType="next"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>새 비밀번호</Text>
                  <TextInput
                    style={styles.input}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="새 비밀번호"
                    placeholderTextColor="#A9B6C8"
                    secureTextEntry
                    autoCapitalize="none"
                    returnKeyType="done"
                  />
                </View>

                <View style={styles.noticeBox}>
                  <Ionicons
                    name="information-circle-outline"
                    size={17}
                    color="#64748B"
                  />
                  <Text style={styles.noticeText}>
                    소셜 로그인 계정은 서버 정책에 따라 비밀번호 변경이 제한될 수 있습니다.
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.saveButton, !canSubmit && styles.disabledSaveButton]}
                activeOpacity={0.85}
                onPress={handleSave}
                disabled={!canSubmit}
              >
                {saving ?
                  <ActivityIndicator size="small" color="#FFFFFF" />
                : <Text style={styles.saveButtonText}>프로필 수정하기</Text>
                }
              </TouchableOpacity>
            </>
          }
        </ScrollView>
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
    width: 42,
    height: 36,
    alignItems: "flex-start",
    justifyContent: "center",
  },

  logo: {
    color: "#202938",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -1,
  },

  saveHeaderButton: {
    minWidth: 42,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EAF1FF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },

  saveHeaderButtonText: {
    color: "#2158E8",
    fontSize: 12,
    fontWeight: "900",
  },

  disabledButton: {
    opacity: 0.45,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 120,
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

  section: {
    marginTop: 34,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 17,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: "#E6EDF7",
  },

  sectionTitle: {
    color: "#202938",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: -0.3,
    marginBottom: 14,
  },

  sectionDescription: {
    color: "#8FA0B7",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
    marginBottom: 16,
  },

  inputGroup: {
    marginBottom: 16,
  },

  inputLabel: {
    color: "#202938",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 8,
  },

  input: {
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: "#F7F9FC",
    borderWidth: 1,
    borderColor: "#E3EAF5",
    paddingHorizontal: 14,
    color: "#202938",
    fontSize: 14,
    fontWeight: "700",
  },

  readOnlyInput: {
    justifyContent: "center",
  },

  readOnlyText: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "700",
  },

  helperText: {
    marginTop: 7,
    color: "#9AA8BA",
    fontSize: 11,
    fontWeight: "600",
  },

  noticeBox: {
    marginTop: 2,
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 11,
  },

  noticeText: {
    flex: 1,
    marginLeft: 7,
    color: "#64748B",
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 16,
  },

  saveButton: {
    marginTop: 22,
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: "#2158E8",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2158E8",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 3,
  },

  disabledSaveButton: {
    backgroundColor: "#AFC0DD",
    shadowOpacity: 0,
    elevation: 0,
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
});
