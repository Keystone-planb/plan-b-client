/**
 * src/screens/LoginScreen.tsx
 */

import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
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
import Svg, { Path } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import WebView from "react-native-webview";
import * as WebBrowser from "expo-web-browser";

import GoogleIcon from "../assets/google.svg";
import KakaoIcon from "../components/KakaoIcon";

import { requestLogin } from "../../api/auth/login";
import {
  createSocialAuthUrl,
  getSocialRedirectUri,
} from "../../api/auth/social";
import {
  handleOAuthSuccessUrl,
  isOAuthFailureUrl,
  isOAuthSuccessUrl,
  parseOAuthError,
  saveOAuthTokens,
} from "../utils/authToken";

WebBrowser.maybeCompleteAuthSession();

const { width } = Dimensions.get("window");

type LoginResult = {
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
      {[0, 1].map((item) => (
        <Svg key={item} width={width} height={waveHeight}>
          <Path d={d} fill={color} opacity={opacity} />
        </Svg>
      ))}
    </Animated.View>
  );
};

const OceanWaveFooter = () => {
  return (
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
};

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [webViewVisible, setWebViewVisible] = useState(false);
  const [kakaoAuthUrl, setKakaoAuthUrl] = useState("");

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

  const moveToMainWithSuccessAlert = (message: string) => {
    Alert.alert("성공", message, [
      {
        text: "확인",
        onPress: () => navigation.replace("Main"),
      },
    ]);
  };

  const handleLoginSuccess = async (
    result: LoginResult,
    successMessage: string,
  ) => {
    await saveTokens(result);

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

  const closeKakaoWebView = () => {
    setWebViewVisible(false);
    setKakaoAuthUrl("");
  };

  const handleOAuthRedirect = async (url: string) => {
    console.log("[OAuth Redirect 감지 URL]", url);

    if (!isOAuthSuccessUrl(url) && !isOAuthFailureUrl(url)) {
      return;
    }

    try {
      closeKakaoWebView();

      if (isOAuthFailureUrl(url)) {
        throw new Error(parseOAuthError(url));
      }

      await handleOAuthSuccessUrl(url);

      moveToMainWithSuccessAlert("소셜 로그인되었습니다.");
    } catch (error) {
      handleLoginError("소셜 로그인 실패", error);
    }
  };

  const openKakaoLogin = () => {
    if (loading) return;

    try {
      const { authUrl, redirectUri } = createSocialAuthUrl("kakao");

      console.log("[카카오 로그인 authUrl]", authUrl);
      console.log("[카카오 로그인 redirectUri]", redirectUri);

      if (Platform.OS === "web") {
        window.location.href = authUrl;
        return;
      }

      setKakaoAuthUrl(authUrl);
      setWebViewVisible(true);
    } catch (error) {
      handleLoginError("카카오 로그인 실패", error);
    }
  };

  const openGoogleLogin = async () => {
    if (loading) return;

    try {
      const { authUrl, redirectUri } = createSocialAuthUrl("google");

      console.log("[구글 로그인 authUrl]", authUrl);
      console.log("[구글 로그인 redirectUri]", redirectUri);

      if (Platform.OS === "web") {
        window.location.href = authUrl;
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        getSocialRedirectUri(),
      );

      console.log("[구글 로그인 결과]", result);

      if (result.type === "success") {
        await handleOAuthRedirect(result.url);
      }
    } catch (error) {
      handleLoginError("구글 로그인 실패", error);
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
                onPress={openKakaoLogin}
                disabled={loading}
              >
                <KakaoIcon size={18} color="#3C1E1E" />
                <Text style={styles.kakaoButtonText}>카카오톡 로그인</Text>
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
              originWhitelist={["https://*", "http://*", "planb://*"]}
              onShouldStartLoadWithRequest={(request) => {
                const nextUrl = request.url;

                console.log("[카카오 WebView 요청 URL]", nextUrl);

                if (isOAuthSuccessUrl(nextUrl) || isOAuthFailureUrl(nextUrl)) {
                  handleOAuthRedirect(nextUrl);
                  return false;
                }

                return true;
              }}
              onNavigationStateChange={({ url }) => {
                console.log("[카카오 WebView URL]", url);

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
    width,
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
