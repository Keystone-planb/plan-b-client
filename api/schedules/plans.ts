import apiClient from "../client";

import type {
  UpdatePlanScheduleRequest,
  UpdatePlanScheduleResponse,
} from "./types";

import {
  assertNotHtmlResponse,
} from "./utils";

export const updatePlanSchedule = async (
  tripPlaceId: number | string,
  request: UpdatePlanScheduleRequest,
): Promise<UpdatePlanScheduleResponse> => {
  try {
    const response =
      await apiClient.patch<unknown>(
        `/api/plans/${tripPlaceId}/schedule`,
        request,
      );

    assertNotHtmlResponse(
      response.data,
      "일정 시간/메모 수정",
    );

    return response.data as UpdatePlanScheduleResponse;
  } catch (error: any) {
    console.log(
      "[updatePlanSchedule] failed:",
      {
        tripPlaceId,
        url:
          `/api/plans/${tripPlaceId}/schedule`,
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

export const deletePlanPlace = async (
  tripPlaceId: number | string,
): Promise<void> => {
  await apiClient.delete(
    `/api/plans/${tripPlaceId}`,
  );
};
