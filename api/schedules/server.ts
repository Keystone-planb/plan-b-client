import apiClient from "../client";

export type CreateTripRequest = {
  title: string;
  startDate: string;
  endDate: string;
  travelStyles: string[];
};

export type CreateTripResponse = {
  tripId: number;
  title: string;
  startDate: string;
  endDate: string;
  travelStyles: string[];
};

export type TripSummaryResponse = {
  tripId: number;
  title: string;
  startDate: string;
  endDate: string;
  status: string;
};

export type AddLocationRequest = {
  name: string;
  visitTime: string;
  memo: string;
  place_id: string;
};

export type AddLocationResponse = {
  tripPlaceId: number;
  placeId: string;
  name: string;
  visitTime: string;
  visitOrder: number;
  memo: string;
};

export const createTrip = async (
  payload: CreateTripRequest,
): Promise<CreateTripResponse> => {
  const response = await apiClient.post<CreateTripResponse>(
    "/api/trips",
    payload,
  );

  return response.data;
};

export const getTrips = async (
  status: "UPCOMING" | "PAST" | "ALL" = "ALL",
): Promise<TripSummaryResponse[]> => {
  const response = await apiClient.get<TripSummaryResponse[]>("/api/trips", {
    params: {
      status,
    },
  });

  return response.data;
};

export const updateTrip = async (
  tripId: number,
  payload: Partial<CreateTripRequest>,
): Promise<CreateTripResponse> => {
  const response = await apiClient.patch<CreateTripResponse>(
    `/api/trips/${tripId}`,
    payload,
  );

  return response.data;
};

export const deleteTrip = async (tripId: number) => {
  const response = await apiClient.delete(`/api/trips/${tripId}`);

  return response.data;
};

export const addLocationToTripDay = async ({
  tripId,
  day,
  payload,
}: {
  tripId: number;
  day: number;
  payload: AddLocationRequest;
}): Promise<AddLocationResponse> => {
  const response = await apiClient.post<AddLocationResponse>(
    `/api/trips/${tripId}/days/${day}/locations`,
    payload,
  );

  return response.data;
};
