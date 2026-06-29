import apiClient from "../client";

import type {
  CreatePlanMemoRequest,
  PlanMemoResponse,
  UpdatePlanMemoRequest,
} from "./types";

import {
  assertNotHtmlResponse,
} from "./utils";

export const addPlanMemo = async (
  planId: number | string,
  request: CreatePlanMemoRequest,
): Promise<PlanMemoResponse> => {
  const response =
    await apiClient.post<unknown>(
      `/api/plans/${planId}/memos`,
      request,
    );

  assertNotHtmlResponse(
    response.data,
    "장소 메모 추가",
  );

  return response.data as PlanMemoResponse;
};

export const updatePlanMemo = async (
  planId: number | string,
  memoId: number | string,
  request: UpdatePlanMemoRequest,
): Promise<PlanMemoResponse> => {
  const response =
    await apiClient.patch<unknown>(
      `/api/plans/${planId}/memos/${memoId}`,
      request,
    );

  assertNotHtmlResponse(
    response.data,
    "장소 메모 수정",
  );

  return response.data as PlanMemoResponse;
};

export const deletePlanMemo = async (
  planId: number | string,
  memoId: number | string,
): Promise<void> => {
  await apiClient.delete(
    `/api/plans/${planId}/memos/${memoId}`,
  );
};
