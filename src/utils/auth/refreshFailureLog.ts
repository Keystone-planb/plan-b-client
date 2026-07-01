import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "last_refresh_failure_log";

export type RefreshFailureLog = {
  occurredAt: string;
  status: number | null;
  statusText: string | null;
  requestedUrl: string;
  method: string | null;
  contentType: string | null;
  server: string | null;
  data: unknown;
};

export const saveRefreshFailureLog = async (
  log: RefreshFailureLog,
): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(log),
    );
  } catch {
    // 진단 로그 저장 실패는 인증 처리에 영향을 주지 않는다.
  }
};

export const getRefreshFailureLog =
  async (): Promise<RefreshFailureLog | null> => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);

      if (!raw) {
        return null;
      }

      return JSON.parse(raw) as RefreshFailureLog;
    } catch {
      return null;
    }
  };

export const clearRefreshFailureLog =
  async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {
      // 진단 로그 삭제 실패는 무시한다.
    }
  };
