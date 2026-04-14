/**
 * src/screens/SignUpScreen.tsx
 *
 * 회원가입 화면
 *
 * [플로우]
 * 1. 이메일 입력 → 인증 버튼 → requestEmailAuth() 호출 → 3분 타이머 시작
 * 2. 6자리 OTP 입력 → verifyEmailCode() 호출 → 인증 완료 처리
 * 3. 비밀번호 / 닉네임 입력 → requestSignup() 호출 → 메인 화면으로 이동
 *
 * [TODO]
 * - 서버 열리면 각 api 파일에서 임시 mock 제거
 * - 회원가입 성공 후 자동 로그인 처리
 */

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { requestEmailAuth } from "../../api/auth/email/request";
import { verifyEmailCode, VerifyEmailError } from "../../api/auth/email/verify";
import { requestSignup } from "../../api/users/signup";
import OtpInput from "../components/OtpInput";

const passwordConditions = [
  { label: "8자리 이상", test: (pw: string) => pw.length >= 8 },
  { label: "영문 소문자 포함", test: (pw: string) => /[a-z]/.test(pw) },
  { label: "영문 대문자 포함", test: (pw: string) => /[A-Z]/.test(pw) },
  { label: "숫자 포함", test: (pw: string) => /\d/.test(pw) },
  { label: "특수문자 포함", test: (pw: string) => /[^A-Za-z\d]/.test(pw) },
];

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

