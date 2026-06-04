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
  route?: any;
};

export default function OAuthRedirectScreen({ navigation, route }: Props) {
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
      accessToken: result.access_token ?? result.accessToken,
      refreshToken: result.refresh_token ?? result.refreshToken,
      userId:
        result.user_id ?? result.userId ?
          String(result.user_id ?? result.userId)
        : undefined,
      nickname: result.nickname,
      email: result.email,
    });

    return true;
  };

  // url로 oauth 결과를 처리했으면 true, 처리할 게 없으면 false를 반환한다.
  const handleUrl = async (url: string | null): Promise<boolean> => {
    if (!url || handledRef.current) return false;

    const isSuccess = isOAuthSuccessUrl(url);
    const isFailure = isOAuthFailureUrl(url);

    if (__DEV__) {
      console.log("[OAuthRedirect] received url:", { isSuccess, isFailure });
    }

    // oauth 리다이렉트가 아닌 url(앱 실행 url 등)은 처리하지 않는다.
    if (!isSuccess && !isFailure) {
      return false;
    }

    handledRef.current = true;

    try {
      if (isFailure) {
        const message = getOAuthFailureMessage(url);
        Alert.alert("로그인 실패", message);
        moveToLogin();
        return true;
      }

      const handledByTokenExchange = await handleSocialTokenRedirect(url);

      if (handledByTokenExchange) {
        moveToMain();
        return true;
      }

      await handleOAuthSuccessUrl(url);
      moveToMain();
      return true;
    } catch (error) {
      const message =
        error instanceof Error ?
          error.message
        : "소셜 로그인 처리 중 오류가 발생했습니다.";

      Alert.alert("로그인 실패", message);
      moveToLogin();
      return true;
    }
  };

  // url에서 결과를 못 얻은 경우(예: WebBrowser 플로우에서 LoginScreen이 이미 로그인을
  // 처리했고, 딥링크로 이 화면만 떴을 때) 라우트 파라미터(result)로 화면을 전환해
  // 스피너에 멈추지 않도록 한다.
  const resolveByRouteParam = () => {
    if (handledRef.current) return;
    handledRef.current = true;

    const result = route?.params?.result;

    if (result === "failure") {
      Alert.alert("로그인 실패", "소셜 로그인에 실패했습니다.");
      moveToLogin();
      return;
    }

    // success 또는 파라미터 없음 → 메인으로 이동(실제 로그인은 이미 처리됨)
    moveToMain();
  };

  useEffect(() => {
    const run = async () => {
      if (Platform.OS === "web" && typeof window !== "undefined") {
        const handled = await handleUrl(window.location.href);
        if (!handled) resolveByRouteParam();
        return;
      }

      const initialUrl = await Linking.getInitialURL();
      const handled = await handleUrl(initialUrl);
      if (!handled) resolveByRouteParam();
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
