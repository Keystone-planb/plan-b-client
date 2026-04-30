import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

import apiClient from "../client";
import { API_CONFIG } from "../config";

export interface LogoutResponse {
  message: string;
}

interface LogoutErrorResponse {
  message?: string;
  error?: string;
}

const clearAuthTokens = async () => {
  await AsyncStorage.multiRemove(["access_token", "refresh_token"]);
};

const isHtmlResponse = (data: unknown) => {
  if (typeof data !== "string") return false;

  const trimmed = data.trim().toLowerCase();

  return trimmed.startsWith("<!doctype html>") || trimmed.startsWith("<html");
};

const getServerErrorMessage = (data: unknown) => {
  if (!data || typeof data !== "object") return null;

  const errorData = data as LogoutErrorResponse;

  return errorData.message || errorData.error || null;
};

export const requestLogout = async (): Promise<LogoutResponse> => {
  try {
        
    const response = await apiClient.post<LogoutResponse>(
      "/api/auth/logout",
      {},
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    const data = response.data;

        
    if (isHtmlResponse(data)) {
      throw new Error(
        "로그아웃 API가 HTML을 반환했습니다. BASE_URL, 포트, 백엔드 서버 상태를 확인해주세요.",
      );
    }

    await clearAuthTokens();

    return data ?? { message: "로그아웃 되었습니다." };
  } catch (error: unknown) {
    await clearAuthTokens();

    if (axios.isAxiosError(error)) {
                  
      const errorData = error.response?.data as
        | LogoutErrorResponse
        | string
        | undefined;

      if (!error.response && error.message === "Network Error") {
        throw new Error(
          "백엔드 서버에 연결할 수 없습니다. 서버 실행 여부와 포트를 확인해주세요.",
        );
      }

      if (isHtmlResponse(errorData)) {
        throw new Error(
          "로그아웃 요청이 API 서버가 아닌 다른 서버로 전달되고 있습니다. BASE_URL 또는 포트를 확인해주세요.",
        );
      }

      const serverMessage = getServerErrorMessage(errorData);

      if (serverMessage) {
        throw new Error(serverMessage);
      }

      if (error.response?.status === 401) {
        throw new Error("로그인 정보가 만료되었습니다. 다시 로그인해주세요.");
      }

      if (error.response?.status === 503) {
        throw new Error(
          "서버가 현재 사용할 수 없습니다. 백엔드 서버 상태를 확인해주세요.",
        );
      }

      throw new Error("로그아웃에 실패했습니다.");
    }

    if (error instanceof Error) {
      throw error;
    }

        throw new Error("알 수 없는 오류가 발생했습니다.");
  }
};
