import React, { useEffect } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRoute } from "@react-navigation/native";

import {
  extractOAuthErrorFromUrl,
  extractSocialTokensFromUrl,
  isOAuthFailureUrl,
  isOAuthSuccessUrl,
} from "../utils/authToken";
import { debugError, debugLog, debugSuccess } from "../utils/debugLog";

type RouteParams = {
  fullUrl?: string;
};

export default function OAuthRedirectScreen({ navigation }: any) {
  const route = useRoute();
  const params = route.params as RouteParams | undefined;

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        /**
         * 웹에서는 window.location.href로 실제 현재 주소를 읽는다.
         * 앱에서 혹시 params로 넘기는 경우도 대비한다.
         */
        const currentUrl =
          typeof window !== "undefined" ?
            window.location.href
          : (params?.fullUrl ?? "");

        debugLog("OAuth Redirect Screen 진입", currentUrl);

        if (isOAuthFailureUrl(currentUrl)) {
          const errorMessage = extractOAuthErrorFromUrl(currentUrl);

          throw new Error(errorMessage ?? "소셜 로그인에 실패했습니다.");
        }

        if (!isOAuthSuccessUrl(currentUrl)) {
          throw new Error("올바르지 않은 OAuth redirect URL입니다.");
        }

        const { accessToken, refreshToken, userId, nickname } =
          extractSocialTokensFromUrl(currentUrl);

        if (!accessToken || !refreshToken) {
          throw new Error("OAuth redirect URL에 토큰이 없습니다.");
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

        debugSuccess("OAuth 로그인 정보 저장 완료", {
          access: accessToken ? "저장됨" : "없음",
          refresh: refreshToken ? "저장됨" : "없음",
          userId,
          nickname,
        });

        navigation.reset({
          index: 0,
          routes: [{ name: "Main" }],
        });
      } catch (error: unknown) {
        debugError("OAuth Redirect 처리 실패", error);

        Alert.alert(
          "소셜 로그인 실패",
          error instanceof Error ?
            error.message
          : "소셜 로그인 처리 중 문제가 발생했습니다.",
          [
            {
              text: "확인",
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: "Login" }],
                });
              },
            },
          ],
        );
      }
    };

    handleRedirect();
  }, [navigation, params?.fullUrl]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#2158E8" />
      <Text style={styles.text}>소셜 로그인 처리 중...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F9FB",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    marginTop: 14,
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
  },
});
