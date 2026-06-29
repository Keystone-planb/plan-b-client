export type TripStatus =
  | "ALL"
  | "UPCOMING"
  | "ONGOING"
  | "PAST";

export type TravelStyle =
  | "HEALING"
  | "ACTIVE"
  | "TRENDY"
  | "CLASSIC"
  | "LOCAL"
  | "CULTURE"
  | "FOOD"
  | "NATURE"
  | "URBAN"
  | "ROMANTIC"
  | "FAMILY"
  | "ADVENTURE";

export interface CreateTripRequest {
  title: string;
  startDate: string;
  endDate: string;
  travelStyles: TravelStyle[] | string[];
}

export interface TripSummary {
  tripId: number;
  title: string;
  startDate: string;
  endDate: string;
  status?:
    | "UPCOMING"
    | "ONGOING"
    | "PAST"
    | string;
  itineraryCount?: number;
  placeCount?: number;
}

export interface TripResponse {
  tripId: number;
  title: string;
  startDate: string;
  endDate: string;
  travelStyles?: TravelStyle[] | string[];
  totalDays?: number;
}

export type TransportMode =
  | "WALK"
  | "TRANSIT"
  | "CAR";

export interface TripPlace {
  tripPlaceId: number;
  placeId: string;
  name: string;
  visitTime?: string | null;
  endTime?: string | null;
  visitOrder?: number;
  memo?: string | null;
  transitGapMinutes?: number | null;
  transportMode?: TransportMode | null;
}

export interface TripItinerary {
  itineraryId?: number;
  day: number;
  date: string;
  places: TripPlace[];
}

export interface TripDetailResponse {
  tripId: number;
  title: string;
  startDate: string;
  endDate: string;
  travelStyles?: TravelStyle[] | string[];
  itineraries: TripItinerary[];
}

export interface UpdateTripRequest {
  title?: string;
  startDate?: string;
  endDate?: string;
  travelStyles?: TravelStyle[] | string[];
}

export interface AddTripLocationRequest {
  /**
   * API request key는 place_id.
   * 값은 Google Place ID 문자열.
   */
  place_id: string;
  name: string;
  category?: string;
  visitTime?: string | null;
  endTime?: string | null;
  memo?: string | null;
  transportMode?: TransportMode | null;
}

export interface AddTripLocationResponse {
  tripPlaceId: number;
  placeId: string;
  name: string;
  visitTime?: string | null;
  endTime?: string | null;
  visitOrder?: number;
  memo?: string | null;
  transportMode?: TransportMode | null;
}

export interface UpdatePlanScheduleRequest {
  visitTime?: string | null;
  endTime?: string | null;
  memo?: string | null;
  transportMode?: TransportMode | null;
}

export interface UpdatePlanScheduleResponse {
  tripPlaceId: number;
  placeId?: string;
  name: string;
  visitTime?: string | null;
  endTime?: string | null;
  visitOrder?: number;
  memo?: string | null;
  transportMode?: TransportMode | null;
}

export interface PlanMemoResponse {
  id: number | string;
  content: string;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface CreatePlanMemoRequest {
  content: string;
}

export interface UpdatePlanMemoRequest {
  content: string;
}

export interface ReplacePlanRequest {
  newGooglePlaceId: string;
  newPlaceName: string;
}

export interface ReplacePlanResponse {
  tripPlaceId: number;
  googlePlaceId: string;
  name: string;
  message: string;
}

export type AlternativeImpactTransportMode =
  | "WALK"
  | "TRANSIT"
  | "CAR";

export interface AlternativeImpactRequest {
  newPlaceId: string;
  newPlaceName: string;
  newLatitude: number;
  newLongitude: number;
  selectedMode?: AlternativeImpactTransportMode;
}

export interface AlternativeImpactOption {
  mode: AlternativeImpactTransportMode;
  minutes: number;
  label: string;
}

export interface AlternativeImpactPlace {
  tripPlaceId: number;
  name: string;
  visitTime: string | null;
  endTime: string | null;
  newVisitTime: string | null;
}

export interface AlternativeImpactResponse {
  calcStatus: "OK" | "NO_COORD";
  travelInOptions: AlternativeImpactOption[];
  travelOutOptions: AlternativeImpactOption[];
  travelInMin: number | null;
  travelInMode:
    | AlternativeImpactTransportMode
    | null;
  travelOutMin: number | null;
  travelOutMode:
    | AlternativeImpactTransportMode
    | null;
  prevPlace: AlternativeImpactPlace | null;
  nextPlace: AlternativeImpactPlace | null;
  dayShiftMin: number;
  affectedCount: number;
}
