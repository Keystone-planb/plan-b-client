import AsyncStorage from "@react-native-async-storage/async-storage";

export type OAuthSuccessPayload = {
  accessToken: string;
  refreshToken: string;
  userId?: string;
  nickname?: string;
  email?: string;
};

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

const getUrlObject = (url: string) => {
  try {
    return new URL(url);
  } catch {
    const normalizedUrl =
      url.startsWith("planb://") ? url : (
        `planb://oauth/success${url.startsWith("?") ? url : `?${url}`}`
      );

    return new URL(normalizedUrl);
  }
};

const getOAuthParam = (url: URL, key: string) => {
  const queryValue = url.searchParams.get(key);

  if (queryValue) return queryValue;

  const hash = url.hash.startsWith("#") ? url.hash.slice(1) : url.hash;
  const hashParams = new URLSearchParams(hash);

  return hashParams.get(key);
};

export const isOAuthSuccessUrl = (url: string) => {
  return url.includes("/oauth/success") || url.includes("oauth/success");
};

export const isOAuthFailureUrl = (url: string) => {
  return url.includes("/oauth/failure") || url.includes("oauth/failure");
};

export const getOAuthFailureMessage = (url: string) => {
  try {
    const parsedUrl = getUrlObject(url);
    return (
      parsedUrl.searchParams.get("error") ||
      parsedUrl.searchParams.get("message") ||
      "소셜 로그인에 실패했습니다."
    );
  } catch {
    return "소셜 로그인에 실패했습니다.";
  }
};

export const parseOAuthSuccessUrl = (url: string): OAuthSuccessPayload => {
  const parsedUrl = getUrlObject(url);

  const accessToken =
    getOAuthParam(parsedUrl, "token") ||
    getOAuthParam(parsedUrl, "access_token") ||
    getOAuthParam(parsedUrl, "accessToken") ||
    "";

  const refreshToken =
    getOAuthParam(parsedUrl, "refresh_token") ||
    getOAuthParam(parsedUrl, "refreshToken") ||
    "";

  const userId =
    getOAuthParam(parsedUrl, "userId") ||
    getOAuthParam(parsedUrl, "user_id") ||
    undefined;

  const nickname = getOAuthParam(parsedUrl, "nickname") || undefined;
  const email = getOAuthParam(parsedUrl, "email") || undefined;

  if (!accessToken || !refreshToken) {
    throw new Error("토큰이 없습니다. 소셜 로그인 응답을 확인해주세요.");
  }

  return {
    accessToken,
    refreshToken,
    userId,
    nickname,
    email,
  };
};

const setStorageValue = async (key: string, value: string) => {
  await AsyncStorage.setItem(key, value);

  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.setItem(key, value);
  }
};

const removeStorageValue = async (key: string) => {
  await AsyncStorage.removeItem(key);

  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.removeItem(key);
  }
};

const syncOptionalStorageValue = async (
  key: string,
  value: string | number | null | undefined,
) => {
  if (value === undefined) {
    return;
  }

  if (value !== null && String(value).trim().length > 0) {
    await setStorageValue(key, String(value));
    return;
  }

  await removeStorageValue(key);
};

export const saveOAuthTokens = async ({
  accessToken,
  refreshToken,
  userId,
  nickname,
  email,
}: {
  accessToken?: string | null;
  refreshToken?: string | null;
  userId?: string | number | null;
  nickname?: string | null;
  email?: string | null;
}) => {
  if (!accessToken || !refreshToken) {
    throw new Error("토큰이 없습니다. 로그인 응답을 확인해주세요.");
  }

  await setStorageValue("access_token", String(accessToken));
  await setStorageValue("refresh_token", String(refreshToken));
  await syncOptionalStorageValue("user_id", userId);
  await syncOptionalStorageValue("nickname", nickname);
  await syncOptionalStorageValue("email", email);
};

export const handleOAuthSuccessUrl = async (url: string) => {
  const payload = parseOAuthSuccessUrl(url);
  await saveOAuthTokens(payload);
  return payload;
};
