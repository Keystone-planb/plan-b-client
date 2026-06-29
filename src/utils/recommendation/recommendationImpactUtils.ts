import type {
  AlternativeImpactResponse,
} from "../../../api/schedules/server";

import type {
  RecommendationTransportMode,
} from "../../components/recommendation/RecommendationTransportCard";

const alternativeImpactCache = new Map<
  string,
  AlternativeImpactResponse
>();

type ImpactOptions =
  | AlternativeImpactResponse["travelInOptions"]
  | AlternativeImpactResponse["travelOutOptions"]
  | undefined;

export const getRecommendationImpactPlanId = ({
  params,
  targetPlace,
}: {
  params: {
    currentPlanId?: string | number;
    tripPlaceId?: string | number;
    serverTripPlaceId?: string | number;
  };
  targetPlace?: {
    id?: string | number;
    tripPlaceId?: string | number;
    serverTripPlaceId?: string | number;
  } | null;
}) => {
  const candidates = [
    params.currentPlanId,
    params.tripPlaceId,
    params.serverTripPlaceId,
    targetPlace?.serverTripPlaceId,
    targetPlace?.tripPlaceId,
    targetPlace?.id,
  ];

  return candidates.find(
    (value) =>
      value !== undefined &&
      value !== null &&
      String(value).trim().length > 0,
  );
};

export const createRecommendationImpactCacheKey = ({
  tripPlaceId,
  newPlaceId,
  latitude,
  longitude,
}: {
  tripPlaceId: string | number;
  newPlaceId: string;
  latitude: number;
  longitude: number;
}) =>
  [
    String(tripPlaceId),
    newPlaceId,
    String(latitude),
    String(longitude),
  ].join(":");

export const getCachedRecommendationImpact = (
  cacheKey: string,
) => alternativeImpactCache.get(cacheKey);

export const setCachedRecommendationImpact = (
  cacheKey: string,
  result: AlternativeImpactResponse,
) => {
  alternativeImpactCache.set(cacheKey, result);
};

export const getRecommendationImpactMinutes = (
  options: ImpactOptions,
  mode: RecommendationTransportMode,
) => {
  const matched = options?.find(
    (option) => option.mode === mode,
  );

  return matched?.minutes;
};

export const getRecommendationImpactTimeText = ({
  loading,
  hasResult,
  minutes,
}: {
  loading: boolean;
  hasResult: boolean;
  minutes?: number | null;
}) => {
  if (loading && !hasResult) {
    return "계산 중...";
  }

  if (minutes != null) {
    return `${minutes}분`;
  }

  return "시간 정보 없음";
};

export const getRecommendationImpactNextTime = ({
  impactResult,
  fallbackTime,
}: {
  impactResult?: AlternativeImpactResponse | null;
  fallbackTime: string;
}) => {
  const nextPlace = impactResult?.nextPlace;

  if (!nextPlace?.newVisitTime) {
    return fallbackTime;
  }

  return [
    nextPlace.newVisitTime,
    nextPlace.endTime,
  ]
    .filter(Boolean)
    .join(" - ");
};
