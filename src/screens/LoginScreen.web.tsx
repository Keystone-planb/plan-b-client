/**
 * src/screens/LoginScreen.web.tsx
 *
 * - 웹 전용 로그인 화면
 * - 일반 로그인
 * - 카카오 / 구글 소셜 로그인은 window.location.assign(authUrl)로 이동
 * - react-native-webview를 절대 import하지 않음
 * - 소셜 버튼 아이콘은 SVG 사용
 */

import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import GoogleIcon from "../assets/google.svg";
import KakaoIcon from "../assets/kakao.svg";

import { requestLogin } from "../../api/auth/login";
import { createSocialAuthUrl, SocialProvider } from "../../api/auth/social";
import { saveOAuthTokens } from "../utils/authToken";

type LoginResult = {
  success?: boolean;
  message?: string;
  access_token: string;
  refresh_token: string;
  token_type?: "Bearer" | string;
  expires_in?: number;
  user_id?: number;
  nickname?: string;
  is_new_user?: boolean;
};

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [socialLoadingProvider, setSocialLoadingProvider] =
    useState<SocialProvider | null>(null);

  const isKakaoLoading = socialLoadingProvider === "kakao";
  const isGoogleLoading = socialLoadingProvider === "google";
  const isBusy = loading || Boolean(socialLoadingProvider);

  const canSubmit = email.trim().length > 0 && password.trim().length > 0;

  const moveToMain = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: "Main" }],
    });
  };

  const saveTokens = async (result: Partial<LoginResult>) => {
    const accessToken = result.access_token;
    const refreshToken = result.refresh_token;

    if (!accessToken || !refreshToken) {
      throw new Error("토큰이 없습니다. 로그인 응답을 확인해주세요.");
    }

    await saveOAuthTokens({
      accessToken,
      refreshToken,
      userId: result.user_id ? String(result.user_id) : undefined,
      nickname: result.nickname,
    });
  };

  const handleLoginSuccess = async (result: LoginResult) => {
    await saveTokens(result);
    moveToMain();
  };

  const handleLoginError = (title: string, error: unknown) => {
    const message =
      error instanceof Error ? error.message : "로그인에 실패했습니다.";

    Alert.alert(title, message);
  };

  const handleLogin = async () => {
    if (isBusy) return;

    if (!canSubmit) {
      Alert.alert("알림", "이메일과 비밀번호를 입력해주세요.");
      return;
    }

    try {
      setLoading(true);

      const result = await requestLogin({
        email: email.trim(),
        password,
      });

      await handleLoginSuccess(result);
    } catch (error) {
      handleLoginError("로그인 실패", error);
    } finally {
      setLoading(false);
    }
  };

  const openSocialLogin = (provider: SocialProvider) => {
    if (isBusy) return;

    try {
      const { authUrl, redirectUri } = createSocialAuthUrl(provider);

      if (__DEV__) {
        console.log(`[${provider} OAuth Web] authUrl:`, authUrl);
        console.log(`[${provider} OAuth Web] redirectUri:`, redirectUri);
      }

      setSocialLoadingProvider(provider);

      if (typeof window !== "undefined") {
        window.location.assign(authUrl);
      }
    } catch (error) {
      setSocialLoadingProvider(null);
      handleLoginError(
        provider === "kakao" ? "카카오 로그인 실패" : "구글 로그인 실패",
        error,
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.topSection}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>Plan.B</Text>
              <Text style={styles.subLogoText}>더 스마트한 여행의 시작</Text>
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.inputLabel}>이메일</Text>

              <TextInput
                placeholder="example@planb.com"
                placeholderTextColor="#8C9BB1"
                value={email}
                onChangeText={setEmail}
                editable={!isBusy}
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <Text style={[styles.inputLabel, styles.passwordLabel]}>
                비밀번호
              </Text>

              <View style={styles.passwordInputWrapper}>
                <TextInput
                  placeholder="8자 이상"
                  placeholderTextColor="#8C9BB1"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  editable={!isBusy}
                  style={styles.passwordInput}
                />

                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.8}
                  disabled={isBusy}
                >
                  <Ionicons
                    name={showPassword ? "eye" : "eye-off"}
                    size={20}
                    color="#8C9BB1"
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={handleLogin}
                style={[
                  styles.loginButton,
                  (!canSubmit || isBusy) && styles.disabledButton,
                ]}
                activeOpacity={0.8}
                disabled={!canSubmit || isBusy}
              >
                {loading ?
                  <ActivityIndicator size="small" color="#FFFFFF" />
                : <Text style={styles.loginButtonText}>로그인</Text>}
              </TouchableOpacity>
            </View>

            <View style={styles.socialSection}>
              <View style={styles.divider}>
                <View style={styles.line} />
                <Text style={styles.dividerText}>또는</Text>
                <View style={styles.line} />
              </View>

              <TouchableOpacity
                style={[styles.kakaoButton, isBusy && styles.disabledButton]}
                onPress={() => openSocialLogin("kakao")}
                activeOpacity={0.8}
                disabled={isBusy}
              >
                {isKakaoLoading ?
                  <ActivityIndicator size="small" color="#3C1E1E" />
                : <View style={styles.socialIconBox}>
                    <KakaoIcon
                      width={20}
                      height={20}
                      style={styles.socialSvgIcon}
                    />
                  </View>
                }

                <Text style={styles.kakaoButtonText}>카카오 로그인</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.googleButton, isBusy && styles.disabledButton]}
                onPress={() => openSocialLogin("google")}
                activeOpacity={0.8}
                disabled={isBusy}
              >
                {isGoogleLoading ?
                  <ActivityIndicator size="small" color="#1E293B" />
                : <View style={styles.socialIconBox}>
                    <GoogleIcon
                      width={20}
                      height={20}
                      style={styles.socialSvgIcon}
                    />
                  </View>
                }

                <Text style={styles.googleButtonText}>Google 로그인</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.signupContainer}>
              <Text style={styles.signupNotice}>계정이 없으신가요?</Text>

              <TouchableOpacity
                style={styles.signupBox}
                onPress={() => navigation.navigate("SignUp")}
                activeOpacity={0.8}
                disabled={isBusy}
              >
                <Text style={styles.signupText}>지금 바로 가입하기</Text>
                <Ionicons name="chevron-forward" size={14} color="#2563EB" />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  container: {
    flex: 1,
    backgroundColor: "#F7F9FB",
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingBottom: 36,
  },

  topSection: {
    paddingHorizontal: 28,
    paddingTop: 24,
  },

  logoContainer: {
    alignItems: "center",
    marginBottom: 34,
  },

  logoText: {
    fontSize: 50,
    fontWeight: "900",
    color: "#1E293B",
    letterSpacing: -1.5,
  },

  subLogoText: {
    fontSize: 15,
    color: "#64748B",
    marginTop: 4,
  },

  formContainer: {
    width: "100%",
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
    color: "#1E293B",
    marginLeft: 4,
  },

  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: "#1E293B",
    fontWeight: "500",
  },

  passwordLabel: {
    marginTop: 15,
  },

  passwordInputWrapper: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },

  passwordInput: {
    flex: 1,
    height: 54,
    fontSize: 16,
    color: "#1E293B",
    fontWeight: "500",
    paddingVertical: 0,
  },

  eyeButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  loginButton: {
    width: "100%",
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 14,
    backgroundColor: "#2158E8",
    shadowColor: "#2158E8",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
    marginTop: 24,
  },

  disabledButton: {
    opacity: 0.7,
  },

  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  socialSection: {
    marginTop: 35,
  },

  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#E2E8F0",
  },

  dividerText: {
    marginHorizontal: 12,
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
  },

  kakaoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE500",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    gap: 10,
  },

  kakaoButtonText: {
    color: "#3C1E1E",
    fontSize: 15,
    fontWeight: "700",
  },

  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 10,
  },

  socialIconBox: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    overflow: "hidden",
  },

  socialSvgIcon: {
    width: 20,
    height: 20,
    maxWidth: 20,
    maxHeight: 20,
  },

  googleButtonText: {
    color: "#1E293B",
    fontSize: 15,
    fontWeight: "700",
  },

  signupContainer: {
    marginTop: 30,
    alignItems: "center",
  },

  signupNotice: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 10,
  },

  signupBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E9F3FF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
  },

  signupText: {
    fontSize: 15,
    color: "#2563EB",
    fontWeight: "800",
    marginRight: 4,
  },
});
