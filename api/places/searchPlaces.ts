import apiClient from "../client";
import {
  PlaceDetail,
  PlaceFreshnessResponse,
  PlaceSearchResponse,
  PlaceSearchResult,
  PlaceSummaryResponse,
} from "./place";

type RawPlaceSearchResult = {
  placeId?: number | string;
  id?: number | string;
  googlePlaceId?: string;
  name?: string;
  address?: string;
  rating?: number;
  category?: string;
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
};

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

const normalizePlace = (place: RawPlaceSearchResult): PlaceSearchResult => {
  const rawPlaceId = place.placeId ?? place.googlePlaceId ?? place.id ?? "";

  return {
    placeId: String(rawPlaceId),
    googlePlaceId: String(place.googlePlaceId ?? rawPlaceId),
    name: place.name ?? "이름 없는 장소",
    address: place.address ?? "",
    rating: place.rating,
    category: place.category,
    latitude: place.latitude ?? place.lat,
    longitude: place.longitude ?? place.lng,
  };
};

const normalizeBaseUrl = (baseUrl?: string) => {
  return (baseUrl ?? "").replace(/\/+$/, "");
};

const getAxiosRequestUrl = (path: string) => {
  const baseURL = normalizeBaseUrl(apiClient.defaults.baseURL);
  return `${baseURL}${path}`;
};

const getAxiosErrorStatus = (error: unknown) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as any).response === "object" &&
    (error as any).response !== null
  ) {
    return (error as any).response.status;
  }

  return undefined;
};

const getAxiosErrorData = (error: unknown) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as any).response === "object" &&
    (error as any).response !== null
  ) {
    return (error as any).response.data;
  }

  return undefined;
};

export const searchPlaces = async (
  query: string,
): Promise<PlaceSearchResult[]> => {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return [];
  }

  const path = "/api/places/search";
  const requestUrl = `${getAxiosRequestUrl(path)}?query=${encodeURIComponent(
    trimmedQuery,
  )}`;

  console.log("[places/search] request url:", requestUrl);
  console.log("[places/search] request query:", trimmedQuery);

  try {
    const response = await apiClient.get<PlaceSearchResponse>(path, {
      params: {
        query: trimmedQuery,
      },
    });

    console.log("[places/search] response:", response.data);

    assertNotHtmlResponse(response.data, "장소 검색");

    const places = response.data?.places ?? [];

    return places.map(normalizePlace).filter((place) => place.placeId);
  } catch (error) {
    console.log("[places/search] failed:", {
      status: getAxiosErrorStatus(error),
      data: getAxiosErrorData(error),
      url: requestUrl,
      query: trimmedQuery,
    });

    throw error;
  }
};

export const getPlaceDetail = async (
  googlePlaceId: number | string,
): Promise<PlaceDetail> => {
  const encodedPlaceId = encodeURIComponent(String(googlePlaceId));
  const path = `/api/places/${encodedPlaceId}`;
  const requestUrl = getAxiosRequestUrl(path);

  console.log("[places/detail] request url:", requestUrl);

  try {
    const response = await apiClient.get<PlaceDetail>(path);

    console.log("[places/detail] response:", response.data);

    assertNotHtmlResponse(response.data, "장소 상세");

    return response.data;
  } catch (error) {
    console.log("[places/detail] failed:", {
      status: getAxiosErrorStatus(error),
      data: getAxiosErrorData(error),
      url: requestUrl,
      googlePlaceId,
    });

    throw error;
  }
};

export const getPlaceSummary = async (
  googlePlaceId: string,
): Promise<PlaceSummaryResponse> => {
  const encodedPlaceId = encodeURIComponent(String(googlePlaceId));
  const path = `/api/places/${encodedPlaceId}/summary`;
  const requestUrl = getAxiosRequestUrl(path);

  console.log("[places/summary] request url:", requestUrl);

  try {
    const response = await apiClient.get<PlaceSummaryResponse>(path);

    console.log("[places/summary] response:", response.data);

    assertNotHtmlResponse(response.data, "장소 AI 요약");

    return response.data;
  } catch (error) {
    console.log("[places/summary] failed:", {
      status: getAxiosErrorStatus(error),
      data: getAxiosErrorData(error),
      url: requestUrl,
      googlePlaceId,
    });

    throw error;
  }
};

export const getPlaceFreshness = async (
  googlePlaceId: string,
): Promise<PlaceFreshnessResponse> => {
  const encodedPlaceId = encodeURIComponent(String(googlePlaceId));
  const path = `/api/places/${encodedPlaceId}/freshness`;
  const requestUrl = getAxiosRequestUrl(path);

  console.log("[places/freshness] request url:", requestUrl);

  try {
    const response = await apiClient.get<PlaceFreshnessResponse>(path);

    console.log("[places/freshness] response:", response.data);

    assertNotHtmlResponse(response.data, "장소 정보 최신성");

    return response.data;
  } catch (error) {
    console.log("[places/freshness] failed:", {
      status: getAxiosErrorStatus(error),
      data: getAxiosErrorData(error),
      url: requestUrl,
      googlePlaceId,
    });

    throw error;
  }
};
