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

const mockRequestEmailCode = async ({
  email,
}: RequestEmailCodeRequest): Promise<RequestEmailCodeResponse> => {
  console.log("인증 코드 발송 요청 (mock):", email);

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!email || !email.includes("@")) {
        reject(new RequestEmailCodeError("올바른 이메일 주소를 입력해주세요."));
        return;
      }

      resolve({
        message: "인증 코드가 이메일로 발송되었습니다. (유효시간 3분)",
      });
    }, 800);
  });
};

const getRequestEmailCodeUrl = () => `${BASE_URL}/api/auth/email/request`;

/**
 * 인증 코드 발송 API
 * POST /api/auth/email/request
 */
export const requestEmailCode = async ({
  email,
}: RequestEmailCodeRequest): Promise<RequestEmailCodeResponse> => {
  if (API_CONFIG.USE_MOCK) {
    return mockRequestEmailCode({ email });
  }

  const url = getRequestEmailCodeUrl();

  try {
    console.log("🔥 requestEmailCode 호출됨");
    console.log("인증 코드 발송 요청 (server):", { email });
    console.log("인증 코드 발송 최종 URL:", url);

    const response = await axios.post<RequestEmailCodeResponse>(
      url,
      { email },
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
      const status = error.response?.status;
      const data = error.response?.data as
        | RequestEmailCodeErrorResponse
        | undefined;
      const message = data?.message || "인증 코드 발송에 실패했습니다.";

      console.log("인증 코드 발송 실패 status:", status);
      console.log("인증 코드 발송 실패 data:", data);
      console.log("인증 코드 발송 실패 message:", error.message);
      console.log("인증 코드 발송 실패 code:", error.code);
      console.log("인증 코드 발송 실패 url:", error.config?.url);

      throw new RequestEmailCodeError(message, status);
    }

    console.log("인증 코드 발송 알 수 없는 에러:", error);
    throw new RequestEmailCodeError("알 수 없는 오류가 발생했습니다.");
  }
};
