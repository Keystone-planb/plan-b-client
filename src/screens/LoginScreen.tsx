/**
 * src/screens/LoginScreen.tsx
 *
 * - 일반 로그인
 * - 카카오 WebView 소셜 로그인
 * - Google system browser 소셜 로그인
 * - Web OAuth 전체 페이지 이동
 * - OAuth 성공 URL 토큰 저장
 */

import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
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
import WebView from "react-native-webview";
import * as WebBrowser from "expo-web-browser";

import GoogleIcon from "../assets/google.svg";
import KakaoIcon from "../assets/kakao.svg";

import { requestLogin } from "../../api/auth/login";
import { createSocialAuthUrl } from "../../api/auth/social";
import {
  getOAuthFailureMessage,
  handleOAuthSuccessUrl,
  isOAuthFailureUrl,
  isOAuthSuccessUrl,
  saveOAuthTokens,
} from "../utils/authToken";

WebBrowser.maybeCompleteAuthSession();

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

type SocialProvider = "kakao" | "google";

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [socialLoadingProvider, setSocialLoadingProvider] =
    useState<SocialProvider | null>(null);
  const [webViewVisible, setWebViewVisible] = useState(false);
  const [kakaoAuthUrl, setKakaoAuthUrl] = useState("");

  const isKakaoLoading = socialLoadingProvider === "kakao";
  const isGoogleLoading = socialLoadingProvider === "google";
  const isBusy = loading || Boolean(socialLoadingProvider);

  const canSubmit = email.trim().length > 0 && password.trim().length > 0;

  const moveToMain = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: "MainTabs" }],
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

    if (!email.trim() || !password.trim()) {
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

  const closeKakaoWebView = () => {
    setWebViewVisible(false);
    setKakaoAuthUrl("");
    setSocialLoadingProvider(null);
  };

  const handleOAuthRedirect = async (url: string) => {
    if (!isOAuthSuccessUrl(url) && !isOAuthFailureUrl(url)) {
      return;
    }

    try {
      closeKakaoWebView();

      if (isOAuthFailureUrl(url)) {
        throw new Error(getOAuthFailureMessage(url));
      }

      await handleOAuthSuccessUrl(url);
      moveToMain();
    } catch (error) {
      handleLoginError("소셜 로그인 실패", error);
    } finally {
      setSocialLoadingProvider(null);
    }
  };

  const openKakaoLogin = () => {
    if (isBusy) return;

    try {
      setSocialLoadingProvider("kakao");

      const { authUrl } = createSocialAuthUrl("kakao");

      if (Platform.OS === "web") {
        window.location.assign(authUrl);
        return;
      }

      setKakaoAuthUrl(authUrl);
      setWebViewVisible(true);
    } catch (error) {
      setSocialLoadingProvider(null);
      handleLoginError("카카오 로그인 실패", error);
    }
  };

  const openGoogleLogin = async () => {
    if (isBusy) return;

    try {
      setSocialLoadingProvider("google");

      const { authUrl, redirectUri } = createSocialAuthUrl("google");

      if (Platform.OS === "web") {
        window.location.assign(authUrl);
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUri,
      );

      if (result.type === "success") {
        await handleOAuthRedirect(result.url);
        return;
      }

      if (result.type === "cancel" || result.type === "dismiss") {
        return;
      }
    } catch (error) {
      handleLoginError("구글 로그인 실패", error);
    } finally {
      setSocialLoadingProvider(null);
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
                returnKeyType="next"
                editable={!isBusy}
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
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  editable={!isBusy}
                />

                <TouchableOpacity
                  onPress={() => setShowPassword((prev) => !prev)}
                  style={styles.eyeButton}
                  activeOpacity={0.7}
                  disabled={isBusy}
                >
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={22}
                    color="#8C9BB1"
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[
                  styles.loginButton,
                  (!canSubmit || isBusy) && styles.disabledButton,
                ]}
                onPress={handleLogin}
                activeOpacity={0.85}
                disabled={!canSubmit || isBusy}
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
                style={[styles.kakaoButton, isBusy && styles.disabledButton]}
                activeOpacity={0.85}
                onPress={openKakaoLogin}
                disabled={isBusy}
              >
                <View style={styles.socialIconBox}>
                  {isKakaoLoading ?
                    <ActivityIndicator size="small" color="#3C1E1E" />
                  : <KakaoIcon
                      width={20}
                      height={20}
                      style={styles.socialSvgIcon}
                    />
                  }
                </View>

                <Text style={styles.kakaoButtonText}>카카오톡 로그인</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.googleButton, isBusy && styles.disabledButton]}
                activeOpacity={0.85}
                onPress={openGoogleLogin}
                disabled={isBusy}
              >
                <View style={styles.socialIconBox}>
                  {isGoogleLoading ?
                    <ActivityIndicator size="small" color="#1E293B" />
                  : <GoogleIcon
                      width={20}
                      height={20}
                      style={styles.socialSvgIcon}
                    />
                  }
                </View>

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

      <Modal visible={webViewVisible} animationType="slide">
        <SafeAreaView style={styles.webViewContainer}>
          <View style={styles.webViewHeader}>
            <TouchableOpacity
              onPress={closeKakaoWebView}
              style={styles.webViewCloseButton}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={24} color="#1E293B" />
            </TouchableOpacity>

            <Text style={styles.webViewTitle}>카카오 로그인</Text>

            <View style={styles.webViewHeaderSpacer} />
          </View>

          {kakaoAuthUrl ?
            <WebView
              source={{ uri: kakaoAuthUrl }}
              originWhitelist={["*"]}
              javaScriptEnabled
              domStorageEnabled
              sharedCookiesEnabled
              thirdPartyCookiesEnabled
              setSupportMultipleWindows={false}
              onError={(event) => {
                Alert.alert(
                  "카카오 로그인 오류",
                  event.nativeEvent.description ||
                    "카카오 로그인 페이지를 불러오지 못했습니다.",
                );

                setSocialLoadingProvider(null);
              }}
              onShouldStartLoadWithRequest={(request) => {
                const nextUrl = request.url;

                if (isOAuthSuccessUrl(nextUrl) || isOAuthFailureUrl(nextUrl)) {
                  handleOAuthRedirect(nextUrl);
                  return false;
                }

                return true;
              }}
              onNavigationStateChange={({ url }) => {
                if (isOAuthSuccessUrl(url) || isOAuthFailureUrl(url)) {
                  handleOAuthRedirect(url);
                }
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
