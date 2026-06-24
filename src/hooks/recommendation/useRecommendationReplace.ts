import { useCallback, useState } from "react";

type ToastType = "success" | "error" | "info";

type ShowToast = (
  title: string,
  message?: string,
  type?: ToastType,
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
