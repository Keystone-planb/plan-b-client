import apiClient from "../../client";
import axios from "axios";
import { API_CONFIG } from "../../config";

export interface VerifyEmailRequest {
  email: string;
  code: string;
}

export interface VerifyEmailResponse {
  message: string;
}

interface VerifyEmailErrorResponse {
  message?: string;
}

export class VerifyEmailError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VerifyEmailError";
  }
}

const mockVerifyEmailCode = async (
  data: VerifyEmailRequest,
): Promise<VerifyEmailResponse> => {
  console.log("인증 코드 검증 요청 (mock):", data.email, data.code);

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!data.email || !data.email.includes("@")) {
        reject(new VerifyEmailError("올바른 이메일 주소를 입력해주세요."));
        return;
      }

      if (data.code === "123456") {
        resolve({
          message: "이메일 인증이 완료되었습니다.",
        });
        return;
      }

      reject(
        new VerifyEmailError("인증 코드가 일치하지 않거나 만료되었습니다."),
      );
    }, 800);
  });
};

/**
 * 이메일 인증 코드 검증 API
 * POST /api/auth/email/verify
 */
export const verifyEmailCode = async (
  data: VerifyEmailRequest,
): Promise<VerifyEmailResponse> => {
  if (API_CONFIG.USE_MOCK) {
    return mockVerifyEmailCode(data);
  }

  try {
    const response = await apiClient.post<VerifyEmailResponse>(
      "/api/auth/email/verify",
      data,
    );

    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const errorData = error.response?.data as
        | VerifyEmailErrorResponse
        | undefined;

      const message =
        errorData?.message || "인증 코드가 일치하지 않거나 만료되었습니다.";

      throw new VerifyEmailError(message);
    }

    throw new VerifyEmailError("알 수 없는 오류가 발생했습니다.");
  }
};
