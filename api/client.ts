import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosRequestHeaders,
} from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_CONFIG } from "./config";

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

type RefreshResponse = {
  success?: boolean;
  message?: string;
  access_token?: string;
  token_type?: "Bearer" | string;
  user_id?: number;
  nickname?: string;
};

const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  },
});

const isHtmlResponse = (data: unknown) => {
  if (typeof data !== "string") return false;

  const trimmed = data.trim().toLowerCase();

  return trimmed.startsWith("<!doctype html>") || trimmed.startsWith("<html");
};

apiClient.interceptors.request.use(
  async (config) => {
    const accessToken = await AsyncStorage.getItem("access_token");

    if (accessToken) {
      const headers = (config.headers ?? {}) as AxiosRequestHeaders;
      headers.Authorization = `Bearer ${accessToken}`;
      config.headers = headers;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem("refresh_token");

        if (!refreshToken || refreshToken.trim().length === 0) {
          throw new Error("refresh_token이 없습니다.");
        }

        const refreshResponse = await axios.post<RefreshResponse>(
          `${API_CONFIG.BASE_URL}/api/auth/refresh`,
          {
            refreshToken,
          },
          {
            timeout: 5000,
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        const data = refreshResponse.data;

        if (isHtmlResponse(data)) {
          throw new Error(
            "토큰 재발급 API가 HTML을 반환했습니다. BASE_URL과 백엔드 서버 상태를 확인해주세요.",
          );
        }

        const newAccessToken = data?.access_token;

        if (!newAccessToken || newAccessToken.length === 0) {
          throw new Error("새 access_token이 없습니다.");
        }

        await AsyncStorage.setItem("access_token", newAccessToken);

        const headers = (originalRequest.headers ?? {}) as AxiosRequestHeaders;
        headers.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers = headers;

        return apiClient(originalRequest);
      } catch (refreshError) {
        await AsyncStorage.multiRemove(["access_token", "refresh_token"]);

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
