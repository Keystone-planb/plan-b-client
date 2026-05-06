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

const toVisitTime = (time?: string) => {
  if (!time) return null;
  return time;
};

const getPlaceGoogleId = (place: PlaceItem) => {
  const maybePlace = place as PlaceItem & {
    placeId?: string | number;
    googlePlaceId?: string | number;
  };

  return String(
    maybePlace.googlePlaceId ??
      maybePlace.placeId ??
      place.id,
  );
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
    return daySchedule.places.map((place) => {
      return {
        day: daySchedule.day,
        payload: {
          place_id: getPlaceGoogleId(place),
          name: place.name,
          visitTime: toVisitTime(place.time),
          endTime: null,
          memo: getFirstMemo(place),
        },
      };
    });
  });
};
