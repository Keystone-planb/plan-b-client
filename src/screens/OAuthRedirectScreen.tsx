import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  getOAuthFailureMessage,
  handleOAuthSuccessUrl,
  isOAuthFailureUrl,
  isOAuthSuccessUrl,
} from "../utils/authToken";

type Props = {
  navigation: any;
};

const getCurrentOAuthUrl = async () => {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined" && window.location?.href) {
      return window.location.href;
    }

    return "";
  }

  const initialUrl = await Linking.getInitialURL();
  return initialUrl ?? "";
};

export default function OAuthRedirectScreen({ navigation }: Props) {
  const [message, setMessage] = useState("소셜 로그인 정보를 확인하는 중...");

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        const url = await getCurrentOAuthUrl();

        if (!url) {
          throw new Error("OAuth redirect URL을 확인할 수 없습니다.");
        }

        if (isOAuthFailureUrl(url)) {
          throw new Error(getOAuthFailureMessage(url));
        }

        if (!isOAuthSuccessUrl(url)) {
          throw new Error("OAuth 성공 URL이 아닙니다.");
        }

        await handleOAuthSuccessUrl(url);

        setMessage("소셜 로그인에 성공했습니다.");

        navigation.reset({
          index: 0,
          routes: [{ name: "MainTabs" }],
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ?
            error.message
          : "소셜 로그인 처리 중 오류가 발생했습니다.";

        setMessage(errorMessage);

        Alert.alert("소셜 로그인 실패", errorMessage, [
          {
            text: "확인",
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: "Login" }],
              });
            },
          },
        ]);
      }
    };

    handleRedirect();
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2158E8" />
        <Text style={styles.message}>{message}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7F9FB",
  },

  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  message: {
    marginTop: 18,
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
    textAlign: "center",
    lineHeight: 22,
  },
});
