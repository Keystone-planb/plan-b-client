import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import EmailVerificationSection from "../components/signup/EmailVerificationSection";
import PasswordSection from "../components/signup/PasswordSection";
import SignupFooter from "../components/signup/SignupFooter";
import { useSignupForm } from "../hooks/useSignupForm";

type Props = {
  navigation: any;
};

export default function SignUpScreen({ navigation }: Props) {
  const form = useSignupForm({ navigation });

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

            <EmailVerificationSection
              email={form.email}
              authCode={form.authCode}
              trimmedEmail={form.trimmedEmail}
              isEmailValid={form.isEmailValid}
              isBusy={form.isBusy}
              isVerified={form.isVerified}
              isSending={form.isSending}
              isVerifying={form.isVerifying}
              isEmailSent={form.isEmailSent}
              timer={form.timer}
              verifyErrorMessage={form.verifyErrorMessage}
              canRequestCode={form.canRequestCode}
              canVerifyCode={form.canVerifyCode}
              requestCodeButtonText={form.getRequestCodeButtonText()}
              formatTimer={form.formatTimer}
              onEmailChange={form.handleEmailChange}
              onAuthCodeChange={form.handleAuthCodeChange}
              onRequestAuthCode={form.handleRequestAuthCode}
              onVerifyCode={form.handleVerifyCode}
            />

            <View style={styles.fieldBlock}>
              <Text style={styles.label}>닉네임</Text>

              <TextInput
                placeholder="닉네임을 입력하세요"
                placeholderTextColor="#8C9BB1"
                style={styles.textInput}
                value={form.nickname}
                onChangeText={form.setNickname}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={20}
                returnKeyType="next"
                editable={!form.loading}
              />

              {!!form.trimmedNickname && !form.isNicknameValid && (
                <Text style={styles.errorText}>
                  닉네임은 2자 이상 입력해주세요.
                </Text>
              )}
            </View>

            <PasswordSection
              password={form.password}
              passwordConfirm={form.passwordConfirm}
              isPasswordVisible={form.isPasswordVisible}
              isPasswordConfirmVisible={form.isPasswordConfirmVisible}
              isPasswordMatched={form.isPasswordMatched}
              loading={form.loading}
              onPasswordChange={form.setPassword}
              onPasswordConfirmChange={form.setPasswordConfirm}
              onTogglePasswordVisible={() =>
                form.setIsPasswordVisible((prev) => !prev)
              }
              onTogglePasswordConfirmVisible={() =>
                form.setIsPasswordConfirmVisible((prev) => !prev)
              }
              onSubmitEditing={form.handleSignup}
            />

            <SignupFooter
              loading={form.loading}
              onSignup={form.handleSignup}
              onGoLogin={() => navigation.goBack()}
            />
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

  errorText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 8,
    marginLeft: 2,
  },
});
