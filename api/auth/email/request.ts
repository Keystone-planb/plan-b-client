import apiClient from "../../client";
import axios from "axios";
import { API_CONFIG } from "../../config";

export interface RequestEmailCodeRequest {
  email: string;
}

export interface RequestEmailCodeResponse {
  message: string;
}

interface RequestEmailCodeErrorResponse {
  message?: string;
  error?: string;
}

export class RequestEmailCodeError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "RequestEmailCodeError";
    this.status = status;
  }
}

const mockRequestEmailCode = async ({
  email,
}: RequestEmailCodeRequest): Promise<RequestEmailCodeResponse> => {
  
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!email || !email.includes("@")) {
        reject(new RequestEmailCodeError("올바른 이메일 주소를 입력해주세요."));
        return;
      }

      resolve({
        message: "인증 코드가 이메일로 발송되었습니다. 유효시간은 3분입니다.",
      });
    }, 800);
  });
};

/**
 * 이메일 인증 코드 발송 API
 * POST /api/auth/email/request
 *
 * Request Body:
 * {
 *   email: string
 * }
 */
export const requestEmailCode = async ({
  email,
}: RequestEmailCodeRequest): Promise<RequestEmailCodeResponse> => {
  if (API_CONFIG.USE_MOCK) {
    return mockRequestEmailCode({ email });
  }

  try {
    const trimmedEmail = email.trim();

        
    const response = await apiClient.post<RequestEmailCodeResponse>(
      "/api/auth/email/request",
      {
        email: trimmedEmail,
      },
    );

        
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
                              
      const status = error.response?.status;
      const errorData = error.response?.data as
        | RequestEmailCodeErrorResponse
        | string
        | undefined;

      if (!error.response && error.message === "Network Error") {
        throw new RequestEmailCodeError(
          "백엔드 서버에 연결할 수 없습니다. 서버 상태와 BASE_URL을 확인해주세요.",
        );
      }

      if (typeof errorData === "string") {
        const trimmed = errorData.trim();

        if (
          trimmed.startsWith("<!DOCTYPE html>") ||
          trimmed.startsWith("<html")
        ) {
          throw new RequestEmailCodeError(
            "이메일 인증 요청이 API 서버가 아닌 다른 서버로 전달되고 있습니다. BASE_URL을 확인해주세요.",
            status,
          );
        }

        throw new RequestEmailCodeError(trimmed, status);
      }

      const serverMessage =
        errorData?.message ||
        errorData?.error ||
        "인증 코드 발송에 실패했습니다.";

      throw new RequestEmailCodeError(serverMessage, status);
    }

        throw new RequestEmailCodeError("알 수 없는 오류가 발생했습니다.");
  }
};
