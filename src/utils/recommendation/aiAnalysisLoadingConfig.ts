import type {
  ImageSourcePropType,
} from "react-native";

import { getAnalyzedPlaceDetail } from "../../../api/places/place";

import type {
  PlaceSpace,
  PlaceType,
  RecommendRequest,
} from "../../types/recommendation";

const StepSearchIcon =
  require("../../assets/ai-loading/step-search.png");

const StepPinIcon =
  require("../../assets/ai-loading/step-pin.png");

const StepStarIcon =
  require("../../assets/ai-loading/step-star.png");

const StepInboxIcon =
  require("../../assets/ai-loading/step-inbox.png");

const StepWriteIcon =
  require("../../assets/ai-loading/step-write.png");

export const EmptyResultImage =
  require("../../assets/ai-loading/empty-result-preview.png");

export type AIAnalysisTransportMode =
  | "WALK"
  | "TRANSIT"
  | "CAR";

export type AIAnalysisMoveTime =
  | "10"
  | "20"
  | "30"
  | "ANY";

export type AIAnalysisPlaceScope =
  | "INDOOR"
  | "OUTDOOR";

export type AIAnalysisRecommendationType =
  | "PLACE"
  | "GAP";

export type AIAnalysisTodayPlace = {
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

export type AIAnalysisLoadingParams = {
  scheduleId?: string;
  tripId?: string | number;
  serverTripId?: string | number;
  tripName?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  transportMode?: AIAnalysisTransportMode;
  transportLabel?: string;
  moveTime?: AIAnalysisMoveTime;
  considerDistance?: boolean;
  changeCategory?: boolean;
  placeScope?: AIAnalysisPlaceScope;
  selectedType?: PlaceType;
  targetPlace?: AIAnalysisTodayPlace;
  recommendationType?: AIAnalysisRecommendationType;
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

export type AIAnalysisLoadingScreenProps = {
  navigation: {
    replace: (
      screen: string,
      params: Record<string, unknown>,
    ) => void;
    goBack: () => void;
  };
  route?: {
    params?: AIAnalysisLoadingParams;
  };
};

export type AIAnalysisLoadingStep = {
  icon: ImageSourcePropType;
  title: string;
  description: string;
  tip: string;
  detailTitle: string;
  detailDescription: string;
};

export type PlaceDetailForRecommendation = {
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

export const AI_ANALYSIS_LOADING_STEPS:
  AIAnalysisLoadingStep[] = [
    {
      icon: StepSearchIcon,
      title: "주변 장소를 찾고 있어요",
      description:
        "이동 조건에 맞는 장소를 분석 중이에요",
      tip: "5개의 대안을 찾아드려요",
      detailTitle: "잠깐! 알고 계셨나요?",
      detailDescription:
        "Plan.B AI는 현재 일정, 이동수단, 장소 유형을 함께 분석해서 대안 장소를 추천해요.",
    },
    {
      icon: StepPinIcon,
      title: "이동 거리와 시간을 계산하고 있어요",
      description:
        "이동 거리와 시간을 계산하고 있어요",
      tip: "위치와 이동 조건을 반영해요",
      detailTitle: "장소를 비교하고 있어요",
      detailDescription:
        "현재 장소의 좌표와 이동 가능 시간을 기준으로 주변 후보 장소를 살펴보고 있어요.",
    },
    {
      icon: StepStarIcon,
      title: "리뷰 데이터를 분석하고 있어요",
      description:
        "리뷰 데이터를 분석하고 있어요",
      tip: "리뷰와 분위기를 종합해요",
      detailTitle: "리뷰도 함께 확인해요",
      detailDescription:
        "평점뿐 아니라 방문자 반응, 장소 분위기, 추천 이유까지 함께 정리하고 있어요.",
    },
    {
      icon: StepInboxIcon,
      title: "조건에 맞는 장소를 고르고 있어요",
      description:
        "조건에 맞는 장소를 고르고 있어요",
      tip: "다음 목적지까지 고려해요",
      detailTitle: "일정 흐름을 지켜요",
      detailDescription:
        "대안 장소를 고를 때 다음 일정과의 이동 부담도 함께 고려해요.",
    },
    {
      icon: StepWriteIcon,
      title: "추천 결과를 정리하고 있어요",
      description:
        "추천 결과를 정리하고 있어요",
      tip: "곧 완료돼요",
      detailTitle:
        "추천 결과를 정리 중이에요",
      detailDescription:
        "AI가 찾은 대안 장소를 카드 형태로 보기 쉽게 정리하고 있어요.",
    },
  ];

export const AI_ANALYSIS_DOT_COUNT = 6;

export const toNumberIfNumeric = (
  value?: string | number,
) => {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === "number") {
    return value;
  }

  const numericValue = Number(value);

  return Number.isFinite(numericValue)
    ? numericValue
    : value;
};

export const removeUndefined = <
  T extends Record<string, unknown>,
>(
  value: T,
) => {
  return Object.fromEntries(
    Object.entries(value).filter(
      ([, item]) => item !== undefined,
    ),
  ) as Partial<T>;
};

export const getAIAnalysisErrorMessage = (
  error: unknown,
) => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "추천 요청 중 알 수 없는 오류가 발생했습니다.";
};

export const getAIAnalysisUserMessage = (
  error: unknown,
) => {
  const message =
    getAIAnalysisErrorMessage(error);

  if (message.includes("500")) {
    return "현재 추천 서버가 불안정합니다. 잠시 후 다시 시도해주세요.";
  }

  if (
    message.includes("좌표") ||
    message.includes("장소")
  ) {
    return "장소 정보를 불러오지 못했습니다. 장소를 다시 선택한 뒤 시도해주세요.";
  }

  if (
    message.includes("Failed to fetch") ||
    message.includes("Network") ||
    message.includes("fetch")
  ) {
    return "네트워크 연결이 불안정합니다. 인터넷 상태를 확인해주세요.";
  }

  if (
    message.includes("끊겼습니다") ||
    message.includes("stream")
  ) {
    return "추천 결과를 끝까지 불러오지 못했습니다. 다시 시도해주세요.";
  }

  return message;
};

export const getRadiusMinute = (
  moveTime?: AIAnalysisMoveTime,
) => {
  if (moveTime === "10") return 10;
  if (moveTime === "20") return 20;
  if (moveTime === "30") return 30;

  return 15;
};

export const getSelectedSpace = (
  placeScope?: AIAnalysisPlaceScope,
): PlaceSpace | undefined => {
  if (placeScope === "INDOOR") {
    return "INDOOR";
  }

  if (placeScope === "OUTDOOR") {
    return "OUTDOOR";
  }

  return undefined;
};

export const fetchPlaceDetailForRecommendation =
  async (
    googlePlaceId?: string,
  ): Promise<PlaceDetailForRecommendation | null> => {
    if (!googlePlaceId) {
      return null;
    }

    try {
      const placeDetail =
        await getAnalyzedPlaceDetail(
          String(googlePlaceId),
        );

      return placeDetail as
        PlaceDetailForRecommendation;
    } catch (error) {
      console.log(
        "[AIAnalysisLoading] place detail request failed:",
        error,
      );

      return null;
    }
  };

export const createRecommendationPayload = async ({
  params,
}: {
  params: AIAnalysisLoadingParams;
}): Promise<RecommendRequest> => {
  const targetPlace = params.targetPlace;

  const resolvedTripId =
    params.tripId ?? params.serverTripId;

  const resolvedCurrentPlanId =
    targetPlace?.serverTripPlaceId ??
    targetPlace?.tripPlaceId;

  const resolvedGooglePlaceId =
    targetPlace?.googlePlaceId ??
    targetPlace?.placeId ??
    (
      typeof targetPlace?.id === "string"
        ? targetPlace.id
        : undefined
    );

  let currentLat = targetPlace?.latitude;
  let currentLng = targetPlace?.longitude;
  let category = targetPlace?.category;

  const hasInvalidCoordinate =
    currentLat === undefined ||
    currentLng === undefined ||
    (
      Number(currentLat) === 0 &&
      Number(currentLng) === 0
    );

  if (
    (hasInvalidCoordinate || !category) &&
    resolvedGooglePlaceId
  ) {
    const placeDetail =
      await fetchPlaceDetailForRecommendation(
        resolvedGooglePlaceId,
      );

    if (placeDetail) {
      currentLat = hasInvalidCoordinate
        ? (
            placeDetail.latitude ??
            placeDetail.lat ??
            currentLat
          )
        : currentLat;

      currentLng = hasInvalidCoordinate
        ? (
            placeDetail.longitude ??
            placeDetail.lng ??
            currentLng
          )
        : currentLng;

      category =
        category ?? placeDetail.category;
    }
  }

  const selectedType =
    params.changeCategory
      ? params.selectedType
      : undefined;

  const selectedSpace =
    getSelectedSpace(params.placeScope);

  const payload = removeUndefined({
    tripId:
      toNumberIfNumeric(resolvedTripId),
    currentPlanId:
      toNumberIfNumeric(
        resolvedCurrentPlanId,
      ),
    tripPlaceId:
      toNumberIfNumeric(
        resolvedCurrentPlanId,
      ),
    placeId: resolvedGooglePlaceId,
    currentLat,
    currentLng,
    latitude: currentLat,
    longitude: currentLng,
    radiusMinute:
      getRadiusMinute(params.moveTime),
    transportMode:
      params.transportMode ?? "WALK",
    selectedType,
    selectedSpace,
    keepOriginalCategory:
      !params.changeCategory,
    considerNextPlan:
      Boolean(params.considerDistance),
  }) as RecommendRequest;

  if (
    payload.currentLat === undefined ||
    payload.currentLng === undefined ||
    (
      Number(payload.currentLat) === 0 &&
      Number(payload.currentLng) === 0
    )
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
    (
      payload.currentLat === undefined ||
      payload.currentLng === undefined
    )
  ) {
    throw new Error(
      "추천 요청에 필요한 currentLat/currentLng가 없습니다. 장소 상세 API 좌표 응답을 확인해주세요.",
    );
  }

  return payload;
};
