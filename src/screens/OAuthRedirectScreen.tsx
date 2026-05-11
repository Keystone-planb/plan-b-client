import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Linking from "expo-linking";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  getOAuthFailureMessage,
  handleOAuthSuccessUrl,
  isOAuthFailureUrl,
  isOAuthSuccessUrl,
  saveOAuthTokens,
} from "../utils/authToken";
import {
  requestSocialTokenLogin,
  SocialProvider,
} from "../../api/auth/social";

type Props = {
  navigation: any;
};

export default function OAuthRedirectScreen({ navigation }: Props) {
  const handledRef = useRef(false);

  const moveToMain = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: "Main" }],
    });
  };

  const moveToLogin = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: "Login" }],
    });
  };

  const getRedirectParam = (url: string, key: string) => {
    try {
      const parsedUrl = new URL(url);
      const queryValue = parsedUrl.searchParams.get(key);

      if (queryValue) return queryValue;

      const hash = parsedUrl.hash.startsWith("#") ?
        parsedUrl.hash.slice(1)
      : parsedUrl.hash;
      const hashParams = new URLSearchParams(hash);

      return hashParams.get(key);
    } catch {
      const queryString = url.split("?")[1] ?? "";
      const params = new URLSearchParams(queryString);
      return params.get(key);
    }
  };

  const getRedirectProvider = (url: string): SocialProvider | null => {
    const provider = getRedirectParam(url, "provider");

    return provider === "kakao" || provider === "google" ? provider : null;
  };

  const handleSocialTokenRedirect = async (url: string) => {
    const provider = getRedirectProvider(url);
    const oauthToken =
      getRedirectParam(url, "oauth_token") ||
      getRedirectParam(url, "oauthToken");

    if (!provider || !oauthToken) return false;

    const result = await requestSocialTokenLogin(provider, oauthToken);

    await saveOAuthTokens({
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
      userId: result.user_id ? String(result.user_id) : undefined,
      nickname: result.nickname,
    });

    return true;
  };

  const handleUrl = async (url: string | null) => {
    if (!url || handledRef.current) return;

    handledRef.current = true;

    if (__DEV__) {
      console.log("[OAuthRedirect] received url:", { isSuccess: isOAuthSuccessUrl(url), isFailure: isOAuthFailureUrl(url) });
    }

    try {
      if (isOAuthFailureUrl(url)) {
        const message = getOAuthFailureMessage(url);
        Alert.alert("로그인 실패", message);
        moveToLogin();
        return;
      }

      if (isOAuthSuccessUrl(url)) {
        const handledByTokenExchange = await handleSocialTokenRedirect(url);

        if (handledByTokenExchange) {
          moveToMain();
          return;
        }

        await handleOAuthSuccessUrl(url);
        moveToMain();
        return;
      }

      Alert.alert("로그인 실패", "알 수 없는 소셜 로그인 응답입니다.");
      moveToLogin();
    } catch (error) {
      const message =
        error instanceof Error ?
          error.message
        : "소셜 로그인 처리 중 오류가 발생했습니다.";

      Alert.alert("로그인 실패", message);
      moveToLogin();
    }
  };

  useEffect(() => {
    const run = async () => {
      if (Platform.OS === "web" && typeof window !== "undefined") {
        await handleUrl(window.location.href);
        return;
      }

      const initialUrl = await Linking.getInitialURL();
      await handleUrl(initialUrl);
    };

    run();

    const subscription = Linking.addEventListener("url", ({ url }) => {
      handleUrl(url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2F6BFF" />
        <Text style={styles.title}>소셜 로그인 처리 중</Text>
        <Text style={styles.description}>잠시만 기다려주세요.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  description: {
    marginTop: 8,
    fontSize: 14,
    color: "#6B7280",
  },
});
