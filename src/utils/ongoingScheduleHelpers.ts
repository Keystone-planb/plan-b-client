type TodayPlace = {
  id?: string | number;
  placeId?: string | number;
  googlePlaceId?: string | number;
  tripPlaceId?: string | number;
  serverTripPlaceId?: string | number;
  name?: string;
  address?: string;
  visitTime?: string | null;
  endTime?: string | null;
  time?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export const toNumberOrNull = (value: unknown) => {
  const numericValue =
    typeof value === "number" ? value
    : typeof value === "string" ? Number(value)
    : NaN;

  return Number.isFinite(numericValue) ? numericValue : null;
};

export const getNestedValue = (source: Record<string, any>, path: string) => {
  return path.split(".").reduce<any>((current, key) => current?.[key], source);
};

export const pickNumberByPaths = (
  source: Record<string, any>,
  paths: string[],
) => {
  for (const path of paths) {
    const value = toNumberOrNull(getNestedValue(source, path));

    if (value !== null) return value;
  }

  return null;
};

export const getSortTimeValue = (time?: string | null) => {
  if (!time) return Number.POSITIVE_INFINITY;

  const trimmed = String(time).trim();
  const normalized = trimmed.match(/(오전|오후)\s*(\d{1,2}):(\d{2})/);

  if (normalized) {
    const [, period, hourText, minuteText] = normalized;
    const hour = Number(hourText);
    const minute = Number(minuteText);

    if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
      return Number.POSITIVE_INFINITY;
    }

    const adjustedHour =
      period === "오후" && hour < 12 ? hour + 12
      : period === "오전" && hour === 12 ? 0
      : hour;

    return adjustedHour * 60 + minute;
  }

  const match = trimmed.match(/(\d{1,2}):(\d{2})/);
  if (!match) return Number.POSITIVE_INFINITY;

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return Number.POSITIVE_INFINITY;
  }

  return hour * 60 + minute;
};

export const normalizeDisplayTime = (time?: string | null) => {
  if (!time) return "";

  return String(time).trim();
};

export const getTimeRangeEndText = (time?: string | null) => {
  const normalizedTime = normalizeDisplayTime(time);
  if (!normalizedTime) return "";

  const parts = normalizedTime.split("-").map((part) => part.trim());
  return parts[1] ?? parts[0] ?? "";
};

export const normalizeEditableTimeInput = (value?: string | null) => {
  const normalizedValue = normalizeDisplayTime(value);

  if (!normalizedValue) return "";

  return normalizedValue.split("-")[0]?.trim() ?? normalizedValue;
};

export const padTimeUnit = (value: number) => String(value).padStart(2, "0");

export const parseTimeForPicker = (value?: string | null) => {
  const normalizedValue = normalizeEditableTimeInput(value);
  const match = normalizedValue.match(/(\d{1,2}):(\d{2})/);

  if (!match) {
    return {
      hour: 12,
      minute: 0,
    };
  }

  return {
    hour: Number(match[1]),
    minute: Number(match[2]),
  };
};

export const addOneHourToDisplayTime = (value: string) => {
  const parsed = parseTimeForPicker(value);
  const nextHour = (parsed.hour + 1) % 24;

  return `${padTimeUnit(nextHour)}:${padTimeUnit(parsed.minute)}`;
};

export const getEditablePlaceKey = (place: TodayPlace, index: number) => {
  return String(
    place.serverTripPlaceId ??
      place.tripPlaceId ??
      place.placeId ??
      place.googlePlaceId ??
      place.id ??
      `place-${index}`,
  );
};

export const getPlaceDisplayTime = (place: TodayPlace) => {
  const visitTime = normalizeDisplayTime(place.visitTime);
  const endTime = normalizeDisplayTime(place.endTime);

  if (visitTime && endTime) return `${visitTime} - ${endTime}`;
  if (visitTime) return visitTime;
  if (endTime) return endTime;

  return normalizeDisplayTime(place.time) || "시간 미정";
};

export const sortPlacesByTime = <T extends TodayPlace>(places: T[]) => {
  return [...places].sort((a, b) => {
    const aTime = getSortTimeValue(a.visitTime ?? a.time);
    const bTime = getSortTimeValue(b.visitTime ?? b.time);

    return aTime - bTime;
  });
};

export const isValidServerPlanId = (value?: string | number) => {
  if (value === undefined || value === null || value === "") return false;

  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue > 0;
};

export const isTripOngoingByDate = (startDate?: string, endDate?: string) => {
  if (!startDate || !endDate) return false;

  const today = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return today >= start && today <= end;
};
