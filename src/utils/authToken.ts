import AsyncStorage from "@react-native-async-storage/async-storage";

export type OAuthTokens = {
  accessToken: string;
  refreshToken: string;
  userId?: string;
  nickname?: string;

  access_token?: string;
  refresh_token?: string;
  user_id?: string;
};

const getSearchParamsFromUrl = (url: string) => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.searchParams;
  } catch {
    const queryString = url.split("?")[1];

    if (!queryString) {
      return new URLSearchParams();
    }

    return new URLSearchParams(queryString);
  }
};

export const isOAuthSuccessUrl = (url: string) => {
  return (
    url.includes("/oauth/success") ||
    url.includes("oauth/success") ||
    url.startsWith("planb://oauth/success")
  );
};

export const isOAuthFailureUrl = (url: string) => {
  return (
    url.includes("/oauth/failure") ||
    url.includes("oauth/failure") ||
    url.startsWith("planb://oauth/failure")
  );
};

export const getOAuthFailureMessage = (url: string) => {
  const params = getSearchParamsFromUrl(url);
  const error = params.get("error");

  if (!error) {
    return "소셜 로그인에 실패했습니다.";
  }

  return decodeURIComponent(error);
};

export const extractSocialTokensFromUrl = (url: string): OAuthTokens | null => {
  const params = getSearchParamsFromUrl(url);

  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  const userId = params.get("user_id");
  const nickname = params.get("nickname");

  if (!accessToken || !refreshToken) {
    return null;
  }

  return {
    accessToken,
    refreshToken,
    userId: userId ?? undefined,
    nickname: nickname ? decodeURIComponent(nickname) : undefined,

    // 구버전 코드 호환용
    access_token: accessToken,
    refresh_token: refreshToken,
    user_id: userId ?? undefined,
  };
};

export const extractOAuthErrorFromUrl = (url: string): string | null => {
  const params = getSearchParamsFromUrl(url);
  const error = params.get("error");

  if (!error) {
    return null;
  }

  return decodeURIComponent(error);
};

export const saveOAuthTokens = async (tokens: OAuthTokens) => {
  const accessToken = tokens.accessToken ?? tokens.access_token;
  const refreshToken = tokens.refreshToken ?? tokens.refresh_token;
  const userId = tokens.userId ?? tokens.user_id;
  const nickname = tokens.nickname;

  if (!accessToken || !refreshToken) {
    throw new Error("소셜 로그인 토큰이 없습니다.");
  }

  await AsyncStorage.setItem("access_token", accessToken);
  await AsyncStorage.setItem("refresh_token", refreshToken);

  if (userId) {
    await AsyncStorage.setItem("user_id", userId);
  }

  if (nickname) {
    await AsyncStorage.setItem("nickname", nickname);
  }
};

export const handleOAuthSuccessUrl = async (url: string) => {
  const tokens = extractSocialTokensFromUrl(url);

  if (!tokens) {
    throw new Error("소셜 로그인 응답에서 토큰을 찾을 수 없습니다.");
  }

  await saveOAuthTokens(tokens);

  return tokens;
};
