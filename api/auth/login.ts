import apiClient from "../client";
import axios from "axios";
import { API_CONFIG } from "../config";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success?: boolean;
  message?: string;
  access_token: string;
  refresh_token: string;
  accessToken?: string;
  refreshToken?: string;
  token_type?: "Bearer" | string;
  expires_in?: number;
  user_id?: number;
  userId?: number;
  email?: string;
  nickname?: string;
}

interface LoginErrorResponse {
  message?: string;
  error?: string;
}

export class LoginError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "LoginError";
    this.status = status;
  }
}

const mockRequestLogin = async ({
  email,
  password,
}: LoginRequest): Promise<LoginResponse> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!email || !password) {
        reject(new LoginError("이메일과 비밀번호를 입력해주세요."));
        return;
      }

      if (email !== "test@test.com" || password !== "1234") {
        reject(new LoginError("이메일 또는 비밀번호가 올바르지 않습니다."));
        return;
      }

      resolve({
        success: true,
        message: "mock 로그인에 성공하였습니다.",
        access_token: "mock_access_token_123456",
        refresh_token: "mock_refresh_token_abcdef",
        token_type: "Bearer",
        expires_in: 3600,
        user_id: 101,
        nickname: "test",
      });
    }, 800);
  });
};

const isLoginResponse = (data: unknown): data is LoginResponse => {
  if (!data || typeof data !== "object") return false;

  const obj = data as Record<string, unknown>;
  const accessToken = obj.access_token ?? obj.accessToken;
  const refreshToken = obj.refresh_token ?? obj.refreshToken;

  return (
    typeof accessToken === "string" &&
    accessToken.length > 0 &&
    typeof refreshToken === "string" &&
    refreshToken.length > 0
  );
};

const normalizeLoginResponse = (data: LoginResponse): LoginResponse => ({
  ...data,
  access_token: data.access_token ?? data.accessToken ?? "",
  refresh_token: data.refresh_token ?? data.refreshToken ?? "",
  user_id: data.user_id ?? data.userId,
});

const isHtmlResponse = (data: unknown) => {
  if (typeof data !== "string") return false;

  const trimmed = data.trim().toLowerCase();

  return trimmed.startsWith("<!doctype html>") || trimmed.startsWith("<html");
};

export const requestLogin = async ({
  email,
  password,
}: LoginRequest): Promise<LoginResponse> => {
  if (API_CONFIG.USE_MOCK) {
    return mockRequestLogin({ email, password });
  }

  try {
    const trimmedEmail = email.trim();

    const response = await apiClient.post<unknown>("/api/auth/login", {
      email: trimmedEmail,
      password,
    });

    const data = response.data;

    if (isHtmlResponse(data)) {
      throw new LoginError(
        "로그인 API가 HTML을 반환했습니다. BASE_URL, 포트, 백엔드 서버 상태를 확인해주세요.",
      );
    }

    if (!isLoginResponse(data)) {
      throw new LoginError("토큰이 없습니다. 로그인 응답을 확인해주세요.");
    }

    return normalizeLoginResponse(data);
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const errorData = error.response?.data as
        | LoginErrorResponse
        | string
        | undefined;

      if (!error.response && error.message === "Network Error") {
        throw new LoginError(
          "백엔드 서버에 연결할 수 없습니다. 서버 상태와 BASE_URL을 확인해주세요.",
        );
      }

      if (isHtmlResponse(errorData)) {
        throw new LoginError(
          "로그인 요청이 API 서버가 아닌 다른 서버로 전달되고 있습니다. BASE_URL을 확인해주세요.",
          status,
        );
      }

      if (typeof errorData === "string") {
        throw new LoginError(errorData.trim(), status);
      }

      const serverMessage =
        errorData?.message || errorData?.error || "로그인에 실패했습니다.";

      throw new LoginError(serverMessage, status);
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new LoginError("알 수 없는 오류가 발생했습니다.");
  }
};
