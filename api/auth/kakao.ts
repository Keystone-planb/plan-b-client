import apiClient from "../client";
import axios from "axios";
import { API_CONFIG } from "../config";

export interface KakaoLoginRequest {
  oauth_token: string;
}

export interface KakaoLoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  is_new_user?: boolean;
}

interface KakaoLoginErrorResponse {
  message?: string;
}

export class KakaoLoginError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "KakaoLoginError";
    this.status = status;
  }
}

const mockRequestKakaoLogin = async ({
  oauth_token,
}: KakaoLoginRequest): Promise<KakaoLoginResponse> => {
  console.log("카카오 로그인 요청 (mock):", oauth_token);

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!oauth_token) {
        reject(new KakaoLoginError("카카오 oauth 토큰이 없습니다."));
        return;
      }

      resolve({
        access_token: "mock_kakao_access_token_123456",
        refresh_token: "mock_kakao_refresh_token_abcdef",
        expires_in: 3600,
        is_new_user: false,
      });
    }, 800);
  });
};

/**
 * 카카오 로그인 API
 * POST /api/auth/kakao
 */
export const requestKakaoLogin = async ({
  oauth_token,
}: KakaoLoginRequest): Promise<KakaoLoginResponse> => {
  if (API_CONFIG.USE_MOCK) {
    return mockRequestKakaoLogin({ oauth_token });
  }

  try {
    console.log("카카오 로그인 요청 (server):", { oauth_token });

    const response = await apiClient.post<KakaoLoginResponse>(
      "/api/auth/kakao",
      { oauth_token },
    );

    console.log("카카오 로그인 응답:", response.status, response.data);

    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.log("카카오 로그인 실패 status:", error.response?.status);
      console.log("카카오 로그인 실패 data:", error.response?.data);
      console.log("카카오 로그인 실패 message:", error.message);

      const errorData = error.response?.data as
        | KakaoLoginErrorResponse
        | undefined;

      const message = errorData?.message || "카카오 로그인에 실패했습니다.";

      throw new KakaoLoginError(message, error.response?.status);
    }

    console.log("카카오 로그인 알 수 없는 에러:", error);
    throw new KakaoLoginError("알 수 없는 오류가 발생했습니다.");
  }
};
