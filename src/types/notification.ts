export type WeatherNotification = {
  /**
   * 기존 프론트 필드
   */
  notificationId?: number | string;
  userId?: number | string;
  tripId?: number | string;
  tripPlaceId?: number | string;
  placeId?: number | string;
  placeName?: string;
  message?: string;
  weatherType?: "RAIN" | "SNOW" | "HEAT" | "COLD" | "WIND" | string;
  recommendedPlaces?: NotificationAlternativePlace[];
  createdAt?: string;

  /**
   * 서버 테스트 알림 응답 필드
   */
  id?: number | string;
  planId?: number | string;
  title?: string;
  body?: string;
  type?: string;
  alternatives?: NotificationAlternativePlace[];
  precipitationProb?: number;
};

export type NotificationAlternativePlace = {
  placeId: number | string;
  googlePlaceId?: string;
  name: string;
  address?: string;
  rating?: number;
  category?: string;
  latitude?: number;
  longitude?: number;
  photoUrl?: string;
};
