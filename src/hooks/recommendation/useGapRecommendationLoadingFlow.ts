import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  streamGapRecommendations,
} from "../../../api/recommendations/gaps";

import type {
  GapRecommendationRequest,
} from "../../types/gapRecommendation";

import type {
  RecommendedPlace,
  TransportMode,
} from "../../types/recommendation";

import {
  AI_ANALYSIS_DOT_COUNT,
  AI_ANALYSIS_LOADING_STEPS,
  type AIAnalysisLoadingParams,
  type AIAnalysisLoadingScreenProps,
} from "../../utils/recommendation/aiAnalysisLoadingConfig";

type Navigation =
  AIAnalysisLoadingScreenProps["navigation"];

export type GapAnalysisLoadingParams =
  AIAnalysisLoadingParams & {
    tripId: string | number;

    recommendationType: "GAP";

    beforePlanId: string | number;
    beforePlanTitle: string;
    beforePlanEndTime?: string;

    afterPlanId: string | number;
    afterPlanTitle: string;
    afterPlanStartTime?: string;

    availableMinutes?: number;
    gapMinutes?: number;

    transportMode: TransportMode;
    transportLabel?: string;

    selectedDay?: number;
    day?: number;

    returnScreen:
      | "OngoingSchedule"
      | "UpcomingSchedule";
  };

type Params = {
  navigation: Navigation;
  params: GapAnalysisLoadingParams;
  enabled?: boolean;
};

const getGapErrorMessage = (
  error: unknown,
) => {
  if (
    error instanceof Error &&
    error.message.trim()
  ) {
    return error.message;
  }

  return (
    "빈 시간 추천 결과를 불러오지 못했습니다.\n" +
    "잠시 후 다시 시도해주세요."
  );
};

