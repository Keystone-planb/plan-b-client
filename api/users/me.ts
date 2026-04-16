import apiClient from "../client";
import axios from "axios";
import { API_CONFIG } from "../config";

export interface MeResponse {
  id: number;
  email: string;
  nickname: string;
}

interface MeErrorResponse {
  message?: string;
}

/**
 * 내 정보 조회 API
 * GET /api/users/me
 */
export const getMe = async (): Promise<MeResponse> => {
  if (API_CONFIG.USE_MOCK) {
    console.log("내 정보 조회 (mock)");

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: 1,
          email: "test@planb.com",
          nickname: "플랜비유저",
        });
      }, 500);
    });
  }

  try {
    console.log("내 정보 조회 요청 (server)");

    const response = await apiClient.get<MeResponse>("/api/users/me");

    console.log("내 정보 조회 응답:", response.status, response.data);

    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.log("내 정보 조회 실패 status:", error.response?.status);
      console.log("내 정보 조회 실패 data:", error.response?.data);
      console.log("내 정보 조회 실패 message:", error.message);

      const errorData = error.response?.data as MeErrorResponse | undefined;
      const message = errorData?.message || "유저 정보 조회에 실패했습니다.";

      throw new Error(message);
    }

    console.log("내 정보 조회 알 수 없는 에러:", error);
    throw new Error("알 수 없는 오류가 발생했습니다.");
  }
};
