import apiClient from "../client";
import axios from "axios";
import { API_CONFIG } from "../config";

export interface SignupRequest {
  email: string;
  password: string;
  nickname: string;
}

export interface SignupResponse {
  success?: boolean;
  message: string;
  user_id?: number;
  userId?: number;
  id?: number;
}

interface SignupErrorResponse {
  message?: string;
  error?: string;
}

export class SignupError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "SignupError";
    this.status = status;
  }
}

const mockRequestSignup = async ({
  email,
  password,
  nickname,
}: SignupRequest): Promise<SignupResponse> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!email || !email.includes("@")) {
        reject(new SignupError("올바른 이메일 주소를 입력해주세요."));
        return;
      }

      if (!password) {
        reject(new SignupError("비밀번호를 입력해주세요."));
        return;
      }

      if (!nickname) {
        reject(new SignupError("닉네임을 입력해주세요."));
        return;
      }

      resolve({
        success: true,
        message: "회원가입이 완료되었습니다.",
        user_id: 101,
      });
    }, 700);
  });
};

const isHtmlResponse = (data: unknown) => {
  if (typeof data !== "string") return false;

  const trimmed = data.trim().toLowerCase();

  return trimmed.startsWith("<!doctype html>") || trimmed.startsWith("<html");
};

/**
 * 회원가입 API
 * POST /api/users/signup
 *
 * Request Body:
 * {
 *   email: string;
 *   password: string;
 *   nickname: string;
 * }
 */
export const requestSignup = async ({
  email,
  password,
  nickname,
}: SignupRequest): Promise<SignupResponse> => {
  if (API_CONFIG.USE_MOCK) {
    return mockRequestSignup({ email, password, nickname });
  }

  try {
    const trimmedEmail = email.trim();
    const trimmedNickname = nickname.trim();

    const response = await apiClient.post<SignupResponse>("/api/users/signup", {
      email: trimmedEmail,
      password,
      nickname: trimmedNickname,
    });

    const data = response.data;

    if (isHtmlResponse(data)) {
      throw new SignupError(
        "회원가입 API가 HTML을 반환했습니다. BASE_URL과 백엔드 서버 상태를 확인해주세요.",
      );
    }

    return data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const errorData = error.response?.data as
        | SignupErrorResponse
        | string
        | undefined;

      if (!error.response && error.message === "Network Error") {
        throw new SignupError(
          "백엔드 서버에 연결할 수 없습니다. 서버 상태와 BASE_URL을 확인해주세요.",
        );
      }

      if (isHtmlResponse(errorData)) {
        throw new SignupError(
          "회원가입 요청이 API 서버가 아닌 다른 서버로 전달되고 있습니다. BASE_URL을 확인해주세요.",
          status,
        );
      }

      if (typeof errorData === "string") {
        throw new SignupError(errorData.trim(), status);
      }

      const serverMessage =
        errorData?.message || errorData?.error || "회원가입에 실패했습니다.";

      throw new SignupError(serverMessage, status);
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new SignupError("알 수 없는 오류가 발생했습니다.");
  }
};
