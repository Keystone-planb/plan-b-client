import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Linking from "expo-linking";

import {
  getOAuthFailureMessage,
  handleOAuthSuccessUrl,
  isOAuthFailureUrl,
  isOAuthSuccessUrl,
} from "../utils/authToken";

type Props = {
  navigation: any;
};

export default function OAuthRedirectScreen({ navigation }: Props) {
  const handledRef = useRef(false);

  useEffect(() => {
    const handleRedirect = async () => {
      if (handledRef.current) return;

      handledRef.current = true;

      try {
        const currentUrl =
          Platform.OS === "web" && typeof window !== "undefined" ?
            window.location.href
          : await Linking.getInitialURL();

        console.log("[OAuthRedirectScreen] currentUrl:", currentUrl);

        if (!currentUrl) {
          throw new Error("OAuth redirect URL을 찾을 수 없습니다.");
        }

        if (isOAuthFailureUrl(currentUrl)) {
          throw new Error(getOAuthFailureMessage(currentUrl));
        }

        if (!isOAuthSuccessUrl(currentUrl)) {
          throw new Error("OAuth 성공 URL이 아닙니다.");
        }

        await handleOAuthSuccessUrl(currentUrl);

        console.log("[OAuthRedirectScreen] token saved. move Main");

        navigation.reset({
          index: 0,
          routes: [{ name: "Main" }],
        });
      } catch (error) {
        console.log("[OAuthRedirectScreen] failed:", error);

        navigation.reset({
          index: 0,
          routes: [{ name: "Login" }],
        });
      }
    };

    handleRedirect();
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color="#2158E8" />
        <Text style={styles.title}>소셜 로그인 처리 중...</Text>
        <Text style={styles.description}>잠시만 기다려주세요.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F9FB",
  },

  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  title: {
    marginTop: 18,
    color: "#1E293B",
    fontSize: 18,
    fontWeight: "900",
  },

  description: {
    marginTop: 8,
    color: "#64748B",
    fontSize: 14,
    fontWeight: "700",
  },
});
