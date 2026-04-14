import apiClient from "../../client";
import axios from "axios";
import { API_CONFIG } from "../../config";

export interface RequestEmailAuthRequest {
  email: string;
}

export interface RequestEmailAuthResponse {
  message: string;
}

const mockRequestEmailAuth = async (
  email: string,
): Promise<RequestEmailAuthResponse> => {
  console.log("인증 코드 발송 요청 (mock):", email);

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!email || !email.includes("@")) {
        reject(new Error("올바른 이메일 주소를 입력해주세요."));
        return;
      }

      resolve({
        message: "인증 코드가 이메일로 발송되었습니다. (유효시간 3분)",
      });
    }, 700);
  });
};

/**
 * 이메일 인증 코드 발송 API
 * POST /api/auth/email/request
 */
export const requestEmailAuth = async (
  email: string,
): Promise<RequestEmailAuthResponse> => {
  if (API_CONFIG.USE_MOCK) {
    return mockRequestEmailAuth(email);
  }

  try {
    const response = await apiClient.post<RequestEmailAuthResponse>(
      "/api/auth/email/request",
      { email },
    );

    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const errorMessage =
        error.response?.data?.message || "인증 코드 발송에 실패했습니다.";
      throw new Error(errorMessage);
    }

    throw new Error("알 수 없는 오류가 발생했습니다.");
  }
};
