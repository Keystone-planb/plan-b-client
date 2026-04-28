export type ScheduleMemo = {
  id: string;
  text: string;
  createdAt: string;
  updatedAt: string;
};

export type SchedulePlace = {
  id: string;
  name: string;
  time: string;
  memos: ScheduleMemo[];
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type ScheduleDay = {
  day: number;
  places: SchedulePlace[];
};

export type TravelSchedule = {
  id: string;
  tripName: string;
  startDate: string;
  endDate: string;
  location: string;
  days: ScheduleDay[];
  createdAt: string;
  updatedAt: string;
};
