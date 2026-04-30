import React from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  password: string;
  passwordConfirm: string;
  isPasswordVisible: boolean;
  isPasswordConfirmVisible: boolean;
  isPasswordMatched: boolean;
  loading: boolean;
  onPasswordChange: (text: string) => void;
  onPasswordConfirmChange: (text: string) => void;
  onTogglePasswordVisible: () => void;
  onTogglePasswordConfirmVisible: () => void;
  onSubmitEditing: () => void;
};

export default function PasswordSection({
  password,
  passwordConfirm,
  isPasswordVisible,
  isPasswordConfirmVisible,
  isPasswordMatched,
  loading,
  onPasswordChange,
  onPasswordConfirmChange,
  onTogglePasswordVisible,
  onTogglePasswordConfirmVisible,
  onSubmitEditing,
}: Props) {
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

  return (
    <>
      <View style={styles.fieldBlock}>
        <Text style={styles.label}>비밀번호</Text>

        <View style={styles.passwordField}>
          <TextInput
            placeholder="비밀번호를 입력하세요"
            placeholderTextColor="#8C9BB1"
            secureTextEntry={!isPasswordVisible}
            style={styles.passwordInput}
            value={password}
            onChangeText={onPasswordChange}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="newPassword"
            returnKeyType="next"
            editable={!loading}
          />

          <TouchableOpacity
            style={styles.eyeButton}
            onPress={onTogglePasswordVisible}
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
          {renderPasswordRule("8자 이상", password.length >= 8, !!password)}
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
          {renderPasswordRule("숫자 포함", /\d/.test(password), !!password)}
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
            onChangeText={onPasswordConfirmChange}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="newPassword"
            returnKeyType="done"
            editable={!loading}
            onSubmitEditing={onSubmitEditing}
          />

          <TouchableOpacity
            style={styles.eyeButton}
            onPress={onTogglePasswordConfirmVisible}
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
            style={isPasswordMatched ? styles.successText : styles.errorText}
          >
            {isPasswordMatched ?
              "비밀번호가 일치합니다."
            : "비밀번호가 일치하지 않습니다."}
          </Text>
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
});
