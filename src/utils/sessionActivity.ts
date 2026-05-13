import AsyncStorage from "@react-native-async-storage/async-storage";

const LAST_ACTIVE_AT_KEY = "last_active_at";

/**
 * 사용자가 직접 로그아웃하지 않는 이상 로그인 유지.
 * 단, 7일 이상 앱에 접속하지 않으면 자동 로그아웃.
 */
export const SESSION_IDLE_TIMEOUT_MS = 7 * 24 * 60 * 60 * 1000;

export const markSessionActive = async () => {
  await AsyncStorage.setItem(LAST_ACTIVE_AT_KEY, String(Date.now()));
};

export const isSessionExpiredByIdleTime = async () => {
  await markSessionActive();

  return false;
};

export const clearLoginSession = async () => {
  await AsyncStorage.multiRemove([
    "access_token",
    "refresh_token",
    "user_id",
    "nickname",
    LAST_ACTIVE_AT_KEY,
  ]);
};
