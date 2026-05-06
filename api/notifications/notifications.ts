import apiClient from "../client";
import type {
  NotificationAlternativePlace,
  WeatherNotification,
} from "../../src/types/notification";

const MOCK_ALTERNATIVE_PLACES: NotificationAlternativePlace[] = [
  {
    placeId: 201,
    googlePlaceId: "mock-indoor-cafe-201",
    name: "경복궁 근처 실내 카페",
    address: "서울 종로구 사직로",
    rating: 4.5,
    category: "카페",
    latitude: 37.5776,
    longitude: 126.9769,
  },
  {
    placeId: 202,
    googlePlaceId: "mock-museum-202",
    name: "국립현대미술관 서울",
    address: "서울 종로구 삼청로",
    rating: 4.6,
    category: "실내 관광지",
    latitude: 37.5788,
    longitude: 126.9800,
  },
];

export const MOCK_WEATHER_NOTIFICATIONS: WeatherNotification[] = [
  {
    notificationId: 1,
    userId: 1,
    tripId: 1,
    tripPlaceId: 1,
    placeId: 101,
    placeName: "경복궁",
    message: "비 예보가 있어요. 야외 일정 대신 실내 장소를 추천받아보세요.",
    weatherType: "RAIN",
    recommendedPlaces: MOCK_ALTERNATIVE_PLACES,
    createdAt: new Date().toISOString(),
  },
];

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

  return [];
};

export const getWeatherNotifications = async (
  userId: number | string,
): Promise<WeatherNotification[]> => {
  try {
    const response = await apiClient.get(`/api/notifications/${userId}`);
    const notifications = normalizeNotifications(response.data);

    return notifications.length > 0 ? notifications : MOCK_WEATHER_NOTIFICATIONS;
  } catch (error) {
    console.log("[notifications] mock fallback:", error);
    return MOCK_WEATHER_NOTIFICATIONS;
  }
};

export const dismissNotification = async (
  notificationId: number | string,
): Promise<boolean> => {
  try {
    await apiClient.post(`/api/notifications/${notificationId}/dismiss`);
    return true;
  } catch (error) {
    console.log("[notifications/dismiss] mock fallback:", error);
    return true;
  }
};

export const replaceNotificationPlace = async (
  notificationId: number | string,
  newPlaceId: number | string,
): Promise<boolean> => {
  try {
    await apiClient.post(
      `/api/notifications/${notificationId}/replace/${newPlaceId}`,
    );
    return true;
  } catch (error) {
    console.log("[notifications/replace] mock fallback:", error);
    return true;
  }
};
