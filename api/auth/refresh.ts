import axios from "axios";
import { API_CONFIG } from "../config";

const BASE_URL = API_CONFIG.BASE_URL;

export interface RefreshRequest {
  /**
   * AsyncStorage에 저장된 키 이름은 refresh_token 그대로 사용.
   * 단, 서버 요청 body에는 05/04 명세 기준으로 refreshToken으로 변환해서 보낸다.
   */
  refresh_token: string;
}

export interface RefreshResponse {
  success?: boolean;
  message?: string;
  access_token: string;
  token_type?: "Bearer" | string;
  expires_in?: number;
  user_id?: number;
  nickname?: string;
}

interface RefreshErrorResponse {
  message?: string;
  error?: string;
}

const mockRequestRefresh = async ({
  refresh_token,
}: RefreshRequest): Promise<RefreshResponse> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!refresh_token) {
        reject(new Error("리프레시 토큰이 없습니다."));
        return;
      }

      resolve({
        success: true,
        message: "mock Access Token이 재발급되었습니다.",
        access_token: "mock_new_access_token_999999",
        token_type: "Bearer",
        expires_in: 3600,
        user_id: 101,
        nickname: "test",
      });
    }, 700);
  });
};

const isRefreshResponse = (data: unknown): data is RefreshResponse => {
  if (!data || typeof data !== "object") return false;

  const obj = data as Record<string, unknown>;

  return typeof obj.access_token === "string" && obj.access_token.length > 0;
};

const isHtmlResponse = (data: unknown) => {
  if (typeof data !== "string") return false;

  const trimmed = data.trim().toLowerCase();

  return trimmed.startsWith("<!doctype html>") || trimmed.startsWith("<html");
};

/**
 * 토큰 재발급 API
 * POST /api/auth/refresh
 *
 * 05/04 API 명세 기준:
 * Request body는 { refreshToken: string }
 *
 * 프론트 저장 키:
 * AsyncStorage에는 기존대로 refresh_token 저장
 */
export const requestRefresh = async ({
  refresh_token,
}: RefreshRequest): Promise<RefreshResponse> => {
  if (API_CONFIG.USE_MOCK) {
    return mockRequestRefresh({ refresh_token });
  }

  if (!refresh_token || refresh_token.trim().length === 0) {
    throw new Error("리프레시 토큰이 없습니다.");
  }

  try {
    const response = await axios.post<unknown>(
      `${BASE_URL}/api/auth/refresh`,
      {
        refreshToken: refresh_token,
      },
      {
        timeout: 5000,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const data = response.data;

    if (isHtmlResponse(data)) {
      throw new Error(
        "토큰 재발급 API가 HTML을 반환했습니다. BASE_URL과 백엔드 서버 상태를 확인해주세요.",
      );
    }

    if (!isRefreshResponse(data)) {
      throw new Error(
        "새 access_token이 없습니다. 토큰 재발급 응답을 확인해주세요.",
      );
    }

    return data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const errorData = error.response?.data as
        | RefreshErrorResponse
        | string
        | undefined;

      if (!error.response && error.message === "Network Error") {
        throw new Error(
          "백엔드 서버에 연결할 수 없습니다. 서버 상태와 BASE_URL을 확인해주세요.",
        );
      }

      if (isHtmlResponse(errorData)) {
        throw new Error(
          "토큰 재발급 요청이 API 서버가 아닌 다른 서버로 전달되고 있습니다. BASE_URL을 확인해주세요.",
        );
      }

      if (typeof errorData === "string") {
        throw new Error(errorData.trim());
      }

      const errorMessage =
        errorData?.message || errorData?.error || "토큰 재발급에 실패했습니다.";

      throw new Error(errorMessage);
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("알 수 없는 오류가 발생했습니다.");
  }
};
