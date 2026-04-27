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

import * as WebBrowser from "expo-web-browser";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { WebView } from "react-native-webview";
import OceanWaveFooter from "../components/OceanWaveFooter";
import GoogleIcon from "../assets/google.svg";
import { requestLogin } from "../../api/auth/login";

type SocialLoginResult = {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  is_new_user?: boolean;
};

type SocialProvider = "kakao" | "google" | null;

const SOCIAL_AUTH_URL: Record<Exclude<SocialProvider, null>, string> = {
  kakao: "https://api-dev.planb-travel.cloud/oauth2/authorization/kakao",
  google: "https://api-dev.planb-travel.cloud/oauth2/authorization/google",
};

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [webViewVisible, setWebViewVisible] = useState(false);
  const [currentProvider, setCurrentProvider] = useState<SocialProvider>(null);
  const [currentAuthUrl, setCurrentAuthUrl] = useState("");

  const saveTokens = async (accessToken: string, refreshToken: string) => {
    if (!accessToken || !refreshToken) {
      throw new Error("저장할 토큰이 없습니다.");
    }

    await AsyncStorage.multiSet([
      ["access_token", accessToken],
      ["refresh_token", refreshToken],
    ]);
  };

  const validateTokens = (result: Partial<SocialLoginResult>) => {
    if (!result?.access_token || !result?.refresh_token) {
      throw new Error("토큰이 없습니다. 로그인 응답을 확인해주세요.");
    }
  };

  const moveToMainWithSuccessAlert = (message: string) => {
    Alert.alert("성공", message, [
      {
        text: "확인",
        onPress: () => navigation.replace("Main"),
      },
    ]);
  };

  const handleLoginSuccess = async (
    result: SocialLoginResult,
    successMessage: string,
  ) => {
    validateTokens(result);
    await saveTokens(result.access_token, result.refresh_token);

    if (result.is_new_user) {
      moveToMainWithSuccessAlert(
        `${successMessage}\n회원가입이 완료되었습니다.`,
      );
      return;
    }

    moveToMainWithSuccessAlert(successMessage);
  };

  const handleLoginError = (title: string, error: unknown) => {
    console.log(`${title} 에러:`, error);

    const message =
      error instanceof Error ? error.message : "로그인에 실패했습니다.";

    Alert.alert(title, message);
  };

  const handleLogin = async () => {
    if (loading) return;

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

      console.log("🔥 로그인 응답 전체:", result);

      await handleLoginSuccess(result, "로그인되었습니다.");
    } catch (error) {
      handleLoginError("로그인 실패", error);
    } finally {
      setLoading(false);
    }
  };

  const openSocialWebView = (provider: Exclude<SocialProvider, null>) => {
    if (loading) return;

    const url = SOCIAL_AUTH_URL[provider];

    if (!url) {
      Alert.alert("알림", "소셜 로그인 주소가 아직 설정되지 않았습니다.");
      return;
    }

    setCurrentProvider(provider);
    setCurrentAuthUrl(url);
    setWebViewVisible(true);
  };

  const openGoogleLogin = async () => {
    if (loading) return;

    try {
      const url = SOCIAL_AUTH_URL.google;

      if (!url) {
        Alert.alert("알림", "구글 로그인 주소가 아직 설정되지 않았습니다.");
        return;
      }

      if (Platform.OS === "web") {
        window.location.href = url;
        return;
      }

      await WebBrowser.openBrowserAsync(url);
    } catch (error) {
      handleLoginError("구글 로그인 실패", error);
    }
  };

  const closeSocialWebView = () => {
    setWebViewVisible(false);
    setCurrentProvider(null);
    setCurrentAuthUrl("");
  };

  const handleWebViewNavigationChange = async (navState: { url: string }) => {
    const { url } = navState;
    console.log("WebView 현재 URL:", url);
  };

  const handleWebViewMessage = async (event: any) => {
    try {
      const rawData = event.nativeEvent.data;
      console.log("WebView JSON 응답:", rawData);

      const result = JSON.parse(rawData);

      closeSocialWebView();
      await handleLoginSuccess(result, "카카오 로그인 성공.");
    } catch (error) {
      handleLoginError("카카오 로그인 실패", error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
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

              <Text style={[styles.inputLabel, { marginTop: 15 }]}>
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
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
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
                style={[styles.kakaoButton, loading && styles.disabledButton]}
                activeOpacity={0.85}
                onPress={() => openSocialWebView("kakao")}
                disabled={loading}
              >
                <Ionicons name="chatbubble" size={18} color="#3C1E1E" />
                <Text style={styles.kakaoButtonText}>카카오 로그인</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.googleButton, loading && styles.disabledButton]}
                activeOpacity={0.85}
                onPress={openGoogleLogin}
                disabled={loading}
              >
                <GoogleIcon width={18} height={18} />
                <Text style={styles.googleButtonText}>Google 로그인</Text>
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

      <Modal
        visible={webViewVisible && currentProvider === "kakao"}
        animationType="slide"
      >
        {" "}
        <SafeAreaView style={styles.webViewContainer}>
          <View style={styles.webViewHeader}>
            <TouchableOpacity
              onPress={closeSocialWebView}
              style={styles.webViewCloseButton}
            >
              <Ionicons name="close" size={24} color="#1E293B" />
            </TouchableOpacity>

            <Text style={styles.webViewTitle}>카카오 로그인</Text>
            <View style={{ width: 24 }} />
          </View>

          {currentAuthUrl ?
            <WebView
              source={{ uri: currentAuthUrl }}
              onNavigationStateChange={handleWebViewNavigationChange}
              onMessage={handleWebViewMessage}
              injectedJavaScript={`
    setTimeout(() => {
      window.ReactNativeWebView.postMessage(document.body.innerText);
    }, 500);
    true;
  `}
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
  input: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: "#1E293B",
    fontWeight: "500",
  },

  passwordInputWrapper: {
    backgroundColor: "#FFF",
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
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 10,
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
