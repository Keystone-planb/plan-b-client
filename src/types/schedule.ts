export type ScheduleMemo = {
  id: string;
  text: string;
  createdAt: string;
  updatedAt: string;
};

export type SchedulePlace = {
  id: string;

  /**
   * 서버에서 생성된 여행 장소 ID
   * POST /api/trips/{tripId}/days/{day}/locations 응답의 tripPlaceId
   *
   * 대안 추천 payload의 tripPlaceId에는 이 값이 들어가야 한다.
   */
  tripPlaceId?: number | string;
  serverTripPlaceId?: number | string;

  /**
   * 외부 장소 ID
   * Google Place ID 계열
   *
   * 대안 추천 payload의 placeId에는 이 값이 들어가야 한다.
   */
  placeId?: string;
  googlePlaceId?: string;

  name: string;
  address?: string;
  category?: string;
  latitude?: number;
  longitude?: number;

  time: string;
  memos: ScheduleMemo[];
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type ScheduleDay = {
  day: number;
  places: SchedulePlace[];
};

export type TravelSchedule = {
  id: string;

  /**
   * 서버에서 생성된 여행 ID
   * POST /api/trips 응답의 tripId
   */
  serverTripId?: number;

  tripName: string;
  startDate: string;
  endDate: string;
  location: string;
  days: ScheduleDay[];
  createdAt: string;
  updatedAt: string;
};
