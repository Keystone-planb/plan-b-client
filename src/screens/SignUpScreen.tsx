import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { Ionicons } from "@expo/vector-icons";

import {
  requestEmailCode,
  RequestEmailCodeError,
} from "../../api/auth/email/request";
import { verifyEmailCode, VerifyEmailError } from "../../api/auth/email/verify";
import { requestSignup } from "../../api/users/signup";

type Props = {
  navigation: any;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

export default function SignUpScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [authCode, setAuthCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const [loading, setLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const [timer, setTimer] = useState(180);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verifyErrorMessage, setVerifyErrorMessage] = useState("");

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isPasswordConfirmVisible, setIsPasswordConfirmVisible] =
    useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resendTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const trimmedEmail = email.trim();
  const trimmedNickname = nickname.trim();
  const trimmedAuthCode = authCode.trim();

  const isEmailValid = EMAIL_REGEX.test(trimmedEmail);
  const isNicknameValid = trimmedNickname.length >= 2;
  const isPasswordValid = PASSWORD_REGEX.test(password);
  const isPasswordMatched =
    password.length > 0 &&
    passwordConfirm.length > 0 &&
    password === passwordConfirm;

  const isBusy = loading || isSending || isVerifying;

  const canRequestCode =
    isEmailValid &&
    !loading &&
    !isSending &&
    !isVerified &&
    resendCooldown === 0;

  const canVerifyCode =
    isEmailSent &&
    !isVerified &&
    trimmedAuthCode.length === 6 &&
    timer > 0 &&
    !loading &&
    !isVerifying;

  const canSubmit = useMemo(() => {
    return (
      isEmailValid &&
      isEmailSent &&
      isVerified &&
      isNicknameValid &&
      isPasswordValid &&
      isPasswordMatched &&
      !isBusy
    );
  }, [
    isEmailValid,
    isEmailSent,
    isVerified,
    isNicknameValid,
    isPasswordValid,
    isPasswordMatched,
    isBusy,
  ]);

  const formatTimer = (seconds: number) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");

    return `${m}:${s}`;
  };

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const clearResendTimer = () => {
    if (resendTimerRef.current) {
      clearInterval(resendTimerRef.current);
      resendTimerRef.current = null;
    }
  };

  const startTimer = (seconds: number = 180) => {
    clearTimer();
    setTimer(seconds);

    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearTimer();
          return 0;
        }

        return prev - 1;
      });
    }, 1000);
  };

  const startResendCooldown = (seconds: number = 60) => {
    clearResendTimer();
    setResendCooldown(seconds);

    resendTimerRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearResendTimer();
          return 0;
        }

        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      clearTimer();
      clearResendTimer();
    };
  }, []);

  const resetEmailVerification = () => {
    setIsVerified(false);
    setIsEmailSent(false);
    setAuthCode("");
    setVerifyErrorMessage("");
    setTimer(180);
    setResendCooldown(0);
    clearTimer();
    clearResendTimer();
  };

  const handleRequestAuthCode = async () => {
    if (!trimmedEmail) {
      Alert.alert("알림", "이메일을 입력해주세요.");
      return;
    }

    if (!isEmailValid) {
      Alert.alert("알림", "올바른 이메일 형식으로 입력해주세요.");
      return;
    }

    if (resendCooldown > 0) {
      Alert.alert(
        "알림",
        `${resendCooldown}초 후 인증번호를 다시 전송할 수 있습니다.`,
      );
      return;
    }

    try {
      setIsSending(true);
      setIsVerified(false);
      setAuthCode("");
      setVerifyErrorMessage("");

      const result = await requestEmailCode({
        email: trimmedEmail,
      });

      setIsEmailSent(true);
      startTimer(180);
      startResendCooldown(60);

      Alert.alert(
        "인증번호 발송",
        result.message || "인증번호가 이메일로 발송되었습니다.",
      );
    } catch (error: unknown) {
      console.log("인증 코드 발송 실패:", error);

      const message =
        error instanceof RequestEmailCodeError || error instanceof Error ?
          error.message
        : "인증번호 발송에 실패했습니다.";

      Alert.alert("인증번호 발송 실패", message);
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!trimmedEmail) {
      Alert.alert("알림", "이메일을 입력해주세요.");
      return;
    }

    if (!isEmailValid) {
      Alert.alert("알림", "올바른 이메일 형식으로 입력해주세요.");
      return;
    }

    if (trimmedAuthCode.length !== 6) {
      const message = "6자리 인증번호를 입력해주세요.";
      setVerifyErrorMessage(message);
      Alert.alert("알림", message);
      return;
    }

    if (timer === 0) {
      const message = "인증 시간이 만료되었습니다. 다시 전송해주세요.";
      setVerifyErrorMessage(message);
      Alert.alert("알림", message);
      return;
    }

    try {
      setIsVerifying(true);
      setVerifyErrorMessage("");

      const result = await verifyEmailCode({
        email: trimmedEmail,
        code: trimmedAuthCode,
      });

      setIsVerified(true);
      setVerifyErrorMessage("");
      clearTimer();

      Alert.alert(
        "인증 완료",
        result.message || "이메일 인증이 완료되었습니다.",
      );
    } catch (error: unknown) {
      console.log("인증 코드 검증 실패:", error);

      const message =
        error instanceof VerifyEmailError || error instanceof Error ?
          error.message
        : "인증 코드가 일치하지 않거나 만료되었습니다.";

      setVerifyErrorMessage(message);
      Alert.alert("인증 실패", message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSignup = async () => {
    if (loading) return;

    console.log("[회원가입 버튼 클릭]", {
      email: trimmedEmail,
      isEmailValid,
      isEmailSent,
      isVerified,
      nickname: trimmedNickname,
      isNicknameValid,
      passwordLength: password.length,
      isPasswordValid,
      passwordConfirmLength: passwordConfirm.length,
      isPasswordMatched,
      loading,
      isSending,
      isVerifying,
      canSubmit,
    });

    if (!trimmedEmail || !trimmedNickname || !password || !passwordConfirm) {
      Alert.alert("알림", "모든 정보를 입력해주세요.");
      return;
    }

    if (!isEmailValid) {
      Alert.alert("알림", "올바른 이메일 형식으로 입력해주세요.");
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

    if (!isNicknameValid) {
      Alert.alert("알림", "닉네임은 2자 이상 입력해주세요.");
      return;
    }

    if (!isPasswordValid) {
      Alert.alert(
        "알림",
        "비밀번호는 8자 이상, 대문자/소문자/숫자/특수문자를 모두 포함해야 합니다.",
      );
      return;
    }

    if (!isPasswordMatched) {
      Alert.alert("알림", "비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      setLoading(true);

      const result = await requestSignup({
        email: trimmedEmail,
        password,
        nickname: trimmedNickname,
      });

      console.log("[회원가입 성공]", result);

      const successMessage = result.message || "회원가입이 완료되었습니다.";

      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.alert(successMessage);
        navigation.replace("Login");
        return;
      }

      Alert.alert("회원가입 완료", successMessage, [
        {
          text: "확인",
          onPress: () => navigation.replace("Login"),
        },
      ]);
    } catch (error: unknown) {
      console.log("회원가입 실패:", error);

      const message =
        error instanceof Error ? error.message : "회원가입에 실패했습니다.";

      Alert.alert("가입 실패", message);
    } finally {
      setLoading(false);
    }
  };

  const renderPasswordRule = (
    label: string,
    active: boolean,
    touched: boolean,
  ) => {
    const color =
      !touched ? "#94A3B8"
      : active ? "#16A34A"
      : "#EF4444";
    const iconName = active ? "checkmark-circle" : "ellipse-outline";

    return (
      <View style={styles.ruleRow}>
        <Ionicons name={iconName} size={14} color={color} />
        <Text style={[styles.ruleText, { color }]}>{label}</Text>
      </View>
    );
  };

  const getRequestCodeButtonText = () => {
    if (isSending) return "";
    if (resendCooldown > 0) return `${resendCooldown}초`;
    if (isEmailSent) return "재전송";

    return "인증전송";
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
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
            <View style={styles.header}>
              <Text style={styles.logoText}>Plan.B</Text>
              <Text style={styles.logoSubText}>더 스마트한 여행의 시작</Text>
              <Text style={styles.title}>회원가입</Text>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.label}>이메일</Text>

              <View
                style={[styles.inlineField, isVerified && styles.verifiedField]}
              >
                <TextInput
                  placeholder="example@planb.com"
                  placeholderTextColor="#8C9BB1"
                  style={styles.inlineInput}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    resetEmailVerification();
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  returnKeyType="next"
                  editable={!isBusy && !isVerified}
                />

                <TouchableOpacity
                  style={[
                    styles.inlineButton,
                    !canRequestCode && styles.disabledButton,
                  ]}
                  onPress={handleRequestAuthCode}
                  disabled={!canRequestCode}
                  activeOpacity={0.85}
                >
                  {isSending ?
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  : <Text style={styles.inlineButtonText}>
                      {getRequestCodeButtonText()}
                    </Text>
                  }
                </TouchableOpacity>
              </View>

              {!!trimmedEmail && !isEmailValid && (
                <Text style={styles.errorText}>
                  올바른 이메일 형식으로 입력해주세요.
                </Text>
              )}

              {isVerified && (
                <Text style={styles.successText}>이메일 인증 완료</Text>
              )}
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.label}>인증번호</Text>

              <View style={styles.inlineField}>
                <TextInput
                  placeholder="6자리 인증번호"
                  placeholderTextColor="#8C9BB1"
                  style={styles.inlineInput}
                  value={authCode}
                  onChangeText={(text) => {
                    const onlyNumber = text.replace(/[^0-9]/g, "");
                    setAuthCode(onlyNumber);
                    setVerifyErrorMessage("");
                  }}
                  keyboardType="number-pad"
                  maxLength={6}
                  editable={
                    !loading && !isVerifying && isEmailSent && !isVerified
                  }
                />

                <TouchableOpacity
                  style={[
                    styles.inlineButton,
                    !canVerifyCode && styles.disabledButton,
                  ]}
                  onPress={handleVerifyCode}
                  disabled={!canVerifyCode}
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
                <Text style={timer > 0 ? styles.timerText : styles.errorText}>
                  {timer > 0 ?
                    `남은 시간 ${formatTimer(timer)}`
                  : "인증 시간이 만료되었습니다. 다시 전송해주세요."}
                </Text>
              )}

              {!!verifyErrorMessage && !isVerified && (
                <Text style={styles.errorText}>{verifyErrorMessage}</Text>
              )}
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.label}>닉네임</Text>

              <TextInput
                placeholder="닉네임을 입력하세요"
                placeholderTextColor="#8C9BB1"
                style={styles.textInput}
                value={nickname}
                onChangeText={setNickname}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={20}
                returnKeyType="next"
                editable={!loading}
              />

              {!!trimmedNickname && !isNicknameValid && (
                <Text style={styles.errorText}>
                  닉네임은 2자 이상 입력해주세요.
                </Text>
              )}
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.label}>비밀번호</Text>

              <View style={styles.passwordField}>
                <TextInput
                  placeholder="비밀번호를 입력하세요"
                  placeholderTextColor="#8C9BB1"
                  secureTextEntry={!isPasswordVisible}
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="newPassword"
                  returnKeyType="next"
                  editable={!loading}
                />

                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setIsPasswordVisible((prev) => !prev)}
                  activeOpacity={0.7}
                  disabled={loading}
                >
                  <Ionicons
                    name={isPasswordVisible ? "eye" : "eye-off"}
                    size={20}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.passwordRules}>
                {renderPasswordRule(
                  "8자 이상",
                  password.length >= 8,
                  !!password,
                )}
                {renderPasswordRule(
                  "대문자 포함",
                  /[A-Z]/.test(password),
                  !!password,
                )}
                {renderPasswordRule(
                  "소문자 포함",
                  /[a-z]/.test(password),
                  !!password,
                )}
                {renderPasswordRule(
                  "숫자 포함",
                  /\d/.test(password),
                  !!password,
                )}
                {renderPasswordRule(
                  "특수문자 포함",
                  /[^A-Za-z\d]/.test(password),
                  !!password,
                )}
              </View>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.label}>비밀번호 확인</Text>

              <View style={styles.passwordField}>
                <TextInput
                  placeholder="비밀번호를 다시 입력하세요"
                  placeholderTextColor="#8C9BB1"
                  secureTextEntry={!isPasswordConfirmVisible}
                  style={styles.passwordInput}
                  value={passwordConfirm}
                  onChangeText={setPasswordConfirm}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="newPassword"
                  returnKeyType="done"
                  editable={!loading}
                  onSubmitEditing={handleSignup}
                />

                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setIsPasswordConfirmVisible((prev) => !prev)}
                  activeOpacity={0.7}
                  disabled={loading}
                >
                  <Ionicons
                    name={isPasswordConfirmVisible ? "eye" : "eye-off"}
                    size={20}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </View>

              {!!passwordConfirm && (
                <Text
                  style={
                    isPasswordMatched ? styles.successText : styles.errorText
                  }
                >
                  {isPasswordMatched ?
                    "비밀번호가 일치합니다."
                  : "비밀번호가 일치하지 않습니다."}
                </Text>
              )}
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

  keyboardView: {
    flex: 1,
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
    paddingTop: 48,
  },

  header: {
    marginBottom: 30,
    alignItems: "center",
  },

  logoText: {
    color: "#1C2534",
    fontSize: 48,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 6,
  },

  logoSubText: {
    color: "#627187",
    fontSize: 15,
  },

  title: {
    color: "#1E293B",
    fontSize: 20,
    fontWeight: "800",
    marginTop: 18,
  },

  fieldBlock: {
    alignSelf: "stretch",
    marginBottom: 18,
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

  verifiedField: {
    borderColor: "#86EFAC",
    backgroundColor: "#F0FDF4",
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

  passwordField: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E1E7EF",
    borderRadius: 14,
    borderWidth: 1,
    paddingRight: 12,
  },

  passwordInput: {
    flex: 1,
    color: "#252D3C",
    fontSize: 16,
    paddingVertical: 17,
    paddingLeft: 20,
    paddingRight: 10,
  },

  eyeButton: {
    padding: 8,
  },

  passwordRules: {
    marginTop: 10,
    gap: 5,
  },

  ruleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  ruleText: {
    fontSize: 12,
    fontWeight: "600",
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

  errorText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 8,
    marginLeft: 2,
  },

  signupButton: {
    alignSelf: "stretch",
    alignItems: "center",
    backgroundColor: "#2158E8",
    borderRadius: 14,
    paddingVertical: 17,
    marginTop: 8,
    marginBottom: 34,
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
    opacity: 0.55,
  },
});
