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
  originalPlace?: NotificationOriginalPlace;
  precipitationProb?: number;
};


export type NotificationOriginalPlace = {
  placeId?: number | string;
  tripPlaceId?: number | string;
  serverTripPlaceId?: number | string;
  googlePlaceId?: string;
  name?: string;
  address?: string;
  category?: string;
  latitude?: number;
  longitude?: number;
  visitTime?: string | null;
  endTime?: string | null;
  time?: string;
  space?: "INDOOR" | "OUTDOOR" | "MIX" | string;
  userRatingsTotal?: number;
  phoneNumber?: string;
  phone?: string;
  website?: string;
  priceLevel?: number;
  openingHours?: string | null;
  reviewData?: string | null;
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
  space?: "INDOOR" | "OUTDOOR" | "MIX" | string;
  userRatingsTotal?: number;
  phoneNumber?: string;
  phone?: string;
  website?: string;
  priceLevel?: number;
  openingHours?: string | null;
  reviewData?: string | null;
};
