import apiClient from "../client";
import {
  getApiErrorMessage,
} from "../utils/apiErrorMessage";

import type {
  AlternativeImpactRequest,
  AlternativeImpactResponse,
  ReplacePlanRequest,
  ReplacePlanResponse,
} from "./types";

import {
  assertNotHtmlResponse,
} from "./utils";

export const getAlternativeImpact = async (
  tripPlaceId: number | string,
  request: AlternativeImpactRequest,
): Promise<AlternativeImpactResponse> => {
  try {
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

    const response =
      await apiClient.post<unknown>(
        `/api/plans/${tripPlaceId}/alternatives/impact`,
        request,
      );

    assertNotHtmlResponse(
      response.data,
      "대안 장소 이동시간 계산",
    );

    return response.data as AlternativeImpactResponse;
  } catch (error: any) {
    console.log(
      "[getAlternativeImpact] failed:",
      {
        tripPlaceId,
        status:
          error?.response?.status,
        data:
          error?.response?.data,
        request,
      },
    );

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
      throw new Error(
        getApiErrorMessage(
          error,
          "일정 시간 수정에 실패했습니다.",
        ),
      );
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
