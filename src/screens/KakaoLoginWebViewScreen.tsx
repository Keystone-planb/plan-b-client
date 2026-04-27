import React, { useRef } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import WebView from "react-native-webview";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  extractOAuthErrorFromUrl,
  extractSocialTokensFromUrl,
  isOAuthFailureUrl,
  isOAuthSuccessUrl,
} from "../utils/authToken";

type Props = {
  navigation: any;
  route: {
    params: {
      authUrl: string;
      redirectUri: string;
    };
  };
};

export default function KakaoLoginWebViewScreen({ navigation, route }: Props) {
  const handledRef = useRef(false);
  const { authUrl, redirectUri } = route.params;

  const handleUrl = async (url: string) => {
    if (handledRef.current) return;

    console.log("[카카오 WebView URL]", url);

    /**
     * 백엔드가 최종적으로 내려주는 OAuth redirect URL만 처리한다.
     *
     * 성공:
     * planb://oauth/success?access_token=...&refresh_token=...&user_id=1&nickname=태형
     *
     * 실패:
     * planb://oauth/failure?error=소셜+로그인에+실패했습니다.
     */
    if (!isOAuthSuccessUrl(url) && !isOAuthFailureUrl(url)) {
      return;
    }

    handledRef.current = true;

    if (isOAuthFailureUrl(url)) {
      const errorMessage = extractOAuthErrorFromUrl(url);

      Alert.alert(
        "카카오 로그인 실패",
        errorMessage ?? "소셜 로그인에 실패했습니다.",
      );

      navigation.goBack();
      return;
    }

    const { accessToken, refreshToken, userId, nickname } =
      extractSocialTokensFromUrl(url);

    if (!accessToken || !refreshToken) {
      Alert.alert(
        "카카오 로그인 실패",
        "로그인은 완료됐지만 앱으로 토큰이 전달되지 않았습니다.",
      );

      navigation.goBack();
      return;
    }

    const storagePairs: [string, string][] = [
      ["access_token", accessToken],
      ["refresh_token", refreshToken],
    ];

    if (userId) {
      storagePairs.push(["user_id", userId]);
    }

    if (nickname) {
      storagePairs.push(["nickname", nickname]);
    }

    await AsyncStorage.multiSet(storagePairs);

    navigation.reset({
      index: 0,
      routes: [{ name: "Main" }],
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
      </View>

      <WebView
        source={{ uri: authUrl }}
        startInLoadingState
        onNavigationStateChange={(navState) => {
          handleUrl(navState.url);
        }}
        onShouldStartLoadWithRequest={(request) => {
          if (
            isOAuthSuccessUrl(request.url) ||
            isOAuthFailureUrl(request.url)
          ) {
            handleUrl(request.url);
            return false;
          }

          return true;
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    height: 8,
    backgroundColor: "#FFFFFF",
  },
  headerSpacer: {
    height: 8,
  },
});
