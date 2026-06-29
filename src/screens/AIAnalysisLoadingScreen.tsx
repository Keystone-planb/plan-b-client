import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  ImageSourcePropType,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getAnalyzedPlaceDetail } from "../../api/places/place";
import { streamRecommendations } from "../../api/recommendations/stream";
import { trackEvent, AMP } from "../utils/amplitude";
import type {
  PlaceSpace,
  PlaceType,
  RecommendRequest,
  RecommendedPlace,
} from "../types/recommendation";

const StepSearchIcon = require("../assets/ai-loading/step-search.png");
const StepPinIcon = require("../assets/ai-loading/step-pin.png");
const StepStarIcon = require("../assets/ai-loading/step-star.png");
const StepInboxIcon = require("../assets/ai-loading/step-inbox.png");
const StepWriteIcon = require("../assets/ai-loading/step-write.png");

type TransportMode = "WALK" | "TRANSIT" | "CAR";
type MoveTime = "10" | "20" | "30" | "ANY";
type PlaceScope = "INDOOR" | "OUTDOOR";
type RecommendationType = "PLACE" | "GAP";

type TodayPlace = {
  id?: string | number;
  tripPlaceId?: string | number;
  serverTripPlaceId?: string | number;
  placeId?: string;
  googlePlaceId?: string;
  name?: string;
  address?: string;
  time?: string;
  visitTime?: string | null;
  endTime?: string | null;
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  category?: string;
};

type Props = {
  navigation: any;
  route?: {
    params?: {
      scheduleId?: string;
      tripId?: string | number;
      serverTripId?: string | number;
      tripName?: string;
      startDate?: string;
      endDate?: string;
      location?: string;
      transportMode?: TransportMode;
      transportLabel?: string;
      moveTime?: MoveTime;
      considerDistance?: boolean;
      changeCategory?: boolean;
      placeScope?: PlaceScope;
      selectedType?: PlaceType;
      targetPlace?: TodayPlace;
      recommendationType?: RecommendationType;
      beforePlanId?: string | number;
      afterPlanId?: string | number;
      currentPlanId?: string | number;
      tripPlaceId?: string | number;
      serverTripPlaceId?: string | number;
      currentLat?: number;
      currentLng?: number;
      latitude?: number;
      longitude?: number;
    };
  };
};

type LoadingStep = {
  icon: ImageSourcePropType;
  title: string;
  description: string;
  tip: string;
  detailTitle: string;
  detailDescription: string;
};

type PlaceDetailForRecommendation = {
  placeId?: number | string;
  googlePlaceId?: string;
  name?: string;
  address?: string;
  category?: string;
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
};

const LOADING_STEPS: LoadingStep[] = [
  {
    icon: StepSearchIcon,
    title: "주변 장소를 찾고 있어요",
    description: "이동 조건에 맞는 장소를 분석 중이에요",
    tip: "5개의 대안을 찾아드려요",
    detailTitle: "잠깐! 알고 계셨나요?",
    detailDescription:
      "Plan.B AI는 현재 일정, 이동수단, 장소 유형을 함께 분석해서 대안 장소를 추천해요.",
  },
  {
    icon: StepPinIcon,
    title: "이동 거리와 시간을 계산하고 있어요",
    description: "이동 거리와 시간을 계산하고 있어요",
    tip: "위치와 이동 조건을 반영해요",
    detailTitle: "장소를 비교하고 있어요",
    detailDescription:
      "현재 장소의 좌표와 이동 가능 시간을 기준으로 주변 후보 장소를 살펴보고 있어요.",
  },
  {
    icon: StepStarIcon,
    title: "리뷰 데이터를 분석하고 있어요",
    description: "리뷰 데이터를 분석하고 있어요",
    tip: "리뷰와 분위기를 종합해요",
    detailTitle: "리뷰도 함께 확인해요",
    detailDescription:
      "평점뿐 아니라 방문자 반응, 장소 분위기, 추천 이유까지 함께 정리하고 있어요.",
  },
  {
    icon: StepInboxIcon,
    title: "조건에 맞는 장소를 고르고 있어요",
    description: "조건에 맞는 장소를 고르고 있어요",
    tip: "다음 목적지까지 고려해요",
    detailTitle: "일정 흐름을 지켜요",
    detailDescription:
      "대안 장소를 고를 때 다음 일정과의 이동 부담도 함께 고려해요.",
  },
  {
    icon: StepWriteIcon,
    title: "추천 결과를 정리하고 있어요",
    description: "추천 결과를 정리하고 있어요",
    tip: "곧 완료돼요",
    detailTitle: "추천 결과를 정리 중이에요",
    detailDescription:
      "AI가 찾은 대안 장소를 카드 형태로 보기 쉽게 정리하고 있어요.",
  },
];

