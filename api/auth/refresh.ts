import axios from "axios";
import { API_CONFIG } from "../config";

const BASE_URL = API_CONFIG.BASE_URL;

export interface RefreshRequest {
  refresh_token: string;
}

export interface RefreshResponse {
  success?: boolean;
  message?: string;
  access_token: string;
  accessToken?: string;
  refresh_token?: string;
  refreshToken?: string;
  token_type?: "Bearer" | string;
  expires_in?: number;
  user_id?: number;
  userId?: number;
  nickname?: string;
}

interface RefreshErrorResponse {
  message?: string;
  error?: string;
}

const isRefreshResponse = (data: unknown): data is RefreshResponse => {
  if (!data || typeof data !== "object") return false;

  const obj = data as Record<string, unknown>;
  const accessToken = obj.access_token ?? obj.accessToken;

  return typeof accessToken === "string" && accessToken.length > 0;
};

const normalizeRefreshResponse = (data: RefreshResponse): RefreshResponse => ({
  ...data,
  access_token: data.access_token ?? data.accessToken ?? "",
  refresh_token: data.refresh_token ?? data.refreshToken,
  user_id: data.user_id ?? data.userId,
});

const isHtmlResponse = (data: unknown) => {
  if (typeof data !== "string") return false;

  const trimmed = data.trim().toLowerCase();

  return trimmed.startsWith("<!doctype html>") || trimmed.startsWith("<html");
};

export const requestRefresh = async ({
  refresh_token,
}: RefreshRequest): Promise<RefreshResponse> => {
  if (!refresh_token || refresh_token.trim().length === 0) {
    throw new Error("리프레시 토큰이 없습니다.");
  }

  try {
    console.log("[requestRefresh] POST", `${BASE_URL}/api/auth/refresh`);
    console.log("[requestRefresh] body", {
      hasRefreshToken: Boolean(refresh_token),
      refreshTokenLength: refresh_token.length,
      preview: `${refresh_token.slice(0, 12)}...`,
    });

    const response = await axios.post<unknown>(
      `${BASE_URL}/api/auth/refresh`,
      {
        refresh_token,
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

    return normalizeRefreshResponse(data);
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

      console.log("[requestRefresh] failed:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        requestedUrl: `${BASE_URL}/api/auth/refresh`,
        method: error.config?.method,
        contentType: error.response?.headers?.["content-type"],
        server: error.response?.headers?.server,
        data: errorData,
      });

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
