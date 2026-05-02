import axios from "axios";

import apiClient from "../client";
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

interface LoginErrorResponse {
  message?: string;
}

const mockRequestLogin = async ({
  email,
  password,
}: LoginRequest): Promise<LoginResponse> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!email.trim() || !password.trim()) {
        reject(new Error("이메일과 비밀번호를 입력해주세요."));
        return;
      }

      if (email.trim() !== "test@test.com" || password !== "1234") {
        reject(new Error("이메일 또는 비밀번호가 올바르지 않습니다."));
        return;
      }

      resolve({
        access_token: "mock_access_token_123456",
        refresh_token: "mock_refresh_token_abcdef",
        expires_in: 3600,
      });
    }, 500);
  });
};

const isLoginResponse = (data: unknown): data is LoginResponse => {
  if (!data || typeof data !== "object") {
    return false;
  }

  const obj = data as Record<string, unknown>;

  return (
    typeof obj.access_token === "string" &&
    typeof obj.refresh_token === "string" &&
    typeof obj.expires_in === "number"
  );
};

const isHtmlResponse = (data: unknown, contentType?: string) => {
  if (contentType?.includes("text/html")) {
    return true;
  }

  if (typeof data !== "string") {
    return false;
  }

  const trimmed = data.trim().toLowerCase();

  return trimmed.startsWith("<!doctype html>") || trimmed.startsWith("<html");
};

const getServerErrorMessage = (data: unknown) => {
  if (!data || typeof data !== "object") {
    return null;
  }

  const errorData = data as LoginErrorResponse;

  if (typeof errorData.message === "string") {
    return errorData.message;
  }

  return null;
};

export const requestLogin = async ({
  email,
  password,
}: LoginRequest): Promise<LoginResponse> => {
  const trimmedEmail = email.trim();

  if (API_CONFIG.USE_MOCK) {
    return mockRequestLogin({
      email: trimmedEmail,
      password,
    });
  }

  try {
    const response = await apiClient.post("/api/auth/login", {
      email: trimmedEmail,
      password,
    });

    const contentType = String(response.headers["content-type"] ?? "");
    const data = response.data;

    if (isHtmlResponse(data, contentType)) {
      throw new Error(
        "로그인 API 응답이 JSON이 아니라 HTML입니다. BASE_URL 또는 API 경로를 확인해주세요.",
      );
    }

    if (!isLoginResponse(data)) {
      throw new Error("토큰이 없습니다. 로그인 응답을 확인해주세요.");
    }

    return data;
  } catch (error: unknown) {
    if (!axios.isAxiosError(error)) {
      if (error instanceof Error) {
        throw error;
      }

      throw new Error("알 수 없는 오류가 발생했습니다.");
    }

    const status = error.response?.status;
    const errorData = error.response?.data;
    const message = error.message;

    if (message.includes("timeout")) {
      throw new Error(
        "로그인 요청 시간이 초과되었습니다. 서버 응답이 느리거나 네트워크 상태가 불안정합니다.",
      );
    }

    if (!error.response && message === "Network Error") {
      throw new Error(
        "백엔드 서버에 연결할 수 없습니다. 서버 실행 여부와 BASE_URL을 확인해주세요.",
      );
    }

    if (
      isHtmlResponse(
        errorData,
        String(error.response?.headers?.["content-type"] ?? ""),
      )
    ) {
      throw new Error(
        "로그인 요청이 API 서버가 아닌 다른 서버로 전달되고 있습니다. BASE_URL 또는 포트를 확인해주세요.",
      );
    }

    const serverMessage = getServerErrorMessage(errorData);

    if (serverMessage) {
      throw new Error(serverMessage);
    }

    if (status === 400 || status === 401 || status === 403) {
      throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
    }

    if (status === 404) {
      throw new Error(
        "로그인 API 경로를 찾을 수 없습니다. endpoint를 확인해주세요.",
      );
    }

    if (status === 503) {
      throw new Error(
        "서버가 현재 사용할 수 없습니다. 백엔드 서버 상태를 확인해주세요.",
      );
    }

    throw new Error("로그인에 실패했습니다.");
  }
};
