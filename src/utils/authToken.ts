import AsyncStorage from "@react-native-async-storage/async-storage";

export type OAuthTokens = {
  accessToken: string;
  refreshToken: string;
  userId?: string;
  nickname?: string;
};

const getQueryParam = (url: string, key: string) => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.searchParams.get(key);
  } catch {
    const queryString = url.split("?")[1];

    if (!queryString) {
      return null;
    }

    const params = new URLSearchParams(queryString);
    return params.get(key);
  }
};

export const isOAuthSuccessUrl = (url: string) => {
  return url.startsWith("planb://oauth/success");
};

export const isOAuthFailureUrl = (url: string) => {
  return url.includes("/oauth/failure") || url.includes("oauth/failure");
};

export const parseOAuthSuccessUrl = (url: string): OAuthTokens => {
  const accessToken = getQueryParam(url, "access_token");
  const refreshToken = getQueryParam(url, "refresh_token");
  const userId = getQueryParam(url, "user_id");
  const nickname = getQueryParam(url, "nickname");

  if (!accessToken || !refreshToken) {
    throw new Error("OAuth 성공 URL에 토큰이 없습니다.");
  }

  return {
    accessToken,
    refreshToken,
    userId: userId ?? undefined,
    nickname: nickname ? decodeURIComponent(nickname) : undefined,
  };
};

export const saveOAuthTokens = async (tokens: OAuthTokens) => {
  await AsyncStorage.multiSet([
    ["access_token", tokens.accessToken],
    ["refresh_token", tokens.refreshToken],
    ["user_id", tokens.userId ?? ""],
    ["nickname", tokens.nickname ?? ""],
  ]);
};

export const handleOAuthSuccessUrl = async (url: string) => {
  const tokens = parseOAuthSuccessUrl(url);

  await saveOAuthTokens(tokens);

  console.log("[OAuth 토큰 저장 완료]", {
    hasAccessToken: Boolean(tokens.accessToken),
    hasRefreshToken: Boolean(tokens.refreshToken),
    userId: tokens.userId,
    nickname: tokens.nickname,
  });

  return tokens;
};

export const getOAuthFailureMessage = (url: string) => {
  const error = getQueryParam(url, "error");

  if (!error) {
    return "소셜 로그인에 실패했습니다.";
  }

  return decodeURIComponent(error);
};
