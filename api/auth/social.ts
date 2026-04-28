import { Platform } from "react-native";
import * as Linking from "expo-linking";

const SOCIAL_BASE_URL = "https://api-dev.planb-travel.cloud";

export type SocialProvider = "kakao" | "google";

const getWebRedirectUri = () => {
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/oauth/success`;
  }

  return "http://localhost:8081/oauth/success";
};

export const getSocialRedirectUri = () => {
  if (Platform.OS === "web") {
    return getWebRedirectUri();
  }

  return Linking.createURL("oauth/success", {
    scheme: "planb",
  });
};

export const createSocialAuthUrl = (provider: SocialProvider) => {
  const redirectUri = getSocialRedirectUri();

  const authUrl =
    `${SOCIAL_BASE_URL}/oauth2/authorization/${provider}` +
    `?redirect_uri=${encodeURIComponent(redirectUri)}`;

  console.log("");
  console.log("🧭 소셜 로그인 시작");
  console.log({
    provider,
    redirectUri,
    authUrl,
  });
  console.log("──────────────────────────────");

  return {
    provider,
    redirectUri,
    authUrl,
  };
};
