import type { PlaceItem } from "../../types/planA";
import type { TravelSchedule } from "../../types/schedule";

export const buildScheduleForTimeValidation = (
  schedule: TravelSchedule,
  selectedDay: number,
  currentPlaces: PlaceItem[],
): TravelSchedule => {
  return {
    ...schedule,
    days: schedule.days.map((day, index) => {
      const dayNumber = day.day ?? index + 1;

      if (dayNumber !== selectedDay) {
        return {
          ...day,
          places: [...day.places],
        };
      }

      return {
        ...day,
        places: currentPlaces.map((place) => ({ ...place })),
      };
    }),
  };
};
