import { TravelSchedule } from "../../types/schedule";
import {
  AddLocationRequest,
  CreateTripRequest,
} from "../../../api/schedules/server";

export type ServerLocationPayload = {
  day: number;
  payload: AddLocationRequest;
};

const normalizeDateForServer = (value: string) => {
  return value.replace(/\./g, "-").trim();
};

export const toCreateTripRequest = (
  schedule: TravelSchedule,
): CreateTripRequest => {
  return {
    title: schedule.tripName,
    startDate: normalizeDateForServer(schedule.startDate),
    endDate: normalizeDateForServer(schedule.endDate),
    travelStyles: ["HEALING"],
  };
};

export const toAddLocationRequests = (
  schedule: TravelSchedule,
): ServerLocationPayload[] => {
  return schedule.days.flatMap((day) =>
    [...day.places]
      .sort((a, b) => a.order - b.order)
      .map((place) => ({
        day: day.day,
        payload: {
          name: place.name,
          visitTime: place.time,
          memo: place.memos.map((memo) => memo.text).join("\n"),
          place_id: place.id,
        },
      })),
  );
};
