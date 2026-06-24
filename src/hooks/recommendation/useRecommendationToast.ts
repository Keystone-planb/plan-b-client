import { useEffect, useRef, useState } from "react";

export type RecommendationToastState = {
  title: string;
  message?: string;
  type?: "success" | "error" | "info";
} | null;

export function useRecommendationToast() {
  const [whiteToast, setWhiteToast] =
    useState<RecommendationToastState>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showWhiteToast = (
    title: string,
    message?: string,
    type: "success" | "error" | "info" = "info",
    onDone?: () => void,
  ) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setWhiteToast({ title, message, type });

    timerRef.current = setTimeout(() => {
      setWhiteToast(null);
      timerRef.current = null;
      onDone?.();
    }, 1300);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return {
    whiteToast,
    showWhiteToast,
  };
}
