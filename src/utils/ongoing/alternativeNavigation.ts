// src/utils/ongoing/alternativeNavigation.ts

type BuildAlternativeNavigationParamsInput = {
  place: any;
  resolvedMapPlaces: any[];
  scheduleId?: string;
  resolvedTripId?: string | number;
  tripName?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  transportMode?: string;
  transportLabel?: string;
  selectedDay: number;
};

const getValueCandidates = (place: any) => {
  return [
    place?.serverTripPlaceId,
    place?.tripPlaceId,
    place?.id,
    place?.placeId,
    place?.googlePlaceId,
  ].map((value) => String(value ?? ""));
};

export const buildAlternativeNavigationParams = ({
  place,
  resolvedMapPlaces,
  scheduleId,
  resolvedTripId,
  tripName,
  startDate,
  endDate,
  location,
  transportMode,
  transportLabel,
  selectedDay,
}: BuildAlternativeNavigationParamsInput) => {
  const placeCandidates = getValueCandidates(place);

  const matchedResolvedPlace = resolvedMapPlaces.find((item) => {
    const candidates = getValueCandidates(item);

    return placeCandidates.some((value) => value && candidates.includes(value));
  });

  const pickTimeValue = (
    ...values: unknown[]
  ) => {
    const matched = values.find(
      (value) =>
        typeof value === "string" &&
        value.trim().length > 0,
    );

    return typeof matched === "string"
      ? matched.trim()
      : undefined;
  };

  const visitTime = pickTimeValue(
    matchedResolvedPlace?.visitTime,
    place?.visitTime,
  );

  const endTime = pickTimeValue(
    matchedResolvedPlace?.endTime,
    place?.endTime,
  );

  const displayTime =
    pickTimeValue(
      matchedResolvedPlace?.time,
      place?.time,
    ) ||
    [visitTime, endTime]
      .filter(Boolean)
      .join(" - ");

  const targetPlaceForAlternative = {
    ...place,
    ...matchedResolvedPlace,

    visitTime,
    endTime,
    time: displayTime,

    latitude:
      matchedResolvedPlace?.latitude ??
      place.latitude,

    longitude:
      matchedResolvedPlace?.longitude ??
      place.longitude,
  };

  const serverPlanId =
    targetPlaceForAlternative.serverTripPlaceId ??
    targetPlaceForAlternative.tripPlaceId ??
    targetPlaceForAlternative.id;

  if (__DEV__) {
    console.log(
      "[AlternativeNavigation] 기존 일정 시간 전달:",
      {
        placeName:
          targetPlaceForAlternative.name,
        serverPlanId,
        time:
          targetPlaceForAlternative.time,
        visitTime:
          targetPlaceForAlternative.visitTime,
        endTime:
          targetPlaceForAlternative.endTime,
      },
    );
  }

  return {
    serverPlanId,
    navigationParams: {
      scheduleId,
      tripId: resolvedTripId,
      serverTripId: resolvedTripId,
      tripName,
      startDate,
      endDate,
      location,
      transportMode,
      transportLabel,
      currentPlanId: serverPlanId,
      tripPlaceId: serverPlanId,
      serverTripPlaceId: serverPlanId,
      targetPlace: {
        scheduleId,
        tripId: resolvedTripId,
        serverTripId: resolvedTripId,
        day: selectedDay,
        id: targetPlaceForAlternative.id,
        tripPlaceId: serverPlanId,
        serverTripPlaceId: serverPlanId,
        placeId:
          targetPlaceForAlternative.placeId ??
          targetPlaceForAlternative.googlePlaceId ??
          String(targetPlaceForAlternative.id ?? ""),
        googlePlaceId:
          targetPlaceForAlternative.googlePlaceId ??
          targetPlaceForAlternative.placeId ??
          String(targetPlaceForAlternative.id ?? ""),
        name: targetPlaceForAlternative.name,
        address: targetPlaceForAlternative.address,
        time: targetPlaceForAlternative.time,
        visitTime:
          targetPlaceForAlternative.visitTime,
        endTime:
          targetPlaceForAlternative.endTime,
        latitude:
          targetPlaceForAlternative.latitude,
        longitude:
          targetPlaceForAlternative.longitude,
        category:
          targetPlaceForAlternative.category,
      },
    },
  };
};
