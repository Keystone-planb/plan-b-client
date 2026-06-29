import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { styles } from "./AIAnalysisLoadingScreen.styles";
import {
  AI_ANALYSIS_DOT_COUNT as DOT_COUNT,
  AI_ANALYSIS_LOADING_STEPS as LOADING_STEPS,
  EmptyResultImage,
  createRecommendationPayload,
  getAIAnalysisErrorMessage as getErrorMessage,
  type AIAnalysisLoadingScreenProps as Props,
} from "../utils/recommendation/aiAnalysisLoadingConfig";

import { streamRecommendations } from "../../api/recommendations/stream";
import { trackEvent, AMP } from "../utils/amplitude";
import type {
  RecommendedPlace,
} from "../types/recommendation";

export default function AIAnalysisLoadingScreen({ navigation, route }: Props) {
  const params = route?.params ?? {};

  const [progress, setProgress] = useState(2);
  const [displayStepIndex, setDisplayStepIndex] = useState(0);
  const [activeDotIndex, setActiveDotIndex] = useState(0);
  const [dotDirection, setDotDirection] = useState<1 | -1>(1);
  const [streamMessage, setStreamMessage] = useState("");
  const [receivedPlaceCount, setReceivedPlaceCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [retryVersion, setRetryVersion] = useState(0);

  const receivedPlacesRef = useRef<RecommendedPlace[]>([]);
  const navigatedRef = useRef(false);
  const lastActivityAtRef = useRef(Date.now());
  const requestStartAtRef = useRef(Date.now()); // latency_ms 측정용

  const floatValue = useMemo(() => new Animated.Value(0), []);
  const pulseValue = useMemo(() => new Animated.Value(0), []);
  const progressValue = useMemo(() => new Animated.Value(2), []);

  const progressStepIndex = Math.min(
    Math.floor((progress / 100) * LOADING_STEPS.length),
    LOADING_STEPS.length - 1,
  );

  const currentStepIndex =
    progress >= 94 ? displayStepIndex : progressStepIndex;
  const currentStep = LOADING_STEPS[currentStepIndex];

  const iconFloat = floatValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -8, 0],
  });

  const iconScale = pulseValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.045, 1],
  });

  const progressWidth = progressValue.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  const moveToResult = (places: RecommendedPlace[]) => {
    if (navigatedRef.current) return;

    navigatedRef.current = true;

    const latencyMs = Date.now() - requestStartAtRef.current;

    if (places.length === 0) {
      // 추천 결과 0개 — AI 실패 또는 조건 불일치
      trackEvent(AMP.SOS_RESULT_EMPTY, {
        trip_id: params.tripId ? String(params.tripId) : undefined,
        plan_id: String(params.currentPlanId ?? params.tripPlaceId ?? ""),
        transport_mode: params.transportMode,
        radius_minute: params.moveTime,
        recommendation_type: params.recommendationType ?? "PLACE",
        latency_ms: latencyMs,
      });
    }

    trackEvent(AMP.ALTERNATIVES_SHOWN, {
      count: places.length,
      latency_ms: latencyMs,
      recommendation_type: params.recommendationType ?? "PLACE",
      trip_id: params.tripId ? String(params.tripId) : undefined,
      plan_id: String(params.currentPlanId ?? params.tripPlaceId ?? ""),
    });

    navigation.replace("RecommendationResult", {
      ...params,
      placesJson: JSON.stringify(places),
      fromAIAnalysis: true,
      hasError: false,
    });
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleRetry = () => {
    receivedPlacesRef.current = [];
    navigatedRef.current = false;
    lastActivityAtRef.current = Date.now();

    setErrorMessage("");
    setStreamMessage("");
    setReceivedPlaceCount(0);
    setProgress(2);
    setDisplayStepIndex(0);
    setRetryVersion((prev) => prev + 1);
  };

  useEffect(() => {
    Animated.timing(progressValue, {
      toValue: progress,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, progressValue]);

  useEffect(() => {
    if (errorMessage) return;

    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 94) return prev;
        return Math.min(prev + 2, 94);
      });
    }, 180);

    return () => {
      clearInterval(progressTimer);
    };
  }, [errorMessage, retryVersion]);

  useEffect(() => {
    if (progress < 94 || errorMessage || navigatedRef.current) {
      return;
    }

    const stepCycleTimer = setInterval(() => {
      setDisplayStepIndex((prev) => (prev + 1) % LOADING_STEPS.length);
    }, 1400);

    return () => {
      clearInterval(stepCycleTimer);
    };
  }, [progress, errorMessage, retryVersion]);

  useEffect(() => {
    if (
      errorMessage ||
      navigatedRef.current ||
      progress < 94 ||
      progress >= 100
    ) {
      return;
    }

    const watchdog = setInterval(() => {
      const idleMs = Date.now() - lastActivityAtRef.current;

      if (idleMs < 20000) {
        return;
      }

      console.log("[AIAnalysisLoading] watchdog timeout:", idleMs);

      setProgress(100);
      setErrorMessage(
        "추천 결과를 끝까지 불러오지 못했습니다.\n다시 시도해주세요.",
      );
    }, 1000);

    return () => {
      clearInterval(watchdog);
    };
  }, [progress, errorMessage, retryVersion]);


  useEffect(() => {
    if (errorMessage) return;

    let cancelled = false;

    const runRecommendationStream = async () => {
      try {
        receivedPlacesRef.current = [];
        setReceivedPlaceCount(0);
        navigatedRef.current = false;
        lastActivityAtRef.current = Date.now();

        const payload =
          await createRecommendationPayload({
            params,
          });

        await streamRecommendations(payload, {
          onProgress: (message) => {
            if (cancelled) return;

            lastActivityAtRef.current = Date.now();
            setStreamMessage(message);
            setProgress((prev) => Math.min(prev + 4, 96));
          },

          onPlace: (place) => {
            if (cancelled) return;

            lastActivityAtRef.current = Date.now();
            receivedPlacesRef.current = [...receivedPlacesRef.current, place];
            setReceivedPlaceCount(receivedPlacesRef.current.length);
            setStreamMessage(
              `${receivedPlacesRef.current.length}개의 추천 후보를 찾았어요`,
            );
            setProgress((prev) => Math.min(prev + 8, 98));
          },

          onWarning: (message) => {
            if (cancelled) return;

            lastActivityAtRef.current = Date.now();

            console.log("[AIAnalysisLoading] stream warning:", message);
            setStreamMessage(
              message || "조건에 맞는 장소를 찾지 못했습니다.",
            );
            setProgress(100);
            setErrorMessage(
              message ||
                "현재 조건으로는 추천할 장소가 없어요.",
            );
          },

          onStreamError: (message) => {
            if (cancelled) return;

            console.log("[AIAnalysisLoading] stream server error:", message);
            setProgress((prev) => Math.max(prev, 98));
            setErrorMessage(
              message || "서버 오류가 발생했습니다. 다시 시도해주세요.",
            );
          },

          onDone: () => {
            if (cancelled) return;

            const receivedPlaces = [...receivedPlacesRef.current];

            console.log("[AIAnalysisLoading] stream done:", {
              count: receivedPlaces.length,
            });

            setProgress(100);

            if (receivedPlaces.length === 0) {
              setErrorMessage(
                "현재 조건으로는 추천할 장소가 없어요.",
              );
              return;
            }

            setStreamMessage("추천 결과를 불러왔어요");

            console.log("[AIAnalysisLoading] 결과 화면 이동:", {
              count: receivedPlaces.length,
            });

            moveToResult(receivedPlaces);
          },

          onError: (error) => {
            if (cancelled) return;

            console.log("[AIAnalysisLoading] stream error:", error);

            setProgress(100);

            const message = getErrorMessage(error);

            if (message.includes("500")) {
              setErrorMessage(
                "현재 추천 서버가 불안정합니다. 잠시 후 다시 시도해주세요.",
              );
            } else if (message.includes("좌표") || message.includes("장소")) {
              setErrorMessage(
                "장소 정보를 불러오지 못했습니다. 장소를 다시 선택한 뒤 시도해주세요.",
              );
            } else if (
              message.includes("Failed to fetch") ||
              message.includes("Network") ||
              message.includes("fetch")
            ) {
              setErrorMessage(
                "네트워크 연결이 불안정합니다. 인터넷 상태를 확인해주세요.",
              );
            } else if (
              message.includes("끊겼습니다") ||
              message.includes("stream")
            ) {
              setErrorMessage(
                "추천 결과를 끝까지 불러오지 못했습니다. 다시 시도해주세요.",
              );
            } else {
              setErrorMessage(message);
            }
          },
        });
      } catch (error) {
        if (cancelled) return;

        console.log("[AIAnalysisLoading] run stream failed:", error);

        setProgress(100);

        const message = getErrorMessage(error);

        if (message.includes("500")) {
          setErrorMessage(
            "현재 추천 서버가 불안정합니다. 잠시 후 다시 시도해주세요.",
          );
        } else if (message.includes("좌표") || message.includes("장소")) {
          setErrorMessage(
            "장소 정보를 불러오지 못했습니다. 장소를 다시 선택한 뒤 시도해주세요.",
          );
        } else if (
          message.includes("Failed to fetch") ||
          message.includes("Network") ||
          message.includes("fetch")
        ) {
          setErrorMessage(
            "네트워크 연결이 불안정합니다. 인터넷 상태를 확인해주세요.",
          );
        } else if (
          message.includes("끊겼습니다") ||
          message.includes("stream")
        ) {
          setErrorMessage(
            "추천 결과를 끝까지 불러오지 못했습니다. 다시 시도해주세요.",
          );
        } else {
          setErrorMessage(message);
        }
      }
    };

    runRecommendationStream();

    return () => {
      cancelled = true;
    };
  }, [
    retryVersion,
    errorMessage,
    params.tripId,
    params.serverTripId,
    params.moveTime,
    params.placeScope,
    params.transportMode,
    params.changeCategory,
    params.considerDistance,
    params.recommendationType,
    params.targetPlace,
  ]);

  useEffect(() => {
    if (errorMessage) return;

    const dotTimer = setInterval(() => {
      setActiveDotIndex((prev) => {
        if (prev >= DOT_COUNT - 1) {
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
  }, [dotDirection, errorMessage, retryVersion]);

  useEffect(() => {
    const floatAnimation = Animated.loop(
      Animated.timing(floatValue, {
        toValue: 1,
        duration: 1700,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
        isInteraction: false,
      }),
    );

    const pulseAnimation = Animated.loop(
      Animated.timing(pulseValue, {
        toValue: 1,
        duration: 1500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
        isInteraction: false,
      }),
    );

    floatAnimation.start();
    pulseAnimation.start();

    return () => {
      floatAnimation.stop();
      pulseAnimation.stop();
    };
  }, [floatValue, pulseValue]);

  const placeCountText =
    receivedPlaceCount > 0 ?
      `현재 ${receivedPlaceCount}개의 추천 후보를 분석했어요`
    : "";

  const descriptionText =
    errorMessage || streamMessage || currentStep.description;

  const isEmptyResult =
    errorMessage.includes("현재 조건으로는 추천할 장소가 없어요") ||
    errorMessage.includes("조건에 맞는 장소를 찾지 못했습니다");

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.logoText}>Plan.B</Text>
        </View>

        {isEmptyResult ? (
          <View style={styles.emptyResultContent}>
            <Image
              source={EmptyResultImage}
              style={styles.emptyResultImage}
              resizeMode="contain"
            />

            <Text style={styles.emptyResultTitle}>
              추천 결과를 찾지 못했어요
            </Text>

            <Text style={styles.emptyResultDescription}>
              현재 조건으로는 추천할 장소가 없어요.
            </Text>

            <TouchableOpacity
              style={styles.resetConditionButton}
              activeOpacity={0.85}
              onPress={handleGoBack}
            >
              <Text style={styles.resetConditionButtonText}>
                조건 다시 설정하기
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.centerContent}>
            <View style={styles.progressBox}>
              <View style={styles.progressTrack}>
                <Animated.View
                  style={[styles.progressFill, { width: progressWidth }]}
                />
              </View>

              <Text style={styles.progressText}>
                {Math.round(progress)}%
              </Text>
            </View>

            <Animated.View
              style={[
                styles.iconWrapper,
                {
                  transform: [
                    { translateY: iconFloat },
                    { scale: iconScale },
                  ],
                },
              ]}
            >
              <View style={styles.iconGlow} />

              <Image
                source={currentStep.icon}
                style={styles.stepIcon}
                resizeMode="contain"
              />
            </Animated.View>

            <Text style={styles.title}>
              {errorMessage
                ? "추천 요청을 완료하지 못했어요"
                : currentStep.title}
            </Text>

            <Text
              style={[
                styles.description,
                errorMessage ? styles.errorDescription : null,
              ]}
            >
              {descriptionText}
            </Text>

            {!errorMessage && placeCountText ? (
              <Text style={styles.placeCountText}>
                {placeCountText}
              </Text>
            ) : null}

            {errorMessage ? (
              <View style={styles.errorButtonRow}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.secondaryButton,
                  ]}
                  activeOpacity={0.85}
                  onPress={handleGoBack}
                >
                  <Text
                    style={[
                      styles.actionButtonText,
                      styles.secondaryText,
                    ]}
                  >
                    이전으로
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.primaryButton,
                  ]}
                  activeOpacity={0.85}
                  onPress={handleRetry}
                >
                  <Text style={styles.actionButtonText}>
                    다시 시도
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.tipPill}>
                <Text style={styles.tipPillEmoji}>💡</Text>
                <Text style={styles.tipPillText}>
                  {currentStep.tip}
                </Text>
              </View>
            )}
          </View>
        )}

        {!errorMessage && !isEmptyResult ?
          <View style={styles.dotsArea}>
            <View style={styles.dotsRow}>
              {Array.from({ length: DOT_COUNT }).map((_, index) => {
                const isActive = index === activeDotIndex;

                return (
                  <View
                    key={`loading-dot-${index}`}
                    style={[styles.dot, isActive && styles.activeDot]}
                  />
                );
              })}
            </View>
          </View>
        : null}

        {isEmptyResult ? (
          <View style={styles.emptyTipCard}>
            <Text style={styles.emptyTipLabel}>TIP</Text>

            <Text style={styles.emptyTipTitle}>
              PLAN.B의 제안
            </Text>

            <Text style={styles.emptyTipDescription}>
              조건을 조금 완화하면 더 많은{"\n"}
              추천 결과를 확인할 수 있어요.
            </Text>
          </View>
        ) : (
          <View
            style={[
              styles.tipCard,
              errorMessage ? styles.errorCard : null,
            ]}
          >
            <View style={styles.tipCardHeader}>
              <Text
                style={[
                  styles.tipCardLabel,
                  errorMessage
                    ? styles.errorTipCardLabel
                    : null,
                ]}
              >
                {errorMessage ? "TIP" : "AI ANALYSIS"}
              </Text>
            </View>

            <Text style={styles.tipCardTitle}>
              {errorMessage
                ? "PLAN.B의 제안"
                : currentStep.detailTitle}
            </Text>

            <Text style={styles.tipCardDescription}>
              {errorMessage
                ? "잠시 후 다시 시도하거나 이전 화면에서 조건을 확인해주세요."
                : currentStep.detailDescription}
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
