import apiClient from "../client";
import axios from "axios";
import { API_CONFIG } from "../config";

/** 요청 타입 */
export interface GoogleLoginRequest {
  oauth_token: string;
}

/** 응답 타입 */
export interface GoogleLoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  is_new_user?: boolean;
}

/** mock */
const mockGoogleLogin = async ({
  oauth_token,
}: GoogleLoginRequest): Promise<GoogleLoginResponse> => {
  console.log("구글 로그인 요청 (mock):", oauth_token);

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!oauth_token) {
        reject(new Error("구글 인증 토큰이 필요합니다."));
        return;
      }

      resolve({
        access_token: "mock_google_access_token_123456",
        refresh_token: "mock_google_refresh_token_abcdef",
        expires_in: 3600,
        is_new_user: false,
      });
    }, 800);
  });
};

/**
 * 구글 소셜 로그인 API
 * POST /api/auth/google
 */
export const requestGoogleLogin = async ({
  oauth_token,
}: GoogleLoginRequest): Promise<GoogleLoginResponse> => {
  if (API_CONFIG.USE_MOCK) {
    return mockGoogleLogin({ oauth_token });
  }

  try {
    const response = await apiClient.post<GoogleLoginResponse>(
      "/api/auth/google",
      { oauth_token },
    );

    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const errorMessage =
        error.response?.data?.message || "구글 로그인에 실패했습니다.";
      throw new Error(errorMessage);
    }

    throw new Error("알 수 없는 오류가 발생했습니다.");
  }
};