const DOT_COUNT = 6;

const PLACE_TYPE_VALUES = [
  "FOOD",
  "CAFE",
  "SIGHTS",
  "SHOP",
  "MARKET",
  "THEME",
  "CULTURE",
  "PARK",
] as const;

const toNumberIfNumeric = (value?: string | number) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "number") return value;

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : value;
};

const removeUndefined = <T extends Record<string, unknown>>(value: T) => {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined),
  ) as Partial<T>;
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  return "추천 요청 중 알 수 없는 오류가 발생했습니다.";
};

const getRadiusMinute = (moveTime?: MoveTime) => {
  if (moveTime === "10") return 10;
  if (moveTime === "20") return 20;
  if (moveTime === "30") return 30;

  return 15;
};

const getSelectedSpace = (placeScope?: PlaceScope): PlaceSpace | undefined => {
  if (placeScope === "INDOOR") return "INDOOR";
  if (placeScope === "OUTDOOR") return "OUTDOOR";

  return undefined;
};

const normalizePlaceType = (category?: string): PlaceType | undefined => {
  if (!category) return undefined;

  const upperCategory = category.toUpperCase();

  if (PLACE_TYPE_VALUES.includes(upperCategory as PlaceType)) {
    return upperCategory as PlaceType;
  }

  if (
    upperCategory.includes("CAFE") ||
    upperCategory.includes("COFFEE") ||
    category.includes("카페")
  ) {
    return "CAFE";
  }

  if (
    upperCategory.includes("FOOD") ||
    upperCategory.includes("RESTAURANT") ||
    upperCategory.includes("MEAL") ||
    category.includes("음식") ||
    category.includes("식당") ||
    category.includes("맛집")
  ) {
    return "FOOD";
  }

  if (upperCategory.includes("PARK") || category.includes("공원")) {
    return "PARK";
  }

  if (
    upperCategory.includes("MUSEUM") ||
    upperCategory.includes("GALLERY") ||
    category.includes("미술관") ||
    category.includes("박물관") ||
    category.includes("문화")
  ) {
    return "CULTURE";
  }

  if (
    upperCategory.includes("SHOP") ||
    upperCategory.includes("STORE") ||
    category.includes("쇼핑")
  ) {
    return "SHOP";
  }

  if (upperCategory.includes("MARKET") || category.includes("시장")) {
    return "MARKET";
  }

  if (upperCategory.includes("THEME") || upperCategory.includes("AMUSEMENT")) {
    return "THEME";
  }

  if (
    upperCategory.includes("TOURIST") ||
    upperCategory.includes("SIGHT") ||
    upperCategory.includes("ATTRACTION") ||
    category.includes("관광")
  ) {
    return "SIGHTS";
  }

  return undefined;
};

