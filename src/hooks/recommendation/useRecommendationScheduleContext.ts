import { useEffect, useMemo, useState } from "react";

import { loadPlanASchedule } from "../../api/schedules/planAStorage";
import {
  getPreviewTimeText,
  normalizeDisplayTime,
} from "../../utils/recommendation/recommendationFormatters";

import type {
  RecommendationResultRootStackParamList,
  RecommendationResultTodayPlace,
} from "../../types/recommendation/recommendationResult";

type RecommendationResultParams =
  RecommendationResultRootStackParamList["RecommendationResult"];

type ShowToast = (
  title: string,
  message?: string,
  type?: "success" | "error" | "info",
) => void;

type Params = {
  params: RecommendationResultParams;
  targetPlace?: RecommendationResultTodayPlace;
  showToast: ShowToast;
};

type ScheduleDayLike = {
  day?: number | string;
  places?: RecommendationResultTodayPlace[];
};

type SchedulePlaceWithOrder =
  RecommendationResultTodayPlace & {
    order?: number | string;
    visitOrder?: number | string;
  };

const normalizeSchedulePlace = (
  place?: RecommendationResultTodayPlace,
): RecommendationResultTodayPlace | null => {
  if (!place) return null;

  return {
    ...place,
    name: place.name?.trim() || "장소명 없음",
    address: place.address?.trim() || "",
    time: getPreviewTimeText(place),
  };
};

const getPlaceIds = (
  place?: RecommendationResultTodayPlace,
) =>
  [
    place?.id,
    place?.tripPlaceId,
    place?.serverTripPlaceId,
    place?.placeId,
    place?.googlePlaceId,
  ]
    .filter(
      (id) =>
        id !== undefined &&
        id !== null &&
        id !== "",
    )
    .map(String);

const getPlaceOrder = (
  place: SchedulePlaceWithOrder,
  index: number,
) => {
  const rawOrder =
    place.visitOrder ??
    place.order;

  const order =
    Number(rawOrder);

  return Number.isFinite(order)
    ? order
    : index + 1;
};

