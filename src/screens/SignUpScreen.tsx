import React, { useState } from "react";
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

import { requestSignup } from "../../api/users/signup";

export default function SignUpScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState(""); // [추가] 비밀번호 확인 상태
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    // 1. 빈 칸 검사
    if (!email || !password || !passwordConfirm || !nickname) {
      Alert.alert("알림", "모든 정보를 입력해주세요.");
      return;
    }

    // 2. [추가] 비밀번호 일치 검사
    if (password !== passwordConfirm) {
      Alert.alert("알림", "비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);

    try {
      const result = await requestSignup(email, password, nickname);

      console.log("회원가입 성공:", result);
      Alert.alert("성공", "회원가입이 완료되었습니다!", [
        { text: "확인", onPress: () => navigation.navigate("Login") },
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

          {/* 이메일 입력 */}
          <Text style={styles.label}>이메일</Text>
          <TextInput
            placeholder="example@planb.com"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          {/* 비밀번호 입력 */}
          <Text style={styles.label}>비밀번호</Text>
          <TextInput
            placeholder="비밀번호를 입력하세요"
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />

          {/* [추가] 비밀번호 확인 입력 */}
          <Text style={styles.label}>비밀번호 확인</Text>
          <TextInput
            placeholder="비밀번호를 한 번 더 입력하세요"
            secureTextEntry
            style={[
              styles.input,
              // 비밀번호가 입력되었고, 두 값이 다를 때 테두리 색상 변경 (옵션)
              passwordConfirm.length > 0 && password !== passwordConfirm ?
                styles.inputError
              : null,
            ]}
            value={passwordConfirm}
            onChangeText={setPasswordConfirm}
          />

          {/* 닉네임 입력 */}
          <Text style={styles.label}>닉네임</Text>
          <TextInput
            placeholder="닉네임을 입력하세요"
            style={styles.input}
            value={nickname}
            onChangeText={setNickname}
          />

          {/* 가입 버튼 */}
          <TouchableOpacity
            style={styles.button}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ?
              <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>가입하기</Text>}
          </TouchableOpacity>

          {/* 로그인으로 돌아가기 */}
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
    borderColor: "#EF4444", // 비밀번호가 다를 때 빨간 테두리
  },
  button: {
    backgroundColor: "#2563EB",
    padding: 18,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 30,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  backButton: { marginTop: 20, marginBottom: 40, alignItems: "center" },
  backButtonText: { color: "#64748B", textDecorationLine: "underline" },
});
