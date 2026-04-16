import apiClient from "../client";
import axios from "axios";
import { API_CONFIG } from "../config";
import AsyncStorage from "@react-native-async-storage/async-storage";

/** 응답 타입 */
export interface LogoutResponse {
  message: string;
}

interface LogoutErrorResponse {
  message?: string;
}

const clearAuthTokens = async () => {
  await AsyncStorage.removeItem("access_token");
  await AsyncStorage.removeItem("refresh_token");
};

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
    await clearAuthTokens();
    return mockLogout();
  }

  try {
    console.log("로그아웃 요청 (server)");

    const response = await apiClient.post<LogoutResponse>("/api/auth/logout");

    console.log("로그아웃 응답:", response.status, response.data);

    await clearAuthTokens();

    return response.data;
  } catch (error: unknown) {
    await clearAuthTokens();

    if (axios.isAxiosError(error)) {
      console.log("로그아웃 실패 status:", error.response?.status);
      console.log("로그아웃 실패 data:", error.response?.data);
      console.log("로그아웃 실패 message:", error.message);

      const errorData = error.response?.data as LogoutErrorResponse | undefined;
      const errorMessage = errorData?.message || "로그아웃에 실패했습니다.";

      throw new Error(errorMessage);
    }

    console.log("로그아웃 알 수 없는 에러:", error);
    throw new Error("알 수 없는 오류가 발생했습니다.");
  }
};
