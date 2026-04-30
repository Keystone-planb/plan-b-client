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
    
    const response = await apiClient.get<MeResponse>("/api/users/me");

    
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
                  
      const errorData = error.response?.data as MeErrorResponse | undefined;
      const message = errorData?.message || "유저 정보 조회에 실패했습니다.";

      throw new Error(message);
    }

        throw new Error("알 수 없는 오류가 발생했습니다.");
  }
};
