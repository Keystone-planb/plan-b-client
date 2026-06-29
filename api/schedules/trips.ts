import apiClient from "../client";

import type {
  AddTripLocationRequest,
  AddTripLocationResponse,
  CreateTripRequest,
  TripDetailResponse,
  TripResponse,
  TripStatus,
  TripSummary,
  UpdateTripRequest,
} from "./types";

import {
  assertNotHtmlResponse,
} from "./utils";

export const createTrip = async (
  request: CreateTripRequest,
): Promise<TripResponse> => {
  const response =
    await apiClient.post<unknown>(
      "/api/trips",
      request,
    );

  assertNotHtmlResponse(
    response.data,
    "여행 생성",
  );

  return response.data as TripResponse;
};

export const getTrips = async (
  status: TripStatus = "ALL",
): Promise<TripSummary[]> => {
  const response =
    await apiClient.get<unknown>(
      "/api/trips",
      {
        params: {
          status,
        },
        timeout: 5000,
      },
    );

  assertNotHtmlResponse(
    response.data,
    "여행 목록 조회",
  );

  return response.data as TripSummary[];
};

export const getTripDetail = async (
  tripId: number | string,
): Promise<TripDetailResponse> => {
  const response =
    await apiClient.get<unknown>(
      `/api/trips/${tripId}`,
    );

  assertNotHtmlResponse(
    response.data,
    "여행 상세 조회",
  );

  return response.data as TripDetailResponse;
};

export const updateTrip = async (
  tripId: number | string,
  request: UpdateTripRequest,
): Promise<TripResponse> => {
  const response =
    await apiClient.patch<unknown>(
      `/api/trips/${tripId}`,
      request,
    );

  assertNotHtmlResponse(
    response.data,
    "여행 정보 수정",
  );

  return response.data as TripResponse;
};

export const deleteTrip = async (
  tripId: number | string,
): Promise<void> => {
  await apiClient.delete(
    `/api/trips/${tripId}`,
  );
};

export const addTripLocation = async (
  tripId: number | string,
  day: number,
  request: AddTripLocationRequest,
): Promise<AddTripLocationResponse> => {
  const response =
    await apiClient.post<unknown>(
      `/api/trips/${tripId}/days/${day}/locations`,
      request,
    );

  assertNotHtmlResponse(
    response.data,
    "일정 장소 추가",
  );

  return response.data as AddTripLocationResponse;
};

export const addLocationToTripDay = async ({
  tripId,
  day,
  payload,
}: {
  tripId: number | string;
  day: number;
  payload: AddTripLocationRequest;
}): Promise<AddTripLocationResponse> => {
  console.log(
    "[addLocationToTripDay] request:",
    {
      tripId,
      day,
      url:
        `/api/trips/${tripId}/days/${day}/locations`,
      payload,
    },
  );

  const response =
    await apiClient.post<unknown>(
      `/api/trips/${tripId}/days/${day}/locations`,
      payload,
    );

  assertNotHtmlResponse(
    response.data,
    "여행 장소 추가",
  );

  return response.data as AddTripLocationResponse;
};

export const getTripDay = async (
  tripId: number | string,
  day: number,
) => {
  if (!tripId) {
    throw new Error(
      "tripId가 없습니다.",
    );
  }

  if (
    !Number.isFinite(Number(day)) ||
    Number(day) < 1
  ) {
    throw new Error(
      "유효하지 않은 day 값입니다.",
    );
  }

  const response = await apiClient.get(
    `/api/trips/${tripId}/days/${day}`,
  );

  return response.data;
};