export function useGapRecommendationLoadingFlow({
  navigation,
  params,
  enabled = true,
}: Params) {
  const [progress, setProgress] =
    useState(2);

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

  const [
    streamMessage,
    setStreamMessage,
  ] = useState("");

  const [
    receivedPlaceCount,
    setReceivedPlaceCount,
  ] = useState(0);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    retryVersion,
    setRetryVersion,
  ] = useState(0);

  const receivedPlacesRef =
    useRef<RecommendedPlace[]>([]);

  const navigatedRef =
    useRef(false);

  const requestLockRef =
    useRef(false);

  const lastActivityAtRef =
    useRef(Date.now());

  const moveToResult = (
    places: RecommendedPlace[],
  ) => {
    if (navigatedRef.current) {
      return;
    }

    navigatedRef.current = true;

    navigation.replace(
      "GapRecommendationResult",
      {
        ...params,
        placesJson:
          JSON.stringify(places),
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
    requestLockRef.current = false;
    lastActivityAtRef.current =
      Date.now();

    setErrorMessage("");
    setStreamMessage("");
    setReceivedPlaceCount(0);
    setProgress(2);
    setDisplayStepIndex(0);
    setActiveDotIndex(0);
    setDotDirection(1);

    setRetryVersion(
      (previous) => previous + 1,
    );
  };

  useEffect(() => {
    if (!enabled || errorMessage) {
      return;
    }

    const timer = setInterval(() => {
      setProgress((previous) => {
        if (previous >= 94) {
          return previous;
        }

        return Math.min(
          previous + 2,
          94,
        );
      });
    }, 180);

    return () => {
      clearInterval(timer);
    };
  }, [
    enabled,
    errorMessage,
    retryVersion,
  ]);

  // 실제 추천 요청과 별개로 로딩 화면 진행률을 움직인다.
  // API를 추가 호출하지 않는 순수 UI 타이머다.
  useEffect(() => {
    if (!enabled || errorMessage || navigatedRef.current) {
      return;
    }

    const progressTimer = setInterval(() => {
      setProgress((previous) => {
        if (previous >= 94) {
          return previous;
        }

        return Math.min(previous + 2, 94);
      });
    }, 180);

    return () => {
      clearInterval(progressTimer);
    };
  }, [
    enabled,
    errorMessage,
    retryVersion,
  ]);

  useEffect(() => {
    if (
      !enabled ||
      progress < 94 ||
      errorMessage ||
      navigatedRef.current
    ) {
      return;
    }

    const timer = setInterval(() => {
      setDisplayStepIndex(
        (previous) =>
          (
            previous + 1
          ) %
          AI_ANALYSIS_LOADING_STEPS.length,
      );
    }, 1400);

    return () => {
      clearInterval(timer);
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
      const idleTime =
        Date.now() -
        lastActivityAtRef.current;

      if (idleTime < 20000) {
        return;
      }

      setProgress(100);

      setErrorMessage(
        "빈 시간 추천 결과를 끝까지 " +
        "불러오지 못했습니다.\n" +
        "다시 시도해주세요.",
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
    if (
      !enabled ||
      errorMessage ||
      requestLockRef.current
    ) {
      return;
    }

    let cancelled = false;

    const runGapRecommendation =
      async () => {
        const beforePlanId =
          Number(params.beforePlanId);

        const afterPlanId =
          Number(params.afterPlanId);

        if (
          !Number.isFinite(beforePlanId) ||
          !Number.isFinite(afterPlanId)
        ) {
          setProgress(100);

          setErrorMessage(
            "빈 시간 추천에 필요한 " +
            "일정 정보를 확인해주세요.",
          );

          return;
        }

        requestLockRef.current = true;
        navigatedRef.current = false;
        receivedPlacesRef.current = [];
        lastActivityAtRef.current =
          Date.now();

        setReceivedPlaceCount(0);

        const availableMinutes =
          params.availableMinutes ??
          params.gapMinutes ??
          30;

        const payload:
          GapRecommendationRequest = {
            beforePlanId,
            afterPlanId,
            transportMode:
              params.transportMode,
            radiusMinute: Math.max(
              availableMinutes,
              30,
            ),
          };

        try {
          await streamGapRecommendations(
            params.tripId,
            payload,
            {
              onProgress: (
                message,
              ) => {
                if (cancelled) {
                  return;
                }

                lastActivityAtRef.current =
                  Date.now();

                setStreamMessage(message);

                setProgress(
                  (previous) =>
                    Math.min(
                      previous + 4,
                      96,
                    ),
                );
              },

              onPlace: (place) => {
                if (cancelled) {
                  return;
                }

                lastActivityAtRef.current =
                  Date.now();

                const placeKey = String(
                  place.placeId ??
                    place.googlePlaceId ??
                    place.name ??
                    "",
                );

                const alreadyExists =
                  receivedPlacesRef.current
                    .some((item) => {
                      const itemKey =
                        String(
                          item.placeId ??
                            item.googlePlaceId ??
                            item.name ??
                            "",
                        );

                      return (
                        itemKey === placeKey
                      );
                    });

                if (alreadyExists) {
                  return;
                }

                receivedPlacesRef.current = [
                  ...receivedPlacesRef.current,
                  place,
                ];

                const count =
                  receivedPlacesRef.current
                    .length;

                setReceivedPlaceCount(count);

                setStreamMessage(
                  `${count}개의 추천 후보를 찾았어요`,
                );

                setProgress(
                  (previous) =>
                    Math.min(
                      previous + 8,
                      98,
                    ),
                );
              },

              onWarning: (
                message,
              ) => {
                if (cancelled) {
                  return;
                }

                lastActivityAtRef.current =
                  Date.now();

                setProgress(100);

                setErrorMessage(
                  message ||
                    "현재 조건으로는 " +
                    "추천할 장소가 없어요.",
                );
              },

              onDone: () => {
                if (cancelled) {
                  return;
                }

                const places = [
                  ...receivedPlacesRef.current,
                ];

                setProgress(100);

                if (
                  places.length === 0
                ) {
                  setErrorMessage(
                    "현재 조건으로는 " +
                    "추천할 장소가 없어요.",
                  );

                  return;
                }

                setStreamMessage(
                  "빈 시간 추천 결과를 " +
                  "불러왔어요",
                );

                moveToResult(places);
              },

              onError: (
                error,
              ) => {
                if (cancelled) {
                  return;
                }

                setProgress(100);

                setErrorMessage(
                  getGapErrorMessage(
                    error,
                  ),
                );
              },
            },
          );


          // 서버가 장소 결과를 보냈지만 SSE done 이벤트를
          // 누락한 경우에도 로딩 화면에 머물지 않도록 처리한다.
          const fallbackPlaces = [
            ...receivedPlacesRef.current,
          ];

          if (
            !cancelled &&
            !navigatedRef.current &&
            fallbackPlaces.length > 0
          ) {
            setProgress(100);
            setStreamMessage(
              "빈 시간 추천 결과를 불러왔어요",
            );
            moveToResult(fallbackPlaces);
          }
        } catch (error) {
          if (cancelled) {
            return;
          }

          setProgress(100);

          setErrorMessage(
            getGapErrorMessage(
              error,
            ),
          );
        } finally {
          requestLockRef.current = false;
        }
      };

    void runGapRecommendation();

    return () => {
      cancelled = true;
    };
  }, [
    enabled,
    retryVersion,
    errorMessage,
    params.tripId,
    params.beforePlanId,
    params.afterPlanId,
    params.transportMode,
    params.availableMinutes,
    params.gapMinutes,
  ]);

  useEffect(() => {
    if (
      !enabled ||
      errorMessage ||
      navigatedRef.current ||
      progress >= 100
    ) {
      return;
    }

    const timer = setInterval(() => {
      setActiveDotIndex(
        (previous) => {
          if (
            previous >=
            AI_ANALYSIS_DOT_COUNT - 1
          ) {
            setDotDirection(-1);

            return previous - 1;
          }

          if (previous <= 0) {
            setDotDirection(1);

            return previous + 1;
          }

          return (
            previous + dotDirection
          );
        },
      );
    }, 240);

    return () => {
      clearInterval(timer);
    };
  }, [
    enabled,
    dotDirection,
    errorMessage,
    progress,
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
