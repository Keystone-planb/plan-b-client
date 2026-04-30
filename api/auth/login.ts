import axios from "axios";
import apiClient from "../client";
import { API_CONFIG } from "../config";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success?: boolean;
  message?: string;
  nickname?: string;
  access_token: string;
  refresh_token: string;
  token_type?: string;
  user_id?: number;
}

interface LoginErrorResponse {
  message?: string;
  error?: string;
}

const isLoginResponse = (data: unknown): data is LoginResponse => {
  if (!data || typeof data !== "object") return false;

  const obj = data as Record<string, unknown>;

  return (
    typeof obj.access_token === "string" &&
    obj.access_token.length > 0 &&
    typeof obj.refresh_token === "string" &&
    obj.refresh_token.length > 0
  );
};

const isHtmlResponse = (data: unknown) => {
  if (typeof data !== "string") return false;

  const trimmed = data.trim().toLowerCase();

  return trimmed.startsWith("<!doctype html>") || trimmed.startsWith("<html");
};

const getServerErrorMessage = (data: unknown) => {
  if (!data || typeof data !== "object") return null;

  const errorData = data as LoginErrorResponse;

  return errorData.message || errorData.error || null;
};

export const requestLogin = async ({
  email,
  password,
}: LoginRequest): Promise<LoginResponse> => {
  try {
    console.log("🔥 requestLogin 호출됨");
    console.log("🔥 LOGIN URL:", `${API_CONFIG.BASE_URL}/api/auth/login`);
    console.log("🔥 로그인 요청:", { email, password });

    const response = await apiClient.post("/api/auth/login", {
      email,
      password,
    });

    const data = response.data;

    console.log("🔥 로그인 response.status:", response.status);
    console.log("🔥 로그인 response.data:", data);

    if (isHtmlResponse(data)) {
      throw new Error(
        "로그인 API가 HTML을 반환했습니다. BASE_URL, 포트, 백엔드 서버 상태를 확인해주세요.",
      );
    }

    if (!isLoginResponse(data)) {
      console.log("❌ 예상한 로그인 응답 구조 아님:", data);
      throw new Error("토큰이 없습니다. 로그인 응답을 확인해주세요.");
    }

    return data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.log("❌ 로그인 실패 status:", error.response?.status);
      console.log("❌ 로그인 실패 data:", error.response?.data);
      console.log("❌ 로그인 실패 message:", error.message);

      const errorData = error.response?.data as
        | LoginErrorResponse
        | string
        | undefined;

      if (!error.response && error.message === "Network Error") {
        throw new Error(
          "백엔드 서버에 연결할 수 없습니다. 서버 실행 여부와 포트를 확인해주세요.",
        );
      }

      if (isHtmlResponse(errorData)) {
        throw new Error(
          "로그인 요청이 API 서버가 아닌 다른 서버로 전달되고 있습니다. BASE_URL 또는 포트를 확인해주세요.",
        );
      }

      const serverMessage = getServerErrorMessage(errorData);

      if (serverMessage) {
        throw new Error(serverMessage);
      }

      if (error.response?.status === 401) {
        throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
      }

      if (error.response?.status === 404) {
        throw new Error("로그인에 실패했습니다.");
      }

      if (error.response?.status === 503) {
        throw new Error(
          "서버가 현재 사용할 수 없습니다. 백엔드 서버 상태를 확인해주세요.",
        );
      }

      throw new Error("로그인에 실패했습니다.");
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("알 수 없는 오류가 발생했습니다.");
  }
};
