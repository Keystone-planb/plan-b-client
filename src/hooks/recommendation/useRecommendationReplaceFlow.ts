import { useRef, useState } from "react";

import { updatePlanSchedule } from "../../../api/schedules/server";

import type {
  RecommendationTransportMode,
} from "../../components/recommendation/RecommendationTransportCard";

import type {
  RecommendationResultDisplayPlace,
  RecommendationResultRootStackParamList,
  RecommendationResultTodayPlace,
} from "../../types/recommendation/recommendationResult";

import { AMP, trackEvent } from "../../utils/amplitude";

import {
  executePlanRecommendationReplace,
  executeWeatherRecommendationReplace,
  getCurrentPlanIdCandidates,
  getPreviewSchedulePayload,
  updateStoredPlanASchedulePlaceTime,
  type ShowToast,
} from "./useRecommendationReplace";

type RouteParams =
  RecommendationResultRootStackParamList["RecommendationResult"];

type Navigation =
  import("../../types/recommendation/recommendationResult")
    .RecommendationResultScreenProps["navigation"];

type TargetPlace =
  RecommendationResultTodayPlace & {
    day?: number | string;
  };

const getTimeMinutes = (value?: string | null) => {
  if (!value) {
    return null;
  }

  const match = String(value).trim().match(/^(\d{1,2}):(\d{2})/);

  if (!match) {
    return null;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  return hour * 60 + minute;
};

const hasInvalidPreviewTimeRange = (
  visitTime?: string | null,
  endTime?: string | null,
) => {
  const visitMinutes = getTimeMinutes(visitTime);
  const endMinutes = getTimeMinutes(endTime);

  if (visitMinutes === null || endMinutes === null) {
    return false;
  }

  return visitMinutes >= endMinutes;
};

type Params = {
  navigation: Navigation;
  params: RouteParams;
  places: RecommendationResultDisplayPlace[];
  shownPlaceIds: Array<string | number>;
  targetPlace?: TargetPlace;
  previousSchedulePlace:
    | RecommendationResultTodayPlace
    | null;
  nextSchedulePlace:
    | RecommendationResultTodayPlace
    | null;
  previewVisitTime?: string | null;
  previewEndTime?: string | null;
  previewPreviousVisitTime?: string | null;
  previewPreviousEndTime?: string | null;
  previewNextVisitTime?: string | null;
  previewNextEndTime?: string | null;
  previousImpactMode: RecommendationTransportMode;
  nextImpactMode: RecommendationTransportMode;
  showToast: ShowToast;
};

export function useRecommendationReplaceFlow({
  navigation,
  params,
  places,
  shownPlaceIds,
  targetPlace,
  previousSchedulePlace,
  nextSchedulePlace,
  previewVisitTime,
  previewEndTime,
  previewPreviousVisitTime,
  previewPreviousEndTime,
  previewNextVisitTime,
  previewNextEndTime,
  previousImpactMode,
  nextImpactMode,
  showToast,
}: Params) {
  const [selectedPlaceId, setSelectedPlaceId] =
    useState<string | number | null>(null);

  const [submittingPlaceId, setSubmittingPlaceId] =
    useState<string | number | null>(null);

  const [
    replaceErrorMessage,
    setReplaceErrorMessage,
  ] = useState("");

  const screenOpenedAtRef = useRef(Date.now());

  const getReplaceNavigationParams = () => ({
    scheduleId: params.scheduleId,
    tripId: params.tripId,
    serverTripId:
      params.serverTripId ?? params.tripId,
    tripName: params.tripName,
    startDate: params.startDate,
    endDate: params.endDate,
    location: params.location,
    transportMode: nextImpactMode,
    transportLabel: nextImpactMode,
  });

  const getSchedulePayload = () =>
    getPreviewSchedulePayload({
      previewVisitTime,
      previewEndTime,
      previewTransportMode: nextImpactMode,
    });

  const moveToPlanAAfterWeatherReplace = (
    updatedTripPlace: {
      day?: number | string;
    },
  ) => {
    const replacedDay =
      Number(updatedTripPlace?.day) > 0
        ? Number(updatedTripPlace.day)
        : params.day ?? params.selectedDay;

    navigation.replace("PlanA", {
      ...getReplaceNavigationParams(),
      day: replacedDay,
      selectedDay: replacedDay,
      isEditMode: true,
      returnScreen: params.returnScreen,
      refreshPlanAAt: Date.now(),
    });
  };

  const moveToPlanAAfterReplace = (
    usedCurrentPlanId?:
      | string
      | number
      | null,
  ) => {
    const selectedDay =
      Number(targetPlace?.day) > 0
        ? Number(targetPlace?.day)
        : undefined;

    navigation.replace("PlanA", {
      ...getReplaceNavigationParams(),
      selectedDay,
      selectedPlace: undefined,
      selectedPlaces: undefined,
      refreshPlanAAt: Date.now(),
      returnScreen: params.returnScreen,
      replacedTripPlaceId:
        usedCurrentPlanId ?? undefined,
      isEditMode: true,
    });
  };

  const getSchedulePlacePlanId = (
    place?: RecommendationResultTodayPlace | null,
  ) => {
    return (
      place?.serverTripPlaceId ??
      place?.tripPlaceId ??
      place?.id
    );
  };

  const savePreviousScheduleAdjustments =
    async () => {
      const previousPlanId =
        getSchedulePlacePlanId(previousSchedulePlace);

      if (
        previousPlanId === undefined ||
        previousPlanId === null ||
        String(previousPlanId).trim().length === 0
      ) {
        return;
      }

      const payload: Record<string, unknown> = {
        transportMode: previousImpactMode,
      };

      if (previewPreviousVisitTime) {
        payload.visitTime = previewPreviousVisitTime;
      }

      if (previewPreviousEndTime) {
        payload.endTime = previewPreviousEndTime;
      }

      await updatePlanSchedule(previousPlanId, payload);

      await updateStoredPlanASchedulePlaceTime({
        scheduleId: params.scheduleId,
        planId: previousPlanId,
        visitTime: previewPreviousVisitTime,
        endTime: previewPreviousEndTime,
        transportMode: previousImpactMode,
      });
    };

  const saveNextScheduleAdjustments =
    async () => {
      if (!previewNextVisitTime && !previewNextEndTime) {
        return;
      }

      const nextPlanId =
        getSchedulePlacePlanId(nextSchedulePlace);

      if (
        nextPlanId === undefined ||
        nextPlanId === null ||
        String(nextPlanId).trim().length === 0
      ) {
        return;
      }

      const payload: Record<string, unknown> = {};

      if (previewNextVisitTime) {
        payload.visitTime = previewNextVisitTime;
      }

      if (previewNextEndTime) {
        payload.endTime = previewNextEndTime;
      }

      await updatePlanSchedule(nextPlanId, payload);

      await updateStoredPlanASchedulePlaceTime({
        scheduleId: params.scheduleId,
        planId: nextPlanId,
        visitTime: previewNextVisitTime,
        endTime: previewNextEndTime,
      });
    };

  const handleSelectPlace = async (
    place: RecommendationResultDisplayPlace,
  ) => {
    setReplaceErrorMessage("");

    if (
      hasInvalidPreviewTimeRange(
        previewVisitTime,
        previewEndTime,
      )
    ) {
      setReplaceErrorMessage(
        "종료 시간은 시작 시간보다 늦어야 합니다.",
      );
      return;
    }

    const placeId =
      place.placeId ?? place.name;

    const selectedRank =
      places.findIndex(
        (item) =>
          (item.placeId ?? item.name) === placeId,
      ) + 1;

    trackEvent(AMP.ALTERNATIVE_SELECTED, {
      rank: selectedRank,
      place_id: String(
        place.googlePlaceId ??
          place.placeId ??
          "",
      ),
      place_name: place.name ?? "",
      place_category: place.category ?? "",
      recommendation_type:
        params.recommendationType ?? "PLACE",
      trip_id: params.tripId
        ? String(params.tripId)
        : undefined,
      time_to_select_ms:
        Date.now() - screenOpenedAtRef.current,
    });

    const newGooglePlaceId = String(
      place.googlePlaceId ??
        place.placeId ??
        "",
    );

    const isWeatherNotificationReplace =
      params.source ===
        "weather-notification" ||
      params.fromWeatherNotification;

    try {
      await savePreviousScheduleAdjustments();
      await saveNextScheduleAdjustments();
    } catch (error) {
      setReplaceErrorMessage(
        "일정 시간을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      );

      return;
    }

    if (isWeatherNotificationReplace) {
      await executeWeatherRecommendationReplace({
        placeId,
        notificationId: params.notificationId,
        newGooglePlaceId,
        newPlaceName: place.name,
        newPlaceId: place.placeId,
        previewSchedulePayload:
          getSchedulePayload(),
        tripId: params.tripId,
        serverTripId: params.serverTripId,
        showToast,
        setSubmittingPlaceId,
        setSelectedPlaceId,
        onError: setReplaceErrorMessage,
        onSuccess: (updatedTripPlace) =>
          moveToPlanAAfterWeatherReplace(
            updatedTripPlace as {
              day?: number | string;
            },
          ),
      });

      return;
    }

    await executePlanRecommendationReplace({
      place,
      placeId,
      selectedRank,
      currentPlanIdCandidates:
        getCurrentPlanIdCandidates({
          params,
          targetPlace,
        }),
      newGooglePlaceId,
      newPlaceName: place.name,
      newCategory: place.category,
      previewSchedulePayload:
        getSchedulePayload(),
      tripId: params.tripId,
      serverTripId: params.serverTripId,
      scheduleId: params.scheduleId,
      recommendationType:
        params.recommendationType,
      source: "manual",
      targetPlaceName: targetPlace?.name,
      shownPlaceIds:
        Array.isArray(shownPlaceIds)
          ? shownPlaceIds
          : [],
      previewVisitTime,
      previewEndTime,
      previewTransportMode:
        nextImpactMode,
      showToast,
      setSubmittingPlaceId,
      setSelectedPlaceId,
      onSuccess: moveToPlanAAfterReplace,
      onScheduleConflict: (
        message,
      ) => {
        setReplaceErrorMessage(
          message,
        );
      },
    });
  };

  return {
    selectedPlaceId,
    submittingPlaceId,
    replaceErrorMessage,
    clearReplaceError: () => {
      setReplaceErrorMessage("");
    },
    handleSelectPlace,
  };
}
