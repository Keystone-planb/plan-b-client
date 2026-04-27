import { Platform } from "react-native";
import * as Linking from "expo-linking";
import { API_CONFIG } from "../config";

export type SocialProvider = "kakao" | "google";

/**
 * 명세서 기준 OAuth 로그인 시작 경로
 */
const SOCIAL_AUTH_PATH: Record<SocialProvider, string> = {
  kakao: "/oauth2/authorization/kakao",
  google: "/oauth2/authorization/google",
};

/**
 * 소셜 로그인 성공 후 돌아올 redirect_uri
 *
 * 웹:
 * 현재 Expo Web 주소 기준으로 자동 생성
 * 예: http://localhost:8081/oauth/success
 *
 * 앱:
 * app.json scheme 기준
 * 예: planb://oauth/success
 */
export const getSocialRedirectUri = () => {
  if (Platform.OS === "web") {
    return `${window.location.origin}/oauth/success`;
  }

  return Linking.createURL("oauth/success");
};

/**
 * 카카오 / 구글 OAuth 로그인 시작 URL 생성
 *
 * 웹 예:
 * https://api-dev.planb-travel.cloud/oauth2/authorization/kakao?redirect_uri=http%3A%2F%2Flocalhost%3A8081%2Foauth%2Fsuccess
 *
 * 앱 예:
 * https://api-dev.planb-travel.cloud/oauth2/authorization/kakao?redirect_uri=planb%3A%2F%2Foauth%2Fsuccess
 */
export const getSocialAuthUrl = (provider: SocialProvider) => {
  const redirectUri = getSocialRedirectUri();

  const url = new URL(`${API_CONFIG.BASE_URL}${SOCIAL_AUTH_PATH[provider]}`);

  url.searchParams.set("redirect_uri", redirectUri);

  return url.toString();
};
