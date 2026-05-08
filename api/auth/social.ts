import { Platform } from "react-native";
import * as Linking from "expo-linking";
import { API_CONFIG } from "../config";
import apiClient from "../client";

export type SocialProvider = "kakao" | "google";

export type SocialLoginResponse = {
  success?: boolean;
  message?: string;
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  token_type?: "Bearer" | string;
  user_id?: number;
  nickname?: string;
  is_new_user?: boolean;
};

export type SocialAuthUrlResult = {
  provider: SocialProvider;
  redirectUri: string;
  encodedRedirectUri: string;
  authUrl: string;
};

const SOCIAL_AUTH_PATH: Record<SocialProvider, string> = {
  kakao: "/oauth2/authorization/kakao",
  google: "/oauth2/authorization/google",
};

const getRootBaseUrl = () => {
  return API_CONFIG.BASE_URL.replace(/\/$/, "")
    .replace(/\/api$/, "")
    .replace(/\/v1$/, "");
};

const encodeRedirectUriToBase64 = (value: string) => {
  if (typeof window !== "undefined" && typeof window.btoa === "function") {
    return window.btoa(value);
  }

  if (typeof globalThis.btoa === "function") {
    return globalThis.btoa(value);
  }

  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

  let output = "";
  let i = 0;

  while (i < value.length) {
    const chr1 = value.charCodeAt(i++);
    const chr2 = value.charCodeAt(i++);
    const chr3 = value.charCodeAt(i++);

    const enc1 = chr1 >> 2;
    const enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
    let enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
    let enc4 = chr3 & 63;

    if (Number.isNaN(chr2)) {
      enc3 = 64;
      enc4 = 64;
    } else if (Number.isNaN(chr3)) {
      enc4 = 64;
    }

    output +=
      chars.charAt(enc1) +
      chars.charAt(enc2) +
      chars.charAt(enc3) +
      chars.charAt(enc4);
  }

  return output;
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
  const baseUrl = getRootBaseUrl();
  const path = SOCIAL_AUTH_PATH[provider];

  const redirectUri = getSocialRedirectUri();
  const encodedRedirectUri = encodeRedirectUriToBase64(redirectUri);
  const querySafeRedirectUri = encodeURIComponent(encodedRedirectUri);

  // 중요:
  // failure_redirect_uri 붙이지 말 것.
  // redirect_uri는 base64 인코딩 후 query string 안전 처리를 위해 encodeURIComponent를 적용한다.
  const authUrl = `${baseUrl}${path}?redirect_uri=${querySafeRedirectUri}`;

  if (__DEV__) {
    console.log("[SocialAuth] provider:", provider);
    console.log("[SocialAuth] baseUrl:", baseUrl);
    console.log("[SocialAuth] redirectUri:", redirectUri);
    console.log("[SocialAuth] encodedRedirectUri:", encodedRedirectUri);
    console.log("[SocialAuth] querySafeRedirectUri:", querySafeRedirectUri);
    console.log("[SocialAuth] authUrl:", authUrl);
  }

  return {
    provider,
    redirectUri,
    encodedRedirectUri,
    authUrl,
  };
};

export const requestSocialTokenLogin = async (
  provider: SocialProvider,
  oauthToken: string,
): Promise<SocialLoginResponse> => {
  const response = await apiClient.post<SocialLoginResponse>(
    `/api/auth/${provider}`,
    {
      oauth_token: oauthToken,
    },
  );

  return response.data;
};
