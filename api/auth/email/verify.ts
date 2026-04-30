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
  error?: string;
}

export class VerifyEmailError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "VerifyEmailError";
    this.status = status;
  }
}

const mockVerifyEmailCode = async ({
  email,
  code,
}: VerifyEmailRequest): Promise<VerifyEmailResponse> => {
  console.log("인증 코드 검증 요청 (mock):", {
    email,
    code,
  });

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!email || !email.includes("@")) {
        reject(new VerifyEmailError("올바른 이메일 주소를 입력해주세요."));
        return;
      }

      if (!code || code.trim().length !== 6) {
        reject(new VerifyEmailError("6자리 인증 코드를 입력해주세요."));
        return;
      }

      if (code === "123456") {
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
 *
 * Request Body:
 * {
 *   email: string;
 *   code: string;
 * }
 */
export const verifyEmailCode = async ({
  email,
  code,
}: VerifyEmailRequest): Promise<VerifyEmailResponse> => {
  if (API_CONFIG.USE_MOCK) {
    return mockVerifyEmailCode({ email, code });
  }

  try {
    const trimmedEmail = email.trim();
    const trimmedCode = code.trim();

    console.log("🔥 verifyEmailCode 호출됨");
    console.log("🔥 이메일 인증 검증 요청:", {
      email: trimmedEmail,
      code: trimmedCode,
    });

    const response = await apiClient.post<VerifyEmailResponse>(
      "/api/auth/email/verify",
      {
        email: trimmedEmail,
        code: trimmedCode,
      },
    );

    console.log("🔥 이메일 인증 검증 response.status:", response.status);
    console.log("🔥 이메일 인증 검증 response.data:", response.data);

    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.log("❌ 이메일 인증 검증 실패 status:", error.response?.status);
      console.log("❌ 이메일 인증 검증 실패 data:", error.response?.data);
      console.log("❌ 이메일 인증 검증 실패 message:", error.message);
      console.log("❌ 이메일 인증 검증 실패 url:", error.config?.url);
      console.log("❌ 이메일 인증 검증 실패 baseURL:", error.config?.baseURL);

      const status = error.response?.status;
      const errorData = error.response?.data as
        | VerifyEmailErrorResponse
        | string
        | undefined;

      if (!error.response && error.message === "Network Error") {
        throw new VerifyEmailError(
          "백엔드 서버에 연결할 수 없습니다. 서버 상태와 BASE_URL을 확인해주세요.",
        );
      }

      if (typeof errorData === "string") {
        const trimmed = errorData.trim();

        if (
          trimmed.startsWith("<!DOCTYPE html>") ||
          trimmed.startsWith("<html")
        ) {
          throw new VerifyEmailError(
            "이메일 인증 확인 요청이 API 서버가 아닌 다른 서버로 전달되고 있습니다. BASE_URL을 확인해주세요.",
            status,
          );
        }

        throw new VerifyEmailError(trimmed, status);
      }

      const serverMessage =
        errorData?.message ||
        errorData?.error ||
        "인증 코드가 일치하지 않거나 만료되었습니다.";

      throw new VerifyEmailError(serverMessage, status);
    }

    console.log("이메일 인증 검증 알 수 없는 에러:", error);
    throw new VerifyEmailError("알 수 없는 오류가 발생했습니다.");
  }
};
