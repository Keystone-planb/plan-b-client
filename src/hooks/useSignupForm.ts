import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Platform } from "react-native";

import {
  requestEmailCode,
  RequestEmailCodeError,
} from "../../api/auth/email/request";
import { verifyEmailCode, VerifyEmailError } from "../../api/auth/email/verify";
import { requestSignup } from "../../api/users/signup";

type UseSignupFormParams = {
  navigation: any;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

export function useSignupForm({ navigation }: UseSignupFormParams) {
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

  const handleEmailChange = (text: string) => {
    setEmail(text);
    resetEmailVerification();
  };

  const handleAuthCodeChange = (text: string) => {
    const onlyNumber = text.replace(/[^0-9]/g, "");

    setAuthCode(onlyNumber);
    setVerifyErrorMessage("");
  };

  const getRequestCodeButtonText = () => {
    if (isSending) return "";
    if (resendCooldown > 0) return `${resendCooldown}초`;
    if (isEmailSent) return "재전송";

    return "인증전송";
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
      
      const message =
        error instanceof Error ? error.message : "회원가입에 실패했습니다.";

      Alert.alert("가입 실패", message);
    } finally {
      setLoading(false);
    }
  };

  return {
    email,
    authCode,
    nickname,
    password,
    passwordConfirm,

    loading,
    isSending,
    isVerifying,
    isEmailSent,
    isVerified,
    timer,
    resendCooldown,
    verifyErrorMessage,

    isPasswordVisible,
    isPasswordConfirmVisible,

    trimmedEmail,
    trimmedNickname,
    isEmailValid,
    isNicknameValid,
    isPasswordValid,
    isPasswordMatched,
    isBusy,
    canRequestCode,
    canVerifyCode,
    canSubmit,

    setNickname,
    setPassword,
    setPasswordConfirm,
    setIsPasswordVisible,
    setIsPasswordConfirmVisible,

    formatTimer,
    getRequestCodeButtonText,
    handleEmailChange,
    handleAuthCodeChange,
    handleRequestAuthCode,
    handleVerifyCode,
    handleSignup,
  };
}

export type SignupFormState = ReturnType<typeof useSignupForm>;
