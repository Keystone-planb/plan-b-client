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

  const targetPlaceForAlternative = {
    ...place,
    ...matchedResolvedPlace,
    latitude: matchedResolvedPlace?.latitude ?? place.latitude,
    longitude: matchedResolvedPlace?.longitude ?? place.longitude,
  };

  const serverPlanId =
    targetPlaceForAlternative.serverTripPlaceId ??
    targetPlaceForAlternative.tripPlaceId ??
    targetPlaceForAlternative.id;

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
        latitude: targetPlaceForAlternative.latitude,
        longitude: targetPlaceForAlternative.longitude,
        category: targetPlaceForAlternative.category,
      },
    },
  };
};
