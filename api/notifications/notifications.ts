import apiClient from "../client";
import type { WeatherNotification } from "../../src/types/notification";

const normalizeNotifications = (data: unknown): WeatherNotification[] => {
  if (Array.isArray(data)) return data as WeatherNotification[];

  if (
    data &&
    typeof data === "object" &&
    "notifications" in data &&
    Array.isArray((data as { notifications?: unknown }).notifications)
  ) {
    return (data as { notifications: WeatherNotification[] }).notifications;
  }

  if (
    data &&
    typeof data === "object" &&
    "data" in data &&
    Array.isArray((data as { data?: unknown }).data)
  ) {
    return (data as { data: WeatherNotification[] }).data;
  }

  if (
    data &&
    typeof data === "object" &&
    "id" in data &&
    "planId" in data
  ) {
    return [data as WeatherNotification];
  }

  return [];
};

export const getWeatherNotifications = async (
  userId: number | string,
): Promise<WeatherNotification[]> => {
  try {
    const response = await apiClient.get(`/api/notifications/${userId}`);
    const notifications = normalizeNotifications(response.data);

    return notifications;
  } catch (error) {
    console.log("[notifications] request failed:", error);
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
    console.log("[notifications/dismiss] request failed:", error);
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
    console.log("[notifications/replace] request failed:", error);
    return null;
  }
};

export const triggerWeatherCheck = async (
  userId?: number | string,
): Promise<boolean> => {
  const attempts = [
    {
      label: "body-userId",
      url: "/api/notifications/actions/trigger-weather-check",
      body: { userId },
    },
    {
      label: "query-userId",
      url: `/api/notifications/actions/trigger-weather-check?userId=${encodeURIComponent(
        String(userId ?? ""),
      )}`,
      body: {},
    },
    {
      label: "empty-body",
      url: "/api/notifications/actions/trigger-weather-check",
      body: {},
    },
  ];

  for (const attempt of attempts) {
    try {
      console.log("[notifications/trigger-weather-check] request:", attempt);

      const response = await apiClient.post(attempt.url, attempt.body);

      console.log("[notifications/trigger-weather-check] response:", {
        label: attempt.label,
        status: response.status,
        data: response.data,
      });

      return true;
    } catch (error: any) {
      console.log("[notifications/trigger-weather-check] attempt failed:", {
        label: attempt.label,
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message,
      });
    }
  }

  return false;
};


