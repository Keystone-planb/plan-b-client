import apiClient from "../client";

export type TripStatus = "ALL" | "UPCOMING" | "ONGOING" | "PAST";

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
  status?: "UPCOMING" | "ONGOING" | "PAST" | string;
}

export interface TripResponse {
  tripId: number;
  title: string;
  startDate: string;
  endDate: string;
  travelStyles?: TravelStyle[] | string[];
  totalDays?: number;
}

export interface TripPlace {
  tripPlaceId: number;
  placeId: string;
  name: string;
  visitTime?: string | null;
  endTime?: string | null;
  visitOrder?: number;
  memo?: string | null;
  transitGapMinutes?: number | null;
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
   * 05/04 API 명세 기준 request key는 place_id.
   * 값은 Google Place ID 문자열.
   */
  place_id: string;
  name: string;
  visitTime?: string | null;
  endTime?: string | null;
  memo?: string | null;
}

export interface AddTripLocationResponse {
  tripPlaceId: number;
  placeId: string;
  name: string;
  visitTime?: string | null;
  endTime?: string | null;
  visitOrder?: number;
  memo?: string | null;
}

export interface UpdatePlanScheduleRequest {
  visitTime?: string | null;
  endTime?: string | null;
  memo?: string | null;
}

export interface UpdatePlanScheduleResponse {
  tripPlaceId: number;
  placeId?: string;
  name: string;
  visitTime?: string | null;
  endTime?: string | null;
  visitOrder?: number;
  memo?: string | null;
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

const isHtmlResponse = (data: unknown) => {
  if (typeof data !== "string") return false;

  const trimmed = data.trim().toLowerCase();

  return trimmed.startsWith("<!doctype html>") || trimmed.startsWith("<html");
};

const assertNotHtmlResponse = (data: unknown, apiName: string) => {
  if (isHtmlResponse(data)) {
    throw new Error(
      `${apiName} API가 HTML을 반환했습니다. BASE_URL과 백엔드 서버 상태를 확인해주세요.`,
    );
  }
};

/**
 * 여행 생성
 * POST /api/trips
 */
export const createTrip = async (
  request: CreateTripRequest,
): Promise<TripResponse> => {
  const response = await apiClient.post<unknown>("/api/trips", request);

  assertNotHtmlResponse(response.data, "여행 생성");

  return response.data as TripResponse;
};

/**
 * 내 여행 목록 조회
 * GET /api/trips?status=ALL | UPCOMING | ONGOING | PAST
 */
export const getTrips = async (
  status: TripStatus = "ALL",
): Promise<TripSummary[]> => {
  const response = await apiClient.get<unknown>("/api/trips", {
    params: {
      status,
    },
  });

  assertNotHtmlResponse(response.data, "여행 목록 조회");

  return response.data as TripSummary[];
};

/**
 * 여행 상세 조회
 * GET /api/trips/{tripId}
 */
export const getTripDetail = async (
  tripId: number | string,
): Promise<TripDetailResponse> => {
  const response = await apiClient.get<unknown>(`/api/trips/${tripId}`);

  assertNotHtmlResponse(response.data, "여행 상세 조회");

  return response.data as TripDetailResponse;
};

/**
 * 여행 정보 수정
 * PATCH /api/trips/{tripId}
 */
export const updateTrip = async (
  tripId: number | string,
  request: UpdateTripRequest,
): Promise<TripResponse> => {
  const response = await apiClient.patch<unknown>(
    `/api/trips/${tripId}`,
    request,
  );

  assertNotHtmlResponse(response.data, "여행 정보 수정");

  return response.data as TripResponse;
};

/**
 * 여행 삭제
 * DELETE /api/trips/{tripId}
 */
export const deleteTrip = async (tripId: number | string): Promise<void> => {
  await apiClient.delete(`/api/trips/${tripId}`);
};

/**
 * 일정에 장소 추가
 * POST /api/trips/{tripId}/days/{day}/locations
 *
 * day는 1-based.
 */
export const addTripLocation = async (
  tripId: number | string,
  day: number,
  request: AddTripLocationRequest,
): Promise<AddTripLocationResponse> => {
  const response = await apiClient.post<unknown>(
    `/api/trips/${tripId}/days/${day}/locations`,
    request,
  );

  assertNotHtmlResponse(response.data, "일정 장소 추가");

  return response.data as AddTripLocationResponse;
};

/**
 * 일정 시간/메모 수정
 * PATCH /api/plans/{tripPlaceId}/schedule
 */
export const updatePlanSchedule = async (
  tripPlaceId: number | string,
  request: UpdatePlanScheduleRequest,
): Promise<UpdatePlanScheduleResponse> => {
  const response = await apiClient.patch<unknown>(
    `/api/plans/${tripPlaceId}/schedule`,
    request,
  );

  assertNotHtmlResponse(response.data, "일정 시간/메모 수정");

  return response.data as UpdatePlanScheduleResponse;
};

/**
 * 일정 장소 PLAN B 대체
 * POST /api/plans/{tripPlaceId}/replace
 */
export const replacePlanPlace = async (
  tripPlaceId: number | string,
  request: ReplacePlanRequest,
): Promise<ReplacePlanResponse> => {
  const response = await apiClient.post<unknown>(
    `/api/plans/${tripPlaceId}/replace`,
    request,
  );

  assertNotHtmlResponse(response.data, "PLAN B 장소 대체");

  return response.data as ReplacePlanResponse;
};
