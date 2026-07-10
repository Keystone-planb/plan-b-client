import apiClient from "../client";
import { API_CONFIG, API_ENV } from "../config";
import type { WeatherNotification } from "../../src/types/notification";

const normalizeNotifications = (data: unknown): WeatherNotification[] => {
  if (Array.isArray(data)) return data as WeatherNotification[];

  if (!data || typeof data !== "object") {
    return [];
  }

  const record = data as Record<string, unknown>;
  const nestedCandidates = [
    record.notifications,
    record.data,
    record.result,
    record.results,
    record.content,
    record.items,
    record.payload,
  ];

  for (const candidate of nestedCandidates) {
    if (Array.isArray(candidate)) {
      return candidate as WeatherNotification[];
    }

    if (candidate && typeof candidate === "object") {
      const nested = normalizeNotifications(candidate);

      if (nested.length > 0) {
        return nested;
      }
    }
  }

  if (
    "id" in data &&
    (
      "planId" in data ||
      "tripPlaceId" in data ||
      "notificationId" in data
    )
  ) {
    return [data as WeatherNotification];
  }

  return [];
};

export const getWeatherNotifications = async (
  userId: number | string,
): Promise<WeatherNotification[]> => {
  try {
    const path = `/api/notifications/${userId}`;

    const response = await apiClient.get(path);
    const notifications = normalizeNotifications(response.data);

    return notifications;
  } catch (error) {
    if (__DEV__) {
      console.warn("[notifications] request failed:", error);
    }
    return [];
  }
};

export const dismissNotification = async (
  notificationId: number | string,
): Promise<boolean> => {
  try {
    await apiClient.post(`/api/notifications/${notificationId}/dismiss`);
    return true;
  } catch (error) {
    if (__DEV__) {
      console.warn("[notifications/dismiss] request failed:", error);
    }
    return false;
  }
};

export const replaceNotificationPlace = async (
  notificationId: number | string,
  newPlaceId: number | string,
): Promise<any | null> => {
  try {
    const response = await apiClient.post(
      `/api/notifications/${notificationId}/replace/${newPlaceId}`,
    );

    return response.data ?? true;
  } catch (error) {
    if (__DEV__) {
      console.warn("[notifications/replace] request failed:", error);
    }
    return null;
  }
};

