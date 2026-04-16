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
  userId: number;
}

interface SignupErrorResponse {
  message?: string;
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
  console.log("회원가입 요청 (mock):", email, nickname);

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!email || !password || !nickname) {
        reject(new SignupError("필수 입력값을 확인해주세요."));
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
    console.log("회원가입 요청 (server):", {
      email,
      password,
      nickname,
    });

    const response = await apiClient.post<SignupResponse>("/api/users/signup", {
      email,
      password,
      nickname,
    });

    console.log("회원가입 응답:", response.status, response.data);

    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.log("회원가입 실패 status:", error.response?.status);
      console.log("회원가입 실패 data:", error.response?.data);
      console.log("회원가입 실패 message:", error.message);

      const errorData = error.response?.data as SignupErrorResponse | undefined;
      const errorMessage = errorData?.message || "회원가입에 실패했습니다.";

      throw new SignupError(errorMessage, error.response?.status);
    }

    console.log("회원가입 알 수 없는 에러:", error);
    throw new SignupError("알 수 없는 오류가 발생했습니다.");
  }
};