const fetchPlaceDetailForRecommendation = async (
  googlePlaceId?: string,
): Promise<PlaceDetailForRecommendation | null> => {
  if (!googlePlaceId) return null;

  try {
    const placeDetail = await getAnalyzedPlaceDetail(String(googlePlaceId));
    return placeDetail as PlaceDetailForRecommendation;
  } catch (error) {
    console.log("[AIAnalysisLoading] place detail request failed:", error);
    return null;
  }
};

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

        const storedUserId = await AsyncStorage.getItem("user_id");
        const userId = storedUserId ? toNumberIfNumeric(storedUserId) : 1;

        const targetPlace = params.targetPlace;
        const resolvedTripId = params.tripId ?? params.serverTripId;

        const resolvedCurrentPlanId =
          targetPlace?.serverTripPlaceId ??
          targetPlace?.tripPlaceId;

        const debugParams = params as Record<string, unknown>;

        const resolvedGooglePlaceId =
          targetPlace?.googlePlaceId ??
          targetPlace?.placeId ??
          (typeof targetPlace?.id === "string" ? targetPlace.id : undefined);

        let currentLat = targetPlace?.latitude;
        let currentLng = targetPlace?.longitude;
        let category = targetPlace?.category;

        const hasInvalidCoordinate =
          currentLat === undefined ||
          currentLng === undefined ||
          (Number(currentLat) === 0 && Number(currentLng) === 0);

        if ((hasInvalidCoordinate || !category) && resolvedGooglePlaceId) {
          const placeDetail = await fetchPlaceDetailForRecommendation(
            resolvedGooglePlaceId,
          );

          if (placeDetail) {
            currentLat =
              hasInvalidCoordinate ?
                (placeDetail.latitude ?? placeDetail.lat ?? currentLat)
              : currentLat;
            currentLng =
              hasInvalidCoordinate ?
                (placeDetail.longitude ?? placeDetail.lng ?? currentLng)
              : currentLng;
            category = category ?? placeDetail.category;
          }
        }

        const selectedType =
          params.changeCategory ?
            params.selectedType
          : undefined;
        const selectedSpace = getSelectedSpace(params.placeScope);

        const rawPayload = {
          tripId: toNumberIfNumeric(resolvedTripId),
          currentPlanId: toNumberIfNumeric(resolvedCurrentPlanId),
          tripPlaceId: toNumberIfNumeric(resolvedCurrentPlanId),
          placeId: resolvedGooglePlaceId,
          currentLat,
          currentLng,
          latitude: currentLat,
          longitude: currentLng,
          radiusMinute: getRadiusMinute(params.moveTime),
          transportMode: params.transportMode ?? "WALK",
          selectedType,
          selectedSpace,
          keepOriginalCategory: !params.changeCategory,
          considerNextPlan: Boolean(params.considerDistance),
        };

        const payload = removeUndefined(rawPayload) as RecommendRequest;

        if (
          payload.currentLat === undefined ||
          payload.currentLng === undefined ||
          (Number(payload.currentLat) === 0 && Number(payload.currentLng) === 0)
        ) {
          throw new Error(
            "추천 요청에 필요한 장소 좌표를 가져오지 못했습니다. 장소 상세 API 응답 또는 장소 저장 좌표를 확인해주세요.",
          );
        }
        if (!payload.currentPlanId) {
          throw new Error(
            "추천 요청에 필요한 currentPlanId가 없습니다. 서버 tripPlaceId 전달을 확인해주세요.",
          );
        }

        if (
          params.recommendationType !== "GAP" &&
          (payload.currentLat === undefined || payload.currentLng === undefined)
        ) {
          throw new Error(
            "추천 요청에 필요한 currentLat/currentLng가 없습니다. 장소 상세 API 좌표 응답을 확인해주세요.",
          );
        }
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

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.logoText}>Plan.B</Text>
        </View>

        <View style={styles.centerContent}>
          <View style={styles.progressBox}>
            <View style={styles.progressTrack}>
              <Animated.View
                style={[styles.progressFill, { width: progressWidth }]}
              />
            </View>

            <Text style={styles.progressText}>{Math.round(progress)}%</Text>
          </View>

          <Animated.View
            style={[
              styles.iconWrapper,
              {
                transform: [{ translateY: iconFloat }, { scale: iconScale }],
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
            {errorMessage ? "추천 결과를 찾지 못했어요" : currentStep.title}
          </Text>

          <Text
            style={[
              styles.description,
              errorMessage ? styles.errorDescription : null,
            ]}
          >
            {descriptionText}
          </Text>

          {!errorMessage && placeCountText ?
            <Text style={styles.placeCountText}>{placeCountText}</Text>
          : null}

          {errorMessage ?
            <View style={styles.errorButtonRow}>
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton]}
                activeOpacity={0.85}
                onPress={handleGoBack}
              >
                <Text style={[styles.actionButtonText, styles.secondaryText]}>
                  이전으로
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.primaryButton]}
                activeOpacity={0.85}
                onPress={handleRetry}
              >
                <Text style={styles.actionButtonText}>다시 시도</Text>
              </TouchableOpacity>
            </View>
          : <View style={styles.tipPill}>
              <Text style={styles.tipPillEmoji}>💡</Text>
              <Text style={styles.tipPillText}>{currentStep.tip}</Text>
            </View>
          }
        </View>

        {!errorMessage ?
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

        <View style={[styles.tipCard, errorMessage ? styles.errorCard : null]}>
          <View style={styles.tipCardHeader}>
            <Text
              style={[
                styles.tipCardLabel,
                errorMessage ? styles.errorTipCardLabel : null,
              ]}
            >
              {errorMessage ? "TIP" : "AI ANALYSIS"}
            </Text>
          </View>

          <Text style={styles.tipCardTitle}>
            {errorMessage ? "PLAN.B의 제안" : currentStep.detailTitle}
          </Text>

          <Text style={styles.tipCardDescription}>
            {errorMessage ?
              "이동 시간, 이동수단, 실내/실외 조건을 완화하면\n추천 결과가 나올 수 있어요."
            : currentStep.detailDescription}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 34,
  },
  header: {
    alignItems: "center",
    paddingTop: Platform.OS === "web" ? 54 : 62,
  },
  logoText: {
    color: "#1C2534",
    fontSize: 29,
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  centerContent: {
    alignItems: "center",
    marginTop: 48,
  },
  progressBox: {
    width: "100%",
    marginBottom: 54,
  },
  progressTrack: {
    width: "100%",
    height: 6,
    borderRadius: 999,
    backgroundColor: "#E8EFFB",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#2158E8",
  },
  progressText: {
    marginTop: 10,
    color: "#2158E8",
    fontSize: 15,
    fontWeight: "900",
    textAlign: "right",
  },
  iconWrapper: {
    width: 216,
    height: 216,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 26,
  },
  iconGlow: {
    position: "absolute",
    width: 194,
    height: 194,
    borderRadius: 97,
    backgroundColor: "#F2F7FF",
  },
  stepIcon: {
    width: 178,
    height: 178,
  },
  title: {
    color: "#111827",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.45,
    textAlign: "center",
    marginBottom: 13,
  },
  placeCountText: {
    marginTop: 8,
    color: "#2563EB",
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },

  description: {
    color: "#8A9BB2",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
    textAlign: "center",
    marginBottom: 19,
  },
  errorDescription: {
    color: "#EF4444",
    lineHeight: 19,
  },
  tipPill: {
    minHeight: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CFE0FF",
    backgroundColor: "#F2F7FF",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  tipPillEmoji: {
    fontSize: 11,
  },
  tipPillText: {
    color: "#2F6BFF",
    fontSize: 10,
    fontWeight: "900",
  },
  dotsArea: {
    marginTop: 55,
    alignItems: "center",
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#E0E8F2",
  },
  activeDot: {
    width: 18,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#2158E8",
  },
  tipCard: {
    marginTop: 48,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E1E7EF",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 22,
    paddingVertical: 24,
    minHeight: 150,
    justifyContent: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 3,
  },
  errorCard: {
    borderColor: "#FECACA",
    backgroundColor: "#FFF7F7",
  },
  tipCardHeader: {
    marginBottom: 9,
  },
  tipCardLabel: {
    color: "#2158E8",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  errorTipCardLabel: {
    color: "#EF4444",
  },
  tipCardTitle: {
    color: "#1C2534",
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 11,
    letterSpacing: -0.2,
  },
  tipCardDescription: {
    color: "#8A9BB2",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 20,
  },
  errorButtonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 6,
  },
  actionButton: {
    height: 38,
    minWidth: 92,
    borderRadius: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    backgroundColor: "#2158E8",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
  secondaryText: {
    color: "#64748B",
  },
});
