import AsyncStorage from "@react-native-async-storage/async-storage";

import { requestRefresh, type RefreshResponse } from "./refresh";

let refreshPromise: Promise<RefreshResponse> | null = null;

const persistRefreshResponse = async (
  refreshed: RefreshResponse,
): Promise<void> => {
  const accessToken = refreshed.access_token;

  if (!accessToken || accessToken.trim().length === 0) {
    throw new Error("새 access_token이 없습니다.");
  }

  const storageEntries: [string, string][] = [
    ["access_token", accessToken],
  ];

  if (
    refreshed.refresh_token &&
    refreshed.refresh_token.trim().length > 0
  ) {
    storageEntries.push([
      "refresh_token",
      refreshed.refresh_token,
    ]);
  }

  if (refreshed.user_id) {
    storageEntries.push([
      "user_id",
      String(refreshed.user_id),
    ]);
  }

  if (refreshed.nickname) {
    storageEntries.push([
      "nickname",
      refreshed.nickname,
    ]);
  }

  await AsyncStorage.multiSet(storageEntries);
};

export const runRefreshOnce = async (
  refreshToken: string,
): Promise<RefreshResponse> => {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshed = await requestRefresh({
        refresh_token: refreshToken,
      });

      // 새 토큰 저장까지 완료되어야 공통 락을 해제한다.
      await persistRefreshResponse(refreshed);

      return refreshed;
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
};
