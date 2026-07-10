import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { RecommendedPlace } from "../recommendation";

export type RecommendationResultTransportMode =
  | "WALK"
  | "TRANSIT"
  | "CAR";

export type RecommendationResultMoveTime =
  | "10"
  | "20"
  | "30"
  | "ANY";

export type RecommendationResultPlaceScope =
  | "INDOOR"
  | "OUTDOOR";

export type RecommendationResultTodayPlace = {
  id?: string | number;
  tripPlaceId?: string | number;
  serverTripPlaceId?: string | number;
  placeId?: string;
  googlePlaceId?: string;
  name?: string;
  address?: string;
  time?: string;
  visitTime?: string | null;
  startTime?: string | null;
  previousVisitTime?: string | null;
  beforePlanStartTime?: string | null;
  nextVisitTime?: string | null;
  afterPlanStartTime?: string | null;
  newVisitTime?: string | null;
  endTime?: string | null;
  previousEndTime?: string | null;
  beforePlanEndTime?: string | null;
  nextEndTime?: string | null;
  afterPlanEndTime?: string | null;
  newEndTime?: string | null;
  finishTime?: string | null;
  toTime?: string | null;
  latitude?: number;
  longitude?: number;
};

export type RecommendationResultDisplayPlace =
  RecommendedPlace & {
    placeId?: string | number;
    name: string;
    category?: string;
    type?: string;
    mood?: string;
    space?: string;
    rating?: number;
    reviewCount?: number;
    userRatingsTotal?: number;
    address?: string;
    reviewSummary?: string;
    googleReview?: string;
    naverReview?: string;
    phone?: string;
    phoneNumber?: string;
    website?: string;
    openingHours?: string | null;
    reviewData?: string | null;
    priceLevel?: number;
    reason?: string;
    suggestedVisitTime?: string | null;
    suggestedEndTime?: string | null;
    sourceSummary?: {
      naver?: string;
      google?: string;
    };
  };

export type RecommendationResultRootStackParamList = {
  Main:
    | {
        refreshMainAt?: number;
        replacedTripId?: string | number;
        replacedTripPlaceId?: string | number;
      }
    | undefined;

  PlanA: {
    scheduleId?: string;
    tripId?: string | number;
    serverTripId?: string | number;
    tripName?: string;
    startDate?: string;
    endDate?: string;
    location?: string;
    transportMode?: RecommendationResultTransportMode;
    transportLabel?: string;
    day?: number;
    selectedDay?: number;
    selectedPlace?: undefined;
    selectedPlaces?: undefined;
    refreshPlanAAt?: number;
    replacedTripPlaceId?: string | number;
    isEditMode?: boolean;
    returnScreen?: "OngoingSchedule" | "UpcomingSchedule";
  };

  OngoingSchedule: {
    scheduleId?: string;
    tripId?: string | number;
    serverTripId?: string | number;
    tripName?: string;
    startDate?: string;
    endDate?: string;
    location?: string;
    transportMode?: RecommendationResultTransportMode;
    transportLabel?: string;
  };

  RecommendationResult: {
    scheduleId?: string;
    tripId?: string | number;
    serverTripId?: string | number;
    tripName?: string;
    startDate?: string;
    endDate?: string;
    location?: string;
    transportMode?: RecommendationResultTransportMode;
    transportLabel?: string;
    moveTime?: RecommendationResultMoveTime;
    considerDistance?: boolean;
    changeCategory?: boolean;
    placeScope?: RecommendationResultPlaceScope;
    targetPlace?: RecommendationResultTodayPlace;
    previousPlace?: RecommendationResultTodayPlace;
    nextPlace?: RecommendationResultTodayPlace;
    currentPlanId?: string | number;
    tripPlaceId?: string | number;
    serverTripPlaceId?: string | number;
    placesJson?: string;
    source?: "weather-notification" | string;
    fromWeatherNotification?: boolean;
    notificationId?: string | number;
    day?: number;
    selectedDay?: number;
    returnScreen?: "OngoingSchedule" | "UpcomingSchedule";
    fromAIAnalysis?: boolean;
    hasError?: boolean;
    title?: string;
    recommendationType?:
      | "PLACE"
      | "GAP"
      | "WEATHER"
      | "alternative"
      | "gap"
      | "weather";
  };
};

export type RecommendationResultScreenProps =
  NativeStackScreenProps<
    RecommendationResultRootStackParamList,
    "RecommendationResult"
  >;
