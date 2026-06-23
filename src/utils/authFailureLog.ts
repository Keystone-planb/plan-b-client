import AsyncStorage from "@react-native-async-storage/async-storage";

const AUTH_FAILURE_LOG_KEY = "@planb/last_auth_failure";

export type AuthFailureLog = {
  occurredAt: string;
  requestUrl: string | null;
  requestMethod: string | null;
  originalStatus: number | null;
  refreshTokenExists: boolean;
  refreshStatus: number | null;
  refreshErrorMessage: string | null;
  reason:
    | "refresh_token_missing"
    | "refresh_api_401"
    | "refresh_token_expired"
    | "refresh_token_invalid";
  action: "clear_tokens_and_redirect_login";
};

const isBrowserStorageAvailable = () =>
  typeof window !== "undefined" &&
  Boolean(window.localStorage);

export const saveAuthFailureLog = async (
  log: AuthFailureLog,
): Promise<void> => {
  const serialized = JSON.stringify(log);

  await AsyncStorage.setItem(
    AUTH_FAILURE_LOG_KEY,
    serialized,
  );

  if (isBrowserStorageAvailable()) {
    window.localStorage.setItem(
      AUTH_FAILURE_LOG_KEY,
      serialized,
    );
  }
};

export const getAuthFailureLog =
  async (): Promise<AuthFailureLog | null> => {
    const stored =
      (await AsyncStorage.getItem(
        AUTH_FAILURE_LOG_KEY,
      )) ??
      (isBrowserStorageAvailable()
        ? window.localStorage.getItem(
            AUTH_FAILURE_LOG_KEY,
          )
        : null);

    if (!stored) {
      return null;
    }

    try {
      return JSON.parse(
        stored,
      ) as AuthFailureLog;
    } catch (error) {
      console.warn(
        "[AuthFailureReport] 저장 기록 파싱 실패:",
        error,
      );

      return null;
    }
  };

export const clearAuthFailureLog =
  async (): Promise<void> => {
    await AsyncStorage.removeItem(
      AUTH_FAILURE_LOG_KEY,
    );

    if (isBrowserStorageAvailable()) {
      window.localStorage.removeItem(
        AUTH_FAILURE_LOG_KEY,
      );
    }
  };
