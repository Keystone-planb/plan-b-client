import { requestRefresh, type RefreshResponse } from "./refresh";

let refreshPromise: Promise<RefreshResponse> | null = null;

export const runRefreshOnce = async (refreshToken: string) => {
  if (!refreshPromise) {
    refreshPromise = requestRefresh({
      refresh_token: refreshToken,
    }).finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
};
