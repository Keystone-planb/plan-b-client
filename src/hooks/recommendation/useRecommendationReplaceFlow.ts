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

type Params = {
  navigation: Navigation;
  params: RouteParams;
  places: RecommendationResultDisplayPlace[];
  shownPlaceIds: Array<string | number>;
  targetPlace?: TargetPlace;
  previousSchedulePlace:
    | RecommendationResultTodayPlace
    | null;
  previewVisitTime?: string | null;
  previewEndTime?: string | null;
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
  previewVisitTime,
  previewEndTime,
  previousImpactMode,
  nextImpactMode,
  showToast,
}: Params) {
  const [selectedPlaceId, setSelectedPlaceId] =
    useState<string | number | null>(null);

  const [submittingPlaceId, setSubmittingPlaceId] =
    useState<string | number | null>(null);

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
      replacedTripPlaceId:
        usedCurrentPlanId ?? undefined,
      isEditMode: true,
    });
  };

  const savePreviousImpactTransportMode =
    async (
      selectedPlace:
        RecommendationResultDisplayPlace,
    ) => {
      const previousPlanId =
        previousSchedulePlace?.serverTripPlaceId ??
        previousSchedulePlace?.tripPlaceId ??
        previousSchedulePlace?.id;

      if (
        previousPlanId === undefined ||
        previousPlanId === null ||
        String(previousPlanId).trim().length === 0
      ) {
        return;
      }

      console.log(
        "[RecommendationResult] 이전 구간 이동수단 저장 요청:",
        {
          previousPlanId,
          transportMode: previousImpactMode,
          from: previousSchedulePlace?.name,
          to: selectedPlace.name,
        },
      );

      await updatePlanSchedule(previousPlanId, {
        transportMode: previousImpactMode,
      });

      console.log(
        "[RecommendationResult] 이전 구간 이동수단 저장 성공:",
        {
          previousPlanId,
          transportMode: previousImpactMode,
        },
      );
    };

  const handleSelectPlace = async (
    place: RecommendationResultDisplayPlace,
  ) => {
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
        onSuccess: (updatedTripPlace) =>
          moveToPlanAAfterWeatherReplace(
            updatedTripPlace as {
              day?: number | string;
            },
          ),
      });

      return;
    }

    try {
      await savePreviousImpactTransportMode(
        place,
      );
    } catch (error) {
      console.log(
        "[RecommendationResult] 이전 구간 이동수단 저장 실패:",
        error,
      );

      showToast(
        "이동수단 저장 실패",
        "이전 일정과 대안 일정 사이의 이동수단을 저장하지 못했습니다.",
        "error",
      );

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
    });
  };

  return {
    selectedPlaceId,
    submittingPlaceId,
    handleSelectPlace,
  };
}
