import { useCallback, useState } from "react";

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

