/**
 * src/screens/LoginScreen.tsx
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import WebView from "react-native-webview";
import * as WebBrowser from "expo-web-browser";

import { OceanWaveFooter } from "../components/OceanWaveFooter";
import GoogleIcon from "../assets/google.svg";
import KakaoIcon from "../assets/kakao.svg";
import { requestLogin } from "../../api/auth/login";

type LoginResult = {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  is_new_user?: boolean;
};

type SocialProvider = "kakao" | "google";

const SOCIAL_AUTH_BASE_URL: Record<SocialProvider, string> = {
  kakao: "https://api-dev.planb-travel.cloud/oauth2/authorization/kakao",
  google: "https://api-dev.planb-travel.cloud/oauth2/authorization/google",
};

const getRedirectUri = () => {
  return Platform.OS === "web" ?
      "http://localhost:8082/oauth/success"
    : "planb://oauth/success";
};

// 소셜 로그인 URL 생성 함수
const getSocialAuthUrl = (provider: SocialProvider) => {
  const redirectUri = encodeURIComponent(getRedirectUri());
  return `${SOCIAL_AUTH_BASE_URL[provider]}?redirect_uri=${redirectUri}`;
};

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [webViewVisible, setWebViewVisible] = useState(false);
  const [kakaoAuthUrl, setKakaoAuthUrl] = useState("");

  const isPasswordLongEnough = password.length >= 8;
  const hasPasswordLetter = /[A-Za-z]/.test(password);
  const hasPasswordNumber = /[0-9]/.test(password);
  const isPasswordValid =
    isPasswordLongEnough && hasPasswordLetter && hasPasswordNumber;

  // 로그인 성공 시 access/refresh token 저장
  const saveTokens = async (result: Partial<LoginResult>) => {
    const accessToken = result.access_token;
    const refreshToken = result.refresh_token;

    if (!accessToken || !refreshToken) {
      throw new Error("토큰이 없습니다. 로그인 응답을 확인해주세요.");
    }

    await AsyncStorage.multiSet([
      ["access_token", accessToken],
      ["refresh_token", refreshToken],
    ]);
  };

  const goMainWithAlert = (message: string) => {
    Alert.alert("성공", message, [
      {
        text: "확인",
        onPress: () =>
          navigation.reset({
            index: 0,
            routes: [{ name: "MainTabs" }],
          }),
      },
    ]);
  };

  // 토큰 저장 후 메인 화면으로 이동
  const completeLogin = async (result: LoginResult, message: string) => {
    await saveTokens(result);

    goMainWithAlert(
      result.is_new_user ? `${message}\n회원가입이 완료되었습니다.` : message,
    );
  };

  const showError = (title: string, error: unknown) => {
    console.log(`${title} 에러:`, error);

    Alert.alert(
      title,
      error instanceof Error ? error.message : "로그인에 실패했습니다.",
    );
  };

  // 일반 이메일 로그인 처리
  const handleLogin = async () => {
    if (loading) return;

    if (!email.trim() || !password.trim()) {
      Alert.alert("알림", "이메일과 비밀번호를 입력해주세요.");
      return;
    }

    if (!isPasswordValid) {
      Alert.alert("알림", "비밀번호 조건을 확인해주세요.");
      return;
    }

    try {
      setLoading(true);

      const result = await requestLogin({
        email: email.trim(),
        password,
      });

      console.log("🔥 로그인 응답 전체:", result);

      await completeLogin(result, "로그인되었습니다.");
    } catch (error: any) {
      showError("로그인 실패", error);
    } finally {
      setLoading(false);
    }
  };

  // 카카오는 앱 내부 WebView로 로그인 진행
  const openKakaoLogin = () => {
    if (loading) return;

    setKakaoAuthUrl(getSocialAuthUrl("kakao"));
    setWebViewVisible(true);
  };

  // 구글은 정책상 시스템 브라우저로 로그인 진행
  const openGoogleLogin = async () => {
    if (loading) return;

    try {
      const url = getSocialAuthUrl("google");

      if (Platform.OS === "web") {
        window.location.href = url;
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(
        url,
        getRedirectUri(),
      );

      console.log("[구글 로그인 결과]", result);

      if (result.type === "success") {
        await handleOAuthRedirect(result.url);
      }
    } catch (error) {
      showError("구글 로그인 실패", error);
    }
  };

  const closeKakaoWebView = () => {
    setWebViewVisible(false);
    setKakaoAuthUrl("");
  };

  // OAuth 성공/실패 redirect URL에서 토큰 또는 에러 메시지 추출
  const handleOAuthRedirect = async (url: string) => {
    if (!url.includes("/oauth/success") && !url.includes("/oauth/failure")) {
      return;
    }

    try {
      const parsedUrl = new URL(url);
      const accessToken = parsedUrl.searchParams.get("access_token");
      const refreshToken = parsedUrl.searchParams.get("refresh_token");
      const errorMessage = parsedUrl.searchParams.get("error");

      closeKakaoWebView();

      if (url.includes("/oauth/failure")) {
        throw new Error(errorMessage ?? "소셜 로그인에 실패했습니다.");
      }

      await completeLogin(
        {
          access_token: accessToken ?? "",
          refresh_token: refreshToken ?? "",
        },
        "소셜 로그인되었습니다.",
      );
    } catch (error) {
      showError("소셜 로그인 실패", error);
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
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                editable={!loading}
              />

              <Text style={[styles.inputLabel, styles.passwordLabel]}>
                비밀번호
              </Text>

              <View style={styles.passwordInputWrapper}>
                <TextInput
                  placeholder="비밀번호를 입력하세요"
                  placeholderTextColor="#8C9BB1"
                  secureTextEntry={!showPassword}
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                  textContentType="password"
                  editable={!loading}
                />

                <TouchableOpacity
                  onPress={() => setShowPassword((prev) => !prev)}
                  style={styles.eyeButton}
                  activeOpacity={0.7}
                  disabled={loading}
                >
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={22}
                    color="#8C9BB1"
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.loginButton, loading && styles.disabledButton]}
                onPress={handleLogin}
                activeOpacity={0.85}
                disabled={loading}
              >
                {loading ?
                  <ActivityIndicator color="#FFFFFF" />
                : <Text style={styles.loginButtonText}>로그인</Text>}
              </TouchableOpacity>
            </View>

            <View style={styles.socialSection}>
              <View style={styles.divider}>
                <View style={styles.line} />
                <Text style={styles.dividerText}>간편 로그인</Text>
                <View style={styles.line} />
              </View>

              <TouchableOpacity
                style={[
                  styles.socialSvgButton,
                  loading && styles.disabledButton,
                ]}
                activeOpacity={0.85}
                onPress={openKakaoLogin}
                disabled={loading}
              >
                <KakaoIcon width="100%" height="100%" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.socialSvgButton,
                  loading && styles.disabledButton,
                ]}
                activeOpacity={0.85}
                onPress={openGoogleLogin}
                disabled={loading}
              >
                <GoogleIcon width="100%" height="100%" />
              </TouchableOpacity>
            </View>

            <View style={styles.signupContainer}>
              <Text style={styles.signupNotice}>계정이 없으신가요?</Text>

              <TouchableOpacity
                style={styles.signupBox}
                onPress={() => navigation.navigate("SignUp")}
                activeOpacity={0.8}
                disabled={loading}
              >
                <Text style={styles.signupText}>지금 바로 가입하기</Text>
                <Ionicons name="chevron-forward" size={14} color="#2563EB" />
              </TouchableOpacity>
            </View>
          </View>

          <OceanWaveFooter />
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={webViewVisible} animationType="slide">
        <SafeAreaView style={styles.webViewContainer}>
          <View style={styles.webViewHeader}>
            <TouchableOpacity
              onPress={closeKakaoWebView}
              style={styles.webViewCloseButton}
            >
              <Ionicons name="close" size={24} color="#1E293B" />
            </TouchableOpacity>

            <Text style={styles.webViewTitle}>카카오 로그인</Text>

            <View style={styles.webViewHeaderSpacer} />
          </View>

          {kakaoAuthUrl ?
            <WebView
              source={{ uri: kakaoAuthUrl }}
              onNavigationStateChange={({ url }) => {
                console.log("WebView 현재 URL:", url);
                handleOAuthRedirect(url);
              }}
              startInLoadingState
              renderLoading={() => (
                <View style={styles.webViewLoading}>
                  <ActivityIndicator size="large" color="#2158E8" />
                </View>
              )}
            />
          : null}
        </SafeAreaView>
      </Modal>
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
    justifyContent: "space-between",
  },
  topSection: {
    paddingHorizontal: 28,
    paddingTop: 50,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
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
  passwordLabel: {
    marginTop: 15,
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
  passwordHintBox: {
    marginTop: 8,
    marginLeft: 4,
    gap: 4,
  },
  passwordHintText: {
    fontSize: 12,
    color: "#EF4444",
    fontWeight: "600",
  },
  passwordHintSuccess: {
    color: "#16A34A",
  },
  loginButton: {
    width: "100%",
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

  // 공통 소셜 로그인 SVG 버튼 터치 영역
  socialSvgButton: {
    width: "100%",
    height: 52,
    marginBottom: 12,
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
  webViewContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  webViewHeader: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  webViewCloseButton: {
    padding: 4,
  },
  webViewHeaderSpacer: {
    width: 24,
  },
  webViewTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
  },
  webViewLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
