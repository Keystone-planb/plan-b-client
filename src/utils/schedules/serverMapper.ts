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

      if (!placeId) {
        console.log("[serverMapper] 장소 추가 요청 제외 - Google Place ID 없음", {
          id: place.id,
          placeId: place.placeId,
          googlePlaceId: place.googlePlaceId,
          name: place.name,
        });

        return [];
      }

      return {
        day: daySchedule.day,
        payload: {
          place_id: placeId,
          name: place.name,
          visitTime: toVisitTime(place.visitTime),
          endTime: toVisitTime(place.endTime),
          memo: getFirstMemo(place),
        },
      };
    });
  });
};
