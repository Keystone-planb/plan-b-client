import axios from "axios";
import { API_CONFIG } from "../../config";

const BASE_URL = "https://api.planb-travel.cloud/v1";

export interface RequestEmailCodeRequest {
  email: string;
}

export interface RequestEmailCodeResponse {
  message: string;
}

interface RequestEmailCodeErrorResponse {
  message?: string;
}

export class RequestEmailCodeError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "RequestEmailCodeError";
    this.status = status;
  }
}

const mockRequestEmailCode = async (
  data: RequestEmailCodeRequest,
): Promise<RequestEmailCodeResponse> => {
  console.log("인증 코드 발송 요청 (mock):", data.email);

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!data.email || !data.email.includes("@")) {
        reject(new RequestEmailCodeError("올바른 이메일 주소를 입력해주세요."));
        return;
      }

      resolve({
        message: "인증 코드가 이메일로 발송되었습니다. (유효시간 3분)",
      });
    }, 800);
  });
};

/**
 * 인증 코드 발송 API
 * POST /api/auth/email/request
 */
export const requestEmailCode = async (
  data: RequestEmailCodeRequest,
): Promise<RequestEmailCodeResponse> => {
  if (API_CONFIG.USE_MOCK) {
    return mockRequestEmailCode(data);
  }

  try {
    console.log("🔥 requestEmailCode 호출됨");
    console.log("인증 코드 발송 요청 (server):", data);
    console.log(
      "인증 코드 발송 최종 URL:",
      `${BASE_URL}/api/auth/email/request`,
    );

    const response = await axios.post<RequestEmailCodeResponse>(
      `${BASE_URL}/api/auth/email/request`,
      data,
      {
        timeout: 5000,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    console.log("인증 코드 발송 응답:", response.status, response.data);

    return response.data;
  } catch (error: unknown) {
    console.log("🔥 requestEmailCode catch 진입");

    if (axios.isAxiosError(error)) {
      console.log("인증 코드 발송 실패 status:", error.response?.status);
      console.log("인증 코드 발송 실패 data:", error.response?.data);
      console.log("인증 코드 발송 실패 headers:", error.response?.headers);
      console.log("인증 코드 발송 실패 message:", error.message);
      console.log("인증 코드 발송 실패 code:", error.code);
      console.log("인증 코드 발송 실패 url:", error.config?.url);
      console.log(
        "인증 코드 발송 실패 전체:",
        JSON.stringify({
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers,
          message: error.message,
          code: error.code,
          url: error.config?.url,
        }),
      );

      const errorData = error.response?.data as
        | RequestEmailCodeErrorResponse
        | undefined;

      const message = errorData?.message || "인증 코드 발송에 실패했습니다.";

      throw new RequestEmailCodeError(message, error.response?.status);
    }

    console.log("인증 코드 발송 알 수 없는 에러:", error);
    throw new RequestEmailCodeError("알 수 없는 오류가 발생했습니다.");
  }
};
