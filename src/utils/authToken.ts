import AsyncStorage from "@react-native-async-storage/async-storage";

export type OAuthTokenPayload = {
  accessToken: string;
  refreshToken: string;
  userId?: string;
  nickname?: string;
};

export const isOAuthSuccessUrl = (url: string) => {
  return url.includes("oauth/success");
};

export const isOAuthFailureUrl = (url: string) => {
  return url.includes("oauth/failure");
};

export const parseOAuthError = (url: string) => {
  try {
    const parsedUrl = new URL(url);

    return parsedUrl.searchParams.get("error") ?? "소셜 로그인에 실패했습니다.";
  } catch {
    return "소셜 로그인에 실패했습니다.";
  }
};

export const parseOAuthTokenPayload = (url: string): OAuthTokenPayload => {
  const parsedUrl = new URL(url);

  const accessToken = parsedUrl.searchParams.get("access_token");
  const refreshToken = parsedUrl.searchParams.get("refresh_token");
  const userId = parsedUrl.searchParams.get("user_id") ?? undefined;
  const nickname = parsedUrl.searchParams.get("nickname") ?? undefined;

  if (!accessToken || !refreshToken) {
    throw new Error("소셜 로그인 토큰이 없습니다.");
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
}: OAuthTokenPayload) => {
  const pairs: [string, string][] = [
    ["access_token", accessToken],
    ["refresh_token", refreshToken],
  ];

  if (userId) {
    pairs.push(["user_id", userId]);
  }

  if (nickname) {
    pairs.push(["nickname", nickname]);
  }

  await AsyncStorage.multiSet(pairs);
};

export const handleOAuthSuccessUrl = async (url: string) => {
  const payload = parseOAuthTokenPayload(url);

  await saveOAuthTokens(payload);

  return payload;
};
