import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { API_CONFIG } from "../../api/config";
import { streamRecommendations } from "../../api/recommendations/stream";
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

  // 서버에서 생성된 여행 장소 ID
  tripPlaceId?: string | number;
  serverTripPlaceId?: string | number;

  // 외부 장소 ID
  placeId?: string;
  googlePlaceId?: string;

  name?: string;
  address?: string;
  time?: string;
  latitude?: number;
  longitude?: number;
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
      considerCrowd?: boolean;
      changeCategory?: boolean;
      placeScope?: PlaceScope;
      targetPlace?: TodayPlace;
      recommendationType?: RecommendationType;
      beforePlanId?: string | number;
      afterPlanId?: string | number;
    };
  };
};

type LoadingStep = {
  icon: ImageSourcePropType;
  title: string;
  description: string;
  tip: string;
  detailTipTitle: string;
  detailTipDescription: string;
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
    title: "여행 데이터 분석 중",
    description: "선택하신 조건을 바탕으로 데이터를 수집하고 있어요",
    tip: "💡 5개의 대안을 찾아드려요",
    detailTipTitle: "잠깐! 알고 계셨나요?",
    detailTipDescription: "Plan.B AI는 현재 일정과 선택 조건을 함께 분석해요.",
  },
  {
    icon: StepPinIcon,
    title: "주변 장소 분석 중",
    description: "선택 사항을 고려해 장소를 찾고 있어요",
    tip: "💡 AI가 최적의 장소를 찾아드려요",
    detailTipTitle: "장소를 비교하고 있어요",
    detailTipDescription:
      "현재 위치, 다음 일정, 이동 조건을 바탕으로 주변 장소를 살펴보고 있어요.",
  },
  {
    icon: StepStarIcon,
    title: "리뷰 분석 중",
    description: "AI가 실시간 리뷰를 분석하고 있어요",
    tip: "💡 네이버, 구글, 인스타그램 리뷰를 종합 분석해요",
    detailTipTitle: "리뷰도 함께 확인해요",
    detailTipDescription:
      "평점뿐 아니라 방문자 반응과 장소 분위기도 함께 참고하고 있어요.",
  },
  {
    icon: StepInboxIcon,
    title: "대안 장소 분석 중",
    description: "가장 적합한 대안들을 선별하고 있어요",
    tip: "💡 다음 목적지와의 거리를 고려해요",
    detailTipTitle: "일정 흐름을 지켜요",
    detailTipDescription:
      "대안 장소를 고를 때 다음 목적지와의 이동 부담도 함께 고려해요.",
  },
  {
    icon: StepWriteIcon,
    title: "추천 결과 생성 중",
    description: "최종 결과를 정리하고 있어요",
    tip: "💡 곧 완료돼요!",
    detailTipTitle: "추천 결과를 정리 중이에요",
    detailTipDescription: "추천 이유와 장소 정보를 보기 쉽게 정리하고 있어요.",
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
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === "number") {
    return value;
  }

  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : value;
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "추천 요청 중 알 수 없는 오류가 발생했습니다.";
};

const normalizeBaseUrl = (baseUrl: string) => {
  return baseUrl.replace(/\/+$/, "");
};

const removeUndefined = <T extends Record<string, unknown>>(value: T) => {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined),
  ) as Partial<T>;
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
  if (!category) {
    return undefined;
  }

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
  if (!googlePlaceId) {
    return null;
  }

  try {
    const accessToken = await AsyncStorage.getItem("access_token");
    const url = `${normalizeBaseUrl(API_CONFIG.BASE_URL)}/api/places/${encodeURIComponent(
      googlePlaceId,
    )}`;

    const response = await fetch(url, {
      method: "GET",
      headers: removeUndefined({
        Authorization: accessToken ? `Bearer ${accessToken}` : undefined,
        Accept: "application/json",
      }) as Record<string, string>,
    });

    console.log("[AIAnalysisLoading] place detail response:", {
      status: response.status,
      ok: response.ok,
      url,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.log("[AIAnalysisLoading] place detail failed:", {
        status: response.status,
        errorText,
      });
      return null;
    }

    const data = (await response.json()) as PlaceDetailForRecommendation;

    console.log("[AIAnalysisLoading] place detail data:", data);

    return data;
  } catch (error) {
    console.log("[AIAnalysisLoading] place detail request failed:", error);
    return null;
  }
};

