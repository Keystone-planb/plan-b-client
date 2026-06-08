import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosRequestHeaders,
} from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_CONFIG } from "./config";
import { runRefreshOnce } from "./auth/refreshLock";
import { emitAuthExpired } from "../src/utils/authEvents";

// refresh가 실패하면 일정 시간 동안 추가 refresh 시도를 막아(쿨다운),
// 무한 재시도로 /api/auth/refresh를 폭주시켜 WAF에 차단되는 루프를 방지한다.
const REFRESH_COOLDOWN_MS = 30000;
let lastRefreshFailureAt = 0;

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

type RefreshResponse = {
  success?: boolean;
  message?: string;
  access_token?: string;
  refresh_token?: string;
  token_type?: "Bearer" | string;
  user_id?: number;
  nickname?: string;
};

const TOKEN_KEYS = ["access_token", "refresh_token"] as const;
const AUTH_STORAGE_KEYS = [
  "access_token",
  "refresh_token",
  "user_id",
  "nickname",
] as const;

const clearStoredAuth = async () => {
  await AsyncStorage.multiRemove([...AUTH_STORAGE_KEYS]);

  if (typeof window !== "undefined" && window.localStorage) {
    AUTH_STORAGE_KEYS.forEach((key) => {
      window.localStorage.removeItem(key);
    });
  }
};

// ===============================
// MVP Trip Cache Layer (safe)
// ===============================
const tripCache = new Map<string, { data: any; time: number }>();

const getCachedTrip = async <T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = 10000,
): Promise<T> => {
  const now = Date.now();
  const cached = tripCache.get(key);

  if (cached && now - cached.time < ttlMs) {
    return cached.data;
  }

  const data = await fetcher();

  tripCache.set(key, {
    data,
    time: now,
  });

  return data;
};

const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
});

const isBrowserLocalStorageAvailable = () => {
  return typeof window !== "undefined" && Boolean(window.localStorage);
};

const getStoredValue = async (key: string) => {
  const asyncStorageValue = await AsyncStorage.getItem(key);

  if (asyncStorageValue && asyncStorageValue.trim().length > 0) {
    return asyncStorageValue;
  }

  if (isBrowserLocalStorageAvailable()) {
    const localStorageValue = window.localStorage.getItem(key);

    if (localStorageValue && localStorageValue.trim().length > 0) {
      return localStorageValue;
    }
  }

  return null;
};

const setStoredValue = async (key: string, value: string) => {
  await AsyncStorage.setItem(key, value);

  if (isBrowserLocalStorageAvailable()) {
    window.localStorage.setItem(key, value);
  }
};

const removeStoredValues = async (keys: readonly string[]) => {
  console.log("[TOKEN_STORE] removeStoredValues called:", {
    keys,
  });

  await AsyncStorage.multiRemove([...keys]);

  if (isBrowserLocalStorageAvailable()) {
    keys.forEach((key) => {
      window.localStorage.removeItem(key);
    });
  }
};

const isHtmlResponse = (data: unknown) => {
  if (typeof data !== "string") return false;

  const trimmed = data.trim().toLowerCase();

  return trimmed.startsWith("<!doctype html>") || trimmed.startsWith("<html");
};

const shouldSkipAuthHeader = (url?: string) => {
  const targetUrl = String(url ?? "");

  return (
    targetUrl.includes("/api/auth/login") ||
    targetUrl.includes("/api/auth/refresh") ||
    targetUrl.includes("/api/users/signup") ||
    targetUrl.includes("/api/auth/email/request") ||
    targetUrl.includes("/api/auth/email/verify")
  );
};