export default function SignUpScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [authCode, setAuthCode] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [nickname, setNickname] = useState("");

  const [loading, setLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [timer, setTimer] = useState(180);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const formatTimer = (seconds: number) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  const startTimer = (seconds: number = 180) => {
    if (timerRef.current) clearInterval(timerRef.current);

    setTimer(seconds);

    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleRequestAuthCode = async () => {
    if (!email.trim()) {
      Alert.alert("알림", "이메일을 입력해주세요.");
      return;
    }

    try {
      setIsSending(true);
      setIsVerified(false);
      setAuthCode("");

      const result = await requestEmailAuth(email.trim());

      setIsEmailSent(true);
      startTimer(180);

      Alert.alert("성공", result.message);
    } catch (error: any) {
      Alert.alert("에러", error.message || "인증 코드 발송에 실패했습니다.");
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!authCode || authCode.length < 6) {
      Alert.alert("알림", "6자리 코드를 입력해주세요.");
      return;
    }

    if (timer === 0) {
      Alert.alert("알림", "인증 시간이 만료되었습니다. 재발송해주세요.");
      return;
    }

    try {
      setLoading(true);

      const result = await verifyEmailCode({
        email: email.trim(),
        code: authCode.trim(),
      });

      setIsVerified(true);

      if (timerRef.current) clearInterval(timerRef.current);

      Alert.alert("성공", result.message);
    } catch (error: any) {
      if (error instanceof VerifyEmailError) {
        Alert.alert(
          "인증 실패",
          error.message || "인증 코드가 일치하지 않거나 만료되었습니다.",
        );
        return;
      }

      Alert.alert("에러", error.message || "인증 코드 확인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (
      !email.trim() ||
      !authCode.trim() ||
      !password ||
      !passwordConfirm ||
      !nickname.trim()
    ) {
      Alert.alert("알림", "모든 정보를 입력해주세요.");
      return;
    }

    if (!isVerified) {
      Alert.alert("알림", "이메일 인증을 완료해주세요.");
      return;
    }

    if (!passwordRegex.test(password)) {
      Alert.alert("알림", "비밀번호 조건을 모두 충족해주세요.");
      return;
    }

    if (password !== passwordConfirm) {
      Alert.alert("알림", "비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      setLoading(true);

      const result = await requestSignup({
        email: email.trim(),
        password,
        nickname: nickname.trim(),
      });

      console.log("회원가입 성공:", result);

      Alert.alert("성공", result.message, [
        {
          text: "확인",
          onPress: () => navigation.navigate("Main"),
        },
      ]);
    } catch (error: any) {
      Alert.alert("가입 실패", error.message || "다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>회원가입</Text>

          <Text style={styles.label}>이메일</Text>
          <View style={styles.inputRow}>
            <TextInput
              placeholder="example@planb.com"
              style={[styles.input, styles.flexInput]}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              textContentType="emailAddress"
              editable={!isVerified && !isSending}
            />

            <TouchableOpacity
              style={styles.inlineButton}
              onPress={handleRequestAuthCode}
              disabled={isSending || loading}
            >
              {isSending ?
                <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.inlineButtonText}>
                  {isEmailSent ? "재발송" : "인증"}
                </Text>
              }
            </TouchableOpacity>
          </View>

          {isEmailSent && (
            <View style={{ marginTop: 10 }}>
              <View style={styles.authCodeRow}>
                <Text style={styles.label}>인증 번호</Text>

                {!isVerified && (
                  <Text
                    style={[styles.timer, timer === 0 && styles.timerExpired]}
                  >
                    {timer === 0 ? "만료됨" : formatTimer(timer)}
                  </Text>
                )}

                {isVerified && (
                  <Text style={styles.timerVerified}>인증 완료 ✓</Text>
                )}
              </View>

              <OtpInput
                value={authCode}
                onChange={setAuthCode}
                isVerified={isVerified}
                isExpired={timer === 0}
              />

              {!isVerified && (
                <TouchableOpacity
                  style={[
                    styles.verifyButton,
                    (timer === 0 || loading) && styles.verifyButtonDisabled,
                  ]}
                  onPress={handleVerifyCode}
                  disabled={timer === 0 || loading}
                >
                  {loading ?
                    <ActivityIndicator color="#fff" />
                  : <Text style={styles.verifyButtonText}>인증 확인</Text>}
                </TouchableOpacity>
              )}

              {timer === 0 && !isVerified && (
                <Text style={styles.expiredText}>
                  인증 시간이 만료되었습니다. 재발송해주세요.
                </Text>
              )}
            </View>
          )}

          <Text style={styles.label}>비밀번호</Text>
          <TextInput
            placeholder="비밀번호를 입력하세요"
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            autoCorrect={false}
            autoCapitalize="none"
            textContentType="newPassword"
          />

          {password.length > 0 && (
            <View style={styles.passwordHintList}>
              {passwordConditions.map((condition) => {
                const passed = condition.test(password);

                return (
                  <View key={condition.label} style={styles.passwordHintRow}>
                    <Text
                      style={[
                        styles.passwordHintIcon,
                        { color: passed ? "#16A34A" : "#EF4444" },
                      ]}
                    >
                      {passed ? "✓" : "✗"}
                    </Text>
                    <Text
                      style={[
                        styles.passwordHintText,
                        { color: passed ? "#16A34A" : "#EF4444" },
                      ]}
                    >
                      {condition.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          <Text style={styles.label}>비밀번호 확인</Text>
          <TextInput
            placeholder="비밀번호를 한 번 더 입력하세요"
            secureTextEntry
            style={[
              styles.input,
              passwordConfirm.length > 0 && password !== passwordConfirm ?
                styles.inputError
              : null,
            ]}
            value={passwordConfirm}
            onChangeText={setPasswordConfirm}
            autoCorrect={false}
            autoCapitalize="none"
            textContentType="newPassword"
          />

          <Text style={styles.label}>닉네임</Text>
          <TextInput
            placeholder="닉네임을 입력하세요"
            style={styles.input}
            value={nickname}
            onChangeText={setNickname}
            autoCorrect={false}
            textContentType="nickname"
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ?
              <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>가입하기</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>
              이미 계정이 있나요? 로그인
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  scrollContent: { padding: 24, paddingTop: 40 },
  formContainer: { width: "100%" },

  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 20,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 8,
    marginTop: 15,
  },

  authCodeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  timer: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2563EB",
    marginTop: 15,
  },

  timerExpired: {
    color: "#EF4444",
  },

  timerVerified: {
    fontSize: 14,
    fontWeight: "600",
    color: "#16A34A",
    marginTop: 15,
  },

  expiredText: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: 6,
  },

  inputRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },

  flexInput: {
    flex: 1,
  },

  input: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: "#1E293B",
  },

  inputError: {
    borderColor: "#EF4444",
  },

  inlineButton: {
    backgroundColor: "#2563EB",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    justifyContent: "center",
    minWidth: 80,
  },

  inlineButtonText: {
    color: "#fff",
    fontWeight: "700",
    textAlign: "center",
  },

  verifyButton: {
    backgroundColor: "#2563EB",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    marginTop: 10,
  },

  verifyButtonDisabled: {
    backgroundColor: "#94A3B8",
  },

  verifyButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },

  passwordHintList: {
    marginTop: 8,
    gap: 4,
  },

  passwordHintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  passwordHintIcon: {
    fontSize: 12,
  },

  passwordHintText: {
    fontSize: 12,
  },

  button: {
    backgroundColor: "#2563EB",
    padding: 18,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 30,
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  backButton: {
    marginTop: 20,
    marginBottom: 40,
    alignItems: "center",
  },

  backButtonText: {
    color: "#64748B",
    textDecorationLine: "underline",
  },
});
