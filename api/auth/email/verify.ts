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
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "VerifyEmailError";
    this.status = status;
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

      if (!data.code || data.code.length < 6) {
        reject(new VerifyEmailError("6자리 인증 코드를 입력해주세요."));
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
    console.log("인증 코드 검증 요청 (server):", data);

    const response = await apiClient.post<VerifyEmailResponse>(
      "/api/auth/email/verify",
      data,
    );

    console.log("인증 코드 검증 응답:", response.status, response.data);

    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.log("인증 코드 검증 실패 status:", error.response?.status);
      console.log("인증 코드 검증 실패 data:", error.response?.data);
      console.log("인증 코드 검증 실패 message:", error.message);

      const errorData = error.response?.data as
        | VerifyEmailErrorResponse
        | undefined;

      const message =
        errorData?.message || "인증 코드가 일치하지 않거나 만료되었습니다.";

      throw new VerifyEmailError(message, error.response?.status);
    }

    console.log("인증 코드 검증 알 수 없는 에러:", error);
    throw new VerifyEmailError("알 수 없는 오류가 발생했습니다.");
  }
};
