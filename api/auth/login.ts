import apiClient from "../client";
import axios from "axios";
import { API_CONFIG } from "../config";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

const mockRequestLogin = async ({
  email,
  password,
}: LoginRequest): Promise<LoginResponse> => {
  console.log("로그인 요청 (mock):", email);

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!email || !password) {
        reject(new Error("이메일과 비밀번호를 입력해주세요."));
        return;
      }

      resolve({
        access_token: "mock_access_token_123456",
        refresh_token: "mock_refresh_token_abcdef",
        expires_in: 3600,
      });
    }, 800);
  });
};

/**
 * 로그인 API
 * POST /api/auth/login
 */
export const requestLogin = async ({
  email,
  password,
}: LoginRequest): Promise<LoginResponse> => {
  if (API_CONFIG.USE_MOCK) {
    return mockRequestLogin({ email, password });
  }

  try {
    const response = await apiClient.post<LoginResponse>("/api/auth/login", {
      email,
      password,
    });

    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const errorMessage =
        error.response?.data?.message || "로그인에 실패했습니다.";
      throw new Error(errorMessage);
    }

    throw new Error("알 수 없는 오류가 발생했습니다.");
  }
};