const getPlaceTimeMinutes = (
  place: RecommendationResultTodayPlace,
) => {
  const rawTime =
    place.visitTime ??
    place.time?.match(/\d{1,2}:\d{2}/)?.[0];

  if (!rawTime) {
    return null;
  }

  const match = normalizeDisplayTime(rawTime).match(
    /^(\d{1,2}):(\d{2})/,
  );

  if (!match) {
    return null;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (
    !Number.isFinite(hour) ||
    !Number.isFinite(minute)
  ) {
    return null;
  }

  return hour * 60 + minute;
};

const sortSchedulePlaces = (
  places: RecommendationResultTodayPlace[],
) =>
  places
    .map((place, index) => ({
      place,
      index,
      order: getPlaceOrder(
        place as SchedulePlaceWithOrder,
        index,
      ),
      timeMinutes:
        getPlaceTimeMinutes(place),
    }))
    .sort((a, b) => {
      if (a.order !== b.order) {
        return a.order - b.order;
      }

      if (
        a.timeMinutes != null &&
        b.timeMinutes != null &&
        a.timeMinutes !== b.timeMinutes
      ) {
        return a.timeMinutes - b.timeMinutes;
      }

      return a.index - b.index;
    })
    .map(({ place }) => place);

export function useRecommendationScheduleContext({
  params,
  targetPlace,
  showToast,
}: Params) {
  const [
    previousSchedulePlace,
    setPreviousSchedulePlace,
  ] = useState<RecommendationResultTodayPlace | null>(() =>
    normalizeSchedulePlace(params.previousPlace),
  );

  const [
    originalSchedulePlaceFromStorage,
    setOriginalSchedulePlaceFromStorage,
  ] = useState<RecommendationResultTodayPlace | null>(null);

  const [
    nextSchedulePlace,
    setNextSchedulePlace,
  ] = useState<RecommendationResultTodayPlace | null>(() =>
    normalizeSchedulePlace(params.nextPlace),
  );

  useEffect(() => {
    let cancelled = false;

    const loadScheduleContext = async () => {
      const currentPlanId =
        params.currentPlanId ??
        params.tripPlaceId ??
        params.serverTripPlaceId ??
        targetPlace?.serverTripPlaceId ??
        targetPlace?.tripPlaceId ??
        targetPlace?.id;

      const scheduleId =
        typeof params.scheduleId === "string"
          ? params.scheduleId
          : undefined;

      if (!scheduleId || currentPlanId == null) {
        setPreviousSchedulePlace(
          normalizeSchedulePlace(params.previousPlace),
        );
        setNextSchedulePlace(
          normalizeSchedulePlace(params.nextPlace),
        );
        return;
      }

      try {
        const savedSchedule =
          await loadPlanASchedule(scheduleId);

        let matchedPlace:
          | RecommendationResultTodayPlace
          | undefined;

        let previousPlace:
          | RecommendationResultTodayPlace
          | undefined;

        let nextPlace:
          | RecommendationResultTodayPlace
          | undefined;

        const targetIds = [
          currentPlanId,
          params.currentPlanId,
          params.tripPlaceId,
          params.serverTripPlaceId,
          ...getPlaceIds(targetPlace),
        ]
          .filter(
            (id) =>
              id !== undefined &&
              id !== null &&
              id !== "",
          )
          .map(String);

        const targetName = targetPlace?.name?.trim();
        const targetAddress = targetPlace?.address?.trim();

        const requestedDay =
          Number(params.selectedDay ?? params.day);

        const scheduleDays =
          (savedSchedule?.days ?? []) as ScheduleDayLike[];

        const candidateDays =
          Number.isFinite(requestedDay) &&
          requestedDay > 0
            ? [
                ...scheduleDays.filter(
                  (day) =>
                    Number(day.day) ===
                    requestedDay,
                ),
                ...scheduleDays.filter(
                  (day) =>
                    Number(day.day) !==
                    requestedDay,
                ),
              ]
            : scheduleDays;

        for (const day of candidateDays) {
          const dayPlaces =
            sortSchedulePlaces(
              Array.isArray(day.places)
                ? day.places
                : [],
            );

          const matchedIndex = dayPlaces.findIndex(
            (place) => {
              const placeIds = getPlaceIds(place);

              const matchedById = placeIds.some(
                (id) => targetIds.includes(id),
              );

              if (matchedById) {
                return true;
              }

              return (
                Boolean(targetName) &&
                place.name?.trim() === targetName &&
                (
                  !targetAddress ||
                  place.address?.trim() === targetAddress
                )
              );
            },
          );

          if (matchedIndex >= 0) {
            matchedPlace = dayPlaces[matchedIndex];
            previousPlace = dayPlaces[matchedIndex - 1];
            nextPlace = dayPlaces[matchedIndex + 1];
            break;
          }
        }

        if (cancelled) {
          return;
        }

        if (!matchedPlace) {
          setPreviousSchedulePlace(
            normalizeSchedulePlace(params.previousPlace),
          );
          setNextSchedulePlace(
            normalizeSchedulePlace(params.nextPlace),
          );

          if (!params.previousPlace && !params.nextPlace) {
            showToast(
              "일정 정보 확인 필요",
              "기존 일정 데이터를 찾지 못했습니다. 일정을 다시 불러온 뒤 시도해주세요.",
              "error",
            );
          }
          return;
        }

        const visitTime =
          matchedPlace.visitTime ?? null;

        const endTime =
          matchedPlace.endTime ?? null;

        setPreviousSchedulePlace(
          normalizeSchedulePlace(
            previousPlace ?? params.previousPlace,
          ),
        );

        setOriginalSchedulePlaceFromStorage({
          ...matchedPlace,
          visitTime,
          endTime,
          time: getPreviewTimeText({
            ...matchedPlace,
            visitTime,
            endTime,
          }),
        });

        setNextSchedulePlace(
          normalizeSchedulePlace(
            nextPlace ?? params.nextPlace,
          ),
        );
      } catch {
        if (!cancelled) {
          showToast(
            "일정 정보 확인 필요",
            "저장된 일정 정보를 불러오지 못했습니다.",
            "error",
          );
        }
      }
    };

    void loadScheduleContext();

    return () => {
      cancelled = true;
    };
  }, [
    params.currentPlanId,
    params.scheduleId,
    params.selectedDay,
    params.serverTripPlaceId,
    params.tripPlaceId,
    params.day,
    params.nextPlace,
    params.previousPlace,
    targetPlace,
  ]);

  const originalSchedulePlace = useMemo(() => {
    const sourcePlace =
      originalSchedulePlaceFromStorage ??
      targetPlace;

    if (!sourcePlace) {
      return null;
    }

    const visitTime =
      originalSchedulePlaceFromStorage?.visitTime ??
      targetPlace?.visitTime ??
      null;

    const endTime =
      originalSchedulePlaceFromStorage?.endTime ??
      targetPlace?.endTime ??
      null;

    const time =
      originalSchedulePlaceFromStorage?.time?.trim() ||
      targetPlace?.time?.trim() ||
      [visitTime, endTime]
        .filter(Boolean)
        .join(" - ");

    return {
      ...targetPlace,
      ...originalSchedulePlaceFromStorage,
      name:
        originalSchedulePlaceFromStorage?.name ||
        targetPlace?.name ||
        params.title ||
        "현재 진행 중인 일정",
      address:
        originalSchedulePlaceFromStorage?.address ||
        targetPlace?.address ||
        params.location ||
        "",
      visitTime,
      endTime,
      time,
    };
  }, [
    originalSchedulePlaceFromStorage,
    params.location,
    params.title,
    targetPlace,
  ]);

  return {
    previousSchedulePlace,
    originalSchedulePlaceFromStorage,
    originalSchedulePlace,
    nextSchedulePlace,
  };
}
