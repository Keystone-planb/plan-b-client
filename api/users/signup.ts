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

const mockRequestSignup = async ({
  email,
  password,
  nickname,
}: SignupRequest): Promise<SignupResponse> => {
  console.log("회원가입 요청 (mock):", email, nickname);

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!email || !password || !nickname) {
        reject(new Error("필수 입력값을 확인해주세요."));
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
    const response = await apiClient.post<SignupResponse>("/api/users/signup", {
      email,
      password,
      nickname,
    });

    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const errorMessage =
        error.response?.data?.message || "회원가입에 실패했습니다.";
      throw new Error(errorMessage);
    }

    throw new Error("알 수 없는 오류가 발생했습니다.");
  }
};