export default function AIAnalysisLoadingScreen({ navigation, route }: Props) {
  const params = route?.params ?? {};

  const [progress, setProgress] = useState(2);
  const [activeDotIndex, setActiveDotIndex] = useState(0);
  const [dotDirection, setDotDirection] = useState<1 | -1>(1);
  const [streamMessage, setStreamMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const receivedPlacesRef = useRef<RecommendedPlace[]>([]);
  const navigatedRef = useRef(false);
  const retryKeyRef = useRef(0);

  const floatValue = useMemo(() => new Animated.Value(0), []);
  const pulseValue = useMemo(() => new Animated.Value(0), []);

  const currentStepIndex = Math.min(
    Math.floor((progress / 100) * LOADING_STEPS.length),
    LOADING_STEPS.length - 1,
  );

  const currentStep = LOADING_STEPS[currentStepIndex];

  const iconFloat = floatValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -6, 0],
  });

  const iconScale = pulseValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.035, 1],
  });

  const moveToResult = (places: RecommendedPlace[]) => {
    if (navigatedRef.current) {
      return;
    }

    navigatedRef.current = true;

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
    setErrorMessage("");
    setStreamMessage("");
    setProgress(2);
    receivedPlacesRef.current = [];
    navigatedRef.current = false;
    retryKeyRef.current += 1;
  };

  useEffect(() => {
    if (errorMessage) {
      return;
    }

    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 94) {
          return prev;
        }

        return Math.min(prev + 2, 94);
      });
    }, 170);

    return () => {
      clearInterval(progressTimer);
    };
  }, [errorMessage]);

  useEffect(() => {
    if (errorMessage) {
      return;
    }

    let cancelled = false;

    const runRecommendationStream = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem("user_id");
        const userId = storedUserId ? toNumberIfNumeric(storedUserId) : 1;
        const targetPlace = params.targetPlace;
        const resolvedTripId = params.tripId ?? params.serverTripId;

        const resolvedCurrentPlanId =
          targetPlace?.tripPlaceId ?? targetPlace?.serverTripPlaceId;

        const resolvedGooglePlaceId =
          targetPlace?.googlePlaceId ??
          targetPlace?.placeId ??
          (typeof targetPlace?.id === "string" ? targetPlace.id : undefined);

        let currentLat = targetPlace?.latitude;
        let currentLng = targetPlace?.longitude;
        let category = targetPlace?.category;

        if (
          (currentLat === undefined || currentLng === undefined || !category) &&
          resolvedGooglePlaceId
        ) {
          const placeDetail = await fetchPlaceDetailForRecommendation(
            resolvedGooglePlaceId,
          );

          if (placeDetail) {
            currentLat = currentLat ?? placeDetail.latitude ?? placeDetail.lat;

            currentLng = currentLng ?? placeDetail.longitude ?? placeDetail.lng;

            category = category ?? placeDetail.category;
          }
        }

        const selectedType = normalizePlaceType(category);

        const rawPayload = {
          /**
           * 2026-05-06 명세 기준 필드
           */
          tripId: toNumberIfNumeric(resolvedTripId),
          currentPlanId: toNumberIfNumeric(resolvedCurrentPlanId),
          currentLat,
          currentLng,
          radiusMinute: getRadiusMinute(params.moveTime),
          transportMode: params.transportMode ?? "WALK",
          selectedSpace: getSelectedSpace(params.placeScope),
          selectedType,
          keepOriginalCategory: !params.changeCategory,
          considerNextPlan: Boolean(params.considerDistance),
          nextLat: undefined,
          nextLng: undefined,

          /**
           * 프론트/서버 호환 확인용 보조 필드
           * 서버에서 무시 가능
           */
          userId: userId ?? 1,
          tripPlaceId: toNumberIfNumeric(resolvedCurrentPlanId),
          placeId: resolvedGooglePlaceId,
          latitude: currentLat,
          longitude: currentLng,
          category,
          limit: 5,
          reason:
            params.recommendationType === "GAP" ?
              "일정 사이의 빈 시간에 방문할 대안 장소를 추천해주세요."
            : "현재 장소를 대체할 수 있는 대안 장소를 추천해주세요.",
        };

        const payload = removeUndefined(rawPayload) as RecommendRequest;

        console.log("[AIAnalysisLoading] stream payload:", payload);

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
            if (cancelled) {
              return;
            }

            setStreamMessage(message);
            setProgress((prev) => Math.min(prev + 4, 96));
          },

          onPlace: (place) => {
            if (cancelled) {
              return;
            }

            console.log("[AIAnalysisLoading] stream place:", place);

            receivedPlacesRef.current = [...receivedPlacesRef.current, place];
            setProgress((prev) => Math.min(prev + 8, 98));
          },

          onDone: () => {
            if (cancelled) {
              return;
            }

            const receivedPlaces = receivedPlacesRef.current;

            console.log("[AIAnalysisLoading] stream done:", {
              receivedCount: receivedPlaces.length,
            });

            if (receivedPlaces.length === 0) {
              setProgress(100);
              setErrorMessage(
                "추천 스트림은 완료됐지만 서버에서 추천 장소가 내려오지 않았습니다.",
              );
              return;
            }

            setProgress(100);

            setTimeout(() => {
              moveToResult(receivedPlaces);
            }, 450);
          },

          onError: (error) => {
            if (cancelled) {
              return;
            }

            console.log("[AIAnalysisLoading] stream error:", error);

            setProgress(100);
            setErrorMessage(getErrorMessage(error));
          },
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.log("[AIAnalysisLoading] run stream failed:", error);

        setProgress(100);
        setErrorMessage(getErrorMessage(error));
      }
    };

    runRecommendationStream();

    return () => {
      cancelled = true;
    };
  }, [
    errorMessage,
    params,
    params.moveTime,
    params.placeScope,
    params.recommendationType,
    params.scheduleId,
    params.serverTripId,
    params.targetPlace,
    params.transportMode,
    params.tripId,
  ]);

  useEffect(() => {
    if (errorMessage) {
      return;
    }

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
  }, [dotDirection, errorMessage]);

  useEffect(() => {
    const floatAnimation = Animated.loop(
      Animated.timing(floatValue, {
        toValue: 1,
        duration: 1700,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );

    const pulseAnimation = Animated.loop(
      Animated.timing(pulseValue, {
        toValue: 1,
        duration: 1500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );

    floatAnimation.start();
    pulseAnimation.start();

    return () => {
      floatAnimation.stop();
      pulseAnimation.stop();
    };
  }, [floatValue, pulseValue]);

  const descriptionText =
    errorMessage || streamMessage || currentStep.description;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.screen}>
        <Text style={styles.logoText}>Plan.B</Text>

        <View style={styles.centerContent}>
          <Animated.View
            style={[
              styles.iconWrapper,
              {
                transform: [{ translateY: iconFloat }, { scale: iconScale }],
              },
            ]}
          >
            <Image
              source={currentStep.icon}
              style={styles.stepIcon}
              resizeMode="contain"
            />
          </Animated.View>

          <Text style={styles.title}>
            {errorMessage ? "추천 요청에 실패했어요" : currentStep.title}
          </Text>

          <Text
            style={[
              styles.description,
              errorMessage ? styles.errorDescription : null,
            ]}
          >
            {descriptionText}
          </Text>

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
          <Text style={styles.tipCardTitle}>
            {errorMessage ? "확인 필요" : currentStep.detailTipTitle}
          </Text>

          <Text style={styles.tipCardDescription}>
            {errorMessage ?
              "명세서 기준으로 currentPlanId/currentLat/currentLng/radiusMinute를 포함해 요청합니다. 좌표가 없으면 장소 상세 API 응답과 서버 추천 로그를 확인해야 합니다."
            : currentStep.detailTipDescription}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  screen: { flex: 1, backgroundColor: "#FFFFFF", paddingHorizontal: 36 },
  logoText: {
    color: "#1C2534",
    fontSize: 29,
    fontWeight: "900",
    letterSpacing: -0.8,
    textAlign: "center",
    marginTop: 70,
  },
  centerContent: { alignItems: "center", marginTop: 76 },
  iconWrapper: {
    width: 132,
    height: 132,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 34,
  },
  stepIcon: { width: 132, height: 132 },
  title: {
    color: "#111827",
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: -0.4,
    textAlign: "center",
    marginBottom: 14,
  },
  description: {
    color: "#8A9BB2",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
    textAlign: "center",
    marginBottom: 18,
  },
  errorDescription: {
    color: "#EF4444",
    fontSize: 12,
    lineHeight: 19,
  },
  tipPill: {
    minHeight: 30,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#CFE0FF",
    backgroundColor: "#F2F7FF",
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  tipPillText: { color: "#2F6BFF", fontSize: 10, fontWeight: "900" },
  dotsArea: { marginTop: 64, alignItems: "center" },
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
    marginTop: 62,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E1E7EF",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 22,
    paddingVertical: 22,
    minHeight: 116,
    justifyContent: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 2,
  },
  errorCard: {
    borderColor: "#FECACA",
    backgroundColor: "#FFF7F7",
  },
  tipCardTitle: {
    color: "#1C2534",
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 12,
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
