import type {
  AlternativeImpactResponse,
} from "../../../api/schedules/server";

import type {
  RecommendationTransportMode,
} from "../../components/recommendation/RecommendationTransportCard";
import {
  normalizeDisplayTime,
  normalizeDisplayTimeRange,
} from "./recommendationFormatters";

const alternativeImpactCache = new Map<
  string,
  AlternativeImpactResponse
>();

type ImpactOptions =
  | AlternativeImpactResponse["travelInOptions"]
  | AlternativeImpactResponse["travelOutOptions"]
  | undefined;

type ImpactDurationOption = {
  minutes?: unknown;
  durationMinutes?: unknown;
  durationSeconds?: unknown;
  durationMillis?: unknown;
};

type ImpactDurationContext = {
  scheduleTimeValues?: Array<string | null | undefined>;
};

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

const getCompactScheduleTimeValues = (
  values?: Array<string | null | undefined>,
) => {
  const compactValues = new Set<string>();

  values?.forEach((value) => {
    const normalized = normalizeDisplayTime(value);

    if (!normalized) {
      return;
    }

    const compact = normalized.replace(":", "");

    if (/^(?:[01]\d|2[0-3])[0-5]\d$/.test(compact)) {
      compactValues.add(compact);
    }
  });

  return compactValues;
};

const isCompactClockDurationNumber = (value: number) => {
  if (!Number.isInteger(value)) {
    return false;
  }

  return /^(?:[01]\d|2[0-3])[0-5]\d$/.test(String(value));
};

const isScheduleClockNumber = (
  value: number,
  scheduleTimeValues?: Array<string | null | undefined>,
) => {
  const compactValue = String(Math.trunc(value)).padStart(4, "0");

  return getCompactScheduleTimeValues(scheduleTimeValues).has(
    compactValue,
  );
};

const parseDurationMinutes = (
  value: unknown,
  context: ImpactDurationContext = {},
) => {
  if (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0
  ) {
    if (
      isCompactClockDurationNumber(value) ||
      isScheduleClockNumber(value, context.scheduleTimeValues)
    ) {
      return null;
    }

    return Math.ceil(value);
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  // HH:mm, HHmm, 날짜 포함 시간은 일정 시각이지 이동 소요시간이 아니다.
  // "19:10"을 19시간 10분으로 잘못 해석하지 않도록 모두 거부한다.
  if (/^\d{1,2}:[0-5]\d$/.test(trimmed)) {
    return null;
  }

  if (/^(?:[01]\d|2[0-3])(?:[0-5]\d)$/.test(trimmed)) {
    return null;
  }

  if (/[Tt]\d{1,2}:?\d{2}/.test(trimmed)) {
    return null;
  }

  if (!/^\d+(?:\.\d+)?$/.test(trimmed)) {
    return null;
  }

  const numericValue = Number(trimmed);

  if (
    Number.isFinite(numericValue) &&
    numericValue >= 0
  ) {
    if (isScheduleClockNumber(numericValue, context.scheduleTimeValues)) {
      return null;
    }

    return Math.ceil(numericValue);
  }

  return null;
};

const normalizeDurationMinutes = (
  option: ImpactDurationOption,
  context: ImpactDurationContext = {},
) => {
  const minutes = parseDurationMinutes(
    option.durationMinutes ?? option.minutes,
    context,
  );

  if (minutes != null) {
    return minutes;
  }

  const seconds = Number(option.durationSeconds);

  if (
    Number.isFinite(seconds) &&
    seconds >= 0
  ) {
    return Math.ceil(seconds / 60);
  }

  const milliseconds = Number(option.durationMillis);

  if (
    Number.isFinite(milliseconds) &&
    milliseconds >= 0
  ) {
    return Math.ceil(milliseconds / 60000);
  }

  return null;
};

export const getRecommendationImpactMinutes = (
  options: ImpactOptions,
  mode: RecommendationTransportMode,
  context: ImpactDurationContext = {},
) => {
  const matched = options?.find(
    (option) => option.mode === mode,
  );

  return matched
    ? normalizeDurationMinutes(matched, context)
    : null;
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
    if (
      !Number.isFinite(minutes) ||
      minutes < 0
    ) {
      return "이동시간 확인 불가";
    }

    if (minutes < 60) {
      return `${minutes}분`;
    }

    const hours = Math.floor(minutes / 60);
    const restMinutes = minutes % 60;

    return restMinutes > 0
      ? `${hours}시간 ${restMinutes}분`
      : `${hours}시간`;
  }

  return "이동시간 확인 불가";
};

export const getRecommendationImpactNextTime = ({
  impactResult,
  fallbackTime,
}: {
  impactResult?: AlternativeImpactResponse | null;
  fallbackTime: string;
}) => {
  const nextPlace = impactResult?.nextPlace;

  const nextVisitTime =
    nextPlace?.newVisitTime ??
    nextPlace?.visitTime ??
    null;

  const nextEndTime =
    nextPlace?.newEndTime ??
    nextPlace?.endTime ??
    null;

  if (!nextVisitTime && !nextEndTime) {
    return fallbackTime;
  }

  const impactTime = normalizeDisplayTimeRange(
    nextVisitTime,
    nextEndTime,
  );

  if (
    nextVisitTime &&
    !nextEndTime &&
    fallbackTime.includes(" - ")
  ) {
    return fallbackTime;
  }

  return impactTime || fallbackTime;
};
