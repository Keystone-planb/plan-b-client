export type WeatherNotification = {
  notificationId: number | string;
  userId?: number | string;
  tripId?: number | string;
  tripPlaceId?: number | string;
  placeId?: number | string;
  placeName?: string;
  message: string;
  weatherType?: "RAIN" | "SNOW" | "HEAT" | "COLD" | "WIND" | string;
  recommendedPlaces?: NotificationAlternativePlace[];
  createdAt?: string;
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
};
