import { Platform } from "react-native";
import * as Linking from "expo-linking";

export type SocialProvider = "kakao" | "google";

type SocialAuthUrlResult = {
  provider: SocialProvider;
  redirectUri: string;
  encodedRedirectUri: string;
  authUrl: string;
};

const SOCIAL_AUTH_BASE_URL = "https://api-dev.planb-travel.cloud";

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

const encodeRedirectUriForOAuth = (redirectUri: string) => {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return window.btoa(redirectUri);
  }

  return encodeURIComponent(redirectUri);
};

export const createSocialAuthUrl = (
  provider: SocialProvider,
): SocialAuthUrlResult => {
  const redirectUri = getSocialRedirectUri();
  const encodedRedirectUri = encodeRedirectUriForOAuth(redirectUri);

  const authUrl = `${SOCIAL_AUTH_BASE_URL}${SOCIAL_AUTH_PATH[provider]}?redirect_uri=${encodedRedirectUri}`;

  return {
    provider,
    redirectUri,
    encodedRedirectUri,
    authUrl,
  };
};
