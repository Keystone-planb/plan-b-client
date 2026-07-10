import type { PlaceItem } from "../../types/planA";
import type { TravelSchedule } from "../../types/schedule";

type CreateTripRequestForServer = {
  title: string;
  startDate: string;
  endDate: string;
  travelStyles: string[];
};

type AddLocationPayload = {
  place_id: string;
  name: string;
  category?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  lat?: number | null;
  lng?: number | null;
  visitTime?: string | null;
  endTime?: string | null;
  memo?: string | null;
};

type AddLocationRequestForServer = {
  day: number;
  payload: AddLocationPayload;
};

const toVisitTime = (time?: string | null) => {
  if (!time) return null;
  return time;
};

const getPlaceGoogleId = (place: PlaceItem) => {
  const maybePlace = place as PlaceItem & {
    placeId?: string | number;
    googlePlaceId?: string | number;
  };

  const candidates = [
    maybePlace.googlePlaceId,
    maybePlace.placeId,
    place.id,
  ]
    .filter((value) => value !== undefined && value !== null)
    .map(String);

  return candidates.find((value) => value.startsWith("ChIJ")) ?? "";
};

const getFirstMemo = (place: PlaceItem) => {
  return place.memos?.[0]?.text ?? null;
};

const toFiniteNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
};

const getCoordinateValue = (
  source: unknown,
  paths: string[],
) => {
  if (!source || typeof source !== "object") {
    return undefined;
  }

  for (const path of paths) {
    const value = path.split(".").reduce<unknown>((current, key) => {
      if (!current || typeof current !== "object") {
        return undefined;
      }

      return (current as Record<string, unknown>)[key];
    }, source);
    const coordinate = toFiniteNumber(value);

    if (coordinate !== undefined) {
      return coordinate;
    }
  }

  return undefined;
};

const getPlaceCoordinates = (place: PlaceItem) => ({
  latitude: getCoordinateValue(place, [
    "latitude",
    "lat",
    "place.latitude",
    "place.lat",
    "location.latitude",
    "location.lat",
    "coordinate.latitude",
    "coordinate.lat",
    "geometry.location.latitude",
    "geometry.location.lat",
  ]),
  longitude: getCoordinateValue(place, [
    "longitude",
    "lng",
    "place.longitude",
    "place.lng",
    "location.longitude",
    "location.lng",
    "coordinate.longitude",
    "coordinate.lng",
    "geometry.location.longitude",
    "geometry.location.lng",
  ]),
});

export const toCreateTripRequest = (
  schedule: TravelSchedule,
): CreateTripRequestForServer => {
  return {
    title: schedule.tripName,
    startDate: schedule.startDate,
    endDate: schedule.endDate,
    travelStyles: [],
  };
};

export const toAddLocationRequests = (
  schedule: TravelSchedule,
): AddLocationRequestForServer[] => {
  return schedule.days.flatMap((daySchedule) => {
    return daySchedule.places.flatMap((place) => {
      const placeId = getPlaceGoogleId(place);
      const coordinates = getPlaceCoordinates(place);

      if (!placeId) {
        return [];
      }

      const payload = {
        place_id: placeId,
        name: place.name,
        category: place.category ?? null,
        address: place.address ?? null,
        latitude: coordinates.latitude ?? null,
        longitude: coordinates.longitude ?? null,
        lat: coordinates.latitude ?? null,
        lng: coordinates.longitude ?? null,
        visitTime: toVisitTime(place.visitTime),
        endTime: toVisitTime(place.endTime),
        memo: getFirstMemo(place),
      };

      return {
        day: daySchedule.day,
        payload,
      };
    });
  });
};
