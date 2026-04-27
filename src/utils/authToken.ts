import * as Linking from "expo-linking";

export type SocialLoginTokens = {
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  nickname: string | null;
};

/**
 * 소셜 로그인 성공 redirect URL에서 로그인 정보를 추출한다.
 *
 * 웹:
 * http://localhost:8082/oauth/success?access_token=...&refresh_token=...&user_id=1&nickname=태형
 *
 * 앱:
 * planb://oauth/success?access_token=...&refresh_token=...&user_id=1&nickname=태형
 */
export const extractSocialTokensFromUrl = (url: string): SocialLoginTokens => {
  const parsed = Linking.parse(url);

  const accessToken =
    parsed.queryParams?.access_token ||
    parsed.queryParams?.accessToken ||
    parsed.queryParams?.access;

  const refreshToken =
    parsed.queryParams?.refresh_token ||
    parsed.queryParams?.refreshToken ||
    parsed.queryParams?.refresh;

  const userId = parsed.queryParams?.user_id || parsed.queryParams?.userId;

  const nickname = parsed.queryParams?.nickname;

  return {
    accessToken: typeof accessToken === "string" ? accessToken : null,
    refreshToken: typeof refreshToken === "string" ? refreshToken : null,
    userId: typeof userId === "string" ? userId : null,
    nickname:
      typeof nickname === "string" ? decodeURIComponent(nickname) : null,
  };
};

/**
 * 소셜 로그인 실패 redirect URL에서 error 메시지를 추출한다.
 *
 * 웹:
 * http://localhost:8082/oauth/failure?error=소셜+로그인에+실패했습니다.
 *
 * 앱:
 * planb://oauth/failure?error=소셜+로그인에+실패했습니다.
 */
export const extractOAuthErrorFromUrl = (url: string) => {
  const parsed = Linking.parse(url);

  const error = parsed.queryParams?.error;
  const message = parsed.queryParams?.message;

  if (typeof message === "string") {
    return decodeURIComponent(message.replace(/\+/g, " "));
  }

  if (typeof error === "string") {
    return decodeURIComponent(error.replace(/\+/g, " "));
  }

  return null;
};

/**
 * 현재 URL이 OAuth 성공 URL인지 확인한다.
 */
export const isOAuthSuccessUrl = (url: string) => {
  return url.includes("/oauth/success") || url.includes("://oauth/success");
};

/**
 * 현재 URL이 OAuth 실패 URL인지 확인한다.
 */
export const isOAuthFailureUrl = (url: string) => {
  return url.includes("/oauth/failure") || url.includes("://oauth/failure");
};
