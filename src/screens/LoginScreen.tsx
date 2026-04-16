/**
 * src/screens/LoginScreen.tsx
 *
 * 로그인 화면
 *
 * [플로우]
 * 1. 이메일 / 비밀번호 입력
 * 2. 로그인 버튼 클릭 → requestLogin() 호출
 * 3. access_token / refresh_token 저장
 * 4. 성공 시 메인 화면 이동
 * 5. 카카오 / 구글 로그인 버튼 클릭 → mock 소셜 로그인 API 호출
 */

import React, { useState, useRef, useEffect } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import GoogleIcon from "../assets/google.svg";
import { requestLogin } from "../../api/auth/login";
import { requestKakaoLogin } from "../../api/auth/kakao";
import { requestGoogleLogin } from "../../api/auth/google";

const { width } = Dimensions.get("window");

/** 파도 레이어 */
const WaveLayer = ({ color, opacity, duration, offsetY, bCurveAmp }: any) => {
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(translateX, {
        toValue: -width,
        duration,
        useNativeDriver: true,
      }),
    ).start();
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

/** 파도 전체 */
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

  const saveTokensAndMoveMain = async (
    accessToken: string,
    refreshToken: string,
    successMessage: string,
  ) => {
    await AsyncStorage.setItem("access_token", accessToken);
    await AsyncStorage.setItem("refresh_token", refreshToken);

    Alert.alert("성공", successMessage, [
      {
        text: "확인",
        onPress: () => navigation.replace("Main"),
      },
    ]);
  };

  /** 일반 로그인 처리 */
  const handleLogin = async () => {
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

      console.log("로그인 성공:", result);

      await saveTokensAndMoveMain(
        result.access_token,
        result.refresh_token,
        "로그인되었습니다.",
      );
    } catch (error: any) {
      console.log("로그인 실패:", error);
      Alert.alert("로그인 실패", error.message || "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  /** 카카오 로그인 처리 (mock 기준) */
  const handleKakaoLogin = async () => {
    try {
      setLoading(true);

      const result = await requestKakaoLogin({
        oauth_token: "mock_kakao_oauth_token",
      });

      console.log("카카오 로그인 성공:", result);

      await saveTokensAndMoveMain(
        result.access_token,
        result.refresh_token,
        "카카오 로그인되었습니다.",
      );
    } catch (error: any) {
      console.log("카카오 로그인 실패:", error);
      Alert.alert(
        "카카오 로그인 실패",
        error.message || "카카오 로그인에 실패했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  /** 구글 로그인 처리 (mock 기준) */
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);

      const result = await requestGoogleLogin({
        oauth_token: "mock_google_oauth_token",
      });

      console.log("구글 로그인 성공:", result);

      await saveTokensAndMoveMain(
        result.access_token,
        result.refresh_token,
        "구글 로그인되었습니다.",
      );
    } catch (error: any) {
      console.log("구글 로그인 실패:", error);
      Alert.alert(
        "구글 로그인 실패",
        error.message || "구글 로그인에 실패했습니다.",
      );
    } finally {
      setLoading(false);
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
                style={styles.kakaoButton}
                activeOpacity={0.85}
                onPress={handleKakaoLogin}
                disabled={loading}
              >
                <Ionicons name="chatbubble" size={18} color="#3C1E1E" />
                <Text style={styles.kakaoButtonText}>카카오톡 로그인</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.googleButton}
                activeOpacity={0.85}
                onPress={handleGoogleLogin}
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
    </SafeAreaView>
  );
}

/* 스타일 */
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
});
