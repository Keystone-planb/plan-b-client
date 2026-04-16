import axios from "axios";
import { API_CONFIG } from "../config";

const BASE_URL = "https://api.planb-travel.cloud/v1";

export interface RefreshRequest {
  refresh_token: string;
}

export interface RefreshResponse {
  access_token: string;
  expires_in: number;
}

interface RefreshErrorResponse {
  message?: string;
}

const mockRequestRefresh = async ({
  refresh_token,
}: RefreshRequest): Promise<RefreshResponse> => {
  console.log("토큰 재발급 요청 (mock):", refresh_token);

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!refresh_token) {
        reject(new Error("리프레시 토큰이 없습니다."));
        return;
      }

      resolve({
        access_token: "mock_new_access_token_999999",
        expires_in: 3600,
      });
    }, 700);
  });
};

/**
 * 토큰 재발급 API
 * POST /api/auth/refresh
 */
export const requestRefresh = async ({
  refresh_token,
}: RefreshRequest): Promise<RefreshResponse> => {
  if (API_CONFIG.USE_MOCK) {
    return mockRequestRefresh({ refresh_token });
  }

  try {
    console.log("토큰 재발급 요청 (server):", { refresh_token });

    const response = await axios.post<RefreshResponse>(
      `${BASE_URL}/api/auth/refresh`,
      { refresh_token },
      {
        timeout: 5000,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    console.log("토큰 재발급 응답:", response.status, response.data);

    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.log("토큰 재발급 실패 status:", error.response?.status);
      console.log("토큰 재발급 실패 data:", error.response?.data);
      console.log("토큰 재발급 실패 message:", error.message);

      const errorData = error.response?.data as
        | RefreshErrorResponse
        | undefined;

      const errorMessage = errorData?.message || "토큰 재발급에 실패했습니다.";

      throw new Error(errorMessage);
    }

    console.log("토큰 재발급 알 수 없는 에러:", error);
    throw new Error("알 수 없는 오류가 발생했습니다.");
  }
};