apiClient.interceptors.request.use(
  async (config) => {
    const accessToken = await getStoredValue("access_token");
    const skipAuthHeader = shouldSkipAuthHeader(config.url);

    if (accessToken && !skipAuthHeader) {
      const headers = (config.headers ?? {}) as AxiosRequestHeaders;
      headers.Authorization = `Bearer ${accessToken}`;
      config.headers = headers;
    }

    if (skipAuthHeader) {
      const headers = (config.headers ?? {}) as AxiosRequestHeaders;
      delete headers.Authorization;
      config.headers = headers;
    }

    console.log("[apiClient] request:", {
      method: config.method,
      url: config.url,
      hasAccessToken: Boolean(accessToken),
      skipAuthHeader,
    });

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

    console.log("[apiClient] response error:", {
      status: error.response?.status,
      url: originalRequest?.url,
      method: originalRequest?.method,
      message: error.message,
      skipAuthHeader: shouldSkipAuthHeader(originalRequest?.url),
    });

    const originalUrl = String(originalRequest?.url ?? "");
    const isOptionalAuthRequest =
      originalUrl.includes("/api/notifications/") ||
      originalUrl.includes("/api/preferences/");

    const isAuthRequest =
      originalUrl.includes("/api/auth/login") ||
      originalUrl.includes("/api/auth/refresh") ||
      originalUrl.includes("/api/auth/logout") ||
      originalUrl.includes("/api/users/signup") ||
      originalUrl.includes("/oauth2/authorization/");

    const isSkipAuthHeaderRequest = shouldSkipAuthHeader(originalUrl);
    const shouldTryRefresh =
      !isOptionalAuthRequest &&
      !isAuthRequest &&
      !isSkipAuthHeaderRequest &&
      // 백엔드(Spring Security)가 만료/무효 토큰에 401 대신 403을 반환하는 경우가 있어
      // 403도 토큰 갱신 대상에 포함한다. (refresh가 성공하면 재요청, 실패 시에만 처리)
      (error.response?.status === 401 || error.response?.status === 403) &&
      originalRequest &&
      !originalRequest._retry &&
      // 직전에 refresh가 실패했다면 쿨다운 동안 재시도하지 않는다(폭주/WAF 차단 방지).
      Date.now() - lastRefreshFailureAt > REFRESH_COOLDOWN_MS;

    if (shouldTryRefresh) {
      console.log("[apiClient] refresh required:", {
        status: error.response?.status,
        url: originalRequest?.url,
        method: originalRequest?.method,
        hasOriginalRequest: Boolean(originalRequest),
      });

      originalRequest._retry = true;

      try {
        const refreshToken = await getStoredValue("refresh_token");

        console.log("[apiClient] stored token state before refresh:", {
          hasRefreshToken: Boolean(refreshToken),
          refreshTokenLength: refreshToken?.length ?? 0,
        });

        if (!refreshToken || refreshToken.trim().length === 0) {
          throw new Error("로그인이 만료되었습니다. 다시 로그인해주세요.");
        }

        const data = await runRefreshOnce(refreshToken);

        if (isHtmlResponse(data)) {
          throw new Error(
            "토큰 재발급 API가 HTML을 반환했습니다. BASE_URL과 백엔드 서버 상태를 확인해주세요.",
          );
        }

        const newAccessToken = data?.access_token;
        const newRefreshToken = data?.refresh_token;

        if (!newAccessToken || newAccessToken.length === 0) {
          throw new Error("새 access_token이 없습니다.");
        }

        // refresh 성공 → 쿨다운 해제
        lastRefreshFailureAt = 0;

        await setStoredValue("access_token", newAccessToken);

        if (newRefreshToken && newRefreshToken.trim().length > 0) {
          await setStoredValue("refresh_token", newRefreshToken);
        }

        if (data.user_id) {
          await setStoredValue("user_id", String(data.user_id));
        }

        if (data.nickname) {
          await setStoredValue("nickname", data.nickname);
        }

        const headers = (originalRequest.headers ?? {}) as AxiosRequestHeaders;
        headers.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers = headers;

        return apiClient(originalRequest);
      } catch (refreshError) {
        // refresh 실패 시각 기록 → 쿨다운 동안 추가 refresh 폭주 차단
        lastRefreshFailureAt = Date.now();

        console.log("[apiClient] token refresh failed:", refreshError);

        console.log("[apiClient] token refresh failed:", {
          refreshError,
          originalUrl: originalRequest?.url,
          originalMethod: originalRequest?.method,
          responseStatus: error.response?.status,
        });

        const refreshResponseStatus =
          (
            refreshError &&
            typeof refreshError === "object" &&
            "response" in refreshError &&
            refreshError.response &&
            typeof refreshError.response === "object" &&
            "status" in refreshError.response
          ) ?
            Number(refreshError.response.status)
          : undefined;

        // refresh 요청이 ELB/WAF 등 게이트웨이에 막혀(비-API 응답) 실패한 경우에도
        // 토큰을 유지하면 화면이 계속 재시도 → refresh 폭주 → WAF 차단의 무한 루프가 발생한다.
        // 이 경우에도 토큰을 정리해 루프를 끊고 재로그인하도록 한다.
        const refreshErrorMessage =
          refreshError instanceof Error ?
            refreshError.message
          : String(refreshError ?? "");

        // 토큰을 정리(=강제 로그아웃)하는 건 "refresh 토큰이 실제로 무효"일 때만 한다.
        // ELB/WAF 일시 차단(HTML 403)·네트워크 블립 등 일시적 실패로는 로그아웃시키지 않는다.
        // (그렇지 않으면 토큰이 멀쩡한데도 잦은 강제 로그아웃이 발생함)
        const refreshTokenInvalid =
          refreshResponseStatus === 401 ||
          refreshErrorMessage.includes("유효하지 않은") ||
          refreshErrorMessage.includes("만료") ||
          refreshErrorMessage.includes("Refresh Token") ||
          refreshErrorMessage.includes("Invalid");

        const isGatewayBlocked =
          refreshErrorMessage.includes("다른 서버로 전달") ||
          refreshErrorMessage.includes("HTML을 반환");

        const shouldClearAuth = refreshTokenInvalid && !isGatewayBlocked;

        if (shouldClearAuth) {
          console.log("[apiClient] clearing tokens after refresh failure:", {
            originalUrl: originalRequest?.url,
            reason: "refresh_failed",
            refreshResponseStatus,
          });

          await clearStoredAuth();
          // 세션 만료 → 앱에 알려 로그인 화면으로 보낸다.
          emitAuthExpired();
        } else {
          console.log("[apiClient] keep tokens after refresh failure:", {
            originalUrl: originalRequest?.url,
            reason: "refresh_failed_but_not_auth_invalid",
            refreshResponseStatus,
          });
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
