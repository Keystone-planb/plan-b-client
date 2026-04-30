import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  email: string;
  authCode: string;
  trimmedEmail: string;
  isEmailValid: boolean;
  isBusy: boolean;
  isVerified: boolean;
  isSending: boolean;
  isVerifying: boolean;
  isEmailSent: boolean;
  timer: number;
  verifyErrorMessage: string;
  canRequestCode: boolean;
  canVerifyCode: boolean;
  requestCodeButtonText: string;
  formatTimer: (seconds: number) => string;
  onEmailChange: (text: string) => void;
  onAuthCodeChange: (text: string) => void;
  onRequestAuthCode: () => void;
  onVerifyCode: () => void;
};

export default function EmailVerificationSection({
  email,
  authCode,
  trimmedEmail,
  isEmailValid,
  isBusy,
  isVerified,
  isSending,
  isVerifying,
  isEmailSent,
  timer,
  verifyErrorMessage,
  canRequestCode,
  canVerifyCode,
  requestCodeButtonText,
  formatTimer,
  onEmailChange,
  onAuthCodeChange,
  onRequestAuthCode,
  onVerifyCode,
}: Props) {
  return (
    <>
      <View style={styles.fieldBlock}>
        <Text style={styles.label}>이메일</Text>

        <View style={[styles.inlineField, isVerified && styles.verifiedField]}>
          <TextInput
            placeholder="example@planb.com"
            placeholderTextColor="#8C9BB1"
            style={styles.inlineInput}
            value={email}
            onChangeText={onEmailChange}
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
            onPress={onRequestAuthCode}
            disabled={!canRequestCode}
            activeOpacity={0.85}
          >
            {isSending ?
              <ActivityIndicator color="#FFFFFF" size="small" />
            : <Text style={styles.inlineButtonText}>
                {requestCodeButtonText}
              </Text>
            }
          </TouchableOpacity>
        </View>

        {!!trimmedEmail && !isEmailValid && (
          <Text style={styles.errorText}>
            올바른 이메일 형식으로 입력해주세요.
          </Text>
        )}

        {isVerified && <Text style={styles.successText}>이메일 인증 완료</Text>}
      </View>

      <View style={styles.fieldBlock}>
        <Text style={styles.label}>인증번호</Text>

        <View style={styles.inlineField}>
          <TextInput
            placeholder="6자리 인증번호"
            placeholderTextColor="#8C9BB1"
            style={styles.inlineInput}
            value={authCode}
            onChangeText={onAuthCodeChange}
            keyboardType="number-pad"
            maxLength={6}
            editable={!isVerifying && isEmailSent && !isVerified}
          />

          <TouchableOpacity
            style={[
              styles.inlineButton,
              !canVerifyCode && styles.disabledButton,
            ]}
            onPress={onVerifyCode}
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
    </>
  );
}

const styles = StyleSheet.create({
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

  disabledButton: {
    opacity: 0.55,
  },
});
