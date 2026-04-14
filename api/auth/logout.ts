import apiClient from "../client";
import axios from "axios";
import { API_CONFIG } from "../config";
import AsyncStorage from "@react-native-async-storage/async-storage";

/** 응답 타입 */
export interface LogoutResponse {
  message: string;
}

/** mock */
const mockLogout = async (): Promise<LogoutResponse> => {
  console.log("로그아웃 요청 (mock)");

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        message: "로그아웃 되었습니다.",
      });
    }, 500);
  });
};

/**
 * 로그아웃 API
 * POST /api/auth/logout
 */
export const requestLogout = async (): Promise<LogoutResponse> => {
  if (API_CONFIG.USE_MOCK) {
    // 🔥 mock에서도 토큰 삭제
    await AsyncStorage.removeItem("access_token");
    await AsyncStorage.removeItem("refresh_token");

    return mockLogout();
  }

  try {
    const response = await apiClient.post<LogoutResponse>("/api/auth/logout");

    // 🔥 서버 호출 성공 후 토큰 삭제
    await AsyncStorage.removeItem("access_token");
    await AsyncStorage.removeItem("refresh_token");

    return response.data;
  } catch (error: unknown) {
    // 🔥 실패해도 토큰은 제거 (안전하게 로그아웃 처리)
    await AsyncStorage.removeItem("access_token");
    await AsyncStorage.removeItem("refresh_token");

    if (axios.isAxiosError(error)) {
      const errorMessage =
        error.response?.data?.message || "로그아웃에 실패했습니다.";
      throw new Error(errorMessage);
    }

    throw new Error("알 수 없는 오류가 발생했습니다.");
  }
};
