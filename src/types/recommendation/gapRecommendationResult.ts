import type {
  NativeStackScreenProps,
} from "@react-navigation/native-stack";

import type {
  RecommendedPlace,
  TransportMode,
} from "../recommendation";

export type GapRecommendationReturnScreen =
  | "OngoingSchedule"
  | "UpcomingSchedule";

export type GapRecommendationResultParams = {
  scheduleId?: string;
  tripId: string | number;
  serverTripId?: string | number;

  tripName?: string;
  startDate?: string;
  endDate?: string;
  location?: string;

  selectedDay?: number;
  day?: number;

  returnScreen:
    GapRecommendationReturnScreen;

  beforePlanId: string | number;
  beforePlanTitle: string;
  beforePlanStartTime?: string;
  beforePlanEndTime?: string;

  afterPlanId: string | number;
  afterPlanTitle: string;
  afterPlanStartTime?: string;
  afterPlanEndTime?: string;

  availableMinutes?: number;
  gapMinutes?: number;

  transportMode: TransportMode;
  transportLabel?: string;

  placesJson: string;
  fromAIAnalysis?: boolean;
  hasError?: boolean;
};

export type GapRecommendationDisplayPlace =
  RecommendedPlace & {
    placeId?: string | number;
    googlePlaceId?: string;
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
    latitude?: number;
    longitude?: number;
    sourceSummary?: {
      naver?: string;
      google?: string;
    };
  };

export type GapRecommendationResultRootStackParamList = {
  GapRecommendationResult:
    GapRecommendationResultParams;

  OngoingSchedule:
    | {
        scheduleId?: string;
        tripId?: string | number;
        serverTripId?: string | number;
        tripName?: string;
        startDate?: string;
        endDate?: string;
        location?: string;
        selectedDay?: number;
        refreshPlanAAt?: number;
        successToastMessage?: string;
      }
    | undefined;

  UpcomingSchedule:
    | {
        scheduleId?: string;
        tripId?: string | number;
        serverTripId?: string | number;
        tripName?: string;
        startDate?: string;
        endDate?: string;
        location?: string;
        selectedDay?: number;
        refreshPlanAAt?: number;
        successToastMessage?: string;
      }
    | undefined;
};

export type GapRecommendationResultScreenProps =
  NativeStackScreenProps<
    GapRecommendationResultRootStackParamList,
    "GapRecommendationResult"
  >;
