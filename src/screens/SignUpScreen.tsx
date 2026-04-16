import React, { useEffect, useRef, useState } from "react";
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  requestEmailCode,
  RequestEmailCodeError,
} from "../../api/auth/email/request";
import { verifyEmailCode, VerifyEmailError } from "../../api/auth/email/verify";
import { requestSignup } from "../../api/users/signup";

type Props = {
  navigation: any;
};

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

export default function SignUpScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [authCode, setAuthCode] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const [loading, setLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
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
      setIsEmailSent(false);
      setAuthCode("");

      const result = await requestEmailCode({
        email: email.trim(),
      });

      setIsEmailSent(true);
      startTimer(180);

      Alert.alert("성공", result.message);
    } catch (error: any) {
      console.log("인증 코드 발송 실패:", error);

      if (error instanceof RequestEmailCodeError) {
        Alert.alert(
          "인증번호 발송 실패",
          error.message || "인증번호 발송에 실패했습니다.",
        );
        return;
      }

      Alert.alert("에러", error.message || "인증번호 발송에 실패했습니다.");
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!email.trim()) {
      Alert.alert("알림", "이메일을 입력해주세요.");
      return;
    }

    if (!authCode.trim() || authCode.trim().length < 6) {
      Alert.alert("알림", "6자리 인증번호를 입력해주세요.");
      return;
    }

    if (timer === 0) {
      Alert.alert("알림", "인증 시간이 만료되었습니다. 다시 전송해주세요.");
      return;
    }

    try {
      setIsVerifying(true);

      const result = await verifyEmailCode({
        email: email.trim(),
        code: authCode.trim(),
      });

      setIsVerified(true);

      if (timerRef.current) clearInterval(timerRef.current);

      Alert.alert("성공", result.message);
    } catch (error: any) {
      console.log("인증 코드 검증 실패:", error);

      if (error instanceof VerifyEmailError) {
        Alert.alert(
          "인증 실패",
          error.message || "인증 코드가 일치하지 않거나 만료되었습니다.",
        );
        return;
      }

      Alert.alert("에러", error.message || "인증 확인에 실패했습니다.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSignup = async () => {
    if (!email.trim() || !password || !passwordConfirm) {
      Alert.alert("알림", "모든 정보를 입력해주세요.");
      return;
    }

    if (!isEmailSent) {
      Alert.alert("알림", "먼저 인증번호를 전송해주세요.");
      return;
    }

    if (!isVerified) {
      Alert.alert("알림", "인증번호 확인을 완료해주세요.");
      return;
    }

    if (!passwordRegex.test(password)) {
      Alert.alert(
        "알림",
        "비밀번호는 8자 이상, 대소문자/숫자/특수문자를 포함해야 합니다.",
      );
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
        nickname: email.trim().split("@")[0],
      });

      Alert.alert("성공", result.message || "회원가입이 완료되었습니다.", [
        {
          text: "확인",
          onPress: () => navigation.replace("Login"),
        },
      ]);
    } catch (error: any) {
      console.log("회원가입 실패:", error);
      Alert.alert("가입 실패", error.message || "다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.page}>
            <View style={styles.logoBox}>
              <Text style={styles.logoText}>Plan.B</Text>
              <Text style={styles.logoSubText}>더 스마트한 여행의 시작</Text>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.label}>이메일</Text>
              <View style={styles.inlineField}>
                <TextInput
                  placeholder="example@planb.com"
                  placeholderTextColor="#8C9BB1"
                  style={styles.inlineInput}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setIsVerified(false);
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  editable={!loading && !isSending && !isVerified}
                />
                <TouchableOpacity
                  style={styles.inlineButton}
                  onPress={handleRequestAuthCode}
                  disabled={isSending || loading}
                  activeOpacity={0.85}
                >
                  {isSending ?
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  : <Text style={styles.inlineButtonText}>
                      {isEmailSent ? "재전송" : "인증전송"}
                    </Text>
                  }
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.label}>인증번호</Text>
              <View style={styles.inlineField}>
                <TextInput
                  placeholder="인증번호를 입력하세요"
                  placeholderTextColor="#8C9BB1"
                  style={styles.inlineInput}
                  value={authCode}
                  onChangeText={setAuthCode}
                  keyboardType="number-pad"
                  maxLength={6}
                  editable={
                    !loading && !isVerifying && isEmailSent && !isVerified
                  }
                />
                <TouchableOpacity
                  style={[
                    styles.inlineButton,
                    (!isEmailSent || isVerified) && styles.disabledButton,
                  ]}
                  onPress={handleVerifyCode}
                  disabled={!isEmailSent || isVerified || isVerifying}
                  activeOpacity={0.85}
                >
                  {isVerifying ?
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  : <Text style={styles.inlineButtonText}>
                      {isVerified ? "인증완료" : "인증확인"}
                    </Text>
                  }
                </TouchableOpacity>
              </View>

              {isEmailSent && !isVerified && (
                <Text style={styles.timerText}>
                  {timer > 0 ?
                    `남은 시간 ${formatTimer(timer)}`
                  : "인증 시간이 만료되었습니다. 다시 전송해주세요."}
                </Text>
              )}

              {isVerified && (
                <Text style={styles.successText}>이메일 인증 완료</Text>
              )}
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.label}>비밀번호</Text>
              <TextInput
                placeholder="비밀번호를 입력하세요"
                placeholderTextColor="#8C9BB1"
                secureTextEntry
                style={styles.textInput}
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
                textContentType="newPassword"
                editable={!loading}
              />
            </View>

            <View style={[styles.fieldBlock, { marginBottom: 50 }]}>
              <Text style={styles.label}>비밀번호 확인</Text>
              <TextInput
                placeholder="비밀번호를 다시 입력하세요"
                placeholderTextColor="#8C9BB1"
                secureTextEntry
                style={styles.textInput}
                value={passwordConfirm}
                onChangeText={setPasswordConfirm}
                autoCapitalize="none"
                textContentType="newPassword"
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={[styles.signupButton, loading && styles.disabledButton]}
              onPress={handleSignup}
              disabled={loading}
              activeOpacity={0.9}
            >
              {loading ?
                <ActivityIndicator color="#FFFFFF" />
              : <Text style={styles.signupButtonText}>회원가입</Text>}
            </TouchableOpacity>

            <View style={styles.bottomWrap}>
              <Text style={styles.bottomLabel}>이미 계정이 있으신가요?</Text>
              <TouchableOpacity
                style={styles.loginButton}
                onPress={() => navigation.goBack()}
                activeOpacity={0.8}
                disabled={loading}
              >
                <Text style={styles.loginButtonText}>로그인하기</Text>
                <Text style={styles.loginArrow}>›</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scroll: {
    flex: 1,
    backgroundColor: "#F7F9FB",
  },
  scrollContent: {
    paddingBottom: 48,
  },
  page: {
    alignItems: "center",
    paddingTop: 56,
  },
  logoBox: {
    marginBottom: 34,
    alignItems: "center",
  },
  logoText: {
    color: "#1C2534",
    fontSize: 50,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 9,
    width: 149,
  },
  logoSubText: {
    color: "#627187",
    fontSize: 15,
  },
  fieldBlock: {
    alignSelf: "stretch",
    marginBottom: 20,
    marginHorizontal: 21,
  },
  label: {
    color: "#252D3C",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  inlineField: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E1E7EF",
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  inlineInput: {
    flex: 1,
    color: "#252D3C",
    fontSize: 16,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  inlineButton: {
    backgroundColor: "#2158E8",
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 13,
    minWidth: 80,
    alignItems: "center",
  },
  inlineButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  textInput: {
    color: "#252D3C",
    fontSize: 16,
    backgroundColor: "#FFFFFF",
    borderColor: "#E1E7EF",
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 17,
    paddingHorizontal: 20,
  },
  timerText: {
    color: "#627187",
    fontSize: 12,
    marginTop: 8,
    marginLeft: 2,
  },
  successText: {
    color: "#16A34A",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 8,
    marginLeft: 2,
  },
  signupButton: {
    alignSelf: "stretch",
    alignItems: "center",
    backgroundColor: "#2158E8",
    borderRadius: 14,
    paddingVertical: 17,
    marginBottom: 35,
    marginHorizontal: 21,
    shadowColor: "#2158E84D",
    shadowOpacity: 0.3,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowRadius: 10,
    elevation: 10,
  },
  signupButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  bottomWrap: {
    marginBottom: 48,
    alignItems: "center",
  },
  bottomLabel: {
    color: "#627187",
    fontSize: 14,
    marginBottom: 10,
  },
  loginButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECF5FF",
    borderRadius: 20,
    paddingVertical: 9,
    paddingHorizontal: 42,
  },
  loginButtonText: {
    color: "#2158E8",
    fontSize: 15,
    fontWeight: "700",
    marginRight: 12,
  },
  loginArrow: {
    color: "#2158E8",
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 18,
  },
  disabledButton: {
    opacity: 0.6,
  },
});
