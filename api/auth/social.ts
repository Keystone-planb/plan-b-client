import { Platform } from "react-native";
import * as Linking from "expo-linking";

import { API_CONFIG } from "../config";

export type SocialProvider = "kakao" | "google";

type SocialAuthUrlResult = {
  provider: SocialProvider;
  redirectUri: string;
  authUrl: string;
};

const SOCIAL_AUTH_PATH: Record<SocialProvider, string> = {
  kakao: "/oauth2/authorization/kakao",
  google: "/oauth2/authorization/google",
};

export const getSocialRedirectUri = () => {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return `${window.location.origin}/oauth/success`;
  }

  return Linking.createURL("oauth/success", {
    scheme: "planb",
  });
};

export const createSocialAuthUrl = (
  provider: SocialProvider,
): SocialAuthUrlResult => {
  const redirectUri = getSocialRedirectUri();

  const authUrl = `${API_CONFIG.BASE_URL}${SOCIAL_AUTH_PATH[provider]}?redirect_uri=${encodeURIComponent(
    redirectUri,
  )}`;

  console.log("──────────────────────────────");
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
