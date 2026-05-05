import apiClient from "../client";
import axios from "axios";
import { API_CONFIG } from "../config";

export interface MeResponse {
  id?: number;
  userId?: number;
  user_id?: number;
  email: string;
  nickname: string;
  provider?: string;
}

interface MeErrorResponse {
  message?: string;
  error?: string;
}

const mockGetMe = async (): Promise<MeResponse> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: 1,
        email: "test@planb.com",
        nickname: "플랜비유저",
        provider: "local",
      });
    }, 500);
  });
};

const isHtmlResponse = (data: unknown) => {
  if (typeof data !== "string") return false;

  const trimmed = data.trim().toLowerCase();

  return trimmed.startsWith("<!doctype html>") || trimmed.startsWith("<html");
};

const isMeResponse = (data: unknown): data is MeResponse => {
  if (!data || typeof data !== "object") {
    return false;
  }

  const obj = data as Record<string, unknown>;

  return typeof obj.email === "string" && typeof obj.nickname === "string";
};

/**
 * 내 정보 조회 API
 * GET /api/users/me
 */
export const getMe = async (): Promise<MeResponse> => {
  if (API_CONFIG.USE_MOCK) {
    return mockGetMe();
  }

  try {
    const response = await apiClient.get<unknown>("/api/users/me");

    const data = response.data;

    if (isHtmlResponse(data)) {
      throw new Error(
        "내 정보 조회 API가 HTML을 반환했습니다. BASE_URL과 백엔드 서버 상태를 확인해주세요.",
      );
    }

    if (!isMeResponse(data)) {
      throw new Error("유저 정보 응답 형식이 올바르지 않습니다.");
    }

    return data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const errorData = error.response?.data as
        | MeErrorResponse
        | string
        | undefined;

      if (!error.response && error.message === "Network Error") {
        throw new Error(
          "백엔드 서버에 연결할 수 없습니다. 서버 상태와 BASE_URL을 확인해주세요.",
        );
      }

      if (isHtmlResponse(errorData)) {
        throw new Error(
          "내 정보 조회 요청이 API 서버가 아닌 다른 서버로 전달되고 있습니다. BASE_URL을 확인해주세요.",
        );
      }

      if (typeof errorData === "string") {
        throw new Error(errorData.trim());
      }

      const message =
        errorData?.message ||
        errorData?.error ||
        "유저 정보 조회에 실패했습니다.";

      throw new Error(message);
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("알 수 없는 오류가 발생했습니다.");
  }
};
