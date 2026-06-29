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
      const dayNumber = Number(day.day ?? index + 1);
      const targetDayNumber = Number(selectedDay);

      if (dayNumber !== targetDayNumber) {
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
