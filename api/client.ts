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

const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    const accessToken = await AsyncStorage.getItem("access_token");

    console.log("🌐 요청 baseURL:", config.baseURL);
    console.log("🌐 요청 url:", config.url);
    console.log("🌐 최종 요청 URL:", `${config.baseURL}${config.url}`);
    console.log("🌐 요청 method:", config.method);
    console.log("🌐 요청 data:", config.data);

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
    console.log("✅ 응답 status:", response.status);
    console.log("✅ 응답 data:", response.data);
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig;

    console.log("❌ 응답 에러 status:", error.response?.status);
    console.log("❌ 응답 에러 data:", error.response?.data);
    console.log("❌ 응답 에러 message:", error.message);

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem("refresh_token");

        if (!refreshToken) {
          throw new Error("refresh_token이 없습니다.");
        }

        const refreshResponse = await axios.post(
          `${API_CONFIG.BASE_URL}/api/auth/refresh`,
          {
            refresh_token: refreshToken,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        const newAccessToken = refreshResponse.data?.access_token;

        if (!newAccessToken) {
          throw new Error("새 access_token이 없습니다.");
        }

        await AsyncStorage.setItem("access_token", newAccessToken);

        const headers = (originalRequest.headers ?? {}) as AxiosRequestHeaders;
        headers.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers = headers;

        return apiClient(originalRequest);
      } catch (refreshError) {
        console.log("❌ 토큰 재발급 실패:", refreshError);

        await AsyncStorage.multiRemove(["access_token", "refresh_token"]);

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
