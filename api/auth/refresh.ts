import apiClient from "../client";
import axios from "axios";
import { API_CONFIG } from "../config";

export interface RefreshRequest {
  refresh_token: string;
}

export interface RefreshResponse {
  access_token: string;
  expires_in: number;
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

export const requestRefresh = async ({
  refresh_token,
}: RefreshRequest): Promise<RefreshResponse> => {
  if (API_CONFIG.USE_MOCK) {
    return mockRequestRefresh({ refresh_token });
  }

  try {
    const response = await apiClient.post<RefreshResponse>(
      "/api/auth/refresh",
      { refresh_token },
    );

    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const errorMessage =
        error.response?.data?.message || "토큰 재발급에 실패했습니다.";
      throw new Error(errorMessage);
    }

    throw new Error("알 수 없는 오류가 발생했습니다.");
  }
};
