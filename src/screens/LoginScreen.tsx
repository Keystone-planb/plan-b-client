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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

// 하단 파도 애니메이션 컴포넌트
interface WaveLayerProps {
  color: string;
  opacity: number;
  duration: number;
  offsetY: number;
  bCurveAmp: number;
}

/** 애니메이션 파도 컴포넌트 */
const WaveLayer = ({
  color,
  opacity,
  duration,
  offsetY,
  bCurveAmp,
}: WaveLayerProps) => {
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
    C ${width * 0.15} ${offsetY - bCurveAmp}, ${width * 0.35} ${offsetY - bCurveAmp * 0.5}, ${width * 0.5} ${offsetY}
    C ${width * 0.65} ${offsetY + bCurveAmp * 0.5}, ${width * 0.85} ${offsetY + bCurveAmp}, ${width} ${offsetY}
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
        <Svg
          key={i}
          width={width}
          height={waveHeight}
          preserveAspectRatio="none"
        >
          <Path d={d} fill={color} opacity={opacity} />
        </Svg>
      ))}
    </Animated.View>
  );
};

/** 바다 푸터 컴포넌트 */
const OceanWaveFooter = () => (
  <View style={styles.waveContainer}>
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

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topSection}>
            {/* 로고 영역 */}
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>Plan.B</Text>
              <Text style={styles.subLogoText}>더 스마트한 여행의 시작</Text>
            </View>

            {/* 입력 폼 영역 */}
            <View style={styles.formContainer}>
              <Text style={styles.inputLabel}>이메일</Text>
              <TextInput
                placeholder="example@planb.com"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
              />

              <Text style={[styles.inputLabel, { marginTop: 15 }]}>
                비밀번호
              </Text>
              <TextInput
                placeholder="비밀번호를 입력하세요"
                secureTextEntry
                style={styles.input}
                value={password}
                onChangeText={setPassword}
              />

              <TouchableOpacity style={styles.loginButton} activeOpacity={0.9}>
                <Text style={styles.loginButtonText}>로그인</Text>
              </TouchableOpacity>
            </View>

            {/* 소셜 로그인 영역 */}
            <View style={styles.socialSection}>
              <View style={styles.divider}>
                <View style={styles.line} />
                <Text style={styles.dividerText}>간편 로그인</Text>
                <View style={styles.line} />
              </View>

              <TouchableOpacity style={styles.kakaoButton} activeOpacity={0.8}>
                <Ionicons name="chatbubble" size={18} color="#3C1E1E" />
                <Text style={styles.kakaoButtonText}>카카오톡 로그인</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.googleButton} activeOpacity={0.8}>
                <Ionicons name="logo-google" size={18} color="#EA4335" />
                <Text style={styles.googleButtonText}>Google 로그인</Text>
              </TouchableOpacity>
            </View>

            {/* 회원가입 섹션 */}
            <View style={styles.signupContainer}>
              <Text style={styles.signupNotice}>계정이 없으신가요?</Text>
              <TouchableOpacity
                style={styles.signupBox}
                onPress={() => navigation.navigate("SignUp")}
                activeOpacity={0.7}
              >
                <Text style={styles.signupText}>지금 바로 가입하기</Text>
                <Ionicons name="chevron-forward" size={14} color="#2563EB" />
              </TouchableOpacity>
            </View>
          </View>

          {/* 하단 애니메이션 파도 */}
          <OceanWaveFooter />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
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
  },
  loginButton: {
    backgroundColor: "#2563EB",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 24,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  loginButtonText: {
    color: "#fff",
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
    zIndex: 1,
  },
  signupNotice: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 10,
  },
  signupBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
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
    backgroundColor: "transparent",
    position: "relative",
  },
});
