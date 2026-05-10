import AsyncStorage from "@react-native-async-storage/async-storage";

export type OAuthSuccessPayload = {
  accessToken: string;
  refreshToken: string;
  userId?: string;
  nickname?: string;
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

  if (!accessToken || !refreshToken) {
    throw new Error("토큰이 없습니다. 소셜 로그인 응답을 확인해주세요.");
  }

  return {
    accessToken,
    refreshToken,
    userId,
    nickname,
  };
};

export const saveOAuthTokens = async ({
  accessToken,
  refreshToken,
  userId,
  nickname,
}: {
  accessToken?: string | null;
  refreshToken?: string | null;
  userId?: string | number | null;
  nickname?: string | null;
}) => {
  if (!accessToken || !refreshToken) {
    throw new Error("토큰이 없습니다. 로그인 응답을 확인해주세요.");
  }

  await AsyncStorage.setItem("access_token", String(accessToken));
  await AsyncStorage.setItem("refresh_token", String(refreshToken));

  if (userId !== undefined && userId !== null && String(userId).length > 0) {
    await AsyncStorage.setItem("user_id", String(userId));
  } else {
    await AsyncStorage.removeItem("user_id");
  }

  if (nickname !== undefined && nickname !== null && String(nickname).length > 0) {
    await AsyncStorage.setItem("nickname", String(nickname));
  } else {
    await AsyncStorage.removeItem("nickname");
  }

  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.setItem("access_token", String(accessToken));
    window.localStorage.setItem("refresh_token", String(refreshToken));

    if (userId !== undefined && userId !== null && String(userId).length > 0) {
      window.localStorage.setItem("user_id", String(userId));
    } else {
      window.localStorage.removeItem("user_id");
    }

    if (nickname !== undefined && nickname !== null && String(nickname).length > 0) {
      window.localStorage.setItem("nickname", String(nickname));
    } else {
      window.localStorage.removeItem("nickname");
    }
  }
};

export const handleOAuthSuccessUrl = async (url: string) => {
  const payload = parseOAuthSuccessUrl(url);
  await saveOAuthTokens(payload);
  return payload;
};
