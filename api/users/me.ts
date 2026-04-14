// src/api/users/me.ts

import apiClient from "../client";
import axios from "axios";

/** mock 사용 여부 */
const USE_MOCK = true;

/** 유저 정보 타입 */
export interface MeResponse {
  id: number;
  email: string;
  nickname: string;
}

/**
 * 내 정보 조회 API
 * GET /api/users/me
 */
export const getMe = async (): Promise<MeResponse> => {
  if (USE_MOCK) {
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
    const response = await apiClient.get<MeResponse>("/api/users/me");

    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.message || "유저 정보 조회에 실패했습니다.";
      throw new Error(message);
    }

    throw new Error("알 수 없는 오류가 발생했습니다.");
  }
};
