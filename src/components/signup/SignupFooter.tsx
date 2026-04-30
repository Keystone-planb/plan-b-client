import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  loading: boolean;
  onSignup: () => void;
  onGoLogin: () => void;
};

export default function SignupFooter({ loading, onSignup, onGoLogin }: Props) {
  return (
    <>
      <TouchableOpacity
        style={[styles.signupButton, loading && styles.disabledButton]}
        onPress={onSignup}
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
          onPress={onGoLogin}
          activeOpacity={0.8}
          disabled={loading}
        >
          <Text style={styles.loginButtonText}>로그인하기</Text>
          <Text style={styles.loginArrow}>›</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
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
