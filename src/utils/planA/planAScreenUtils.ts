// src/utils/planA/planAScreenUtils.ts

import type Ionicons from "@expo/vector-icons/Ionicons";

import type { DayOption, PlaceItem } from "../../types/planA";
import type { TravelSchedule } from "../../types/schedule";

type BottomTabName = "PlanX" | "Home" | "Profile";
type IconName = keyof typeof Ionicons.glyphMap;

export const toCoordinateNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
};

export const pickCoordinate = (source: Record<string, any>, keys: string[]) => {
  for (const key of keys) {
    const value = toCoordinateNumber(source[key]);

    if (value !== undefined) return value;
  }

  return undefined;
};

export const getTransportLabel = (
  mode: "WALK" | "TRANSIT" | "CAR",
) => {
  if (mode === "TRANSIT") return "대중교통";
  if (mode === "CAR") return "자동차";
  return "도보";
};

export const getSortTimeValue = (time?: string | null) => {
  if (!time) return Number.MAX_SAFE_INTEGER;

  const match = String(time).match(/^(\d{2}):(\d{2})/);

  if (!match) return Number.MAX_SAFE_INTEGER;

  return Number(match[1]) * 60 + Number(match[2]);
};

export const sortPlacesByTime = (places: PlaceItem[]) => {
  return [...places].sort((a, b) => {
    const aTime = getSortTimeValue(a.visitTime ?? a.time);
    const bTime = getSortTimeValue(b.visitTime ?? b.time);

    if (aTime !== bTime) return aTime - bTime;

    return (a.order ?? 0) - (b.order ?? 0);
  });
};

export const getTripDayCount = (startDate?: string, endDate?: string) => {
  if (!startDate || !endDate) return 1;

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 1;
  }

  const diffDays = Math.floor(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );

  return Math.max(diffDays + 1, 1);
};

export const getCurrentTripDay = (startDate?: string, endDate?: string) => {
  if (!startDate || !endDate) return 1;

  const today = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (
    Number.isNaN(today.getTime()) ||
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    return 1;
  }

  if (today < start) return 1;
  if (today > end) return getTripDayCount(startDate, endDate);

  const diffDays = Math.floor(
    (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );

  return Math.max(diffDays + 1, 1);
};

export const makeDayOptions = (
  startDate?: string,
  endDate?: string,
): DayOption[] => {
  const dayCount = getTripDayCount(startDate, endDate);

  return Array.from({ length: dayCount }, (_, index) => ({
    id: index + 1,
    label: `Day ${index + 1}`,
  }));
};

export const formatDisplayDate = (value: string) => {
  if (!value) return "";

  return value.replaceAll("-", ".");
};

export const formatTripDateRange = (startDate?: string, endDate?: string) => {
  if (!startDate && !endDate) return "";

  if (startDate && endDate) {
    return `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`;
  }

  return formatDisplayDate(startDate ?? endDate ?? "");
};

export const normalizeTimeText = (value?: string | null) => {
  const trimmed = value?.trim();

  if (!trimmed || trimmed === "시간 미정") return null;

  return trimmed;
};

export const parseLegacyDisplayTime = (time?: string | null) => {
  const normalized = normalizeTimeText(time);

  if (!normalized) {
    return {
      visitTime: null,
      endTime: null,
    };
  }

  const [start, end] = normalized.split(/\s*-\s*/);

  return {
    visitTime: normalizeTimeText(start),
    endTime: normalizeTimeText(end),
  };
};

export const getPlaceVisitTime = (place: PlaceItem) => {
  return normalizeTimeText(place.visitTime) ?? parseLegacyDisplayTime(place.time).visitTime;
};

export const getPlaceEndTime = (place: PlaceItem) => {
  return normalizeTimeText(place.endTime) ?? parseLegacyDisplayTime(place.time).endTime;
};

export const getPlaceDisplayTime = (place: PlaceItem) => {
  const visitTime = getPlaceVisitTime(place);
  const endTime = getPlaceEndTime(place);

  if (visitTime && endTime) return `${visitTime} - ${endTime}`;
  if (visitTime) return visitTime;
  if (endTime) return endTime;

  return "";
};

export const parsePickerTimeValue = (value: string) => {
  const normalized = normalizeTimeText(value);

  if (!normalized) {
    return {
      hour: 9,
      minute: 0,
    };
  }

  const match = normalized.match(/^(\d{1,2}):(\d{2})/);

  if (!match) {
    return {
      hour: 9,
      minute: 0,
    };
  }

  return {
    hour: Number(match[1]),
    minute: Number(match[2]),
  };
};

export const formatPickerTimeValue = (hour: number, minute: number) => {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

export const parseTimeToMinutes = (value?: string | null) => {
  const normalized = normalizeTimeText(value);

  if (!normalized) return null;

  const match = normalized.match(/^(\d{1,2}):(\d{2})/);

  if (!match) return null;

  return Number(match[1]) * 60 + Number(match[2]);
};

export const isValidVisitTimeRange = (
  visitTime?: string | null,
  endTime?: string | null,
) => {
  const visitMinutes = parseTimeToMinutes(visitTime);
  const endMinutes = parseTimeToMinutes(endTime);

  if (visitMinutes === null || endMinutes === null) return true;

  return visitMinutes < endMinutes;
};

export const addOneHourToDisplayTime = (value: string) => {
  const parsed = parsePickerTimeValue(value);

  return formatPickerTimeValue((parsed.hour + 1) % 24, parsed.minute);
};

export const getMissingTimePlaceNames = (schedule: TravelSchedule) => {
  return schedule.days
    .flatMap((day) => day.places)
    .filter((place) => {
      return !getPlaceVisitTime(place) || !getPlaceEndTime(place);
    })
    .map((place) => place.name)
    .filter(Boolean);
};

export const getBottomTabIconName = (
  tabName: BottomTabName,
  focused: boolean,
): IconName => {
  if (tabName === "PlanX") return focused ? "time" : "time-outline";
  if (tabName === "Home") return focused ? "home" : "home-outline";
  return focused ? "person" : "person-outline";
};
