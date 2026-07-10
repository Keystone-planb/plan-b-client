import AsyncStorage from "@react-native-async-storage/async-storage";

import { reportPreferenceFeedback } from "../../../api/preferences/preferences";

import { replaceNotificationPlace } from "../../../api/notifications/notifications";
import { replacePlanPlace, updatePlanSchedule } from "../../../api/schedules/server";
import {
  loadPlanASchedule,
  savePlanASchedule,
} from "../../api/schedules/planAStorage";

import type { RecommendationToastType } from "../../types/recommendation/recommendationPreview";
import { clearTripGapCache } from "../../components/recommendations/GapRecommendationCard";
import { trackEvent, AMP } from "../../utils/amplitude";

export type ShowToast = (
  title: string,
  message?: string,
  type?: RecommendationToastType,
  onDone?: () => void,
) => void;

export const showWeatherReplaceErrorToast = (
  showToast: ShowToast,
  error: unknown,
) => {
  showToast(
    "장소 교체 실패",
    error instanceof Error
      ? error.message
      : "날씨 알림 기반 장소 교체 중 오류가 발생했습니다.",
    "error",
  );
};

type ErrorPayload = Record<string, unknown>;

const isErrorPayload = (value: unknown): value is ErrorPayload => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const getErrorResponseData = (error: unknown) => {
  if (
    error &&
    typeof error === "object" &&
    "response" in error
  ) {
    return (
      error as {
        response?: {
          data?: unknown;
        };
      }
    ).response?.data;
  }

  return null;
};

const getStringField = (
  source: ErrorPayload | null | undefined,
  keys: string[],
) => {
  if (!source) {
    return "";
  }

  for (const key of keys) {
    const value = source[key];

    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }

  return "";
};

const getNestedErrorPayload = (
  source: ErrorPayload,
) => {
  const nestedCandidates = [
    source.conflict,
    source.conflictingSchedule,
    source.conflictingPlan,
    source.overlap,
    source.data,
  ];

  for (const candidate of nestedCandidates) {
    if (isErrorPayload(candidate)) {
      return candidate;
    }
  }

  for (const key of ["conflicts", "overlaps", "items"]) {
    const value = source[key];

    if (Array.isArray(value) && isErrorPayload(value[0])) {
      return value[0];
    }
  }

  return source;
};

const getScheduleConflictDetailMessage = (
  data: unknown,
) => {
  if (!isErrorPayload(data)) {
    return "";
  }

  const source = getNestedErrorPayload(data);
  const placeName = getStringField(source, [
    "placeName",
    "conflictingPlaceName",
    "planTitle",
    "title",
    "name",
  ]);
  const rangeText = getStringField(source, [
    "timeRange",
    "range",
    "conflictingTimeRange",
  ]);
  const startTime = getStringField(source, [
    "startTime",
    "visitTime",
    "conflictingStartTime",
    "beforePlanStartTime",
  ]);
  const endTime = getStringField(source, [
    "endTime",
    "conflictingEndTime",
    "beforePlanEndTime",
  ]);
  const resolvedRange =
    rangeText ||
    (startTime && endTime ? `${startTime} ~ ${endTime}` : "");

  if (!placeName || !resolvedRange) {
    return "";
  }

  return `'${placeName}'의 시간대(${resolvedRange})와 겹칩니다.\n다른 시간대를 선택해 주세요.`;
};

