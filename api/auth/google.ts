import apiClient from "../client";
import axios from "axios";
import { API_CONFIG } from "../config";

export interface GoogleLoginRequest {
  oauth_token: string;
}

export interface GoogleLoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  is_new_user?: boolean;
}

interface GoogleLoginErrorResponse {
  message?: string;
}

export class GoogleLoginError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "GoogleLoginError";
    this.status = status;
  }
}

const mockRequestGoogleLogin = async ({
  oauth_token,
}: GoogleLoginRequest): Promise<GoogleLoginResponse> => {
  console.log("구글 로그인 요청 (mock):", oauth_token);

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!oauth_token) {
        reject(new GoogleLoginError("구글 oauth 토큰이 없습니다."));
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
 * 구글 로그인 API
 * POST /api/auth/google
 */
export const requestGoogleLogin = async ({
  oauth_token,
}: GoogleLoginRequest): Promise<GoogleLoginResponse> => {
  if (API_CONFIG.USE_MOCK) {
    return mockRequestGoogleLogin({ oauth_token });
  }

  try {
    console.log("구글 로그인 요청 (server):", { oauth_token });

    const response = await apiClient.post<GoogleLoginResponse>(
      "/api/auth/google",
      { oauth_token },
    );

    console.log("구글 로그인 응답:", response.status, response.data);

    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.log("구글 로그인 실패 status:", error.response?.status);
      console.log("구글 로그인 실패 data:", error.response?.data);
      console.log("구글 로그인 실패 message:", error.message);

      const errorData = error.response?.data as
        | GoogleLoginErrorResponse
        | undefined;

      const message = errorData?.message || "구글 로그인에 실패했습니다.";

      throw new GoogleLoginError(message, error.response?.status);
    }

    console.log("구글 로그인 알 수 없는 에러:", error);
    throw new GoogleLoginError("알 수 없는 오류가 발생했습니다.");
  }
};
