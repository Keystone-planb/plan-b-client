import { useCallback, useState } from "react";

import { replacePlanPlace } from "../../../api/schedules/server";
import {
  loadPlanASchedule,
  savePlanASchedule,
} from "../../api/schedules/planAStorage";

import type { RecommendationToastType } from "../../types/recommendation/recommendationPreview";

type ShowToast = (
  title: string,
  message?: string,
  type?: RecommendationToastType,
  onDone?: () => void,
) => void;

type UseRecommendationReplaceParams = {
  showToast: ShowToast;
};

export function useRecommendationReplace({
  showToast,
}: UseRecommendationReplaceParams) {
  const [isReplacing, setIsReplacing] = useState(false);

  const runReplace = useCallback(
    async (replaceTask: () => Promise<void>, successMessage?: string) => {
      if (isReplacing) return;

      try {
        setIsReplacing(true);
        await replaceTask();

        if (successMessage) {
          showToast("PLAN B 교체 완료", successMessage, "success");
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "일정 교체 중 오류가 발생했습니다.";

        showToast("일정 교체 실패", message, "error");
      } finally {
        setIsReplacing(false);
      }
    },
    [isReplacing, showToast],
  );

  return {
    isReplacing,
    runReplace,
  };
}

export type RecommendationReplaceResult<T = unknown> = {
  ok: boolean;
  data?: T;
  error?: unknown;
};

export async function runRecommendationReplaceTask<T>(
  task: () => Promise<T>,
): Promise<RecommendationReplaceResult<T>> {
  try {
    const data = await task();

    return {
      ok: true,
      data,
    };
  } catch (error) {
    return {
      ok: false,
      error,
    };
  }
}

export type ExecuteRecommendationReplaceParams = {
  execute: () => Promise<void>;
  onError?: (error: unknown) => void;
  onFinally?: () => void;
};

export async function executeRecommendationReplace({
  execute,
  onError,
  onFinally,
}: ExecuteRecommendationReplaceParams) {
  try {
    await execute();
  } catch (error) {
    onError?.(error);
  } finally {
    onFinally?.();
  }
}


export const updateStoredPlanAAfterReplace = async ({
  scheduleId,
  currentPlanId,
  place,
  replaceResult,
  previewVisitTime,
  previewEndTime,
  previewTransportMode,
}: {
  scheduleId?: string;
  currentPlanId: string | number;
  place: {
    googlePlaceId?: string | number;
    placeId?: string | number;
    name?: string;
    address?: string;
    category?: string;
    latitude?: number;
    longitude?: number;
  };
  replaceResult: Awaited<ReturnType<typeof replacePlanPlace>>;
  previewVisitTime?: string | null;
  previewEndTime?: string | null;
  previewTransportMode?: "WALK" | "TRANSIT" | "CAR" | null;
}) => {
  if (!scheduleId) {
    console.log(
      "[RecommendationResult] scheduleId 없음 - 로컬 Plan.A 반영 생략",
    );
    return;
  }

  const savedSchedule = await loadPlanASchedule(scheduleId);

  if (!savedSchedule) {
    console.log("[RecommendationResult] 저장된 Plan.A 없음 - 로컬 반영 생략", {
      scheduleId,
    });
    return;
  }

  const now = new Date().toISOString();

  const nextSchedule = {
    ...savedSchedule,
    updatedAt: now,
    days: savedSchedule.days.map((day) => ({
      ...day,
      places: day.places.map((item) => {
        const isTarget = [
          item.id,
          item.tripPlaceId,
          item.serverTripPlaceId,
        ].some((id) => String(id) === String(currentPlanId));

        if (!isTarget) {
          return item;
        }

        const nextGooglePlaceId = String(
          place.googlePlaceId ??
            replaceResult.googlePlaceId ??
            place.placeId ??
            item.googlePlaceId ??
            item.placeId ??
            item.id,
        );

        return {
          ...item,
          tripPlaceId: replaceResult.tripPlaceId ?? item.tripPlaceId,
          serverTripPlaceId:
            replaceResult.tripPlaceId ?? item.serverTripPlaceId,
          placeId: nextGooglePlaceId,
          googlePlaceId: nextGooglePlaceId,
          name: place.name ?? replaceResult.name ?? item.name,
          address: place.address ?? item.address,
          category: place.category ?? item.category,
          latitude: place.latitude ?? item.latitude,
          longitude: place.longitude ?? item.longitude,
          visitTime: previewVisitTime ?? item.visitTime,
          endTime: previewEndTime ?? item.endTime,
          time:
            previewVisitTime && previewEndTime
              ? `${previewVisitTime} - ${previewEndTime}`
              : item.time,
          transportMode: previewTransportMode ?? item.transportMode,
          updatedAt: now,
        };
      }),
    })),
  };

  await savePlanASchedule(nextSchedule);

  console.log("[RecommendationResult] 로컬 Plan.A 교체 반영 완료", {
    scheduleId,
    currentPlanId,
    newPlaceName: place.name,
  });
};