export const getRecommendationReplaceErrorMessage = (
  error: unknown,
) => {
  const data = getErrorResponseData(error);

  if (
    typeof data === "string" &&
    data.trim().length > 0
  ) {
    return data.trim();
  }

  if (isErrorPayload(data)) {
    const explicitMessage = getStringField(data, [
      "message",
      "error",
      "detail",
      "reason",
    ]);

    const conflictMessage = getScheduleConflictDetailMessage(data);

    if (
      conflictMessage &&
      (
        !explicitMessage ||
        !explicitMessage.includes("겹칩니다")
      )
    ) {
      return conflictMessage;
    }

    if (explicitMessage) {
      return explicitMessage;
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "방문 시간을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.";
};

export const isScheduleConflictMessage = (
  message: string,
) => {
  return (
    message.includes("겹칩니다") ||
    message.includes("다른 시간대") ||
    message.includes("시간대")
  );
};

export const showReplaceErrorToast = (
  showToast: ShowToast,
  error: unknown,
) => {
  const message =
    getRecommendationReplaceErrorMessage(error);

  showToast("일정 교체 실패", message, "error");
};

export const showReplaceSuccessToast = (
  showToast: ShowToast,
  placeName: string,
  onDone?: () => void,
) => {
  showToast(
    "PLAN B 교체 완료",
    `${placeName}으로 기존 일정이 교체되었습니다.`,
    "success",
    onDone,
  );
};

export const validatePlanReplaceInput = ({
  currentPlanIdCandidates,
  newGooglePlaceId,
  newPlaceName,
  showToast,
}: {
  currentPlanIdCandidates: Array<string | number>;
  newGooglePlaceId: string;
  newPlaceName: string;
  newCategory?: string;
  showToast: ShowToast;
}) => {
  if (currentPlanIdCandidates.length === 0) {
    showToast(
      "일정 교체 불가",
      "현재 일정의 planId가 없어 PLAN B 교체를 진행할 수 없습니다.",
      "error",
    );
    return false;
  }

  if (!newGooglePlaceId || !newPlaceName) {
    showToast(
      "장소 정보 부족",
      "추천 장소의 Google Place ID 또는 장소명이 없습니다.",
      "error",
    );
    return false;
  }

  return true;
};

export const validateWeatherReplaceInput = ({
  notificationId,
  newGooglePlaceId,
  newPlaceName,
  showToast,
}: {
  notificationId?: string | number;
  newGooglePlaceId: string;
  newPlaceName: string;
  newCategory?: string;
  showToast: ShowToast;
}) => {
  if (!notificationId) {
    showToast(
      "알림 교체 불가",
      "날씨 알림 ID가 없어 장소 교체를 진행할 수 없습니다.",
      "error",
    );
    return false;
  }

  if (!newGooglePlaceId || !newPlaceName) {
    showToast(
      "장소 정보 부족",
      "추천 장소의 Google Place ID 또는 장소명이 없습니다.",
      "error",
    );
    return false;
  }

  return true;
};

export const requestPlanPlaceReplace = async ({
  currentPlanIdCandidates,
  newGooglePlaceId,
  newPlaceName,
  newCategory,
}: {
  currentPlanIdCandidates: Array<string | number>;
  newGooglePlaceId: string;
  newPlaceName: string;
  newCategory?: string;
}) => {
  let replaceResult: Awaited<ReturnType<typeof replacePlanPlace>> | null = null;
  let lastReplaceError: unknown = null;
  let usedCurrentPlanId: string | number | null = null;

  for (const candidatePlanId of currentPlanIdCandidates) {
    try {
      replaceResult = await replacePlanPlace(candidatePlanId, {
        newGooglePlaceId,
        newPlaceName,
        newCategory,
      });

      usedCurrentPlanId = candidatePlanId;
      break;
    } catch (replaceError: any) {
      lastReplaceError = replaceError;

      if (replaceError?.response?.status !== 404) {
        throw replaceError;
      }
    }
  }

  if (!replaceResult || usedCurrentPlanId == null) {
    throw lastReplaceError ?? new Error("일정 교체에 실패했습니다.");
  }

  return {
    replaceResult,
    usedCurrentPlanId,
  };
};


export const updateReplacedScheduleMeta = async ({
  replaceResult,
  usedCurrentPlanId,
  previewSchedulePayload,
}: {
  replaceResult: Awaited<ReturnType<typeof replacePlanPlace>>;
  usedCurrentPlanId: string | number;
  previewSchedulePayload: Record<string, unknown>;
}) => {
  if (Object.keys(previewSchedulePayload).length === 0) {
    return;
  }

  await updatePlanSchedule(
    replaceResult.tripPlaceId ?? usedCurrentPlanId,
    previewSchedulePayload as any,
  );
};

export const replaceWeatherNotificationAlternative = async ({
  notificationId,
  newPlaceId,
  previewSchedulePayload,
}: {
  notificationId: string | number;
  newPlaceId?: string | number;
  previewSchedulePayload: Record<string, unknown>;
}) => {
  const updatedTripPlace = await replaceNotificationPlace(
    notificationId,
    newPlaceId,
  );

  if (!updatedTripPlace) {
    throw new Error("날씨 알림 대안 장소 교체에 실패했습니다.");
  }

  const weatherTripPlaceId =
    (updatedTripPlace as any)?.tripPlaceId ??
    (updatedTripPlace as any)?.id ??
    newPlaceId;

  if (
    weatherTripPlaceId != null &&
    Object.keys(previewSchedulePayload).length > 0
  ) {
    await updatePlanSchedule(
      weatherTripPlaceId,
      previewSchedulePayload as any,
    );
  }

  return updatedTripPlace;
};

const isSameStoredPlanPlace = (
  item: {
    id?: string | number;
    tripPlaceId?: string | number;
    serverTripPlaceId?: string | number;
  },
  planId: string | number,
) => {
  return [
    item.id,
    item.tripPlaceId,
    item.serverTripPlaceId,
  ].some((id) => String(id) === String(planId));
};

export const updateStoredPlanASchedulePlaceTime = async ({
  scheduleId,
  planId,
  visitTime,
  endTime,
  transportMode,
}: {
  scheduleId?: string;
  planId?: string | number | null;
  visitTime?: string | null;
  endTime?: string | null;
  transportMode?: "WALK" | "TRANSIT" | "CAR" | null;
}) => {
  if (!scheduleId || planId == null) {
    return;
  }

  const hasTimeUpdate = Boolean(visitTime || endTime);
  const hasTransportUpdate = Boolean(transportMode);

  if (!hasTimeUpdate && !hasTransportUpdate) {
    return;
  }

  const savedSchedule = await loadPlanASchedule(scheduleId);

  if (!savedSchedule) {
    return;
  }

  const now = new Date().toISOString();
  let didUpdate = false;

  const nextSchedule = {
    ...savedSchedule,
    updatedAt: now,
    days: savedSchedule.days.map((day) => ({
      ...day,
      places: day.places.map((item) => {
        if (!isSameStoredPlanPlace(item, planId)) {
          return item;
        }

        didUpdate = true;

        const nextVisitTime = visitTime ?? item.visitTime;
        const nextEndTime = endTime ?? item.endTime;

        return {
          ...item,
          visitTime: nextVisitTime,
          endTime: nextEndTime,
          time:
            nextVisitTime && nextEndTime
              ? `${nextVisitTime} - ${nextEndTime}`
              : item.time,
          transportMode: transportMode ?? item.transportMode,
          updatedAt: now,
        };
      }),
    })),
  };

  if (didUpdate) {
    await savePlanASchedule(nextSchedule);
  }
};

export const updateStoredPlanAAfterReplace = async ({
  scheduleId,
  currentPlanId,
  place,
  replaceResult,
  previewVisitTime,
  previewEndTime,
  previewTransportMode,
}: {
  scheduleId?: string;
  currentPlanId: string | number;
  place: {
    googlePlaceId?: string | number;
    placeId?: string | number;
    name?: string;
    address?: string;
    category?: string;
    latitude?: number;
    longitude?: number;
  };
  replaceResult: Awaited<ReturnType<typeof replacePlanPlace>>;
  previewVisitTime?: string | null;
  previewEndTime?: string | null;
  previewTransportMode?: "WALK" | "TRANSIT" | "CAR" | null;
}) => {
  if (!scheduleId) {
    return;
  }

  const savedSchedule = await loadPlanASchedule(scheduleId);

  if (!savedSchedule) {
    return;
  }

  const now = new Date().toISOString();

  const nextSchedule = {
    ...savedSchedule,
    updatedAt: now,
    days: savedSchedule.days.map((day) => ({
      ...day,
      places: day.places.map((item) => {
        if (!isSameStoredPlanPlace(item, currentPlanId)) {
          return item;
        }

        const nextGooglePlaceId = String(
          place.googlePlaceId ??
            replaceResult.googlePlaceId ??
            place.placeId ??
            item.googlePlaceId ??
            item.placeId ??
            item.id,
        );

        return {
          ...item,
          tripPlaceId: replaceResult.tripPlaceId ?? item.tripPlaceId,
          serverTripPlaceId:
            replaceResult.tripPlaceId ?? item.serverTripPlaceId,
          placeId: nextGooglePlaceId,
          googlePlaceId: nextGooglePlaceId,
          name: place.name ?? replaceResult.name ?? item.name,
          address: place.address ?? item.address,
          category: place.category ?? item.category,
          latitude: place.latitude ?? item.latitude,
          longitude: place.longitude ?? item.longitude,
          visitTime: previewVisitTime ?? item.visitTime,
          endTime: previewEndTime ?? item.endTime,
          time:
            previewVisitTime && previewEndTime
              ? `${previewVisitTime} - ${previewEndTime}`
              : item.time,
          transportMode: previewTransportMode ?? item.transportMode,
          updatedAt: now,
        };
      }),
    })),
  };

  await savePlanASchedule(nextSchedule);
};

export const handlePlanReplaceSuccessSideEffects = async ({
  place,
  placeId,
  usedCurrentPlanId,
  replaceResult,
  selectedRank,
  tripId,
  serverTripId,
  scheduleId,
  recommendationType,
  source,
  targetPlaceName,
  shownPlaceIds,
  previewVisitTime,
  previewEndTime,
  previewTransportMode,
  setSelectedPlaceId,
}: {
  place: {
    googlePlaceId?: string | number;
    placeId?: string | number;
    name?: string;
    address?: string;
    category?: string;
    latitude?: number;
    longitude?: number;
  };
  placeId: string | number;
  usedCurrentPlanId: string | number;
  replaceResult: Awaited<ReturnType<typeof replacePlanPlace>>;
  selectedRank: number;
  tripId?: string | number;
  serverTripId?: string | number;
  scheduleId?: string;
  recommendationType?: string;
  source: "weather" | "manual";
  targetPlaceName?: string;
  shownPlaceIds?: Array<string | number>;
  previewVisitTime?: string | null;
  previewEndTime?: string | null;
  previewTransportMode?: "WALK" | "TRANSIT" | "CAR" | null;
  setSelectedPlaceId: (placeId: string | number) => void;
}) => {
  setSelectedPlaceId(placeId);

  trackEvent(AMP.ALTERNATIVE_REPLACED, {
    trip_id: tripId ? String(tripId) : undefined,
    old_place_id: String(usedCurrentPlanId),
    old_place_name: targetPlaceName ?? "",
    new_place_id: String(place.googlePlaceId ?? place.placeId ?? ""),
    new_place_name: place.name ?? "",
    new_place_category: place.category ?? "",
    rank: selectedRank,
    recommendation_type: recommendationType ?? "PLACE",
    source,
  });

  clearTripGapCache(tripId ?? serverTripId);

  await updateStoredPlanAAfterReplace({
    scheduleId,
    currentPlanId: usedCurrentPlanId,
    place,
    replaceResult,
    previewVisitTime,
    previewEndTime,
    previewTransportMode,
  });

  const storedUserId = await AsyncStorage.getItem("user_id");

  if (storedUserId) {
    reportPreferenceFeedback({
      userId: storedUserId,
      shownPlaceIds: Array.isArray(shownPlaceIds) ? shownPlaceIds : [],
      selectedPlaceId: placeId,
    }).catch(() => {});
  }
};


export const executeWeatherRecommendationReplace = async ({
  placeId,
  notificationId,
  newGooglePlaceId,
  newPlaceName,
  newPlaceId,
  previewSchedulePayload,
  tripId,
  serverTripId,
  showToast,
  setSubmittingPlaceId,
  setSelectedPlaceId,
  onSuccess,
  onError,
}: {
  placeId: string | number;
  notificationId?: string | number;
  newGooglePlaceId: string;
  newPlaceName: string;
  newCategory?: string;
  newPlaceId?: string | number;
  previewSchedulePayload: Record<string, unknown>;
  tripId?: string | number;
  serverTripId?: string | number;
  showToast: ShowToast;
  setSubmittingPlaceId: (placeId: string | number | null) => void;
  setSelectedPlaceId: (placeId: string | number) => void;
  onSuccess: (updatedTripPlace: unknown) => void;
  onError?: (message: string) => void;
}) => {
  if (
    !validateWeatherReplaceInput({
      notificationId,
      newGooglePlaceId,
      newPlaceName,
      showToast,
    })
  ) {
    return;
  }

  try {
    setSubmittingPlaceId(placeId);

    if (notificationId == null) {
      throw new Error("날씨 알림 ID를 확인할 수 없습니다.");
    }

    const updatedTripPlace = await replaceWeatherNotificationAlternative({
      notificationId,
      newPlaceId,
      previewSchedulePayload,
    });

    setSelectedPlaceId(placeId);
    clearTripGapCache(tripId ?? serverTripId);

    showToast(
      "장소 선택 완료",
      "대안 장소를 반영했어요. 시간과 이동수단을 설정해주세요.",
      "success",
      () => onSuccess(updatedTripPlace),
    );
  } catch (error) {
    const message =
      getRecommendationReplaceErrorMessage(error);

    if (onError) {
      onError(message);
    } else {
      showWeatherReplaceErrorToast(showToast, error);
    }
  } finally {
    setSubmittingPlaceId(null);
  }
};

export const executePlanRecommendationReplace = async ({
  place,
  placeId,
  selectedRank,
  currentPlanIdCandidates,
  newGooglePlaceId,
  newPlaceName,
  newCategory,
  previewSchedulePayload,
  tripId,
  serverTripId,
  scheduleId,
  recommendationType,
  source,
  targetPlaceName,
  shownPlaceIds,
  previewVisitTime,
  previewEndTime,
  previewTransportMode,
  showToast,
  setSubmittingPlaceId,
  setSelectedPlaceId,
  onSuccess,
  onScheduleConflict,
}: {
  place: {
    googlePlaceId?: string | number;
    placeId?: string | number;
    name?: string;
    address?: string;
    category?: string;
    latitude?: number;
    longitude?: number;
  };
  placeId: string | number;
  selectedRank: number;
  currentPlanIdCandidates: Array<string | number>;
  newGooglePlaceId: string;
  newPlaceName: string;
  newCategory?: string;
  previewSchedulePayload: Record<string, unknown>;
  tripId?: string | number;
  serverTripId?: string | number;
  scheduleId?: string;
  recommendationType?: string;
  source: "weather" | "manual";
  targetPlaceName?: string;
  shownPlaceIds?: Array<string | number>;
  previewVisitTime?: string | null;
  previewEndTime?: string | null;
  previewTransportMode?: "WALK" | "TRANSIT" | "CAR" | null;
  showToast: ShowToast;
  setSubmittingPlaceId: (placeId: string | number | null) => void;
  setSelectedPlaceId: (placeId: string | number) => void;
  onSuccess: (usedCurrentPlanId: string | number) => void;
  onScheduleConflict?: (message: string) => void;
}) => {
  if (
    !validatePlanReplaceInput({
      currentPlanIdCandidates,
      newGooglePlaceId,
      newPlaceName,
      showToast,
    })
  ) {
    return;
  }

  try {
    setSubmittingPlaceId(placeId);

    const { replaceResult, usedCurrentPlanId } =
      await requestPlanPlaceReplace({
        currentPlanIdCandidates,
        newGooglePlaceId,
        newPlaceName,
        newCategory,
      });

    await updateReplacedScheduleMeta({
      replaceResult,
      usedCurrentPlanId,
      previewSchedulePayload,
    });

    await handlePlanReplaceSuccessSideEffects({
      place,
      placeId,
      usedCurrentPlanId,
      replaceResult,
      selectedRank,
      tripId,
      serverTripId,
      scheduleId,
      recommendationType,
      source,
      targetPlaceName,
      shownPlaceIds,
      previewVisitTime,
      previewEndTime,
      previewTransportMode,
      setSelectedPlaceId,
    });

    // 교체 완료 토스트 없이 성공 즉시 다음 화면으로 이동
    onSuccess(usedCurrentPlanId);
  } catch (error) {
    const message =
      getRecommendationReplaceErrorMessage(error);

    if (onScheduleConflict) {
      onScheduleConflict(message);
    } else {
      showReplaceErrorToast(
        showToast,
        error,
      );
    }
  } finally {
    setSubmittingPlaceId(null);
  }
};

export const getCurrentPlanIdCandidates = ({
  params,
  targetPlace,
}: {
  params: any;
  targetPlace?: any;
}) => {
  return [
    params.currentPlanId,
    params.tripPlaceId,
    params.serverTripPlaceId,
    targetPlace?.tripPlaceId,
    targetPlace?.serverTripPlaceId,
    targetPlace?.id,
  ]
    .filter((value): value is string | number => {
      return value !== undefined && value !== null && value !== "";
    })
    .filter((value, index, array) => {
      return array.findIndex((item) => String(item) === String(value)) === index;
    });
};

export const getPreviewSchedulePayload = ({
  previewVisitTime,
  previewEndTime,
  previewTransportMode,
}: {
  previewVisitTime?: string | null;
  previewEndTime?: string | null;
  previewTransportMode?: "WALK" | "TRANSIT" | "CAR" | null;
}) => {
  const payload: Record<string, unknown> = {};

  if (previewVisitTime) {
    payload.visitTime = previewVisitTime;
  }

  if (previewEndTime) {
    payload.endTime = previewEndTime;
  }

  if (previewTransportMode) {
    payload.transportMode = previewTransportMode;
  }

  return payload;
};

