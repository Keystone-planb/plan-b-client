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

type AxiosLikeError = {
  response?: {
    status?: number;
    data?: unknown;
  };
  code?: string;
  message?: string;
};

const PLACE_API_TIMEOUT = 30000;

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

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const toAxiosLikeError = (error: unknown): AxiosLikeError => {
  if (!isRecord(error)) {
    return {};
  }

  const responseRaw = error.response;
  const response =
    isRecord(responseRaw) ?
      {
        status:
          typeof responseRaw.status === "number" ?
            responseRaw.status
          : undefined,
        data: responseRaw.data,
      }
    : undefined;

  return {
    response,
    code: typeof error.code === "string" ? error.code : undefined,
    message: typeof error.message === "string" ? error.message : undefined,
  };
};

const getAxiosErrorStatus = (error: unknown) => {
  return toAxiosLikeError(error).response?.status;
};

const getAxiosErrorData = (error: unknown) => {
  return toAxiosLikeError(error).response?.data;
};

const getAxiosErrorCode = (error: unknown) => {
  return toAxiosLikeError(error).code;
};

const getAxiosErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return toAxiosLikeError(error).message ?? "";
};

const isTimeoutError = (error: unknown) => {
  const code = getAxiosErrorCode(error);
  const message = getAxiosErrorMessage(error).toLowerCase();

  return (
    code === "ECONNABORTED" ||
    message.includes("timeout") ||
    message.includes("exceeded")
  );
};

const getServerErrorMessage = (data: unknown) => {
  if (!isRecord(data)) {
    return "";
  }

  const error = data.error;
  const message = data.message;

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  if (typeof message === "string" && message.trim()) {
    return message;
  }

  return "";
};

const handlePlaceApiError = ({
  error,
  apiName,
}: {
  error: unknown;
  apiName: string;
}): never => {
  const status = getAxiosErrorStatus(error);
  const data = getAxiosErrorData(error);
  const serverMessage = getServerErrorMessage(data);

  if (status === 401) {
    throw new Error(
      `${apiName} API 인증에 실패했습니다. 로그아웃 후 다시 로그인하거나 access_token/refresh_token 저장 상태를 확인해주세요.`,
    );
  }

  if (status === 403) {
    throw new Error(`${apiName} API 접근 권한이 없습니다.`);
  }

  if (status === 404) {
    throw new Error(`${apiName} API 경로를 찾을 수 없습니다.`);
  }

  if (isTimeoutError(error)) {
    throw new Error(
      `${apiName} API 응답 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.`,
    );
  }

  if (serverMessage) {
    throw new Error(serverMessage);
  }

  if (error instanceof Error) {
    throw error;
  }

  throw new Error(`${apiName} API 호출에 실패했습니다.`);
};

const logPlaceApiError = ({
  tag,
  error,
  url,
  extra,
}: {
  tag: string;
  error: unknown;
  url: string;
  extra?: Record<string, unknown>;
}) => {
  console.log(tag, {
    status: getAxiosErrorStatus(error),
    data: getAxiosErrorData(error),
    code: getAxiosErrorCode(error),
    message: getAxiosErrorMessage(error),
    url,
    ...extra,
  });
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
      timeout: PLACE_API_TIMEOUT,
    });

    console.log("[places/search] response:", response.data);

    assertNotHtmlResponse(response.data, "장소 검색");

    const places = response.data?.places ?? [];

    return places.map(normalizePlace).filter((place) => place.placeId);
  } catch (error) {
    logPlaceApiError({
      tag: "[places/search] failed:",
      error,
      url: requestUrl,
      extra: {
        query: trimmedQuery,
      },
    });

    return handlePlaceApiError({
      error,
      apiName: "장소 검색",
    });
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
    const response = await apiClient.get<PlaceDetail>(path, {
      timeout: PLACE_API_TIMEOUT,
    });

    console.log("[places/detail] response:", response.data);

    assertNotHtmlResponse(response.data, "장소 상세");

    return response.data;
  } catch (error) {
    logPlaceApiError({
      tag: "[places/detail] failed:",
      error,
      url: requestUrl,
      extra: {
        googlePlaceId,
      },
    });

    return handlePlaceApiError({
      error,
      apiName: "장소 상세",
    });
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
    const response = await apiClient.get<PlaceSummaryResponse>(path, {
      timeout: PLACE_API_TIMEOUT,
    });

    console.log("[places/summary] response:", response.data);

    assertNotHtmlResponse(response.data, "장소 AI 요약");

    return response.data;
  } catch (error) {
    logPlaceApiError({
      tag: "[places/summary] failed:",
      error,
      url: requestUrl,
      extra: {
        googlePlaceId,
      },
    });

    return handlePlaceApiError({
      error,
      apiName: "장소 AI 요약",
    });
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
    const response = await apiClient.get<PlaceFreshnessResponse>(path, {
      timeout: PLACE_API_TIMEOUT,
    });

    console.log("[places/freshness] response:", response.data);

    assertNotHtmlResponse(response.data, "장소 정보 최신성");

    return response.data;
  } catch (error) {
    logPlaceApiError({
      tag: "[places/freshness] failed:",
      error,
      url: requestUrl,
      extra: {
        googlePlaceId,
      },
    });

    return handlePlaceApiError({
      error,
      apiName: "장소 정보 최신성",
    });
  }
};
