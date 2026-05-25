import { useMemo } from "react";

import {
  getEditablePlaceKey,
  getSortTimeValue,
  isValidServerPlanId,
  pickNumberByPaths,
  sortPlacesByTime,
} from "../../utils/ongoingScheduleHelpers";

type TodayPlace = any;
type ScheduleDay = any;
type TripScheduleGap = any;

type Params = {
  days: ScheduleDay[];
  serverDays: ScheduleDay[];
  editedPlacesByDay: Record<number, TodayPlace[]>;
  deletedPlaceKeysByDay: Record<number, string[]>;
  selectedDayIndex: number;
  paramsPlaces?: TodayPlace[];
  hasSamePlaceForMerge: (a: TodayPlace, b: TodayPlace) => boolean;
  getPlaceStartTimeValueForGap: (place: TodayPlace) => number;
  getPlaceEndTimeValueForGap: (place: TodayPlace) => number;
};

export default function useOngoingPlaces({
  days,
  serverDays,
  editedPlacesByDay,
  deletedPlaceKeysByDay,
  selectedDayIndex,
  paramsPlaces,
  hasSamePlaceForMerge,
  getPlaceStartTimeValueForGap,
  getPlaceEndTimeValueForGap,
}: Params) {
  const currentDay = useMemo(() => {
    const dayNumber = selectedDayIndex + 1;
    const editedPlaces = editedPlacesByDay[dayNumber];

    if (editedPlaces) {
      return {
        day: dayNumber,
        places: editedPlaces,
      };
    }

    const serverDay = serverDays.find((day) => day.day === dayNumber);
    const localDay = days.find((day) => day.day === dayNumber);

    if (!serverDay) {
      return localDay;
    }

    const mergedPlaces = [...(serverDay.places ?? [])];

    (localDay?.places ?? []).forEach((localPlace) => {
      const exists = mergedPlaces.some((serverPlace) =>
        hasSamePlaceForMerge(localPlace, serverPlace),
      );

      if (!exists) {
        mergedPlaces.push(localPlace);
      }
    });

    return {
      ...serverDay,
      places: mergedPlaces,
    };
  }, [
    days,
    editedPlacesByDay,
    serverDays,
    selectedDayIndex,
    hasSamePlaceForMerge,
  ]);

  const places = useMemo(() => {
    const dayNumber = selectedDayIndex + 1;
    const deletedKeys = deletedPlaceKeysByDay[dayNumber] ?? [];

    const filterDeletedPlaces = (sourcePlaces: TodayPlace[]) => {
      return sourcePlaces.filter((place, index) => {
        const placeKey = getEditablePlaceKey(place, index);

        return !deletedKeys.includes(placeKey);
      });
    };

    if (currentDay?.places?.length) {
      return sortPlacesByTime(filterDeletedPlaces(currentDay.places));
    }

    if (paramsPlaces && paramsPlaces.length > 0) {
      return sortPlacesByTime(filterDeletedPlaces(paramsPlaces));
    }

    return [];
  }, [
    currentDay?.places,
    deletedPlaceKeysByDay,
    paramsPlaces,
    selectedDayIndex,
  ]);

  const mapPlaces = useMemo(() => {
    return places.map((place) => {
      const rawPlace = place as TodayPlace & Record<string, any>;

      const latitude =
        pickNumberByPaths(rawPlace, [
          "latitude",
          "lat",
          "y",
          "mapY",
          "location.latitude",
          "location.lat",
          "coordinate.latitude",
          "coordinate.lat",
          "geometry.location.lat",
        ]) ?? place.latitude;

      const longitude =
        pickNumberByPaths(rawPlace, [
          "longitude",
          "lng",
          "lon",
          "x",
          "mapX",
          "location.longitude",
          "location.lng",
          "location.lon",
          "coordinate.longitude",
          "coordinate.lng",
          "coordinate.lon",
          "geometry.location.lng",
        ]) ?? place.longitude;

      return {
        ...place,
        latitude,
        longitude,
      };
    });
  }, [places]);

  const currentDayFallbackGaps = useMemo<TripScheduleGap[]>(() => {
    return places
      .slice(0, -1)
      .map((place, index) => {
        const nextPlace = places[index + 1];

        const beforePlanId =
          place.serverTripPlaceId ?? place.tripPlaceId ?? place.id;

        const afterPlanId =
          nextPlace?.serverTripPlaceId ??
          nextPlace?.tripPlaceId ??
          nextPlace?.id;

        if (
          !isValidServerPlanId(beforePlanId) ||
          !isValidServerPlanId(afterPlanId)
        ) {
          return null;
        }

        const currentEnd = getPlaceEndTimeValueForGap(place);
        const nextStart = getPlaceStartTimeValueForGap(nextPlace);

        if (
          currentEnd === Number.MAX_SAFE_INTEGER ||
          nextStart === Number.MAX_SAFE_INTEGER
        ) {
          return null;
        }

        const gapMinutes = nextStart - currentEnd;

        if (gapMinutes < 30) {
          return null;
        }

        return {
          day: selectedDayIndex + 1,
          beforePlanId,
          afterPlanId,
          beforePlanTitle: place.name ?? "이전 장소",
          afterPlanTitle: nextPlace?.name ?? "다음 장소",
          gapMinutes,
        };
      })
      .filter(Boolean) as TripScheduleGap[];
  }, [
    places,
    selectedDayIndex,
    getPlaceEndTimeValueForGap,
    getPlaceStartTimeValueForGap,
  ]);

  return {
    currentDay,
    places,
    mapPlaces,
    currentDayFallbackGaps,
  };
}
