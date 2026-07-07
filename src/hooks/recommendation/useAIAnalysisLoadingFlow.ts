import { useEffect, useRef, useState } from "react";

import { streamRecommendations } from "../../../api/recommendations/stream";

import type {
  RecommendedPlace,
} from "../../types/recommendation";

import { AMP, trackEvent } from "../../utils/amplitude";

import {
  AI_ANALYSIS_DOT_COUNT,
  AI_ANALYSIS_LOADING_STEPS,
  createRecommendationPayload,
  getAIAnalysisUserMessage,
  type AIAnalysisLoadingParams,
  type AIAnalysisLoadingScreenProps,
} from "../../utils/recommendation/aiAnalysisLoadingConfig";

type Navigation =
  AIAnalysisLoadingScreenProps["navigation"];

type Params = {
  navigation: Navigation;
  params: AIAnalysisLoadingParams;
  enabled?: boolean;
};

export function useAIAnalysisLoadingFlow({
  navigation,
  params,
  enabled = true,
}: Params) {
  const [progress, setProgress] = useState(6);

  const [
    displayStepIndex,
    setDisplayStepIndex,
  ] = useState(0);

  const [
    activeDotIndex,
    setActiveDotIndex,
  ] = useState(0);

  const [dotDirection, setDotDirection] =
    useState<1 | -1>(1);

  const [streamMessage, setStreamMessage] =
    useState("");

  const [
    receivedPlaceCount,
    setReceivedPlaceCount,
  ] = useState(0);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [retryVersion, setRetryVersion] =
    useState(0);

  const receivedPlacesRef =
    useRef<RecommendedPlace[]>([]);

  const navigatedRef = useRef(false);
  const lastActivityAtRef = useRef(Date.now());
  const requestStartAtRef = useRef(Date.now());

  const moveToResult = (
    places: RecommendedPlace[],
  ) => {
    if (navigatedRef.current) {
      return;
    }

    navigatedRef.current = true;

    const latencyMs =
      Date.now() - requestStartAtRef.current;

    if (places.length === 0) {
      trackEvent(AMP.SOS_RESULT_EMPTY, {
        trip_id: params.tripId
          ? String(params.tripId)
          : undefined,
        plan_id: String(
          params.currentPlanId ??
            params.tripPlaceId ??
            "",
        ),
        transport_mode: params.transportMode,
        radius_minute: params.moveTime,
        recommendation_type:
          params.recommendationType ?? "PLACE",
        latency_ms: latencyMs,
      });
    }

    trackEvent(AMP.ALTERNATIVES_SHOWN, {
      count: places.length,
      latency_ms: latencyMs,
      recommendation_type:
        params.recommendationType ?? "PLACE",
      trip_id: params.tripId
        ? String(params.tripId)
        : undefined,
      plan_id: String(
        params.currentPlanId ??
          params.tripPlaceId ??
          "",
      ),
    });

    navigation.replace(
      "RecommendationResult",
      {
        ...params,
        placesJson: JSON.stringify(places),
        fromAIAnalysis: true,
        hasError: false,
      },
    );
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleRetry = () => {
    receivedPlacesRef.current = [];
    navigatedRef.current = false;
    lastActivityAtRef.current = Date.now();
    requestStartAtRef.current = Date.now();

    setErrorMessage("");
    setStreamMessage("");
    setReceivedPlaceCount(0);
    setProgress(6);
    setDisplayStepIndex(0);
    setActiveDotIndex(0);
    setDotDirection(1);

    setRetryVersion((prev) => prev + 1);
  };

  useEffect(() => {
    if (!enabled || errorMessage) {
      return;
    }

    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 94) {
          return prev;
        }

        if (prev < 35) {
          return Math.min(prev + 3, 35);
        }

        if (prev < 75) {
          return Math.min(prev + 2, 75);
        }

        return Math.min(prev + 1, 94);
      });
    }, 220);

    return () => {
      
    };
  }, [enabled, errorMessage, retryVersion]);

  useEffect(() => {
    if (
      !enabled ||
      progress < 94 ||
      errorMessage ||
      navigatedRef.current
    ) {
      return;
    }

    const stepCycleTimer = setInterval(() => {
      setDisplayStepIndex(
        (prev) =>
          (prev + 1) %
          AI_ANALYSIS_LOADING_STEPS.length,
      );
    }, 1400);

    return () => {
      clearInterval(stepCycleTimer);
    };
  }, [
    enabled,
    progress,
    errorMessage,
    retryVersion,
  ]);

  useEffect(() => {
    if (
      !enabled ||
      errorMessage ||
      navigatedRef.current ||
      progress < 94 ||
      progress >= 100
    ) {
      return;
    }

    const watchdog = setInterval(() => {
      const idleMs =
        Date.now() -
        lastActivityAtRef.current;

      if (idleMs < 20000) {
        return;
      }

      
      setProgress(100);

      setErrorMessage(
        "추천 결과를 끝까지 불러오지 못했습니다.\n다시 시도해주세요.",
      );
    }, 1000);

    return () => {
      clearInterval(watchdog);
    };
  }, [
    enabled,
    progress,
    errorMessage,
    retryVersion,
  ]);

  useEffect(() => {
    if (!enabled || errorMessage) {
      return;
    }

    let cancelled = false;

    const runRecommendationStream =
      async () => {
        try {
          receivedPlacesRef.current = [];
          setReceivedPlaceCount(0);
          navigatedRef.current = false;
          lastActivityAtRef.current =
            Date.now();
          requestStartAtRef.current =
            Date.now();

          setProgress((prev) => Math.max(prev, 12));
          setStreamMessage("추천 조건을 정리하고 있어요");

          const payload =
            await createRecommendationPayload({
              params,
            });

          setProgress((prev) => Math.max(prev, 28));
          setStreamMessage("추천 가능한 장소를 찾고 있어요");

          await streamRecommendations(
            payload,
            {
              onProgress: (message) => {
                if (cancelled) {
                  return;
                }

                lastActivityAtRef.current =
                  Date.now();

                setStreamMessage(message);

                setProgress((prev) =>
                  Math.min(prev + 4, 96),
                );
              },

              onPlace: (place) => {
                if (cancelled) {
                  return;
                }

                lastActivityAtRef.current =
                  Date.now();

                receivedPlacesRef.current = [
                  ...receivedPlacesRef.current,
                  place,
                ];

                const placeCount =
                  receivedPlacesRef.current
                    .length;

                setReceivedPlaceCount(
                  placeCount,
                );

                setStreamMessage(
                  `${placeCount}개의 추천 후보를 찾았어요`,
                );

                setProgress((prev) =>
                  Math.min(prev + 8, 98),
                );
              },

              onWarning: (message) => {
                if (cancelled) {
                  return;
                }

                lastActivityAtRef.current =
                  Date.now();

                
                setStreamMessage(
                  message ||
                    "조건에 맞는 장소를 찾지 못했습니다.",
                );

                setProgress(100);

                setErrorMessage(
                  message ||
                    "현재 조건으로는 추천할 장소가 없어요.",
                );
              },

              onStreamError: (message) => {
                if (cancelled) {
                  return;
                }

                
                setProgress((prev) =>
                  Math.max(prev, 98),
                );

                setErrorMessage(
                  message ||
                    "서버 오류가 발생했습니다. 다시 시도해주세요.",
                );
              },

              onDone: () => {
                

                if (cancelled) {
                  return;
                }

                const receivedPlaces = [
                  ...receivedPlacesRef.current,
                ];

                
                setProgress(100);

                if (
                  receivedPlaces.length === 0
                ) {
                  setErrorMessage(
                    "현재 조건으로는 추천할 장소가 없어요.",
                  );

                  return;
                }

                setStreamMessage(
                  "추천 결과를 불러왔어요",
                );

                
                moveToResult(
                  receivedPlaces,
                );
              },

              onError: (error) => {
                if (cancelled) {
                  return;
                }

                
                setProgress(100);

                setErrorMessage(
                  getAIAnalysisUserMessage(
                    error,
                  ),
                );
              },
            },
          );
        } catch (error) {
          

          if (cancelled) {
            return;
          }

          
          setProgress(100);

          setErrorMessage(
            getAIAnalysisUserMessage(
              error,
            ),
          );
        }
      };

    void runRecommendationStream();

    return () => {
      cancelled = true;
    };
  }, [
    enabled,
    retryVersion,
    errorMessage,
    params.tripId,
    params.serverTripId,
    params.moveTime,
    params.placeScope,
    params.transportMode,
    params.changeCategory,
    params.selectedType,
    params.considerDistance,
    params.recommendationType,
    params.targetPlace,
  ]);

  useEffect(() => {
    if (errorMessage) {
      return;
    }

    const dotTimer = setInterval(() => {
      setActiveDotIndex((prev) => {
        if (
          prev >=
          AI_ANALYSIS_DOT_COUNT - 1
        ) {
          setDotDirection(-1);
          return prev - 1;
        }

        if (prev <= 0) {
          setDotDirection(1);
          return prev + 1;
        }

        return prev + dotDirection;
      });
    }, 240);

    return () => {
      clearInterval(dotTimer);
    };
  }, [
    enabled,
    dotDirection,
    errorMessage,
    retryVersion,
  ]);

  return {
    progress,
    displayStepIndex,
    activeDotIndex,
    streamMessage,
    receivedPlaceCount,
    errorMessage,
    handleRetry,
    handleGoBack,
  };
}
