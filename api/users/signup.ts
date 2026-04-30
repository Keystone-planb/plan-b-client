import apiClient from "../client";
import axios from "axios";
import { API_CONFIG } from "../config";

export interface SignupRequest {
  email: string;
  password: string;
  nickname: string;
}

export interface SignupResponse {
  message: string;
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
        message: "회원가입이 완료되었습니다.",
        userId: 101,
      });
    }, 700);
  });
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

        
    return response.data;
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

      if (typeof errorData === "string") {
        const trimmed = errorData.trim();

        if (
          trimmed.startsWith("<!DOCTYPE html>") ||
          trimmed.startsWith("<html")
        ) {
          throw new SignupError(
            "회원가입 요청이 API 서버가 아닌 다른 서버로 전달되고 있습니다. BASE_URL을 확인해주세요.",
            status,
          );
        }

        throw new SignupError(trimmed, status);
      }

      const serverMessage =
        errorData?.message || errorData?.error || "회원가입에 실패했습니다.";

      throw new SignupError(serverMessage, status);
    }

        throw new SignupError("알 수 없는 오류가 발생했습니다.");
  }
};
