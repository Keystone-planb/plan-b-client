import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

import apiClient from "../client";

export interface LogoutResponse {
  message: string;
}

interface LogoutErrorResponse {
  message?: string;
  error?: string;
}

const clearBrowserStorage = () => {
  if (
    typeof window !== "undefined" &&
    window.localStorage
  ) {
    window.localStorage.removeItem("access_token");
    window.localStorage.removeItem("refresh_token");
    window.localStorage.removeItem("user_id");
    window.localStorage.removeItem("nickname");
  }
};

const clearAuthTokens = async () => {
  await AsyncStorage.multiRemove([
    "access_token",
    "refresh_token",
    "user_id",
    "nickname",
  ]);

  clearBrowserStorage();
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
  const refreshToken = await AsyncStorage.getItem("refresh_token");

  try {
    /**
     * 05/04 API 명세 기준:
     * POST /api/auth/logout
     * Request body: { refreshToken: string }
     *
     * 단, refresh_token이 없는 상태여도 앱에서는 로컬 토큰을 정리하고
     * 로그아웃 성공으로 처리한다.
     */
    if (!refreshToken || refreshToken.trim().length === 0) {
      await clearAuthTokens();

      return {
        message: "로그아웃 되었습니다.",
      };
    }

    const response = await apiClient.post<unknown>(
      "/api/auth/logout",
      {
        refreshToken,
      },
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

    if (!data || typeof data !== "object") {
      return {
        message: "로그아웃 되었습니다.",
      };
    }

    const logoutData = data as Partial<LogoutResponse>;

    return {
      message: logoutData.message || "로그아웃 되었습니다.",
    };
  } catch (error: unknown) {
    /**
     * 서버 로그아웃 실패 여부와 관계없이
     * 앱에서는 로컬 토큰을 반드시 삭제한다.
     */
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

      if (typeof errorData === "string") {
        throw new Error(errorData.trim());
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
