/**
 * src/screens/LoginScreen.tsx
 */

import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { WebView } from "react-native-webview";

import GoogleIcon from "../assets/google.svg";
import { requestLogin } from "../../api/auth/login";

const { width } = Dimensions.get("window");

type SocialLoginResult = {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  is_new_user?: boolean;
};

type WaveLayerProps = {
  color: string;
  opacity: number;
  duration: number;
  offsetY: number;
  bCurveAmp: number;
};

type SocialProvider = "kakao" | "google" | null;

/**
 * 백엔드가 실제로 제공하는 시작 URL로 바꾸기
 * http://127.0.0.1:8080/oauth2/authorization/kakao
 * http://127.0.0.1:8080/oauth2/authorization/google
 */

const SOCIAL_AUTH_URL = {
  kakao: "http://127.0.0.1:8080/oauth2/authorization/kakao",
  google: "http://127.0.0.1:8080/oauth2/authorization/google",
};

/**
 * 백엔드가 로그인 완료 후 리다이렉트하는 URL 규칙으로 바꾸기
 */
const SOCIAL_SUCCESS_URL_PREFIX = "http://127.0.0.1:8080/oauth/success";
const SOCIAL_FAIL_URL_PREFIX = "http://127.0.0.1:8080/oauth/fail";

const WaveLayer = ({
  color,
  opacity,
  duration,
  offsetY,
  bCurveAmp,
}: WaveLayerProps) => {
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(translateX, {
        toValue: -width,
        duration,
        useNativeDriver: true,
      }),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [duration, translateX]);

  const waveHeight = 250;

  const d = `
    M 0 ${offsetY}
    C ${width * 0.15} ${offsetY - bCurveAmp}, ${width * 0.35} ${
      offsetY - bCurveAmp * 0.5
    }, ${width * 0.5} ${offsetY}
    C ${width * 0.65} ${offsetY + bCurveAmp * 0.5}, ${width * 0.85} ${
      offsetY + bCurveAmp
    }, ${width} ${offsetY}
    L ${width} ${waveHeight}
    L 0 ${waveHeight}
    Z
  `;

  return (
    <Animated.View
      style={{
        position: "absolute",
        width: width * 2,
        flexDirection: "row",
        transform: [{ translateX }],
        bottom: 0,
      }}
    >
      {[0, 1].map((i) => (
        <Svg key={i} width={width} height={waveHeight}>
          <Path d={d} fill={color} opacity={opacity} />
        </Svg>
      ))}
    </Animated.View>
  );
};

const OceanWaveFooter = () => (
  <View style={styles.waveContainer} pointerEvents="none">
    <WaveLayer
      color="#93C5FD"
      opacity={0.4}
      duration={12000}
      offsetY={70}
      bCurveAmp={60}
    />
    <WaveLayer
      color="#60A5FA"
      opacity={0.6}
      duration={8500}
      offsetY={100}
      bCurveAmp={45}
    />
    <WaveLayer
      color="#2563EB"
      opacity={1}
      duration={5500}
      offsetY={130}
      bCurveAmp={30}
    />
  </View>
);

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

    setCurrentProvider(provider);
    setCurrentAuthUrl(SOCIAL_AUTH_URL[provider]);
    setWebViewVisible(true);
  };

  const closeSocialWebView = () => {
    setWebViewVisible(false);
    setCurrentProvider(null);
    setCurrentAuthUrl("");
  };

  const parseQueryParams = (url: string) => {
    try {
      const parsedUrl = new URL(url);
      const access_token = parsedUrl.searchParams.get("access_token") ?? "";
      const refresh_token = parsedUrl.searchParams.get("refresh_token") ?? "";
      const expires_in = Number(
        parsedUrl.searchParams.get("expires_in") ?? "0",
      );
      const is_new_user = parsedUrl.searchParams.get("is_new_user") === "true";

      return {
        access_token,
        refresh_token,
        expires_in,
        is_new_user,
      };
    } catch {
      return {
        access_token: "",
        refresh_token: "",
        expires_in: 0,
        is_new_user: false,
      };
    }
  };

  const handleWebViewNavigationChange = async (navState: { url: string }) => {
    const { url } = navState;
    console.log("WebView 현재 URL:", url);

    if (!url) return;

    if (url.startsWith(SOCIAL_FAIL_URL_PREFIX)) {
      closeSocialWebView();

      let failMessage = "소셜 로그인에 실패했습니다.";

      try {
        const parsedUrl = new URL(url);
        failMessage = parsedUrl.searchParams.get("message") ?? failMessage;
        console.log("소셜 로그인 실패 URL:", url);
        console.log("소셜 로그인 실패 메시지:", failMessage);
      } catch {}

      handleLoginError(
        currentProvider === "kakao" ? "카카오 로그인 실패" : "구글 로그인 실패",
        new Error(failMessage),
      );
      return;
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
              <TextInput
                placeholder="비밀번호를 입력하세요"
                placeholderTextColor="#8C9BB1"
                secureTextEntry
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                textContentType="password"
                editable={!loading}
              />

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
                <Text style={styles.kakaoButtonText}>카카오톡 로그인</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.googleButton, loading && styles.disabledButton]}
                activeOpacity={0.85}
                onPress={() => openSocialWebView("google")}
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

      <Modal visible={webViewVisible} animationType="slide">
        <SafeAreaView style={styles.webViewContainer}>
          <View style={styles.webViewHeader}>
            <TouchableOpacity
              onPress={closeSocialWebView}
              style={styles.webViewCloseButton}
            >
              <Ionicons name="close" size={24} color="#1E293B" />
            </TouchableOpacity>

            <Text style={styles.webViewTitle}>
              {currentProvider === "kakao" ?
                "카카오 로그인"
              : currentProvider === "google" ?
                "구글 로그인"
              : "소셜 로그인"}
            </Text>

            <View style={{ width: 24 }} />
          </View>

          {currentAuthUrl ?
            <WebView
              source={{ uri: currentAuthUrl }}
              onNavigationStateChange={handleWebViewNavigationChange}
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
  waveContainer: {
    height: 180,
    width: width,
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
