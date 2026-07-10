import apiClient from "../client";
import type {
  AlternativeImpactRequest,
  AlternativeImpactResponse,
  ReplacePlanRequest,
  ReplacePlanResponse,
} from "./types";

import {
  assertNotHtmlResponse,
} from "./utils";

type ApiRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is ApiRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toFiniteDurationNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return value;
  }

  if (typeof value === "string" && /^\d+(?:\.\d+)?$/.test(value.trim())) {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  }

  return null;
};

const isCompactClockDuration = (value: number) => {
  if (!Number.isInteger(value)) {
    return false;
  }

  return /^(?:[01]\d|2[0-3])[0-5]\d$/.test(String(value));
};

const normalizeImpactDurationMinutes = (value: unknown) => {
  const numericValue = toFiniteDurationNumber(value);

  if (numericValue == null) {
    return null;
  }

  if (isCompactClockDuration(numericValue)) {
    return null;
  }

  // Latest spec says `minutes` is minutes. Some prod responses currently send
  // millisecond durations in that field; normalize that legacy shape here.
  if (numericValue >= 1000) {
    return Math.ceil(numericValue / 60000);
  }

  return Math.ceil(numericValue);
};

const normalizeImpactOption = (option: unknown) => {
  if (!isRecord(option)) {
    return option;
  }

  return {
    ...option,
    minutes: normalizeImpactDurationMinutes(option.minutes),
  };
};

const normalizeAlternativeImpactResponse = (
  value: unknown,
): AlternativeImpactResponse => {
  if (!isRecord(value)) {
    return value as AlternativeImpactResponse;
  }

  return {
    ...value,
    travelInOptions: Array.isArray(value.travelInOptions)
      ? value.travelInOptions.map(normalizeImpactOption)
      : value.travelInOptions,
    travelOutOptions: Array.isArray(value.travelOutOptions)
      ? value.travelOutOptions.map(normalizeImpactOption)
      : value.travelOutOptions,
    travelInMin: normalizeImpactDurationMinutes(value.travelInMin),
    travelOutMin: normalizeImpactDurationMinutes(value.travelOutMin),
  } as AlternativeImpactResponse;
};

export const getAlternativeImpact = async (
  tripPlaceId: number | string,
  request: AlternativeImpactRequest,
): Promise<AlternativeImpactResponse> => {
  try {
    if (__DEV__) {
      console.log(
        "[getAlternativeImpact] request:",
        {
          tripPlaceId,
          url:
            `/api/plans/${tripPlaceId}/alternatives/impact`,
          selectedMode:
            request.selectedMode,
          hasCoordinates:
            Number.isFinite(
              request.newLatitude,
            ) &&
            Number.isFinite(
              request.newLongitude,
            ),
        },
      );
    }

    const response =
      await apiClient.post<unknown>(
        `/api/plans/${tripPlaceId}/alternatives/impact`,
        request,
      );

    assertNotHtmlResponse(
      response.data,
      "대안 장소 이동시간 계산",
    );

    return normalizeAlternativeImpactResponse(response.data);
  } catch (error: any) {
    if (__DEV__) {
      console.log(
        "[getAlternativeImpact] failed:",
        {
          tripPlaceId,
          status:
            error?.response?.status,
        },
      );
    }

    throw error;
  }
};

export const replacePlanPlace = async (
  tripPlaceId: number | string,
  request: ReplacePlanRequest,
): Promise<ReplacePlanResponse> => {
  try {
    console.log(
      "[replacePlanPlace] primary request:",
      {
        url:
          `/api/plans/${tripPlaceId}/replace`,
        request,
      },
    );

    const response =
      await apiClient.post<unknown>(
        `/api/plans/${tripPlaceId}/replace`,
        request,
      );

    assertNotHtmlResponse(
      response.data,
      "PLAN B 장소 대체",
    );

    return response.data as ReplacePlanResponse;
  } catch (error: any) {
    const status =
      error?.response?.status;

    console.log(
      "[replacePlanPlace] primary failed:",
      {
        status,
        data:
          error?.response?.data,
        message:
          error?.message,
      },
    );

    if (status !== 404) {
      throw error;
    }

    console.log(
      "[replacePlanPlace] fallback request:",
      {
        url:
          `/api/plans/${tripPlaceId}/replace/${request.newGooglePlaceId}`,
        request,
      },
    );

    const fallbackResponse =
      await apiClient.post<unknown>(
        `/api/plans/${tripPlaceId}/replace/${encodeURIComponent(
          request.newGooglePlaceId,
        )}`,
        {
          newPlaceName:
            request.newPlaceName,
        },
      );

    assertNotHtmlResponse(
      fallbackResponse.data,
      "PLAN B 장소 대체 fallback",
    );

    return fallbackResponse.data as ReplacePlanResponse;
  }
};
